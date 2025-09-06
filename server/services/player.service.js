const pool = require('../config/database');
const { getGameData } = require('./gameData.service');

const SYNC_INTERVAL_MS = 5000; // Must match client's SYNC_INTERVAL_MS
const OFFLINE_THRESHOLD_SECONDS = (SYNC_INTERVAL_MS / 1000) + 2; // Allow 2s for latency

// --- Helper Functions ---

// Helper to safely parse a field that might be a JSON string
const safeParse = (field, defaultVal) => {
    if (typeof field === 'string') {
        try {
            const parsed = JSON.parse(field);
            return parsed;
        } catch (e) {
            // Not a valid JSON string, return the default
            return defaultVal;
        }
    }
    // If it's not a string (already an object/array or null), return it or the default
    return field || defaultVal;
};

// A dedicated function to consume buffs based on a specific action trigger.
const consumeBuffsOnAction = (activeBuffs, actionType) => {
    const buffs = safeParse(activeBuffs, []);
    if (buffs.length === 0) {
        return { newBuffs: [], buffsModified: false };
    }

    const trigger = `on_${actionType}`;
    let buffsModified = false;

    const newBuffs = buffs.reduce((acc, buff) => {
        // If the trigger doesn't match, keep the buff as is.
        if (buff.consumption_trigger !== trigger) {
            acc.push(buff);
            return acc;
        }

        // Trigger matches. The buff will be consumed in some way.
        buffsModified = true;

        // Case 1: Buff has duration_attempts and more than 1 attempt remaining.
        if (buff.duration_attempts && buff.duration_attempts > 1) {
            // Decrement and keep the buff.
            acc.push({ ...buff, duration_attempts: buff.duration_attempts - 1 });
        } 
        // Case 2: Buff has duration_attempts of 1, or has no duration_attempts (implying single use).
        // In this case, we simply don't push it to the accumulator, effectively removing it.
        
        return acc;
    }, []);

    // Check if the final array is different from the original
    if (buffs.length !== newBuffs.length) {
      buffsModified = true;
    }

    return { newBuffs, buffsModified };
};


const calculateCombatPower = (player, stats) => {
    if (!player || !stats) return 0;
    
    // Part 1: Base Combat Power from core stats and realm
    const baseCombatPower = Math.floor(
        (stats.hp / 5) + // HP is less important for CP
        (stats.atk * 4) +
        (stats.def * 3) +
        (stats.speed * 10) +
        ((player.realmIndex + 1) * 1000) // Bonus from realm
    );

    // Part 2: Sub-stat Combat Power from secondary stats
    const subStatCombatPower = Math.floor(
        (stats.critRate * 100 * 20) +       // 1% crit rate = 20 CP
        (stats.critDamage * 100 * 10) +     // 1% crit damage = 10 CP
        (stats.dodgeRate * 100 * 15) +      // 1% dodge = 15 CP
        (stats.hitRate * 100 * 15) +        // 1% hit rate = 15 CP
        (stats.lifestealRate * 100 * 12) +  // 1% lifesteal = 12 CP
        (stats.counterRate * 100 * 12)      // 1% counter = 12 CP
    );

    // Final Combat Power is the sum of both
    return baseCombatPower + subStatCombatPower;
}

