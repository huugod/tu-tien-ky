const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { performAction, updatePlayerState, getFullPlayerQuery, calculateTotalBonuses, calculateCombatStats, consumeBuffsOnAction } = require('../services/player.service');
const { getGameData } = require('../services/gameData.service');

const router = express.Router();

// GET /api/pvp/opponents - Tìm đối thủ dựa trên Elo
router.get('/opponents', authenticateToken, async (req, res) => {
    const playerName = req.user.name;
    let conn;
    try {
        conn = await pool.getConnection();
        const [player] = await conn.query("SELECT pvp_elo FROM players WHERE name = ?", [playerName]);
        if (!player) {
            return res.status(404).json({ message: 'Không tìm thấy người chơi.' });
        }
        
        const elo = player.pvp_elo;
        const eloRange = 200; // Tìm đối thủ trong khoảng +/- 200 Elo

        const opponents = await conn.query(
            "SELECT name, realmIndex, pvp_elo FROM players WHERE pvp_elo BETWEEN ? AND ? AND name != ? AND is_banned = FALSE ORDER BY RAND() LIMIT 5",
            [elo - eloRange, elo + eloRange, playerName]
        );
        res.status(200).json(opponents);
    } catch (err) {
        console.error("Find Opponents Error:", err);
        res.status(500).json({ message: 'Lỗi máy chủ khi tìm đối thủ.' });
    } finally {
        if (conn) conn.release();
    }
});

// GET /api/pvp/history - Lấy lịch sử đấu
router.get('/history', authenticateToken, async (req, res) => {
    const playerName = req.user.name;
    let conn;
    try {
        conn = await pool.getConnection();
        const history = await conn.query(
            `SELECT 
                id, 
                IF(attacker_name = ?, defender_name, attacker_name) as opponent,
                (winner_name = ?) as won,
                funny_summary as summary,
                combat_log as log,
                UNIX_TIMESTAMP(timestamp) as timestamp
            FROM pvp_history 
            WHERE attacker_name = ? OR defender_name = ? 
            ORDER BY timestamp DESC 
            LIMIT 20`,
            [playerName, playerName, playerName, playerName]
        );
        
        const processedHistory = history.map(h => {
            // Defensively parse the combat log, which might be a string or already an object.
            // This ensures a single malformed log doesn't crash the entire request.
            let combatLogData = []; 
            if (h.log) {
                let parsedLog;
                if (typeof h.log === 'string') {
                    try {
                        // The DB should return JSON, but sometimes it might be a string representation.
                        parsedLog = JSON.parse(h.log);
                    } catch (e) {
                        console.error(`Could not parse combat_log string for pvp_history ID ${h.id}:`, h.log);
                        parsedLog = []; // Default to empty on failure.
                    }
                } else {
                    // Assume the DB driver already parsed it into an object/array.
                    parsedLog = h.log;
                }
                
                // Ensure the final result is always an array.
                if (Array.isArray(parsedLog)) {
                    combatLogData = parsedLog;
                }
            }

            return {
                ...h,
                log: combatLogData, // Use the safely parsed log.
                timestamp: h.timestamp * 1000
            };
        });
        
        res.status(200).json(processedHistory);

    } catch (err) {
        console.error("Get History Error:", err);
        res.status(500).json({ message: 'Lỗi máy chủ khi tải lịch sử đấu.' });
    } finally {
        if (conn) conn.release();
    }
});


const getCombatLogTemplate = (type) => {
    const gameData = getGameData();
    const templates = gameData.COMBAT_LOG_TEMPLATES?.filter(t => t.type === type) || [];
    if (templates.length === 0) {
        // Fallback for safety
        return { template: '{attacker} thực hiện hành động: ' + type, type: 'INFO' };
    }
    return templates[Math.floor(Math.random() * templates.length)];
};


