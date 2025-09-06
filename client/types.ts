export interface Realm {
  name: string;
  qiThreshold: number;
  baseQiPerSecond: number;
  breakthroughChance: number;
  // NEW: Base combat stats
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpeed: number;
  baseCritRate: number;
  baseCritDamage: number;
  baseDodgeRate: number;
  // NEW: Base resist stats
  baseHitRate: number;
  baseCritResist: number;
  baseLifestealResist: number;
  baseCounterResist: number;
}

export type TechniqueBonus = EquipmentBonus;

export interface Technique {
  id: string;
  name: string;
  description: string;
  requiredRealmIndex: number;
  bonuses: TechniqueBonus[];
}

export interface Herb {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
}

export type Reward = 
  | { type: 'qi'; amount: number; chance: number; }
  | { type: 'herb'; herbId: string; amount: number; chance: number; }
  | { type: 'equipment'; equipmentId: string; chance: number; }
  | { type: 'linh_thach'; amount: number; chance: number; }
  | { type: 'merit'; amount: number; chance: number; }
  | { type: 'avatar'; avatarId: string; chance: number; }
  | { type: 'honor_points'; amount: number; chance?: number }
  | { type: 'pill'; itemId: string; amount: number; chance?: number };


export interface ExplorationLocation {
  id: string;
  name: string;
  description: string;
  requiredRealmIndex: number;
  requiredBodyStrength: number;
  durationSeconds: number;
  rewards: Reward[];
}

export interface TrialZone {
  id:string;
  name: string;
  description: string;
  requiredRealmIndex: number;
  cooldownSeconds: number;
  monster: {
    name: string;
    health: number;
    attack: number;
  };
  rewards: Reward[];
  type: 'NORMAL' | 'MERIT'; // NEW: Type for Chính-Tà system
}

export type PillEffect = 
  | { type: 'instant_qi'; amount: number }
  | { 
      type: string; // e.g. 'atk_mul_buff', 'breakthrough_chance_add_buff'
      value: number; 
      duration_seconds?: number;
      duration_attempts?: number;
      max_stack_value?: number; // The maximum total bonus this buff type can provide
      consumption_trigger?: 'none' | 'on_breakthrough' | 'on_pvp_fight' | 'on_guild_war_fight' | 'on_pve_fight';
    };

export interface Pill {
  id: string;
  name: string;
  description: string;
  effect: PillEffect[];
  rarity?: string;
  icon_url?: string;
}

export interface Recipe {
  id: string;
  pillId: string;
  name: string;
  description: string;
  requiredRealmIndex: number;
  qiCost: number;
  herbCosts: { [herbId: string]: number };
  successChance: number;
}

export type SpiritualRootId = 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho';

export interface SpiritualRoot {
  id: SpiritualRootId;
  name: string;
  description: string;
  bonus: EquipmentBonus[];
}

export type EquipmentBonus =
  | { type: 'qi_per_second_multiplier'; value: number }
  | { type: 'breakthrough_chance_add'; value: number }
  | { type: 'hp_add'; value: number }
  | { type: 'atk_add'; value: number }
  | { type: 'def_add'; value: number }
  | { type: 'hp_mul'; value: number }
  | { type: 'atk_mul'; value: number }
  | { type: 'def_mul'; value: number }
  | { type: 'speed_mul'; value: number }
  | { type: 'speed_add'; value: number }
  | { type: 'crit_rate_add'; value: number }
  | { type: 'crit_damage_add'; value: number }
  | { type: 'dodge_rate_add'; value: number }
  | { type: 'lifesteal_rate_add'; value: number }
  | { type: 'counter_rate_add'; value: number }
  // NEW: Resist bonuses
  | { type: 'hit_rate_add'; value: number }
  | { type: 'crit_resist_add'; value: number }
  | { type: 'lifesteal_resist_add'; value: number }
  | { type: 'counter_resist_add'; value: number }
  // FIX: Add missing bonus types to align with server data and fix type errors.
  | { type: 'qi_per_second_base_add'; value: number }
  | { type: 'body_temper_eff_add'; value: number }
  | { type: 'alchemy_success_base_add'; value: number }
  | { type: 'alchemy_success_add'; value: number }
  | { type: 'exploration_yield_mul'; value: number }
  | { type: 'pvp_honor_mul'; value: number }
  | { type: 'pve_linh_thach_mul'; value: number }
  | { type: 'atk_mul_buff'; value: number }
  | { type: 'def_mul_buff'; value: number }
  | { type: 'hp_mul_buff'; value: number }
  | { type: 'speed_mul_buff'; value: number }
  | { type: 'breakthrough_chance_add_buff'; value: number };

export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';