const calculateTotalBonuses = async (conn, player) => {
    const gameData = getGameData();
    const bonuses = { 
      qiMultiplier: 1, 
      breakthroughBonus: 0, 
      qiBonus: 0, 
      qiPerSecondAdd: 0,
      hpAdd: 0,
      atkAdd: 0,
      defAdd: 0,
      hpMul: 1,
      atkMul: 1,
      defMul: 1,
      speedMul: 1,
      bodyTemperMultiplier: 1,
      bodyTemperEffectAdd: 0, 
      alchemySuccessAdd: 0,
      explorationYieldMultiplier: 1,
      pvpHonorMultiplier: 1,
      pveLinhThachMultiplier: 1,
      speed_add: 0,
      crit_rate_add: 0,
      crit_damage_add: 0,
      dodge_rate_add: 0,
      lifesteal_rate_add: 0,
      counter_rate_add: 0,
      hit_rate_add: 0,
      crit_resist_add: 0,
      lifesteal_resist_add: 0,
      counter_resist_add: 0,
    };

    const processBonuses = (bonusList) => {
        if (!Array.isArray(bonusList)) return;
        bonusList.forEach((bonus) => {
             const bonusType = bonus.type;
             const bonusValue = bonus.value;
             switch (bonusType) {
                 case 'qi_per_second_multiplier': case 'qi_per_second_multiplier_buff': bonuses.qiMultiplier *= bonusValue; break;
                 case 'breakthrough_chance_add': case 'breakthrough_chance_add_buff': bonuses.breakthroughBonus += bonusValue; break;
                 case 'qi_per_second_base_add': bonuses.qiPerSecondAdd += bonusValue; break;
                 case 'hp_add': bonuses.hpAdd += bonusValue; break;
                 case 'atk_add': bonuses.atkAdd += bonusValue; break;
                 case 'def_add': bonuses.defAdd += bonusValue; break;
                 case 'hp_mul': case 'hp_mul_buff': bonuses.hpMul *= bonusValue; break;
                 case 'atk_mul': case 'atk_mul_buff': bonuses.atkMul *= bonusValue; break;
                 case 'def_mul': case 'def_mul_buff': bonuses.defMul *= bonusValue; break;
                 case 'speed_mul': case 'speed_mul_buff': bonuses.speedMul *= bonusValue; break;
                 case 'speed_add': bonuses.speed_add += bonusValue; break;
                 case 'crit_rate_add': case 'crit_rate_add_buff': bonuses.crit_rate_add += bonusValue; break;
                 case 'crit_damage_add': bonuses.crit_damage_add += bonusValue; break;
                 case 'dodge_rate_add': bonuses.dodge_rate_add += bonusValue; break;
                 case 'lifesteal_rate_add': bonuses.lifesteal_rate_add += bonusValue; break;
                 case 'counter_rate_add': bonuses.counter_rate_add += bonusValue; break;
                 case 'hit_rate_add': bonuses.hit_rate_add += bonusValue; break;
                 case 'crit_resist_add': bonuses.crit_resist_add += bonusValue; break;
                 case 'lifesteal_resist_add': bonuses.lifesteal_resist_add += bonusValue; break;
                 case 'counter_resist_add': bonuses.counter_resist_add += bonusValue; break;
                 case 'body_temper_eff_add': bonuses.bodyTemperEffectAdd += bonusValue; break;
                 case 'alchemy_success_base_add': case 'alchemy_success_add': bonuses.alchemySuccessAdd += bonusValue; break;
                 case 'exploration_yield_mul': bonuses.explorationYieldMultiplier *= bonusValue; break;
                 case 'pvp_honor_mul': bonuses.pvpHonorMultiplier *= bonusValue; break;
                 case 'pve_linh_thach_mul': bonuses.pveLinhThachMultiplier *= bonusValue; break;
             }
        });
    };
    
    // NEW: Bonus from consecutive failures (configurable by admin)
    if (player.breakthrough_consecutive_failures > 0) {
        const failureBonuses = (gameData.BREAKTHROUGH_FAILURE_BONUSES || [])
            .filter(fb => fb.failure_count <= player.breakthrough_consecutive_failures);
        failureBonuses.forEach(fb => processBonuses(fb.bonuses));
    }


    // Chính-Tà Bonuses (from config)
    const karmaConfig = gameData.KARMA_EFFECTS || [];
    processBonuses(karmaConfig.filter(effect => player.karma > effect.threshold));
    

    const meritConfig = gameData.MERIT_EFFECTS || [];
    processBonuses(meritConfig.filter(effect => player.merit > effect.threshold));
    
    // NEW: Breakthrough bonus from Merit (after offsetting Karma)
    const meritBreakthroughConfig = gameData.BREAKTHROUGH_MERIT_SCALING;
    const meritKarmaOffsetRate = gameData.MERIT_KARMA_OFFSET_RATE?.value || 0;

    let remainingMerit = player.merit;
    if (player.karma > 0 && meritKarmaOffsetRate > 0) {
        const meritNeededToOffset = Math.ceil(player.karma / meritKarmaOffsetRate);
        const meritUsedForOffset = Math.min(player.merit, meritNeededToOffset);
        remainingMerit = player.merit - meritUsedForOffset;
    }

    if (meritBreakthroughConfig && remainingMerit > 0) {
        bonuses.breakthroughBonus += remainingMerit * (meritBreakthroughConfig.bonus_per_point || 0);
    }

    // Technique bonuses
    if (player.activeTechniqueId) {
        const technique = gameData.TECHNIQUES.find(t => t.id === player.activeTechniqueId);
        if(technique) processBonuses(technique.bonuses);
    }

    // Guild bonuses
    if (player.guildId && player.guildLevel) {
        if (player.guildLevel > 1) {
            const levelBonus = player.guildLevel - 1;
            bonuses.qiBonus += levelBonus * 0.01;
            bonuses.breakthroughBonus += levelBonus * 0.002;
        }
    }
    
    // Spiritual Root bonuses
    if (player.spiritualRoot) {
        const root = gameData.SPIRITUAL_ROOTS.find(r => r.id === player.spiritualRoot);
        if (root && root.bonus) {
            processBonuses(root.bonus);
        }
    }

    if (player.equipment) {
        player.equipment.forEach(item => processBonuses(item.bonuses));
    }

    // Unlocked Insights bonuses
    if (player.unlockedInsights) {
        player.unlockedInsights.forEach(insightId => {
            const insight = gameData.INSIGHTS.find(i => i.id === insightId);
            if (insight && insight.bonus) {
                processBonuses([insight.bonus]);
            }
        });
    }
    
    // Event Bonuses
    if (conn) {
      const activeEvents = await conn.query("SELECT bonuses FROM events WHERE is_active = TRUE AND starts_at <= NOW() AND expires_at >= NOW()");
      activeEvents.forEach(event => processBonuses(safeParse(event.bonuses, [])));
    }

    // --- Active Buffs (from Pills) ---
    const now = Date.now();
    const activeBuffs = safeParse(player.active_buffs, []).filter(buff => !buff.expires_at || buff.expires_at > now);
    processBonuses(activeBuffs);

    return bonuses;
};
  
