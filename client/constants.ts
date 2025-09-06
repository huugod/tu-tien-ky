import type { Player, GameData, EquipmentBonus, Rarity, ActiveEvent, PillEffect } from './types';

export const BODY_STRENGTH_REALMS: { [key: number]: string } = {
  0: 'Phàm Thân',
  10: 'Cương Thân',
  50: 'Ngọc Thân',
  200: 'Lưu Ly Thân',
  1000: 'Kim Cương Bất Hoại Thân',
};

export const BODY_STRENGTH_COST = {
  base: 100,
  multiplier: 1.1,
};

export const INITIAL_PLAYER: Player = {
  name: 'Đạo Hữu',
  qi: 0,
  realmIndex: 0,
  bodyStrength: 0,
  karma: 0, 
  merit: 0, // NEW: For Chính-Tà system
  honorPoints: 0,
  linh_thach: 0,
  refinement_dust: 0, // NEW: For smelting furnace
  combat_power: 0,
  learnedTechniques: [],
  activeTechniqueId: null,
  pills: {},
  herbs: {},
  spiritualRoot: null,
  inventory: [],
  equipment: [],
  enlightenmentPoints: 0,
  unlockedInsights: [],
  purchasedHonorItems: [],
  active_buffs: [],
  breakthrough_consecutive_failures: 0,
  learned_pvp_skills: [],
  equipped_pvp_skill_id: null,
  pvp_elo: 1000,
  // NEW: Add avatar fields
  equipped_avatar_id: null,
  unlocked_avatars: [],
  // Guild Info
  guildId: null,
  guildName: null,
  guildLevel: null,
  guildExp: null,
  guild_role: null,
  guild_contribution: 0,
};

export const GAME_TICK_MS = 1000;
export const GUILD_CREATION_COST = 100000; // Chi phí tạo Tông Môn
export const MARKET_TAX_RATE = 0.05; // 5% tax
export const MARKET_LISTING_DURATION_HOURS = 24;


export const getGuildNextLevelExp = (currentLevel: number): number => {
    // Starts at 1,000,000 for level 1->2, and increases by 50% each level
    return Math.floor(500000 * Math.pow(1.5, currentLevel));
};

/**
 * NEW: Calculates the maximum number of members a guild can have at a certain level.
 * @param level The guild's level.
 * @returns The maximum number of members.
 */
export const getGuildMemberLimit = (level: number): number => {
    if (level <= 0) return 0;
    // Base 10 members at level 1, +2 members for each subsequent level.
    return 10 + (level - 1) * 2;
};


/**
 * Formats a large number into a readable string with suffixes (K, Triệu, Tỷ).
 * @param num The number to format.
 * @returns A formatted string.
 */
export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const n = Math.floor(num);

  if (n < 1000) {
    return n.toLocaleString('vi-VN');
  }
  if (n >= 1_000_000_000) {
    // Show up to 3 decimal places for billions, e.g. 1.234 Tỷ
    return `${parseFloat((n / 1_000_000_000).toFixed(3))} Tỷ`;
  }
  if (n >= 1_000_000) {
    // Show up to 2 decimal places for millions, e.g. 1.23 Triệu
    return `${parseFloat((n / 1_000_000).toFixed(2))} Triệu`;
  }
  // Show up to 1 decimal place for thousands, e.g. 1.2K
  return `${parseFloat((n / 1000).toFixed(1))}K`;
};


export const getGuildBonuses = (guildLevel: number | null) => {
    if (!guildLevel || guildLevel <= 1) return { qiBonus: 0, breakthroughBonus: 0 };
    // Example: +1% Qi gain and +0.2% breakthrough chance per level after level 1
    const levelBonus = guildLevel - 1;
    return {
        qiBonus: levelBonus * 0.01,
        breakthroughBonus: levelBonus * 0.002,
    };
};

export const getRarityStyle = (rarityId: string | undefined, rarities: Rarity[], context: 'text' | 'container' = 'text'): { style: React.CSSProperties, className?: string } => {
    if (!rarityId) return { style: {} };
    const rarity = rarities.find(r => r.id === rarityId);
    if (!rarity || !rarity.style) return { style: {} };

    const styleObject: React.CSSProperties = {};
    let className: string | undefined = undefined;
    
    if (rarity.style.css) {
        if (rarity.style.css.includes('gradient')) {
            styleObject.backgroundImage = rarity.style.css;
            if (context === 'text') {
                styleObject.backgroundClip = 'text';
                styleObject.WebkitBackgroundClip = 'text'; // for Safari
                styleObject.color = 'transparent';
            }
        } else {
            styleObject.color = rarity.style.css;
        }
    }

    if (rarity.style.animation) {
        className = rarity.style.animation;
    }

    return { style: styleObject, className };
};

