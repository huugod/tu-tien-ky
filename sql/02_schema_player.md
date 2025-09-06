-- ==========================================
-- Tu Tiên Ký: 02 - Schema (Player & System)
-- ==========================================
USE `tu_tien_db`;

-- ==========================================
-- PLAYER AND SYSTEM TABLES
-- ==========================================

-- Guilds Table
CREATE TABLE IF NOT EXISTS `guilds` (
  `id` INT AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `leaderName` VARCHAR(50) NOT NULL,
  `level` INT NOT NULL DEFAULT 1,
  `exp` BIGINT NOT NULL DEFAULT 0,
  `announcement` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci;

-- Players Table
CREATE TABLE IF NOT EXISTS `players` (
  `name` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `qi` DOUBLE PRECISION NOT NULL DEFAULT 0,
  `realmIndex` INT NOT NULL DEFAULT 0,
  `bodyStrength` DOUBLE PRECISION NOT NULL DEFAULT 0,
  `combat_power` BIGINT NOT NULL DEFAULT 0,
  `refinement_dust` INT NOT NULL DEFAULT 0,
  `breakthrough_consecutive_failures` INT NOT NULL DEFAULT 0,
  `equipped_avatar_id` VARCHAR(50) NULL,
  `unlocked_avatars` JSON NULL DEFAULT (JSON_ARRAY()),
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `guildId` INT NULL,
  `karma` INT NOT NULL DEFAULT 0,
  `merit` INT NOT NULL DEFAULT 0,
  `lastChallengeTime` JSON NULL DEFAULT (JSON_OBJECT()),
  `pills` JSON NULL DEFAULT (JSON_OBJECT()),
  `herbs` JSON NULL DEFAULT (JSON_OBJECT()),
  `spiritualRoot` VARCHAR(50) NULL,
  `honorPoints` INT NOT NULL DEFAULT 0,
  `learnedTechniques` JSON NULL DEFAULT (JSON_ARRAY()),
  `activeTechniqueId` VARCHAR(50) NULL,
  `enlightenmentPoints` INT NOT NULL DEFAULT 0,
  `unlockedInsights` JSON NULL DEFAULT (JSON_ARRAY()),
  `explorationStatus` JSON NULL,
  `purchasedHonorItems` JSON NULL DEFAULT (JSON_ARRAY()),
  `is_banned` BOOLEAN NOT NULL DEFAULT FALSE,
  `ban_reason` TEXT NULL,
  `linh_thach` BIGINT NOT NULL DEFAULT 0,
  `active_buffs` JSON NULL DEFAULT (JSON_ARRAY()),
  `learned_pvp_skills` JSON NULL DEFAULT (JSON_ARRAY()),
  `guild_role` VARCHAR(20) NULL,
  `guild_contribution` BIGINT NOT NULL DEFAULT 0,
  `equipped_pvp_skill_id` VARCHAR(50) NULL DEFAULT NULL,
  `last_technique_switch_time` TIMESTAMP NULL DEFAULT NULL,
  `registration_ip` VARCHAR(45) NULL,
  `last_login_ip` VARCHAR(45) NULL,
  `registration_client_id` VARCHAR(50) NULL,
  `last_login_client_id` VARCHAR(50) NULL,
  `pvp_elo` INT NOT NULL DEFAULT 1000, -- NEW: Elo rating for PvP
  PRIMARY KEY (`name`),
  INDEX `idx_combat_power` (`combat_power` DESC),
  INDEX `idx_pvp_elo` (`pvp_elo` DESC), -- NEW: Index for Elo
  FOREIGN KEY (`equipped_avatar_id`) REFERENCES `avatars`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`guildId`) REFERENCES `guilds`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`equipped_pvp_skill_id`) REFERENCES `pvp_skills`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci;