const calculateCombatStats = (player, bonuses) => {
  const gameData = getGameData();
  const realm = gameData.REALMS[player.realmIndex];
  if (!realm) {
      return { hp: 0, atk: 0, def: 0, speed: 0, critRate: 0, critDamage: 0, dodgeRate: 0, lifestealRate: 0, counterRate: 0, hitRate: 0, critResist: 0, lifestealResist: 0, counterResist: 0 };
  }

  const baseHp = realm.baseHp + (player.bodyStrength * 10);
  const baseAtk = realm.baseAtk + (player.bodyStrength * 0.5);
  const baseDef = realm.baseDef + (player.bodyStrength * 1.5);
  
  const totalHp = (baseHp + bonuses.hpAdd) * bonuses.hpMul;
  const totalAtk = (baseAtk + bonuses.atkAdd) * bonuses.atkMul;
  const totalDef = (baseDef + bonuses.defAdd) * bonuses.defMul;
  const totalSpeed = (realm.baseSpeed + bonuses.speed_add) * bonuses.speedMul;
  const totalCritRate = realm.baseCritRate + bonuses.crit_rate_add;
  const totalCritDamage = realm.baseCritDamage + bonuses.crit_damage_add;
  const totalDodgeRate = realm.baseDodgeRate + bonuses.dodge_rate_add;
  const totalLifestealRate = bonuses.lifesteal_rate_add;
  const totalCounterRate = bonuses.counter_rate_add;
  const totalHitRate = realm.baseHitRate + bonuses.hit_rate_add;
  const totalCritResist = realm.baseCritResist + bonuses.crit_resist_add;
  const totalLifestealResist = bonuses.lifesteal_resist_add;
  const totalCounterResist = bonuses.counter_resist_add;

  return {
      hp: Math.floor(totalHp),
      atk: Math.floor(totalAtk),
      def: Math.floor(totalDef),
      speed: Math.floor(totalSpeed),
      critRate: totalCritRate,
      critDamage: totalCritDamage,
      dodgeRate: totalDodgeRate,
      lifestealRate: totalLifestealRate,
      counterRate: totalCounterRate,
      hitRate: totalHitRate,
      critResist: totalCritResist,
      lifestealResist: totalLifestealResist,
      counterResist: totalCounterResist,
  };
};

