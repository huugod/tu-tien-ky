-- ==========================================
-- Tu Tiên Ký: 01 - Schema (Core Game Data)
-- ==========================================

-- 1. Create and Select Database
CREATE DATABASE IF NOT EXISTS `tu_tien_db`
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `tu_tien_db`;

-- ==========================================
-- CORE GAME DATA TABLES
-- ==========================================

-- NEW: Avatars Table
CREATE TABLE IF NOT EXISTS `avatars` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `url` VARCHAR(512) NOT NULL,
  `description` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- NEW: Rarities Table
CREATE TABLE IF NOT EXISTS `rarities` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `style` JSON NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Realms Table
CREATE TABLE IF NOT EXISTS `realms` (
  `realmIndex` INT NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `qiThreshold` BIGINT NOT NULL,
  `baseQiPerSecond` DOUBLE NOT NULL,
  `breakthroughChance` DOUBLE NOT NULL,
  `baseHp` INT NOT NULL,
  `baseAtk` INT NOT NULL,
  `baseDef` INT NOT NULL,
  `baseSpeed` INT NOT NULL DEFAULT 10,
  `baseCritRate` DOUBLE NOT NULL DEFAULT 0.05,
  `baseCritDamage` DOUBLE NOT NULL DEFAULT 1.5,
  `baseDodgeRate` DOUBLE NOT NULL DEFAULT 0.01,
  `baseHitRate` DOUBLE NOT NULL DEFAULT 0.0,
  `baseCritResist` DOUBLE NOT NULL DEFAULT 0.0,
  `baseLifestealResist` DOUBLE NOT NULL DEFAULT 0.0,
  `baseCounterResist` DOUBLE NOT NULL DEFAULT 0.0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Spiritual Roots Table
CREATE TABLE IF NOT EXISTS `spiritual_roots` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `bonus` JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Herbs Table
CREATE TABLE IF NOT EXISTS `herbs` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pills Table
CREATE TABLE IF NOT EXISTS `pills` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `effect` JSON NOT NULL,
  `rarity` VARCHAR(50) NULL,
  FOREIGN KEY (`rarity`) REFERENCES `rarities`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recipes Table
CREATE TABLE IF NOT EXISTS `recipes` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `pillId` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `requiredRealmIndex` INT NOT NULL,
  `qiCost` BIGINT NOT NULL,
  `herbCosts` JSON NOT NULL,
  `successChance` DOUBLE NOT NULL,
  FOREIGN KEY (`pillId`) REFERENCES `pills`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Techniques Table
CREATE TABLE IF NOT EXISTS `techniques` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `requiredRealmIndex` INT NOT NULL,
  `bonuses` JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Equipment Table
CREATE TABLE IF NOT EXISTS `equipment` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `slot` VARCHAR(20) NOT NULL, -- 'weapon', 'armor', 'accessory'
  `bonuses` JSON NOT NULL,
  `rarity` VARCHAR(50) NULL,
  `smelt_yield` INT NOT NULL DEFAULT 0, -- NEW: Dust gained from smelting
  FOREIGN KEY (`rarity`) REFERENCES `rarities`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NEW: Equipment Upgrades Table
CREATE TABLE IF NOT EXISTS `equipment_upgrades` (
  `upgrade_level` INT NOT NULL PRIMARY KEY,
  `required_dust` INT NOT NULL,
  `success_chance` DOUBLE NOT NULL,
  `stat_multiplier` DOUBLE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Insights Table
CREATE TABLE IF NOT EXISTS `insights` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `cost` INT NOT NULL,
  `requiredInsightIds` JSON NOT NULL,
  `bonus` JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exploration Locations Table
CREATE TABLE IF NOT EXISTS `exploration_locations` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `requiredRealmIndex` INT NOT NULL,
  `requiredBodyStrength` INT NOT NULL,
  `durationSeconds` INT NOT NULL,
  `rewards` JSON NOT NULL -- Example: [{"type": "herb", "herbId": "linh_thao", "amount": 1, "chance": 0.8}]
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trial Zones Table
CREATE TABLE IF NOT EXISTS `trial_zones` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `requiredRealmIndex` INT NOT NULL,
  `cooldownSeconds` INT NOT NULL,
  `monster` JSON NOT NULL,
  `rewards` JSON NOT NULL, -- Example: [{"type": "equipment", "equipmentId": "id", "chance": 0.05}]
  `type` VARCHAR(20) NOT NULL DEFAULT 'NORMAL' -- For Chính-Tà system
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Honor Shop Items Table
CREATE TABLE IF NOT EXISTS `honor_shop_items` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `type` VARCHAR(50) NOT NULL,
  `itemId` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `cost` INT NOT NULL,
  `isUnique` BOOLEAN NOT NULL DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PvP Skills Table
CREATE TABLE IF NOT EXISTS `pvp_skills` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `cost` INT NOT NULL, -- Honor points to learn
  `energy_cost` INT NOT NULL,
  `effect` JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Game Configuration Table
CREATE TABLE IF NOT EXISTS `game_config` (
  `config_key` VARCHAR(50) NOT NULL PRIMARY KEY,
  `config_value` JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NEW: Combat Log Templates Table
-- FIX: Changed `type` from ENUM to VARCHAR(50) to prevent truncation errors and allow for easier expansion.
CREATE TABLE IF NOT EXISTS `combat_log_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` VARCHAR(50) NOT NULL,
  `template` VARCHAR(512) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NEW: Breakthrough Failure Bonuses Table
CREATE TABLE IF NOT EXISTS `breakthrough_failure_bonuses` (
  `failure_count` INT NOT NULL PRIMARY KEY,
  `description` TEXT NULL,
  `bonuses` JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NEW: CSS Animations Table
CREATE TABLE IF NOT EXISTS `css_animations` (
  `class_name` VARCHAR(100) NOT NULL PRIMARY KEY,
  `keyframes_css` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;