// POST /api/pvp/challenge - Khiêu chiến
router.post('/challenge', authenticateToken, async (req, res) => {
    const attackerName = req.user.name;
    const { opponentName } = req.body;

    await performAction(req, res, async (conn, attacker, body, resRef) => {
        const gameData = getGameData();
        
        const defender = await getFullPlayerQuery(conn, opponentName);
        if (!defender) throw new Error("Không tìm thấy đối thủ.");

        const lastChallengeTime = attacker.lastChallengeTime || {};
        const lastPvpTime = lastChallengeTime['pvp'] || 0;
        if (Date.now() - lastPvpTime < gameData.PVP_COOLDOWN_SECONDS.value * 1000) {
            throw new Error('Bạn đang trong thời gian hồi, chưa thể khiêu chiến.');
        }

        const attackerBonuses = await calculateTotalBonuses(conn, attacker);
        const defenderBonuses = await calculateTotalBonuses(conn, defender);
        let attackerStats = calculateCombatStats(attacker, attackerBonuses);
        let defenderStats = calculateCombatStats(defender, defenderBonuses);

        // --- NEW: Realm difference power scaling ---
        const realmDiff = attacker.realmIndex - defender.realmIndex;
        if (realmDiff > 0) {
            const scalingFactor = gameData.PVP_REALM_SCALING_FACTOR?.value || 1;
            const reduction = Math.pow(scalingFactor, realmDiff);
            attackerStats.hp = Math.floor(attackerStats.hp / reduction);
            attackerStats.atk = Math.floor(attackerStats.atk / reduction);
        }
        
        // --- NEW: Combat state initialization ---
        let combatants = {
            [attackerName]: { hp: attackerStats.hp, maxHp: attackerStats.hp, energy: 0, maxEnergy: 100, shield: 0, shield_duration: 0, dot: { damage: 0, duration: 0 } },
            [opponentName]: { hp: defenderStats.hp, maxHp: defenderStats.hp, energy: 0, maxEnergy: 100, shield: 0, shield_duration: 0, dot: { damage: 0, duration: 0 } },
        };
        
        const structuredCombatLog = [];
        let turn = 0;

        const addLog = (type, context) => {
            const { template } = getCombatLogTemplate(type);
            let text = template;
            for (const key in context) {
                text = text.replace(new RegExp(`{${key}}`, 'g'), context[key]);
            }
            structuredCombatLog.push({
                turn, text, type, 
                damage: context.damage || 0,
                shield: context.shield || 0,
                healed: context.healed || 0,
                state: {
                    [attackerName]: { hp: Math.max(0, combatants[attackerName].hp), maxHp: combatants[attackerName].maxHp, energy: combatants[attackerName].energy, maxEnergy: combatants[attackerName].maxEnergy },
                    [opponentName]: { hp: Math.max(0, combatants[opponentName].hp), maxHp: combatants[opponentName].maxHp, energy: combatants[opponentName].energy, maxEnergy: combatants[opponentName].maxEnergy }
                }
            });
        };

        addLog('INFO', { text: `Trận đấu giữa ${attackerName} và ${opponentName} bắt đầu!`});
        const turnOrder = attackerStats.speed >= defenderStats.speed ? [attackerName, opponentName] : [opponentName, attackerName];
        addLog('INFO', { text: `${turnOrder[0]} có tốc độ cao hơn, ra đòn trước!`});

        while (combatants[attackerName].hp > 0 && combatants[opponentName].hp > 0 && turn < 50) {
            turn++;
            
            if (turn === 16) {
                addLog('INFO', { text: `Sau 15 hiệp, sát khí trên chiến trường trở nên nồng đậm, các đòn tấn công trở nên uy lực hơn!`});
            }

            for (const combatantName of turnOrder) {
                if (combatants[attackerName].hp <= 0 || combatants[opponentName].hp <= 0) break;

                 const opponentNameRef = combatantName === attackerName ? opponentName : attackerName;
                 const combatant = combatants[combatantName];
                 const combatantBase = combatantName === attackerName ? attacker : defender;
                 const combatantStats = combatantName === attackerName ? attackerStats : defenderStats;
                 const opponent = combatants[opponentNameRef];
                 const opponentStats = combatantName === attackerName ? defenderStats : attackerStats;

                // --- NEW: Pre-turn effects (DOT, shield decay) ---
                if (combatant.dot.duration > 0) {
                    combatant.hp -= combatant.dot.damage;
                    addLog('INFO', { text: `${combatantName} trúng độc, mất ${combatant.dot.damage} HP.`, damage: combatant.dot.damage });
                    combatant.dot.duration--;
                }
                 if (combatant.shield_duration > 0) {
                     combatant.shield_duration--;
                     if(combatant.shield_duration === 0) combatant.shield = 0;
                 }
                 if (combatant.hp <= 0) break;


                let damageMultiplier = turn > 15 ? 1 + (turn - 15) * 0.20 : 1;
                combatant.energy = Math.min(combatant.maxEnergy, combatant.energy + 15);

                // --- NEW: Skill usage logic (only equipped skill) ---
                let usedSkill = false;
                let equippedSkill = null;
                if (combatantBase.equipped_pvp_skill_id) {
                    equippedSkill = gameData.PVP_SKILLS.find(s => s.id === combatantBase.equipped_pvp_skill_id);
                }

                if (equippedSkill && combatant.energy >= equippedSkill.energy_cost && Math.random() < 0.5) { // 50% chance to try using a skill
                    const skill = equippedSkill;
                    combatant.energy -= skill.energy_cost;
                    addLog('INFO', {text: `${combatantName} vận khởi tuyệt kỹ [${skill.name}]!`});
                    usedSkill = true;

                    const effects = Array.isArray(skill.effect) ? skill.effect : (skill.effect ? [skill.effect] : []);
                    for (const effect of effects) {
                        if (effect.type === 'damage') {
                            let skillDamage = combatantStats.atk * (effect.multiplier || 1) * damageMultiplier;
                            const armorPierce = effect.armor_pierce || 0;
                            const damageReduction = opponentStats.def * (1 - armorPierce) / (opponentStats.def * (1 - armorPierce) + 10000);
                            let actualDamage = Math.max(1, Math.floor(skillDamage * (1 - damageReduction)));
                            opponent.hp -= actualDamage;
                            addLog('SKILL_DAMAGE', { attacker: combatantName, defender: opponentNameRef, damage: actualDamage, skillName: skill.name });
                        } else if (effect.type === 'shield') {
                            const shieldAmount = Math.floor(combatant.maxHp * effect.hp_percent);
                            combatant.shield = shieldAmount;
                            combatant.shield_duration = effect.duration;
                            addLog('SKILL_EFFECT', { attacker: combatantName, shield: shieldAmount, skillName: skill.name });
                        } else if (effect.type === 'dot') {
                            const initialDamage = Math.floor(combatantStats.atk * effect.initial_damage_percent * damageMultiplier);
                            opponent.hp -= initialDamage;
                            addLog('SKILL_DAMAGE', { attacker: combatantName, defender: opponentNameRef, damage: initialDamage, skillName: skill.name});
                            opponent.dot.damage = Math.floor(combatantStats.atk * effect.dot_damage_percent);
                            opponent.dot.duration = effect.duration;
                        }
                    }
                }
                
                // --- Basic Attack Logic ---
                if (!usedSkill) {
                    const effectiveDodgeRate = Math.max(0.01, opponentStats.dodgeRate - combatantStats.hitRate);
                    if (Math.random() < effectiveDodgeRate) {
                        addLog('DODGE', { attacker: combatantName, defender: opponentNameRef });
                        continue;
                    }
                    
                    let damage = combatantStats.atk * damageMultiplier;
                    let isCrit = false;
                    const effectiveCritRate = Math.max(0, combatantStats.critRate - opponentStats.critResist);
                    if (Math.random() < effectiveCritRate) {
                        damage *= combatantStats.critDamage;
                        isCrit = true;
                    }
                    
                    const damageReduction = opponentStats.def / (opponentStats.def + 10000);
                    let potentialDamage = Math.max(1, Math.floor(damage * (1 - damageReduction)));

                    let absorbedDamage = 0;
                    if (opponent.shield > 0) {
                        absorbedDamage = Math.min(opponent.shield, potentialDamage);
                        opponent.shield -= absorbedDamage;
                        if (absorbedDamage > 0) {
                            addLog('SHIELD_ABSORB', { attacker: combatantName, defender: opponentNameRef, damage: absorbedDamage });
                        }
                    }

                    const penetratingDamage = potentialDamage - absorbedDamage;

                    if (penetratingDamage > 0) {
                        opponent.hp -= penetratingDamage;
                        if (opponent.hp <= 0) {
                            addLog('ATTACKER_FINISHER', { attacker: combatantName, defender: opponentNameRef, damage: penetratingDamage });
                        } else {
                            addLog(isCrit ? 'CRITICAL_HIT' : 'NORMAL_HIT', { attacker: combatantName, defender: opponentNameRef, damage: penetratingDamage });
                        }

                        // Lifesteal check, based on damage dealt
                        const effectiveLifestealRate = Math.max(0, combatantStats.lifestealRate - opponentStats.lifestealResist);
                        if (opponent.hp > 0 && Math.random() < effectiveLifestealRate) {
                            const healed = Math.min(combatant.maxHp - combatant.hp, Math.floor(penetratingDamage * effectiveLifestealRate));
                            if (healed > 0) {
                                combatant.hp += healed;
                                addLog('LIFESTEAL', { attacker: combatantName, healed });
                            }
                        }
                    } else if (potentialDamage > 0) {
                        // Attack landed but was fully absorbed by shield. Log a 0-damage hit.
                        addLog('NORMAL_HIT', { attacker: combatantName, defender: opponentNameRef, damage: 0 });
                    }

                    // Counter-attack check (can happen even if damage was fully absorbed)
                    if (opponent.hp > 0 && opponentStats.counterRate > 0) {
                        const effectiveCounterRate = Math.max(0, opponentStats.counterRate - combatantStats.counterResist);
                         if (Math.random() < effectiveCounterRate) {
                            const counterDamage = Math.floor(opponentStats.atk * 0.5); // Counter deals 50% base ATK
                            combatant.hp -= counterDamage;
                            if (combatant.hp <= 0) {
                                addLog('DEFENDER_FINISHER', { attacker: opponentNameRef, defender: combatantName, damage: counterDamage });
                            } else {
                                addLog('COUNTER_ATTACK', { attacker: opponentNameRef, defender: combatantName, damage: counterDamage });
                            }
                         }
                    }
                }
            }
        }

        let winnerName = null;
        let loserName = null;
        
        if (combatants[attackerName].hp > 0 && combatants[opponentName].hp <= 0) {
            winnerName = attackerName;
            loserName = opponentName;
        } else if (combatants[opponentName].hp > 0 && combatants[attackerName].hp <= 0) {
            winnerName = opponentName;
            loserName = attackerName;
        }
        
        // --- NEW: Post-combat updates (Elo, Qi loss, Realm drop, Karma) ---
        const attackerUpdates = {};
        const defenderUpdates = {};
        let summary;
        
        const K_FACTOR = 32;
        // FIX: Ensure Elo values are treated as numbers to prevent string concatenation issues.
        const attackerElo = Number(attacker.pvp_elo);
        const defenderElo = Number(defender.pvp_elo);
        const expectedAttacker = 1 / (1 + Math.pow(10, (defenderElo - attackerElo) / 400));
        const expectedDefender = 1 / (1 + Math.pow(10, (attackerElo - defenderElo) / 400));

        if (winnerName) {
            const isAttackerWinner = winnerName === attackerName;
            const attackerScore = isAttackerWinner ? 1 : 0;
            const defenderScore = isAttackerWinner ? 0 : 1;
            
            attackerUpdates.pvp_elo = Math.round(attackerElo + K_FACTOR * (attackerScore - expectedAttacker));
            defenderUpdates.pvp_elo = Math.round(defenderElo + K_FACTOR * (defenderScore - expectedDefender));

            const loser = isAttackerWinner ? defender : attacker;
            const loserUpdates = isAttackerWinner ? defenderUpdates : attackerUpdates;

            // Qi loss and Realm drop logic
            if (loser.realmIndex === (isAttackerWinner ? attacker.realmIndex : defender.realmIndex)) {
                const loserMaxQi = gameData.REALMS[loser.realmIndex].qiThreshold;
                const qiLoss = loserMaxQi * (gameData.PVP_QI_LOSS_ON_DEFEAT_PERCENT?.value || 0);
                loserUpdates.qi = Number(loser.qi) - qiLoss;
                if (loserUpdates.qi < 0 && loser.realmIndex > 0) {
                    loserUpdates.qi = 0;
                    loserUpdates.realmIndex = loser.realmIndex - 1;
                    
                    // Winner gains Karma for dropping someone's realm
                    const winnerUpdates = isAttackerWinner ? attackerUpdates : defenderUpdates;
                    winnerUpdates.karma = (isAttackerWinner ? attacker.karma : defender.karma) + 50;
                }
            }
            
            const summaryType = isAttackerWinner ? 'PVP_WIN_SUMMARY' : 'PVP_LOSE_SUMMARY';
            summary = getCombatLogTemplate(summaryType).template.replace(/{attacker}/g, attackerName).replace(/{defender}/g, opponentName);
            addLog('INFO', { text: `Trận đấu kết thúc! ${winnerName} là người chiến thắng!` });

        } else { // Draw
            attackerUpdates.pvp_elo = Math.round(attackerElo + K_FACTOR * (0.5 - expectedAttacker));
            defenderUpdates.pvp_elo = Math.round(defenderElo + K_FACTOR * (0.5 - expectedDefender));
            summary = "Hai vị đạo hữu bất phân thắng bại, hẹn ngày tái đấu.";
            addLog('INFO', { text: `Hết 50 hiệp! Trận đấu kết thúc với kết quả hòa!`});
        }
        
        // --- Final updates ---
        attackerUpdates.lastChallengeTime = { ...lastChallengeTime, pvp: Date.now() };

        // Consume buffs for both players
        const attackerBuffsResult = consumeBuffsOnAction(attacker.active_buffs, 'pvp_fight');
        if (attackerBuffsResult.buffsModified) {
            attackerUpdates.active_buffs = attackerBuffsResult.newBuffs;
        }
        const defenderBuffsResult = consumeBuffsOnAction(defender.active_buffs, 'pvp_fight');
        if (defenderBuffsResult.buffsModified) {
            defenderUpdates.active_buffs = defenderBuffsResult.newBuffs;
        }

        await conn.query( "INSERT INTO pvp_history (attacker_name, defender_name, winner_name, funny_summary, combat_log) VALUES (?, ?, ?, ?, ?)", [attackerName, opponentName, winnerName || 'Hòa', summary, JSON.stringify(structuredCombatLog)] );
        await updatePlayerState(conn, attackerName, attackerUpdates);
        await updatePlayerState(conn, opponentName, defenderUpdates);

        resRef.structuredCombatLog = structuredCombatLog;
        resRef.log = { message: `Trận đấu kết thúc. ${summary}`, type: winnerName ? (winnerName === attackerName ? 'success' : 'danger') : 'info' };
    });
});