export interface Equipment {
  id: string;
  name: string;
  description: string;
  slot: EquipmentSlot;
  bonuses: EquipmentBonus[];
  rarity?: string;
  smelt_yield: number;
  icon_url?: string;
  is_upgradable?: boolean; // NEW: Flag to determine if item can be upgraded
}

// NEW: Represents a unique instance of an equipment item owned by a player.
export interface PlayerEquipment extends Equipment {
  instance_id: number;
  is_equipped: boolean;
  upgrade_level: number; // NEW: For Blacksmith feature
  is_locked: boolean; // NEW: For quick smelt safety
}


export type InsightBonus =
  | { type: 'qi_per_second_base_add'; value: number }
  | { type: 'body_temper_eff_add'; value: number }
  | { type: 'alchemy_success_base_add'; value: number };

export interface Insight {
  id: string;
  name: string;
  description: string;
  cost: number; // Cost in enlightenment points
  requiredInsightIds: string[];
  bonus: InsightBonus;
}

// NEW: PvP Skill type
export interface PvpSkill {
    id: string;
    name: string;
    description: string;
    cost: number; // Honor points to learn
    energy_cost: number;
    effect: any; // JSON object for effect details
}

export type GuildRole = 'leader' | 'vice_leader' | 'elite' | 'member';

// NEW: Structure for an active buff on a player
export interface ActiveBuff {
  type: string;
  value: number;
  expires_at?: number; // Timestamp for timed buffs
  duration_attempts?: number; // For buffs consumed by actions
  consumption_trigger?: string;
}

// NEW: Avatar type
export interface Avatar {
  id: string;
  name: string;
  url: string;
  description: string;
}

// NEW: Equipment Upgrade Config type
export interface EquipmentUpgrade {
    upgrade_level: number;
    required_dust: number;
    success_chance: number;
    stat_multiplier: number;
}


export interface Player {
  name: string;
  qi: number;
  realmIndex: number;
  bodyStrength: number; // Điểm rèn luyện thân thể
  karma: number; // Ác Nghiệp
  merit: number; // NEW: Công Đức
  honorPoints: number; // Điểm vinh dự từ PvP
  linh_thach: number | string; // NEW: Spirit Stones for marketplace (BIGINT)
  refinement_dust: number; // NEW: For smelting furnace
  combat_power: number | string; // NEW: Combat Power (BIGINT)
  learnedTechniques: string[]; // IDs of learned techniques
  activeTechniqueId: string | null;
  last_technique_switch_time?: string; // NEW: For cooldown
  pills: { [pillId: string]: number }; // Kho chứa đan dược
  herbs: { [herbId: string]: number }; // Kho chứa nguyên liệu
  spiritualRoot: SpiritualRootId | null;
  // --- NEW INVENTORY SYSTEM ---
  inventory: PlayerEquipment[]; // Unequipped items
  equipment: PlayerEquipment[]; // Equipped items
  enlightenmentPoints: number;
  unlockedInsights: string[];
  purchasedHonorItems: string[]; // Items bought from honor shop (one-time)
  active_buffs: ActiveBuff[]; // NEW: Flexible buff system
  learned_pvp_skills: string[]; // NEW: PvP skills
  equipped_pvp_skill_id: string | null; // NEW: Equipped PvP skill
  breakthrough_consecutive_failures: number; // NEW: Counts consecutive failures
  pvp_elo: number; // NEW: PvP Ranking points
  // NEW: Avatar fields
  equipped_avatar_id: string | null;
  unlocked_avatars: string[];
  // Guild Info
  guildId: number | null;
  guildName: string | null;
  guildLevel: number | null;
  guildExp: number | string | null; // BIGINT
  guild_role: GuildRole | null;
  guild_contribution: number | string; // BIGINT
}

export interface InspectPlayer {
  name: string;
  realmIndex: number;
  bodyStrength: number;
  karma: number;
  merit: number;
  combat_power: number; // NEW: Combat Power
  activeTechniqueId: string | null;
  spiritualRoot: SpiritualRootId | null;
  // NEW: Calculated combat stats
  calculatedHp: number;
  calculatedAtk: number;
  calculatedDef: number;
  calculatedSpeed: number;
  calculatedCritRate: number;
  calculatedCritDamage: number;
  calculatedDodgeRate: number;
  calculatedLifesteal: number;
  calculatedCounter: number;
  // NEW: Calculated resist stats
  calculatedHitRate: number;
  calculatedCritResist: number;
  calculatedLifestealResist: number;
  calculatedCounterResist: number;
  is_banned: boolean;
  ban_reason: string | null;
}


export interface GameEvent {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  timestamp: number;
}

export interface ActiveEvent {
  id: number;
  title: string;
  description: string;
  bonuses: Array<{ type: string; value: number }>;
  expires_at: string;
}