const updatePlayerState = async (conn, name, updates) => {
    const fields = Object.keys(updates);
    if (fields.length === 0) return;

    // FIX: Stringify object/array values but EXCLUDE Date objects.
    // The mariadb driver can handle Date objects correctly for DATETIME/TIMESTAMP columns.
    const values = fields.map(field => {
        let value = updates[field];
        if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
            return JSON.stringify(value);
        }
        // Ensure BigInt values are converted back to strings for the database driver
        if (typeof value === 'bigint') {
            return value.toString();
        }
        return value;
    });

    const setClause = fields.map(field => `\`${field}\` = ?`).join(', ');
    const query = `UPDATE players SET ${setClause} WHERE name = ?`;
    await conn.query(query, [...values, name]);
};

// A reusable query to get all relevant player data in one go
const getPlayerQuery = `
    SELECT 
        p.*
    FROM players p 
    WHERE p.name = ?
`;

const getFullPlayerQuery = async (conn, name) => {
    // 1. Get base player data
    const [playerData] = await conn.query(`
        SELECT 
            p.name, p.qi, p.realmIndex, p.bodyStrength, p.karma, p.merit,
            p.honorPoints, p.linh_thach, p.refinement_dust, p.enlightenmentPoints, p.unlockedInsights,
            p.learnedTechniques, p.activeTechniqueId, p.last_technique_switch_time, p.pills, p.herbs,
            p.guildId, p.purchasedHonorItems, p.learned_pvp_skills, p.equipped_pvp_skill_id,
            p.spiritualRoot, p.explorationStatus, p.lastChallengeTime, p.active_buffs,
            p.guild_role, p.guild_contribution, p.breakthrough_consecutive_failures,
            p.combat_power, p.equipped_avatar_id, p.unlocked_avatars, p.pvp_elo,
            p.registration_ip, p.last_login_ip, p.registration_client_id, p.last_login_client_id,
            p.is_banned, p.ban_reason,
            g.name as guildName, g.level as guildLevel, g.exp as guildExp
        FROM players p 
        LEFT JOIN guilds g ON p.guildId = g.id 
        WHERE p.name = ?
    `, [name]);
    
    if (!playerData) return null;

    // 2. Get all owned equipment instances THAT ARE NOT on the market
    const ownedEquipment = await conn.query(`
        SELECT
            pe.instance_id,
            pe.is_equipped,
            pe.slot,
            pe.upgrade_level,
            pe.is_locked,
            pe.equipment_id AS id,
            e.name,
            e.description,
            e.icon_url,
            e.bonuses,
            e.rarity,
            e.smelt_yield,
            e.is_upgradable
        FROM player_equipment pe
        JOIN equipment e ON pe.equipment_id = e.id
        LEFT JOIN market_listings ml ON pe.instance_id = ml.item_id
        WHERE pe.player_name = ? AND ml.id IS NULL
    `, [name]);

    // 3. Process and combine data, ensuring JSON fields are parsed
    const finalPlayer = {
        ...playerData,
        learnedTechniques: safeParse(playerData.learnedTechniques, []),
        pills: safeParse(playerData.pills, {}),
        herbs: safeParse(playerData.herbs, {}),
        unlockedInsights: safeParse(playerData.unlockedInsights, []),
        purchasedHonorItems: safeParse(playerData.purchasedHonorItems, []),
        learned_pvp_skills: safeParse(playerData.learned_pvp_skills, []),
        active_buffs: safeParse(playerData.active_buffs, []),
        unlocked_avatars: safeParse(playerData.unlocked_avatars, []),
        lastChallengeTime: safeParse(playerData.lastChallengeTime, {}),
        explorationStatus: safeParse(playerData.explorationStatus, null),
        breakthrough_consecutive_failures: Number(playerData.breakthrough_consecutive_failures || 0),
        inventory: [],
        equipment: [],
    };

    ownedEquipment.forEach(item => {
        const itemInstance = {
            ...item,
            bonuses: safeParse(item.bonuses, []),
        };
        if (item.is_equipped) {
            finalPlayer.equipment.push(itemInstance);
        } else {
            finalPlayer.inventory.push(itemInstance);
        }
    });

    return finalPlayer;
}