export const formatBonus = (bonus: EquipmentBonus): string => {
    const formatPercent = (val: number) => {
        const percentValue = (val - 1) * 100;
        const sign = percentValue >= 0 ? '+' : '';
        return `${sign}${parseFloat(percentValue.toFixed(1))}%`;
    };
    const formatAddPercent = (val: number) => {
        const percentValue = val * 100;
        const sign = percentValue >= 0 ? '+' : '';
        return `${sign}${parseFloat(percentValue.toFixed(1))}%`;
    };
    const formatAddValue = (val: number) => {
        const sign = val >= 0 ? '+' : '';
        return `${sign}${formatNumber(val)}`;
    };

    switch (bonus.type) {
        case 'qi_per_second_multiplier':
            return `Tốc độ tu luyện ${formatPercent(bonus.value)}`;
        case 'qi_per_second_base_add':
            return `Linh khí/s cơ bản ${formatAddValue(bonus.value)}`;
        case 'breakthrough_chance_add':
            return `Tỷ lệ đột phá ${formatAddPercent(bonus.value)}`;
        case 'hp_mul':
            return `Sinh Lực ${formatPercent(bonus.value)}`;
        case 'atk_mul':
            return `Công Kích ${formatPercent(bonus.value)}`;
        case 'def_mul':
            return `Phòng Ngự ${formatPercent(bonus.value)}`;
        case 'speed_mul':
            return `Tốc Độ ${formatPercent(bonus.value)}`;
        case 'hp_add':
            return `Sinh Lực ${formatAddValue(bonus.value)}`;
        case 'atk_add':
            return `Công Kích ${formatAddValue(bonus.value)}`;
        case 'def_add':
            return `Phòng Ngự ${formatAddValue(bonus.value)}`;
        case 'speed_add':
            return `Tốc Độ ${formatAddValue(bonus.value)}`;
        case 'crit_rate_add':
            return `Tỷ lệ Bạo Kích ${formatAddPercent(bonus.value)}`;
        case 'crit_damage_add':
            return `ST Bạo Kích ${formatAddPercent(bonus.value)}`;
        case 'dodge_rate_add':
            return `Tỷ lệ Né Tránh ${formatAddPercent(bonus.value)}`;
        case 'lifesteal_rate_add':
            return `Hút Máu ${formatAddPercent(bonus.value)}`;
        case 'counter_rate_add':
            return `Tỷ lệ Phản Đòn ${formatAddPercent(bonus.value)}`;
        case 'hit_rate_add':
            return `Chính Xác ${formatAddPercent(bonus.value)}`;
        case 'crit_resist_add':
            return `Kháng Bạo Kích ${formatAddPercent(bonus.value)}`;
        case 'lifesteal_resist_add':
            return `Kháng Hút Máu ${formatAddPercent(bonus.value)}`;
        case 'counter_resist_add':
            return `Kháng Phản Đòn ${formatAddPercent(bonus.value)}`;
        case 'body_temper_eff_add':
            return `Hiệu quả Luyện Thể ${formatAddPercent(bonus.value)}`;
        case 'alchemy_success_base_add':
            return `Tỷ lệ Luyện Đan cơ bản ${formatAddPercent(bonus.value)}`;
        case 'alchemy_success_add':
            return `Tỷ lệ Luyện Đan ${formatAddPercent(bonus.value)}`;
        case 'exploration_yield_mul':
            return `Sản lượng Thám Hiểm ${formatPercent(bonus.value)}`;
        case 'pvp_honor_mul':
            return `Điểm Vinh Dự PvP ${formatPercent(bonus.value)}`;
        case 'pve_linh_thach_mul':
            return `Linh Thạch Thí Luyện ${formatPercent(bonus.value)}`;
        case 'atk_mul_buff':
            return `Công Kích (Buff) ${formatPercent(bonus.value)}`;
        case 'def_mul_buff':
            return `Phòng Ngự (Buff) ${formatPercent(bonus.value)}`;
        case 'hp_mul_buff':
            return `Sinh Lực (Buff) ${formatPercent(bonus.value)}`;
        case 'speed_mul_buff':
            return `Tốc Độ (Buff) ${formatPercent(bonus.value)}`;
        case 'breakthrough_chance_add_buff':
            return `Tỷ lệ đột phá (Buff) ${formatAddPercent(bonus.value)}`;
        default:
            return `Phúc lợi không xác định`;
    }
};

