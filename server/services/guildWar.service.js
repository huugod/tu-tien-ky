const pool = require('../config/database');
const { calculateTotalBonuses, calculateCombatStats, updatePlayerState, getFullPlayerQuery, consumeBuffsOnAction } = require('./player.service');
const { getGameData } = require('../services/gameData.service');

const getCombatLogTemplate = (type) => {
    const gameData = getGameData();
    const templates = gameData.COMBAT_LOG_TEMPLATES?.filter(t => t.type === type) || [];
    if (templates.length === 0) {
        return { template: '{attacker} thực hiện hành động: ' + type, type: 'INFO' };
    }
    return templates[Math.floor(Math.random() * templates.length)];
};

const processRound = async (conn, matchId) => {
    console.log(`Processing round for match ID: ${matchId}`);
    const [match] = await conn.query("SELECT * FROM guild_war_matches WHERE id = ? FOR UPDATE", [matchId]);
    if (!match || match.status !== 'PENDING_LINEUP') return;

    const lineups = await conn.query("SELECT * FROM guild_war_lineups WHERE match_id = ? AND round_number = ?", [match.id, match.current_round]);
    if (lineups.length < 2) return; // Both lineups not submitted yet

    await conn.query("UPDATE guild_war_matches SET status = 'IN_PROGRESS' WHERE id = ?", [match.id]);

    const lineup1 = lineups.find(l => l.guild_id === match.guild1_id);
    const lineup2 = lineups.find(l => l.guild_id === match.guild2_id);
    const fighters1 = [lineup1.player1_name, lineup1.player2_name, lineup1.player3_name];
    const fighters2 = [lineup2.player1_name, lineup2.player2_name, lineup2.player3_name];

    let guild1Wins = 0;
    
    for (let i = 0; i < 3; i++) {
        const p1Name = fighters1[i];
        const p2Name = fighters2[i];

        const p1 = await getFullPlayerQuery(conn, p1Name);
        const p2 = await getFullPlayerQuery(conn, p2Name);

        if (!p1 || !p2) continue; // Skip if a player doesn't exist

        const p1Bonuses = await calculateTotalBonuses(conn, p1);
        const p2Bonuses = await calculateTotalBonuses(conn, p2);
        const p1Stats = calculateCombatStats(p1, p1Bonuses);
        const p2Stats = calculateCombatStats(p2, p2Bonuses);

        // --- NEW: Structured combat simulation ---
        let combatants = {
            [p1Name]: { hp: p1Stats.hp, maxHp: p1Stats.hp, energy: 0, maxEnergy: 100 },
            [p2Name]: { hp: p2Stats.hp, maxHp: p2Stats.hp, energy: 0, maxEnergy: 100 },
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
                    [p1Name]: { hp: Math.max(0, combatants[p1Name].hp), maxHp: combatants[p1Name].maxHp, energy: combatants[p1Name].energy, maxEnergy: combatants[p1Name].maxHp },
                    [p2Name]: { hp: Math.max(0, combatants[p2Name].hp), maxHp: combatants[p2Name].maxHp, energy: combatants[p2Name].energy, maxEnergy: combatants[p2Name].maxHp }
                }
            });
        };
        
        addLog('INFO', { text: `Trận đấu giữa ${p1Name} và ${p2Name} bắt đầu!`});
        const turnOrder = p1Stats.speed >= p2Stats.speed ? [p1Name, p2Name] : [p2Name, p1Name];
        addLog('INFO', { text: `${turnOrder[0]} có tốc độ cao hơn, ra đòn trước!`});

        while (combatants[p1Name].hp > 0 && combatants[p2Name].hp > 0 && turn < 50) {
            turn++;
            for (const combatantName of turnOrder) {
                if (combatants[p1Name].hp <= 0 || combatants[p2Name].hp <= 0) break;
                
                const opponentNameRef = combatantName === p1Name ? p2Name : p1Name;
                const combatantStats = combatantName === p1Name ? p1Stats : p2Stats;
                const opponent = combatants[opponentNameRef];
                const opponentStats = combatantName === p1Name ? p2Stats : p1Stats;

                const effectiveDodgeRate = Math.max(0.01, opponentStats.dodgeRate - combatantStats.hitRate);
                if (Math.random() < effectiveDodgeRate) {
                    addLog('DODGE', { attacker: combatantName, defender: opponentNameRef });
                    continue;
                }

                let damage = combatantStats.atk;
                let isCrit = false;
                const effectiveCritRate = Math.max(0, combatantStats.critRate - opponentStats.critResist);
                if (Math.random() < effectiveCritRate) {
                    damage *= combatantStats.critDamage;
                    isCrit = true;
                }

                const damageReduction = opponentStats.def / (opponentStats.def + 10000); // K=10000 for balance
                let actualDamage = Math.max(1, Math.floor(damage * (1 - damageReduction)));

                opponent.hp -= actualDamage;

                if (opponent.hp <= 0) {
                     addLog('ATTACKER_FINISHER', { attacker: combatantName, defender: opponentNameRef, damage: actualDamage });
                } else {
                    addLog(isCrit ? 'CRITICAL_HIT' : 'NORMAL_HIT', { attacker: combatantName, defender: opponentNameRef, damage: actualDamage });
                }
            }
        }
        
        const p1Won = combatants[p1Name].hp > 0 && combatants[p2Name].hp <= 0;
        const winnerName = p1Won ? p1Name : (combatants[p2Name].hp > 0 && combatants[p1Name].hp <= 0 ? p2Name : null);
        
        if (winnerName) {
            addLog('INFO', { text: `Trận đấu kết thúc! ${winnerName} là người chiến thắng!` });
            if (p1Won) guild1Wins++;
        } else {
            addLog('INFO', { text: `Sau 50 hiệp, trận đấu kết thúc với kết quả hòa!`});
        }
        
        // Consume attempt-based buffs for both combatants
        const p1BuffsResult = consumeBuffsOnAction(p1.active_buffs, 'guild_war_fight');
        if (p1BuffsResult.buffsModified) {
            await updatePlayerState(conn, p1Name, { active_buffs: p1BuffsResult.newBuffs });
        }
        const p2BuffsResult = consumeBuffsOnAction(p2.active_buffs, 'guild_war_fight');
        if (p2BuffsResult.buffsModified) {
            await updatePlayerState(conn, p2Name, { active_buffs: p2BuffsResult.newBuffs });
        }
        
        await conn.query(
            "INSERT INTO guild_war_fights (match_id, round_number, guild1_player, guild2_player, winner_player, combat_log, fight_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [match.id, match.current_round, p1Name, p2Name, winnerName || 'Hòa', JSON.stringify(structuredCombatLog), i + 1]
        );
    }
    
    // Add all fighters to participants list
    const allFighters = [...fighters1, ...fighters2];
    for (const fighterName of allFighters) {
        await conn.query("INSERT IGNORE INTO guild_war_match_participants (match_id, player_name) VALUES (?, ?)", [match.id, fighterName]);
    }

    // Update match score
    let { guild1_round_wins, guild2_round_wins, current_round } = match;
    if(guild1Wins >= 2) guild1_round_wins++; else guild2_round_wins++;

    let nextStatus = 'PENDING_LINEUP';
    let winner_guild_id = null;
    if (guild1_round_wins >= 2) {
        winner_guild_id = match.guild1_id;
        nextStatus = 'COMPLETED';
    } else if (guild2_round_wins >= 2) {
        winner_guild_id = match.guild2_id;
        nextStatus = 'COMPLETED';
    } else if (current_round >= 3) {
        winner_guild_id = guild1_round_wins > guild2_round_wins ? match.guild1_id : match.guild2_id;
        nextStatus = 'COMPLETED';
    } else {
        current_round++;
    }

    if (nextStatus === 'COMPLETED') {
         console.log(`Match ${matchId} completed. Winner: ${winner_guild_id}`);
         // Distribute rewards
         const [war] = await conn.query("SELECT rewards FROM guild_wars WHERE id = ?", [match.war_id]);
         const rewards = typeof war.rewards === 'string' ? JSON.parse(war.rewards) : (war.rewards || []);

         if (rewards.length > 0 && winner_guild_id) {
            const members = await conn.query("SELECT name, pills, linh_thach, honorPoints FROM players WHERE guildId = ? FOR UPDATE", [winner_guild_id]);
            for (const member of members) {
                const memberUpdates = {};
                const pills = typeof member.pills === 'string' ? JSON.parse(member.pills) : (member.pills || {});
                let pillsModified = false;

                for (const reward of rewards) {
                    switch (reward.type) {
                        case 'linh_thach':
                            memberUpdates.linh_thach = (BigInt(member.linh_thach || 0) + BigInt(reward.amount || 0)).toString();
                            break;
                        case 'honor_points':
                            memberUpdates.honorPoints = (member.honorPoints || 0) + (reward.amount || 0);
                            break;
                        case 'equipment':
                            if (reward.itemId) {
                                await conn.query(
                                    "INSERT INTO player_equipment (player_name, equipment_id) VALUES (?, ?)",
                                    [member.name, reward.itemId]
                                );
                            }
                            break;
                        case 'pill':
                            if (reward.itemId) {
                                pills[reward.itemId] = (pills[reward.itemId] || 0) + (reward.amount || 0);
                                pillsModified = true;
                            }
                            break;
                    }
                }

                if (pillsModified) {
                    memberUpdates.pills = JSON.stringify(pills);
                }

                const updateFields = Object.keys(memberUpdates);
                if (updateFields.length > 0) {
                    const setClause = updateFields.map(k => `\`${k}\` = ?`).join(', ');
                    const updateValues = updateFields.map(k => memberUpdates[k]);
                    await conn.query(
                        `UPDATE players SET ${setClause} WHERE name = ?`,
                        [...updateValues, member.name]
                    );
                }
            }
            console.log(`Distributed rewards to ${members.length} members of guild ${winner_guild_id}`);
         }
    }

    await conn.query("UPDATE guild_war_matches SET guild1_round_wins = ?, guild2_round_wins = ?, current_round = ?, status = ?, winner_guild_id = ? WHERE id = ?", 
        [guild1_round_wins, guild2_round_wins, current_round, nextStatus, winner_guild_id, match.id]);
};