// POST /api/pvp/shop/buy - Mua vật phẩm từ cửa hàng vinh dự
router.post('/shop/buy', authenticateToken, async (req, res) => {
    const { itemId } = req.body;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const gameData = getGameData();
        const shopItems = gameData.HONOR_SHOP_ITEMS || [];
        const item = shopItems.find(i => i.id === itemId);

        if (!item) throw new Error("Vật phẩm không tồn tại.");

        if (item.isUnique && (p.purchasedHonorItems || []).includes(item.id)) {
            throw new Error("Bạn đã mua vật phẩm này rồi.");
        }
        if (p.honorPoints < item.cost) {
            throw new Error("Không đủ điểm vinh dự.");
        }

        const updates = {
            honorPoints: p.honorPoints - item.cost,
        };

        if (item.isUnique) {
            updates.purchasedHonorItems = [...(p.purchasedHonorItems || []), item.id];
        }
        
        if (item.type === 'equipment') {
            await conn.query( "INSERT INTO player_equipment (player_name, equipment_id) VALUES (?, ?)", [p.name, item.itemId] );
        } else if (item.type === 'pill') {
            const newPills = { ...p.pills };
            newPills[item.itemId] = (newPills[item.itemId] || 0) + 1;
            updates.pills = newPills;
        }

        await updatePlayerState(conn, p.name, updates);
        resRef.log = { message: `Mua thành công [${item.name}]!`, type: 'success' };
    });
});