const processOfflineGains = async (conn, name) => {
    const gameData = getGameData();
    const rows = await conn.query("SELECT *, UNIX_TIMESTAMP(updated_at) as last_update FROM players WHERE name = ? FOR UPDATE", [name]);
    if (rows.length === 0) throw new Error('Không tìm thấy đạo hữu này.');

    const p = rows[0];
    const now = Date.now();
    const lastUpdate = p.updated_at.getTime();
    const deltaTime = Math.max(0, (now - lastUpdate) / 1000);
    const offlineGains = { qi: 0 };
    let explorationLog;

    const playerWithEquipment = await getFullPlayerQuery(conn, name);
    const bonuses = await calculateTotalBonuses(conn, playerWithEquipment);

    p.explorationStatus = playerWithEquipment.explorationStatus;
    p.herbs = playerWithEquipment.herbs;
    
    // Clean up expired buffs
    let activeBuffs = safeParse(p.active_buffs, []);
    const originalBuffCount = activeBuffs.length;
    activeBuffs = activeBuffs.filter(buff => !buff.expires_at || buff.expires_at > now);
    const buffsChanged = activeBuffs.length !== originalBuffCount;
    p.active_buffs = activeBuffs;


    // Complete offline exploration
    if (p.explorationStatus && p.explorationStatus.endTime <= now) {
        const location = gameData.EXPLORATION_LOCATIONS.find(l => l.id === p.explorationStatus.locationId);
        if (location) {
            let rewardsLog = [];
            const yieldMultiplier = bonuses.explorationYieldMultiplier || 1;

            for (const reward of location.rewards) {
                if (Math.random() > reward.chance) continue;

                if (reward.type === 'qi') {
                    p.qi = Number(p.qi) + reward.amount;
                }
                if (reward.type === 'herb') {
                    const amountGained = Math.floor(reward.amount * yieldMultiplier);
                    p.herbs[reward.herbId] = (p.herbs[reward.herbId] || 0) + amountGained;
                    const herb = gameData.HERBS.find(h => h.id === reward.herbId);
                    rewardsLog.push(`${herb?.name} x${amountGained}`);
                }
                if (reward.type === 'equipment') {
                    await conn.query(
                        "INSERT INTO player_equipment (player_name, equipment_id) VALUES (?, ?)",
                        [name, reward.equipmentId]
                    );
                    const equipment = gameData.EQUIPMENT.find(t => t.id === reward.equipmentId);
                    rewardsLog.push(`[${equipment.name}]`);
                }
            }
            if (rewardsLog.length > 0) {
                 explorationLog = { message: `Thám hiểm ${location.name} hoàn tất! Bạn nhận được: ${rewardsLog.join(', ')}.`, type: 'success' };
            } else {
                 explorationLog = { message: `Thám hiểm ${location.name} hoàn tất! Tiếc là không thu được gì.`, type: 'info' };
            }
        }
        p.explorationStatus = null;
    }

    // Calculate offline cultivation only if not exploring
    if (p.explorationStatus === null && deltaTime > 1) { // Only calc for more than 1s offline
        const currentRealm = gameData.REALMS[p.realmIndex];
        const qiPerSecond = (currentRealm.baseQiPerSecond * bonuses.qiMultiplier * (1 + bonuses.qiBonus)) + bonuses.qiPerSecondAdd;
        
        // Apply admin-defined offline gain rate
        const offlineRate = gameData.OFFLINE_QI_GAIN_RATE?.value ?? 1.0;
        const gainedQi = qiPerSecond * deltaTime * offlineRate;
        
        const newQi = Number(p.qi) + gainedQi;
        const qiCap = currentRealm.qiThreshold === Infinity ? newQi : currentRealm.qiThreshold;
        const finalQi = Math.min(newQi, qiCap);
        
        const qiGainedThisTick = finalQi - Number(p.qi);
        if (deltaTime > OFFLINE_THRESHOLD_SECONDS) {
            offlineGains.qi = qiGainedThisTick;
        }
        
        p.qi = finalQi;
    }
    
    const updates = {
        qi: p.qi,
        explorationStatus: p.explorationStatus,
        herbs: p.herbs,
        updated_at: new Date(now) // Explicitly set update time
    };
    
    if (buffsChanged) {
        updates.active_buffs = p.active_buffs;
    }

    // Persist changes
    await updatePlayerState(conn, name, updates);

    const finalPlayerData = await getFullPlayerQuery(conn, name);
    
    const finalExplorationLog = deltaTime > OFFLINE_THRESHOLD_SECONDS ? explorationLog : null;

    return {
        player: finalPlayerData,
        explorationStatus: finalPlayerData.explorationStatus,
        lastChallengeTime: finalPlayerData.lastChallengeTime,
        offlineGains,
        explorationLog: finalExplorationLog,
    };
};