-- Player Equipment Table (Instance-based items)
CREATE TABLE IF NOT EXISTS `player_equipment` (
  `instance_id` INT AUTO_INCREMENT PRIMARY KEY,
  `player_name` VARCHAR(50) NOT NULL,
  `equipment_id` VARCHAR(50) NOT NULL,
  `is_equipped` BOOLEAN NOT NULL DEFAULT FALSE,
  `slot` VARCHAR(20) NULL,
  `upgrade_level` INT NOT NULL DEFAULT 0, -- NEW: For Blacksmith upgrades
  `is_locked` BOOLEAN NOT NULL DEFAULT FALSE, -- NEW: For Quick Smelt safety
  FOREIGN KEY (`player_name`) REFERENCES `players`(`name`) ON DELETE CASCADE,
  FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON DELETE CASCADE,
  INDEX `idx_player_equipment` (`player_name`, `is_equipped`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` INT AUTO_INCREMENT,
  `playerName` VARCHAR(50) NOT NULL,
  `message` VARCHAR(255) NOT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PvP History Table
CREATE TABLE IF NOT EXISTS `pvp_history` (
  `id` INT AUTO_INCREMENT,
  `attacker_name` VARCHAR(50) NOT NULL,
  `defender_name` VARCHAR(50) NOT NULL,
  `winner_name` VARCHAR(50) NOT NULL,
  `funny_summary` VARCHAR(512) NOT NULL,
  `combat_log` JSON NOT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_attacker` (`attacker_name`),
  INDEX `idx_defender` (`defender_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events Table
CREATE TABLE IF NOT EXISTS `events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `bonuses` JSON NULL,
  `starts_at` TIMESTAMP NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NEW: Announcements Table
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `content` TEXT NOT NULL,
  `start_time` TIMESTAMP NOT NULL,
  `end_time` TIMESTAMP NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gift Codes Table
CREATE TABLE IF NOT EXISTS `gift_codes` (
  `code` VARCHAR(50) PRIMARY KEY,
  `rewards` JSON NOT NULL,
  `max_uses` INT DEFAULT NULL,
  `uses` INT NOT NULL DEFAULT 0,
  `expires_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Redeemed Codes Table
CREATE TABLE IF NOT EXISTS `player_redeemed_codes` (
  `player_name` VARCHAR(50) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `redeemed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`player_name`, `code`),
  FOREIGN KEY (`player_name`) REFERENCES `players`(`name`) ON DELETE CASCADE,
  FOREIGN KEY (`code`) REFERENCES `gift_codes`(`code`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admins Table
CREATE TABLE IF NOT EXISTS `admins` (
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Marketplace Listings Table (For Equipment)
CREATE TABLE IF NOT EXISTS `market_listings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `seller_name` VARCHAR(50) NOT NULL,
  `item_id` INT NOT NULL UNIQUE,
  `price` BIGINT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL,
  FOREIGN KEY (`seller_name`) REFERENCES `players`(`name`) ON DELETE CASCADE,
  FOREIGN KEY (`item_id`) REFERENCES `player_equipment`(`instance_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NEW: Marketplace Listings Table (For Pills)
CREATE TABLE IF NOT EXISTS `market_listings_pills` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `seller_name` VARCHAR(50) NOT NULL,
  `pill_id` VARCHAR(50) NOT NULL,
  `quantity` INT NOT NULL,
  `price_per_item` BIGINT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL,
  FOREIGN KEY (`seller_name`) REFERENCES `players`(`name`) ON DELETE CASCADE,
  FOREIGN KEY (`pill_id`) REFERENCES `pills`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Guild Applications Table
CREATE TABLE IF NOT EXISTS `guild_applications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `guild_id` INT NOT NULL,
  `player_name` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `guild_player_application` (`guild_id`, `player_name`),
  FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`player_name`) REFERENCES `players`(`name`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NEW: Banned IPs Table for Anti-Bot
CREATE TABLE IF NOT EXISTS `banned_ips` (
  `ip_address` VARCHAR(45) NOT NULL PRIMARY KEY,
  `reason` VARCHAR(255) NULL,
  `banned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NEW: IP Activity Log Table for Anti-Bot
CREATE TABLE IF NOT EXISTS `ip_activity_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ip_address` VARCHAR(45) NOT NULL,
  `client_id` VARCHAR(50) NULL,
  `action` VARCHAR(20) NOT NULL, -- 'register' or 'login'
  `player_name` VARCHAR(50) NOT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ip_client_timestamp` (`ip_address`, `client_id`, `timestamp`),
  INDEX `idx_client_id` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NEW: Banned Player Snapshots table for restoring data on unban
CREATE TABLE IF NOT EXISTS `banned_player_snapshots` (
  `player_name` VARCHAR(50) NOT NULL PRIMARY KEY,
  `snapshot_data` JSON NOT NULL,
  `banned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`player_name`) REFERENCES `players`(`name`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NEW: Mail table
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

-- NEW: PvP Daily Rewards Table
CREATE TABLE IF NOT EXISTS `pvp_daily_rewards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rank_start` INT NOT NULL,
  `rank_end` INT NOT NULL,
  `rewards` JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NEW: PvP Weekly Rewards Table
CREATE TABLE IF NOT EXISTS `pvp_weekly_rewards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rank_start` INT NOT NULL,
  `rank_end` INT NOT NULL,
  `rewards` JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;