const checkGuildWarStatus = async () => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 1. Start registration for pending wars
        const [pendingWar] = await conn.query("SELECT * FROM guild_wars WHERE status = 'PENDING' AND start_time <= NOW() ORDER BY start_time ASC LIMIT 1");
        if (pendingWar) {
            console.log(`Starting registration for Guild War: ${pendingWar.name}`);
            await conn.query("UPDATE guild_wars SET status = 'REGISTRATION' WHERE id = ?", [pendingWar.id]);
        }

        // 2. Start matches for wars after registration ends (e.g. 1 hour registration window)
        const [registrationWar] = await conn.query("SELECT * FROM guild_wars WHERE status = 'REGISTRATION' AND start_time + INTERVAL 1 HOUR <= NOW() LIMIT 1");
        if (registrationWar) {
            console.log(`Starting matches for Guild War: ${registrationWar.name}`);
            const registrations = await conn.query("SELECT guild_id FROM guild_war_registrations WHERE war_id = ?", [registrationWar.id]);
            const guildIds = registrations.map(r => r.guild_id);
            
            // Simple random matchmaking
            guildIds.sort(() => 0.5 - Math.random()); 
            for (let i = 0; i < guildIds.length - 1; i += 2) {
                await conn.query("INSERT INTO guild_war_matches (war_id, guild1_id, guild2_id) VALUES (?, ?, ?)", [registrationWar.id, guildIds[i], guildIds[i+1]]);
            }
            await conn.query("UPDATE guild_wars SET status = 'IN_PROGRESS' WHERE id = ?", [registrationWar.id]);
        }

        // 3. Process rounds for matches with submitted lineups
        const pendingMatches = await conn.query("SELECT id FROM guild_war_matches WHERE status = 'PENDING_LINEUP'");
        for (const match of pendingMatches) {
            await processRound(conn, match.id);
        }

        await conn.commit();
    } catch (err) {
        if (conn) await conn.rollback();
        console.error("Guild War Scheduler Error:", err);
    } finally {
        if (conn) conn.release();
    }
};

const initializeGuildWarService = () => {
    console.log("Guild War Service Initialized. Scheduler running every 60 seconds.");
    // Run once on start, then set interval
    checkGuildWarStatus(); 
    setInterval(checkGuildWarStatus, 60000); // Check every minute
};

module.exports = {
    initializeGuildWarService,
    processRound, // Export for admin use
};