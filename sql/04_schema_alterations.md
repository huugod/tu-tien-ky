-- ==========================================
-- Tu Tiên Ký: 04 - Schema (Alterations)
-- Idempotent version (safe to run many times)
-- ==========================================
USE `tu_tien_db`;

-- Safely add 'type' column to trial_zones
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='trial_zones' AND COLUMN_NAME='type');
SET @sql := IF(@col_exists=0, "ALTER TABLE `trial_zones` ADD COLUMN `type` VARCHAR(20) NOT NULL DEFAULT 'NORMAL'", 'SELECT "Column trial_zones.type already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Safe add columns to guilds
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='guilds' AND COLUMN_NAME='level');
SET @sql := IF(@col_exists=0, 'ALTER TABLE guilds ADD COLUMN `level` INT NOT NULL DEFAULT 1', 'SELECT "Column guilds.level already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='guilds' AND COLUMN_NAME='exp');
SET @sql := IF(@col_exists=0, 'ALTER TABLE guilds ADD COLUMN `exp` BIGINT NOT NULL DEFAULT 0', 'SELECT "Column guilds.exp already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='guilds' AND COLUMN_NAME='announcement');
SET @sql := IF(@col_exists=0, 'ALTER TABLE guilds ADD COLUMN `announcement` TEXT NULL', 'SELECT "Column guilds.announcement already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Safe add/remove columns to players
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='guildId');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `guildId` INT NULL', 'SELECT "Column players.guildId already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='mindState');
SET @sql := IF(@col_exists>0, 'ALTER TABLE players DROP COLUMN `mindState`', 'SELECT "Column players.mindState does not exist, skipping drop."'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='karma');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `karma` INT NOT NULL DEFAULT 0', 'SELECT "Column players.karma already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add 'merit' column for Chính-Tà system
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='merit');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `merit` INT NOT NULL DEFAULT 0', 'SELECT "Column players.merit already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='lastChallengeTime');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `lastChallengeTime` JSON NULL DEFAULT (JSON_OBJECT())', 'SELECT "Column players.lastChallengeTime already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='pills');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `pills` JSON NULL DEFAULT (JSON_OBJECT())', 'SELECT "Column players.pills already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='herbs');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `herbs` JSON NULL DEFAULT (JSON_OBJECT())', 'SELECT "Column players.herbs already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='spiritualRoot');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `spiritualRoot` VARCHAR(10) NULL', 'SELECT "Column players.spiritualRoot already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='honorPoints');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `honorPoints` INT NOT NULL DEFAULT 0', 'SELECT "Column players.honorPoints already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='learnedTechniques');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `learnedTechniques` JSON NULL DEFAULT (JSON_ARRAY())', 'SELECT "Column players.learnedTechniques already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='activeTechniqueId');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `activeTechniqueId` VARCHAR(50) NULL', 'SELECT "Column players.activeTechniqueId already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- REMOVE old treasure columns
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='treasures');
SET @sql := IF(@col_exists > 0, 'ALTER TABLE players DROP COLUMN `treasures`', 'SELECT "Column players.treasures does not exist, skipping drop."'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='equippedTreasureId');
SET @sql := IF(@col_exists > 0, 'ALTER TABLE players DROP COLUMN `equippedTreasureId`', 'SELECT "Column players.equippedTreasureId does not exist, skipping drop."'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='enlightenmentPoints');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `enlightenmentPoints` INT NOT NULL DEFAULT 0', 'SELECT "Column players.enlightenmentPoints already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='unlockedInsights');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `unlockedInsights` JSON NULL DEFAULT (JSON_ARRAY())', 'SELECT "Column players.unlockedInsights already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='explorationStatus');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `explorationStatus` JSON NULL', 'SELECT "Column players.explorationStatus already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='purchasedHonorItems');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `purchasedHonorItems` JSON NULL DEFAULT (JSON_ARRAY())', 'SELECT "Column players.purchasedHonorItems already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='is_banned');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `is_banned` BOOLEAN NOT NULL DEFAULT FALSE', 'SELECT "Column players.is_banned already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='ban_reason');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `ban_reason` TEXT NULL', 'SELECT "Column players.ban_reason already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='linh_thach');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `linh_thach` BIGINT NOT NULL DEFAULT 0', 'SELECT "Column players.linh_thach already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='combat_power');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `combat_power` BIGINT NOT NULL DEFAULT 0', 'SELECT "Column players.combat_power already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='refinement_dust');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `refinement_dust` INT NOT NULL DEFAULT 0', 'SELECT "Column players.refinement_dust already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- NEW: Drop pvpBuff and add active_buffs
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='pvpBuff');
SET @sql := IF(@col_exists > 0, 'ALTER TABLE players DROP COLUMN `pvpBuff`', 'SELECT "Column players.pvpBuff does not exist, skipping drop."'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='active_buffs');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `active_buffs` JSON NULL DEFAULT (JSON_ARRAY())', 'SELECT "Column players.active_buffs already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- NEW: Drop breakthrough_failure_bonus and add breakthrough_consecutive_failures
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='breakthrough_failure_bonus');
SET @sql := IF(@col_exists > 0, 'ALTER TABLE players DROP COLUMN `breakthrough_failure_bonus`', 'SELECT "Column players.breakthrough_failure_bonus does not exist, skipping drop."'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='breakthrough_consecutive_failures');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `breakthrough_consecutive_failures` INT NOT NULL DEFAULT 0', 'SELECT "Column players.breakthrough_consecutive_failures already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='learned_pvp_skills');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `learned_pvp_skills` JSON NULL DEFAULT (JSON_ARRAY())', 'SELECT "Column players.learned_pvp_skills already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add guild_role and guild_contribution columns
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='guild_role');
SET @sql := IF(@col_exists=0, "ALTER TABLE players ADD COLUMN `guild_role` VARCHAR(20) NULL", 'SELECT "Column players.guild_role already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='guild_contribution');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `guild_contribution` BIGINT NOT NULL DEFAULT 0', 'SELECT "Column players.guild_contribution already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- NEW: Add equipped_pvp_skill_id column
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='equipped_pvp_skill_id');
SET @sql := IF(@col_exists=0, "ALTER TABLE players ADD COLUMN `equipped_pvp_skill_id` VARCHAR(50) NULL DEFAULT NULL", 'SELECT "Column players.equipped_pvp_skill_id already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- NEW: Add avatar columns
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='equipped_avatar_id');
SET @sql := IF(@col_exists=0, "ALTER TABLE players ADD COLUMN `equipped_avatar_id` VARCHAR(50) NULL", 'SELECT "Column players.equipped_avatar_id already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='unlocked_avatars');
SET @sql := IF(@col_exists=0, 'ALTER TABLE players ADD COLUMN `unlocked_avatars` JSON NULL DEFAULT (JSON_ARRAY())', 'SELECT "Column players.unlocked_avatars already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- NEW: Add last_technique_switch_time to players table for cooldown
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='last_technique_switch_time');
SET @sql := IF(@col_exists=0, "ALTER TABLE `players` ADD COLUMN `last_technique_switch_time` TIMESTAMP NULL DEFAULT NULL", 'SELECT "Column players.last_technique_switch_time already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- NEW: Add pvp_elo to players table
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='pvp_elo');
SET @sql := IF(@col_exists=0, "ALTER TABLE `players` ADD COLUMN `pvp_elo` INT NOT NULL DEFAULT 1000", 'SELECT "Column players.pvp_elo already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- Foreign Key fk_guild
SET @fk_exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = 'tu_tien_db' AND TABLE_NAME = 'players' AND CONSTRAINT_NAME = 'fk_guild');
SET @sql := IF(@fk_exists=0, 'ALTER TABLE `players` ADD CONSTRAINT `fk_guild` FOREIGN KEY (`guildId`) REFERENCES `guilds`(`id`) ON DELETE SET NULL', 'SELECT "Foreign key fk_guild already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- NEW: Foreign Key for equipped_pvp_skill_id
SET @fk_exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = 'tu_tien_db' AND TABLE_NAME = 'players' AND CONSTRAINT_NAME = 'fk_equipped_skill');
SET @sql := IF(@fk_exists=0, 'ALTER TABLE `players` ADD CONSTRAINT `fk_equipped_skill` FOREIGN KEY (`equipped_pvp_skill_id`) REFERENCES `pvp_skills`(`id`) ON DELETE SET NULL', 'SELECT "Foreign key fk_equipped_skill already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- NEW: Foreign Key for equipped_avatar_id
SET @fk_exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = 'tu_tien_db' AND TABLE_NAME = 'players' AND CONSTRAINT_NAME = 'fk_equipped_avatar');
SET @sql := IF(@fk_exists=0, 'ALTER TABLE `players` ADD CONSTRAINT `fk_equipped_avatar` FOREIGN KEY (`equipped_avatar_id`) REFERENCES `avatars`(`id`) ON DELETE SET NULL', 'SELECT "Foreign key fk_equipped_avatar already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- Index for combat_power
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'tu_tien_db' AND TABLE_NAME = 'players' AND INDEX_NAME = 'idx_combat_power');
SET @sql := IF(@idx_exists=0, 'ALTER TABLE `players` ADD INDEX `idx_combat_power` (`combat_power` DESC)', 'SELECT "Index idx_combat_power already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- NEW: Index for pvp_elo
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'tu_tien_db' AND TABLE_NAME = 'players' AND INDEX_NAME = 'idx_pvp_elo');
SET @sql := IF(@idx_exists=0, 'ALTER TABLE `players` ADD INDEX `idx_pvp_elo` (`pvp_elo` DESC)', 'SELECT "Index idx_pvp_elo already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- Safely modify events table for multiple bonuses
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='events' AND COLUMN_NAME='bonuses');
SET @sql := IF(@col_exists=0, 'ALTER TABLE `events` ADD COLUMN `bonuses` JSON NULL AFTER `description`', 'SELECT "Column events.bonuses already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='events' AND COLUMN_NAME='bonus_type');
SET @sql := IF(@col_exists > 0, 'ALTER TABLE `events` DROP COLUMN `bonus_type`', 'SELECT "Column events.bonus_type does not exist, skipping drop."'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='events' AND COLUMN_NAME='bonus_value');
SET @sql := IF(@col_exists > 0, 'ALTER TABLE `events` DROP COLUMN `bonus_value`', 'SELECT "Column events.bonus_value does not exist, skipping drop."'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- NEW: Safely modify rarities table
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='rarities' AND COLUMN_NAME='style');
SET @sql := IF(@col_exists=0, 'ALTER TABLE `rarities` ADD COLUMN `style` JSON NULL AFTER `name`', 'SELECT "Column rarities.style already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='rarities' AND COLUMN_NAME='color');
SET @sql := IF(@col_exists > 0, 'ALTER TABLE `rarities` DROP COLUMN `color`', 'SELECT "Column rarities.color does not exist, skipping drop."'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- ADD Rarity FKs
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='equipment' AND COLUMN_NAME='rarity');
SET @sql := IF(@col_exists=0, 'ALTER TABLE `equipment` ADD COLUMN `rarity` VARCHAR(50) NULL, ADD CONSTRAINT `fk_equipment_rarity` FOREIGN KEY (`rarity`) REFERENCES `rarities`(`id`) ON DELETE SET NULL', 'SELECT "Column equipment.rarity already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='pills' AND COLUMN_NAME='rarity');
SET @sql := IF(@col_exists=0, 'ALTER TABLE `pills` ADD COLUMN `rarity` VARCHAR(50) NULL, ADD CONSTRAINT `fk_pills_rarity` FOREIGN KEY (`rarity`) REFERENCES `rarities`(`id`) ON DELETE SET NULL', 'SELECT "Column pills.rarity already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- NEW: Add smelt_yield to equipment table
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='equipment' AND COLUMN_NAME='smelt_yield');
SET @sql := IF(@col_exists=0, 'ALTER TABLE `equipment` ADD COLUMN `smelt_yield` INT NOT NULL DEFAULT 0', 'SELECT "Column equipment.smelt_yield already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- NEW: Modify combat_log_templates.type to VARCHAR for flexibility
SET @col_type := (SELECT DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='combat_log_templates' AND COLUMN_NAME='type');
SET @sql := IF(@col_type = 'enum', "ALTER TABLE `combat_log_templates` MODIFY COLUMN `type` VARCHAR(50) NOT NULL", 'SELECT "Column combat_log_templates.type is not ENUM, skipping modification."');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- NEW: Table for banned player snapshots
CREATE TABLE IF NOT EXISTS `banned_player_snapshots` (
  `player_name` VARCHAR(50) NOT NULL PRIMARY KEY,
  `snapshot_data` JSON NOT NULL,
  `banned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`player_name`) REFERENCES `players`(`name`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NEW: Add icon_url to items
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='equipment' AND COLUMN_NAME='icon_url');
SET @sql := IF(@col_exists=0, "ALTER TABLE `equipment` ADD COLUMN `icon_url` VARCHAR(512) NULL", 'SELECT "Column equipment.icon_url already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='pills' AND COLUMN_NAME='icon_url');
SET @sql := IF(@col_exists=0, "ALTER TABLE `pills` ADD COLUMN `icon_url` VARCHAR(512) NULL", 'SELECT "Column pills.icon_url already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='herbs' AND COLUMN_NAME='icon_url');
SET @sql := IF(@col_exists=0, "ALTER TABLE `herbs` ADD COLUMN `icon_url` VARCHAR(512) NULL", 'SELECT "Column herbs.icon_url already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- NEW: Add is_upgradable to equipment table
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='equipment' AND COLUMN_NAME='is_upgradable');
SET @sql := IF(@col_exists=0, "ALTER TABLE `equipment` ADD COLUMN `is_upgradable` BOOLEAN NOT NULL DEFAULT FALSE", 'SELECT "Column equipment.is_upgradable already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- NEW: Add upgrade_level to player_equipment
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='player_equipment' AND COLUMN_NAME='upgrade_level');
SET @sql := IF(@col_exists=0, "ALTER TABLE `player_equipment` ADD COLUMN `upgrade_level` INT NOT NULL DEFAULT 0", 'SELECT "Column player_equipment.upgrade_level already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- NEW: Add is_locked to player_equipment
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='player_equipment' AND COLUMN_NAME='is_locked');
SET @sql := IF(@col_exists=0, "ALTER TABLE `player_equipment` ADD COLUMN `is_locked` BOOLEAN NOT NULL DEFAULT FALSE", 'SELECT "Column player_equipment.is_locked already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- FIX: Increase pvp_history.funny_summary size to prevent transaction rollbacks
SET @col_len := (SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'tu_tien_db' AND TABLE_NAME = 'pvp_history' AND COLUMN_NAME = 'funny_summary');
SET @sql := IF(@col_len < 512, "ALTER TABLE `pvp_history` MODIFY COLUMN `funny_summary` VARCHAR(512) NOT NULL", "SELECT 'pvp_history.funny_summary is already large enough.'");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- NEW: Add IP tracking columns to players table
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='registration_ip');
SET @sql := IF(@col_exists=0, "ALTER TABLE `players` ADD COLUMN `registration_ip` VARCHAR(45) NULL", 'SELECT "Column players.registration_ip already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='last_login_ip');
SET @sql := IF(@col_exists=0, "ALTER TABLE `players` ADD COLUMN `last_login_ip` VARCHAR(45) NULL", 'SELECT "Column players.last_login_ip already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='registration_client_id');
SET @sql := IF(@col_exists=0, "ALTER TABLE `players` ADD COLUMN `registration_client_id` VARCHAR(50) NULL", 'SELECT "Column players.registration_client_id already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='players' AND COLUMN_NAME='last_login_client_id');
SET @sql := IF(@col_exists=0, "ALTER TABLE `players` ADD COLUMN `last_login_client_id` VARCHAR(50) NULL", 'SELECT "Column players.last_login_client_id already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- NEW: Add client_id to ip_activity_log table
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tu_tien_db' AND TABLE_NAME='ip_activity_log' AND COLUMN_NAME='client_id');
SET @sql := IF(@col_exists=0, "ALTER TABLE `ip_activity_log` ADD COLUMN `client_id` VARCHAR(50) NULL AFTER `ip_address`", 'SELECT "Column ip_activity_log.client_id already exists"'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- NEW: Update index on ip_activity_log
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'tu_tien_db' AND TABLE_NAME = 'ip_activity_log' AND INDEX_NAME = 'idx_ip_timestamp');
SET @sql := IF(@idx_exists > 0, 'ALTER TABLE `ip_activity_log` DROP INDEX `idx_ip_timestamp`', 'SELECT "Index idx_ip_timestamp does not exist, skipping drop."'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'tu_tien_db' AND TABLE_NAME = 'ip_activity_log' AND INDEX_NAME = 'idx_ip_client_timestamp');
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE `ip_activity_log` ADD INDEX `idx_ip_client_timestamp` (`ip_address`, `client_id`, `timestamp`)', 'SELECT "Index idx_ip_client_timestamp already exists."'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'tu_tien_db' AND TABLE_NAME = 'ip_activity_log' AND INDEX_NAME = 'idx_client_id');
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE `ip_activity_log` ADD INDEX `idx_client_id` (`client_id`)', 'SELECT "Index idx_client_id already exists."'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- NEW: Create PvP reward tables
CREATE TABLE IF NOT EXISTS `pvp_daily_rewards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rank_start` INT NOT NULL,
  `rank_end` INT NOT NULL,
  `rewards` JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pvp_weekly_rewards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rank_start` INT NOT NULL,
  `rank_end` INT NOT NULL,
  `rewards` JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NEW: Create Mail table
CREATE TABLE IF NOT EXISTS `mail` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `player_name` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NULL,
  `rewards` JSON NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`player_name`) REFERENCES `players`(`name`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;