// NEW: Endpoint to learn a PvP skill
router.post('/learn-skill', authenticateToken, async (req, res) => {
    const { skillId } = req.body;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const gameData = getGameData();
        const skill = gameData.PVP_SKILLS.find(s => s.id === skillId);

        if (!skill) throw new Error("Tuyệt kỹ không tồn tại.");
        if ((p.learned_pvp_skills || []).includes(skillId)) throw new Error("Bạn đã lĩnh ngộ tuyệt kỹ này rồi.");
        if (p.honorPoints < skill.cost) throw new Error(`Không đủ Điểm Vinh Dự. Cần ${skill.cost}.`);

        const newPoints = p.honorPoints - skill.cost;
        const newSkills = [...(p.learned_pvp_skills || []), skillId];

        await updatePlayerState(conn, p.name, {
            honorPoints: newPoints,
            learned_pvp_skills: newSkills,
        });

        resRef.log = { message: `Lĩnh ngộ thành công [${skill.name}]!`, type: 'success' };
    });
});

// NEW: Endpoint to equip a PvP skill
router.post('/equip-skill', authenticateToken, async (req, res) => {
    const { skillId } = req.body;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const gameData = getGameData();
        const skill = gameData.PVP_SKILLS.find(s => s.id === skillId);

        if (!skill) throw new Error("Tuyệt kỹ không tồn tại.");
        if (!(p.learned_pvp_skills || []).includes(skillId)) {
            throw new Error("Bạn chưa lĩnh ngộ tuyệt kỹ này.");
        }

        const currentlyEquipped = p.equipped_pvp_skill_id;
        const newEquippedId = currentlyEquipped === skillId ? null : skillId;

        await updatePlayerState(conn, p.name, {
            equipped_pvp_skill_id: newEquippedId,
        });

        if (newEquippedId) {
            resRef.log = { message: `Đã trang bị tuyệt kỹ [${skill.name}].`, type: 'success' };
        } else {
            resRef.log = { message: `Đã tháo tuyệt kỹ [${skill.name}].`, type: 'info' };
        }
    });
});


module.exports = router;