export interface ChatMessage {
  id: number;
  playerName: string;
  message: string;
  timestamp: number;
  avatarUrl?: string;
}

export interface MatchHistoryItem {
    id: number;
    opponent: string;
    won: boolean;
    summary: string;
    log: CombatLogEntry[]; // UPDATED: Use structured log
    timestamp: number;
}

// UPDATED: Combined Market Listing Type
interface MarketListingBase {
    id: number;
    seller_name: string;
    expires_at: string;
    created_at: string;
}

export interface MarketListingEquipment extends MarketListingBase {
    listing_type: 'equipment';
    price: number;
    item: PlayerEquipment;
}

export interface MarketListingPill extends MarketListingBase {
    listing_type: 'pill';
    quantity: number;
    price_per_item: number;
    item: Pill;
}

export type MarketListing = MarketListingEquipment | MarketListingPill;


// NEW: Structured combat log entry
export interface CombatLogEntry {
    turn: number;
    text: string;
    type: 'action' | 'info' | 'skill';
    attacker?: string;
    defender?: string;
    damage?: number;
    shield?: number;
    state: {
        [playerName: string]: {
            hp: number;
            maxHp: number;
            energy: number;
            maxEnergy: number;
        }
    };
}


// --- Guild War Types ---
export interface GuildWar {
  id: number;
  name: string;
  start_time: string;
  status: 'PENDING' | 'REGISTRATION' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface GuildWarMatch {
    id: number;
    war_id: number;
    current_round: number;
    guild1_id: number;
    guild1_round_wins: number;
    guild2_id: number;
    guild2_round_wins: number;
    status: 'PENDING_LINEUP' | 'IN_PROGRESS' | 'COMPLETED';
    winner_guild_id: number | null;
    opponent: {
        id: number;
        name: string;
    };
    my_lineup_submitted: boolean;
    opponent_lineup_submitted: boolean;
}

export interface GuildWarFightResult {
    id: number;
    round_number: number;
    guild1_player: string;
    guild2_player: string;
    winner_player: string;
    fight_order: number;
    combat_log: CombatLogEntry[]; // UPDATED: Use structured log to be consistent with PvP.
}

export interface GuildWarState {
    current_war: GuildWar | null;
    is_registered: boolean;
    my_match: GuildWarMatch | null;
    fight_results: GuildWarFightResult[];
    is_leader: boolean; // NEW: To check if the current player is the guild leader
}

// NEW: Updated GuildMember to include role and contribution
export interface GuildMember {
    name: string;
    realmIndex: number;
    guild_role: GuildRole;
    guild_contribution: number | string;
    is_banned: boolean;
    equipped_avatar_id: string | null;
}

// NEW: Type for guild applications
export interface GuildApplication {
    id: number;
    player_name: string;
    realmIndex: number;
}

// NEW: Rarity Type
export interface Rarity {
  id: string;
  name: string;
  style: any; // Can be { css: "linear-gradient(...)", animation: "animate-class" }
}

// NEW: Breakthrough Failure Bonus type
export interface BreakthroughFailureBonus {
  failure_count: number;
  description: string | null;
  bonuses: { type: string; value: number }[];
}

// NEW: CSS Animation Type
export interface CssAnimation {
  class_name: string;
  keyframes_css: string;
}

// A generic item type for the unified inventory
export type GenericItem = 
  | (PlayerEquipment & { itemType: 'equipment' })
  | (Pill & { itemType: 'pill'; count: number; })
  | (Herb & { itemType: 'herb'; count: number; });

// NEW: Mail System Types
export type MailReward = Reward & { chance?: number };

export interface MailItem {
    id: number;
    title: string;
    content: string;
    rewards: MailReward[];
    is_read: boolean;
    created_at: string;
}

export interface GameData {
  REALMS: Realm[];
  SPIRITUAL_ROOTS: SpiritualRoot[];
  TECHNIQUES: Technique[];
  HERBS: Herb[];
  EXPLORATION_LOCATIONS: ExplorationLocation[];
  TRIAL_ZONES: TrialZone[];
  PILLS: Pill[];
  EQUIPMENT: Equipment[];
  EQUIPMENT_UPGRADES: EquipmentUpgrade[];
  RECIPES: Recipe[];
  INSIGHTS: Insight[];
  HONOR_SHOP_ITEMS: any[];
  PVP_SKILLS: PvpSkill[]; // NEW: Add pvp skills
  RARITIES: Rarity[]; // NEW: Add rarities
  BREAKTHROUGH_FAILURE_BONUSES: BreakthroughFailureBonus[];
  CSS_ANIMATIONS: CssAnimation[]; // NEW: Add CSS animations
  AVATARS: Avatar[]; // NEW: Add avatars
  [key: string]: any; // For game config keys like PVP_COOLDOWN_SECONDS
}