export const formatPillEffectDescription = (effect: PillEffect): string => {
    if (effect.type === 'instant_qi' && 'amount' in effect) {
        return `Bổ sung ${formatNumber(effect.amount)} Linh Khí.`;
    }

    if ('value' in effect) {
        let effectText = 'Không xác định';
        const value = effect.value;
        
        // Format value
        if (effect.type.includes('_add')) {
            effectText = `+${(value * 100).toFixed(1)}%`;
        } else if (effect.type.includes('_mul')) {
            effectText = `+${((value - 1) * 100).toFixed(0)}%`;
        }

        // Format type
        let typeText = "Hiệu ứng";
        if (effect.type.includes('breakthrough_chance')) typeText = "Tỷ lệ Đột Phá";
        else if (effect.type.includes('atk')) typeText = "Công Kích";
        else if (effect.type.includes('def')) typeText = "Phòng Ngự";
        else if (effect.type.includes('hp')) typeText = "Sinh Lực";
        else if (effect.type.includes('crit_rate')) typeText = "Tỷ lệ Bạo Kích";
        else if (effect.type.includes('qi_per_second_multiplier')) typeText = "Tốc Độ Tu Luyện";

        // Format duration
        let durationText = '';
        switch (effect.consumption_trigger) {
            case 'on_breakthrough':
                durationText = `hiệu lực cho ${effect.duration_attempts || 1} lần Đột Phá.`;
                break;
            case 'on_pvp_fight':
                durationText = `hiệu lực trong ${effect.duration_attempts || 1} trận Đấu Pháp.`;
                break;
            case 'on_guild_war_fight':
                durationText = `hiệu lực trong ${effect.duration_attempts || 1} trận Tông Môn Chiến.`;
                break;
            default: // 'none' or time-based
                if (effect.duration_seconds) {
                    const minutes = Math.floor(effect.duration_seconds / 60);
                    const seconds = effect.duration_seconds % 60;
                    durationText = `hiệu lực trong ${minutes > 0 ? `${minutes} phút ` : ''}${seconds > 0 ? `${seconds} giây` : ''}.`;
                } else if (effect.duration_attempts) {
                    durationText = `có ${effect.duration_attempts} lần sử dụng.`;
                }
                break;
        }
        
        return `${typeText} ${effectText}${durationText ? `, ${durationText}` : '.'}`;
    }

    return 'Hiệu ứng không xác định';
};


// --- Client-side Calculation Functions (Ported from server) ---

export const calculateBreakthroughBonusBreakdown = (player: Player, gameData: GameData, activeEvents: ActiveEvent[]): { source: string, value: number }[] => {
    const breakdown: { source: string, value: number }[] = [];

    // 1. Technique bonus
    if (player.activeTechniqueId) {
        const technique = gameData.TECHNIQUES.find(t => t.id === player.activeTechniqueId);
        technique?.bonuses.forEach(bonus => {
            if (bonus.type === 'breakthrough_chance_add' && bonus.value !== 0) {
                breakdown.push({ source: `Công pháp (${technique.name})`, value: bonus.value });
            }
        });
    }

    // 2. Equipment bonuses
    let equipmentBonus = 0;
    player.equipment.forEach(item => {
        item.bonuses.forEach(bonus => {
            if (bonus.type === 'breakthrough_chance_add') {
                equipmentBonus += bonus.value;
            }
        });
    });
    if (equipmentBonus !== 0) {
        breakdown.push({ source: 'Trang bị', value: equipmentBonus });
    }
    
    // 3. Guild bonus
    const guildBonus = getGuildBonuses(player.guildLevel).breakthroughBonus;
    if (guildBonus > 0) {
         breakdown.push({ source: 'Phúc lợi Tông Môn', value: guildBonus });
    }

    // 4. Consecutive failure bonus
    let totalFailureBonus = 0;
    if (player.breakthrough_consecutive_failures > 0) {
        const applicableFailureBonuses = (gameData.BREAKTHROUGH_FAILURE_BONUSES || [])
            .filter(fb => fb.failure_count <= player.breakthrough_consecutive_failures);
        
        applicableFailureBonuses.forEach(fb => {
            (fb.bonuses || []).forEach(bonus => {
                if (bonus.type === 'breakthrough_chance_add') {
                    totalFailureBonus += bonus.value;
                }
            });
        });
    }
    if (totalFailureBonus > 0) {
        breakdown.push({ source: 'Phúc lợi thất bại', value: totalFailureBonus });
    }

    // 5. Merit bonus (from remaining merit after karma offset)
    const meritBreakthroughConfig = gameData.BREAKTHROUGH_MERIT_SCALING;
    const meritKarmaOffsetRate = gameData.MERIT_KARMA_OFFSET_RATE?.value || 0;

    let remainingMerit = player.merit;
    if (player.karma > 0 && meritKarmaOffsetRate > 0) {
        const meritNeededToOffset = Math.ceil(player.karma / meritKarmaOffsetRate);
        const meritUsedForOffset = Math.min(player.merit, meritNeededToOffset);
        remainingMerit = player.merit - meritUsedForOffset;
    }

    if (meritBreakthroughConfig && remainingMerit > 0) {
        const meritBonus = remainingMerit * (meritBreakthroughConfig.bonus_per_point || 0);
        if (meritBonus > 0) {
            breakdown.push({ source: 'Công Đức hộ thể', value: meritBonus });
        }
    }

    // 6. Event bonuses
    let eventBonusValue = 0;
    activeEvents.forEach(event => {
        (event.bonuses || []).forEach(bonus => {
            if (bonus.type === 'breakthrough_chance_add' || bonus.type === 'breakthrough_add') {
                eventBonusValue += bonus.value;
            }
        });
    });
    if(eventBonusValue > 0) {
        breakdown.push({ source: 'Sự kiện', value: eventBonusValue });
    }

    // 7. Active buffs (pills)
    let buffBonusValue = 0;
    (player.active_buffs || []).forEach(buff => {
        if (buff.type === 'breakthrough_chance_add_buff' || buff.type === 'breakthrough_chance_add') {
            buffBonusValue += buff.value;
        }
    });
    if(buffBonusValue > 0) {
        breakdown.push({ source: 'Đan dược', value: buffBonusValue });
    }

    return breakdown;
}

