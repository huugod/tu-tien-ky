-- ==========================================
-- Tu Tiên Ký: 03 - Schema (Guild War)
-- ==========================================
USE `tu_tien_db`;

-- ==========================================
-- GUILD WAR TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS `guild_wars` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `start_time` TIMESTAMP NOT NULL,
  `status` ENUM('PENDING', 'REGISTRATION', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
  `rewards` JSON NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `guild_war_registrations` (
  `war_id` INT NOT NULL,
  `guild_id` INT NOT NULL,
  `registered_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`war_id`, `guild_id`),
  FOREIGN KEY (`war_id`) REFERENCES `guild_wars`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `guild_war_matches` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `war_id` INT NOT NULL,
  `guild1_id` INT NOT NULL,
  `guild2_id` INT NOT NULL,
  `current_round` INT NOT NULL DEFAULT 1,
  `guild1_round_wins` INT NOT NULL DEFAULT 0,
  `guild2_round_wins` INT NOT NULL DEFAULT 0,
  `winner_guild_id` INT NULL,
  `status` ENUM('PENDING_LINEUP', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'PENDING_LINEUP',
  FOREIGN KEY (`war_id`) REFERENCES `guild_wars`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`guild1_id`) REFERENCES `guilds`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`guild2_id`) REFERENCES `guilds`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `guild_war_lineups` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `match_id` INT NOT NULL,
  `round_number` INT NOT NULL,
  `guild_id` INT NOT NULL,
  `player1_name` VARCHAR(50) NOT NULL,
  `player2_name` VARCHAR(50) NOT NULL,
  `player3_name` VARCHAR(50) NOT NULL,
  `submitted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `match_round_guild` (`match_id`, `round_number`, `guild_id`),
  FOREIGN KEY (`match_id`) REFERENCES `guild_war_matches`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `guild_war_fights` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `match_id` INT NOT NULL,
  `round_number` INT NOT NULL,
  `guild1_player` VARCHAR(50) NOT NULL,
  `guild2_player` VARCHAR(50) NOT NULL,
  `winner_player` VARCHAR(50) NOT NULL,
  `combat_log` JSON NOT NULL,
  `fight_order` INT NOT NULL, -- 1, 2, or 3 within the round
  FOREIGN KEY (`match_id`) REFERENCES `guild_war_matches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `guild_war_match_participants` (
  `match_id` INT NOT NULL,
  `player_name` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`match_id`, `player_name`),
  FOREIGN KEY (`match_id`) REFERENCES `guild_war_matches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