const recalculateAndSaveCombatPower = async (conn, name) => {
    const player = await getFullPlayerQuery(conn, name);
    if (!player) return;

    const bonuses = await calculateTotalBonuses(conn, player);
    const stats = calculateCombatStats(player, bonuses);
    const newCombatPower = calculateCombatPower(player, stats);
    
    if (newCombatPower !== Number(player.combat_power)) {
        await updatePlayerState(conn, name, { combat_power: newCombatPower });
    }
};

// A wrapper for all player actions to ensure consistency
const performAction = async (req, res, actionLogic) => {
    const name = req.user.name;
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 1. Process any offline progress before the action
        const offlineData = await processOfflineGains(conn, name);
        if (offlineData.explorationLog) {
            // If an exploration finished, add its log to the response
            res.log = offlineData.explorationLog;
        }
        
        // 2. Get the fresh player state after offline processing
        const player = await getFullPlayerQuery(conn, name);
        if (!player) throw new Error("Không tìm thấy người chơi.");

        // 3. Execute the specific action logic
        // The logic function can attach a 'log' or 'combatLog' to the `res` object
        const resRef = {}; // Use a reference object to pass logs back
        await actionLogic(conn, player, req.body, resRef);

        // 4. After action, recalculate and save combat power
        await recalculateAndSaveCombatPower(conn, name);

        await conn.commit();

        // 5. Get the final updated state to return to client
        const finalPlayerState = await getFullPlayerQuery(conn, name);
        
        res.status(200).json({
            player: finalPlayerState,
            explorationStatus: finalPlayerState.explorationStatus,
            lastChallengeTime: finalPlayerState.lastChallengeTime,
            log: resRef.log || res.log, // Prioritize log from action logic
            combatLog: resRef.combatLog,
            structuredCombatLog: resRef.structuredCombatLog, // NEW: for pvp replay
        });

    } catch (err) {
        if (conn) await conn.rollback();
        console.error("Action Error:", err);
        res.status(400).json({ message: err.message || 'Hành động không hợp lệ.' });
    } finally {
        if (conn) conn.release();
    }
};

/**
 * Sends a system mail to a player and prunes their mailbox if it exceeds the limit.
 * @param {object} conn - The database connection.
 * @param {string} playerName - The name of the player receiving the mail.
 * @param {string} title - The title of the mail.
 * @param {string} content - The content of the mail.
 * @param {Array<object>} rewards - An array of reward objects.
 */
const sendSystemMail = async (conn, playerName, title, content, rewards) => {
    const MAILBOX_LIMIT = 15;
    
    // 1. Insert the new mail
    await conn.query(
        "INSERT INTO mail (player_name, title, content, rewards) VALUES (?, ?, ?, ?)",
        [playerName, title, content, JSON.stringify(rewards || [])]
    );

    // 2. Prune old mails if the limit is exceeded
    const [mailCountResult] = await conn.query("SELECT COUNT(*) as count FROM mail WHERE player_name = ?", [playerName]);
    const mailCount = mailCountResult.count;

    if (mailCount > MAILBOX_LIMIT) {
        const mailsToDeleteCount = mailCount - MAILBOX_LIMIT;
        // This subquery syntax is required by MySQL/MariaDB to delete from a table you're selecting from.
        await conn.query(
            "DELETE FROM mail WHERE id IN (SELECT id FROM (SELECT id FROM mail WHERE player_name = ? ORDER BY created_at ASC LIMIT ?) AS temp_table)",
            [playerName, mailsToDeleteCount]
        );
    }
};


module.exports = {
    calculateTotalBonuses,
    calculateCombatStats,
    updatePlayerState,
    getPlayerQuery,
    getFullPlayerQuery,
    processOfflineGains,
    performAction,
    recalculateAndSaveCombatPower,
    consumeBuffsOnAction,
    sendSystemMail,
};