export const calculateTotalBonuses = (player: Player, gameData: GameData, activeEvents: ActiveEvent[]) => {
    const bonuses = { 
        qiMultiplier: 1, breakthroughBonus: 0, qiBonus: 0, qiPerSecondAdd: 0, hpAdd: 0, atkAdd: 0, defAdd: 0,
        hpMul: 1, atkMul: 1, defMul: 1, bodyTemperMultiplier: 1, bodyTemperEffectAdd: 0, alchemySuccessAdd: 0,
        explorationYieldMultiplier: 1, pvpHonorMultiplier: 1, pveLinhThachMultiplier: 1, speed_add: 0,
        crit_rate_add: 0, crit_damage_add: 0, dodge_rate_add: 0, lifesteal_rate_add: 0, counter_rate_add: 0,
        hit_rate_add: 0, crit_resist_add: 0, lifesteal_resist_add: 0, counter_resist_add: 0,
    };

    const processBonuses = (bonusList: any[]) => {
        if (!Array.isArray(bonusList)) return;
        bonusList.forEach((bonus: any) => {
             const bonusType = bonus.type;
             const bonusValue = bonus.value;
             switch (bonusType) {
                 case 'qi_per_second_multiplier': bonuses.qiMultiplier *= bonusValue; break;
                 case 'breakthrough_chance_add': case 'breakthrough_chance_add_buff': bonuses.breakthroughBonus += bonusValue; break;
                 case 'qi_per_second_base_add': bonuses.qiPerSecondAdd += bonusValue; break;
                 case 'hp_add': bonuses.hpAdd += bonusValue; break;
                 case 'atk_add': bonuses.atkAdd += bonusValue; break;
                 case 'def_add': bonuses.defAdd += bonusValue; break;
                 case 'hp_mul': case 'hp_mul_buff': bonuses.hpMul *= bonusValue; break;
                 case 'atk_mul': case 'atk_mul_buff': bonuses.atkMul *= bonusValue; break;
                 case 'def_mul': case 'def_mul_buff': bonuses.defMul *= bonusValue; break;
                 case 'speed_add': bonuses.speed_add += bonusValue; break;
                 case 'crit_rate_add': bonuses.crit_rate_add += bonusValue; break;
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
    
    // Equipment
    player.equipment.forEach(item => {
        const upgradeConfig = gameData.EQUIPMENT_UPGRADES.find(u => u.upgrade_level === item.upgrade_level);
        const statMultiplier = upgradeConfig?.stat_multiplier;

        if (statMultiplier && statMultiplier > 1) {
            const upgradedBonuses = item.bonuses.map(bonus => {
                const newBonus = { ...bonus };
                if (bonus.type.endsWith('_add')) {
                    newBonus.value = bonus.value * statMultiplier;
                } else if (bonus.type.endsWith('_mul')) {
                    newBonus.value = (bonus.value - 1) * statMultiplier + 1;
                }
                return newBonus;
            });
            processBonuses(upgradedBonuses);
        } else {
            processBonuses(item.bonuses);
        }
    });

    // Technique
    if (player.activeTechniqueId) {
        const technique = gameData.TECHNIQUES.find(t => t.id === player.activeTechniqueId);
        if (technique) processBonuses(technique.bonuses);
    }
    
    // Insights
    player.unlockedInsights.forEach(insightId => {
        const insight = gameData.INSIGHTS.find(i => i.id === insightId);
        if (insight) processBonuses([insight.bonus]);
    });

    // Spiritual Root
    if (player.spiritualRoot) {
        const root = gameData.SPIRITUAL_ROOTS.find(r => r.id === player.spiritualRoot);
        if (root) processBonuses(root.bonus);
    }
    
    // Events
    activeEvents.forEach(event => processBonuses(event.bonuses));

    // Active Buffs
    processBonuses(player.active_buffs);
    
    // Guild
    const guildBonus = getGuildBonuses(player.guildLevel);
    bonuses.qiBonus += guildBonus.qiBonus;
    bonuses.breakthroughBonus += guildBonus.breakthroughBonus;

    // Failure bonus
    if (player.breakthrough_consecutive_failures > 0) {
        const applicableFailureBonuses = (gameData.BREAKTHROUGH_FAILURE_BONUSES || [])
            .filter(fb => fb.failure_count <= player.breakthrough_consecutive_failures);
        applicableFailureBonuses.forEach(fb => processBonuses(fb.bonuses));
    }

    // Merit/Karma bonus
    const breakdown = calculateBreakthroughBonusBreakdown(player, gameData, activeEvents);
    bonuses.breakthroughBonus += breakdown.reduce((sum, b) => sum + b.value, 0);

    (gameData.KARMA_EFFECTS || []).forEach((effect: any) => { if (player.karma > effect.threshold) processBonuses([effect]) });
    (gameData.MERIT_EFFECTS || []).forEach((effect: any) => { if (player.merit > effect.threshold) processBonuses([effect]) });

    return bonuses;
};
  
export const calculateCombatStats = (player: Player, gameData: GameData, bonuses: any) => {
    const realm = gameData.REALMS[player.realmIndex];
    if (!realm) {
        return { combatPower: 0, hp: 0, atk: 0, def: 0, speed: 0, critRate: 0, critDamage: 0, dodgeRate: 0, lifestealRate: 0, counterRate: 0, hitRate: 0, critResist: 0, lifestealResist: 0, counterResist: 0 };
    }

    const baseHp = realm.baseHp + (player.bodyStrength * 10);
    const baseAtk = realm.baseAtk + (player.bodyStrength * 0.5);
    const baseDef = realm.baseDef + (player.bodyStrength * 1.5);

    const stats = {
        hp: Math.floor((baseHp + bonuses.hpAdd) * bonuses.hpMul),
        atk: Math.floor((baseAtk + bonuses.atkAdd) * bonuses.atkMul),
        def: Math.floor((baseDef + bonuses.defAdd) * bonuses.defMul),
        speed: Math.floor(realm.baseSpeed + bonuses.speed_add),
        critRate: realm.baseCritRate + bonuses.crit_rate_add,
        critDamage: realm.baseCritDamage + bonuses.crit_damage_add,
        dodgeRate: realm.baseDodgeRate + bonuses.dodge_rate_add,
        lifestealRate: bonuses.lifesteal_rate_add,
        counterRate: bonuses.counter_rate_add,
        hitRate: realm.baseHitRate + bonuses.hit_rate_add,
        critResist: realm.baseCritResist + bonuses.crit_resist_add,
        lifestealResist: realm.baseLifestealResist + bonuses.lifesteal_resist_add,
        counterResist: realm.baseCounterResist + bonuses.counter_resist_add,
        combatPower: player.combat_power, // Use the server's authoritative combat power
    };
    return stats;
};

const CLIENT_ID_KEY = 'tutu_clientId';

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function getClientId(): string {
    let clientId = localStorage.getItem(CLIENT_ID_KEY);
    if (!clientId) {
        clientId = generateUUID();
        localStorage.setItem(CLIENT_ID_KEY, clientId);
    }
    return clientId;
}