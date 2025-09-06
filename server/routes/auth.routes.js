const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');
const { getGameData } = require('../services/gameData.service');

const router = express.Router();

// --- Anti-Bot Configuration ---
const BOT_CLIENT_ID_ACCOUNT_LIMIT = 5;
const BOT_IP_ACCOUNT_LIMIT = 10; // FIX: Renamed constant for clarity
const BOT_DETECTION_TIMEFRAME_HOURS = 1;
const BOT_BAN_REASON = "Phát hiện hành vi đáng ngờ. Tài khoản đã bị khóa để điều tra.";

/**
 * Checks for suspicious activity and bans if thresholds are met.
 * @returns {Promise<boolean>} - Returns true if a ban was issued, otherwise false.
 */
const checkAndBanForBotActivity = async (conn, ip, clientId, playerName, action) => {
    if (!ip || !clientId) return false;

    await conn.query(
        "INSERT INTO ip_activity_log (ip_address, client_id, action, player_name) VALUES (?, ?, ?, ?)",
        [ip, clientId, action, playerName]
    );

    // Check 1: Too many accounts from one Client ID
    const [clientResult] = await conn.query(
        "SELECT COUNT(DISTINCT player_name) as count FROM ip_activity_log WHERE client_id = ? AND timestamp > NOW() - INTERVAL ? HOUR",
        [clientId, BOT_DETECTION_TIMEFRAME_HOURS]
    );

    if (clientResult.count >= BOT_CLIENT_ID_ACCOUNT_LIMIT) {
        console.log(`BOT DETECTED (Client ID): ${clientId} used for ${clientResult.count} accounts. Banning...`);
        const playersToBan = await conn.query("SELECT DISTINCT player_name as name FROM ip_activity_log WHERE client_id = ?", [clientId]);
        const playerNames = playersToBan.map((p) => p.name);

        if (playerNames.length > 0) {
            await conn.query("UPDATE players SET is_banned = 1, ban_reason = ? WHERE name IN (?)", [BOT_BAN_REASON, playerNames]);
        }
        
        const [latestIpResult] = await conn.query("SELECT ip_address FROM ip_activity_log WHERE client_id = ? ORDER BY timestamp DESC LIMIT 1", [clientId]);
        if (latestIpResult && latestIpResult.ip_address) {
            const ipToBan = latestIpResult.ip_address;
            await conn.query("INSERT INTO banned_ips (ip_address, reason) VALUES (?, ?) ON DUPLICATE KEY UPDATE reason = VALUES(reason)", [ipToBan, 'Automatic bot detection (multiple accounts per client)']);
        }
        
        return true;
    }
    
    // Check 2: Too many ACCOUNTS from one IP
    const [ipResult] = await conn.query(
        "SELECT COUNT(DISTINCT player_name) as count FROM ip_activity_log WHERE ip_address = ? AND timestamp > NOW() - INTERVAL ? HOUR",
        [ip, BOT_DETECTION_TIMEFRAME_HOURS]
    );

    if (ipResult.count >= BOT_IP_ACCOUNT_LIMIT) {
        console.log(`BOT DETECTED (IP): ${ip} used for ${ipResult.count} accounts. Banning...`); // FIX: Updated log message
        await conn.query("INSERT INTO banned_ips (ip_address, reason) VALUES (?, ?) ON DUPLICATE KEY UPDATE reason = VALUES(reason)", [ip, 'Automatic bot detection (multiple accounts)']);
        
        const playersToBan = await conn.query("SELECT DISTINCT player_name as name FROM ip_activity_log WHERE ip_address = ?", [ip]);
        const playerNames = playersToBan.map((p) => p.name);

        if (playerNames.length > 0) {
            await conn.query("UPDATE players SET is_banned = 1, ban_reason = ? WHERE name IN (?)", [BOT_BAN_REASON, playerNames]);
        }
        return true;
    }
    
    return false;
};


// [POST] /api/auth/register - Đăng ký tài khoản mới
router.post('/register', async (req, res) => {
    const { name, password } = req.body;
    const clientIp = req.clientIp;
    const clientId = req.clientId;

    if (!name || !password || password.length < 6) {
        return res.status(400).json({ message: 'Tên và mật khẩu (tối thiểu 6 ký tự) là bắt buộc.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();

        // NEW: Explicit IP Ban Check at the start of the handler for defense-in-depth
        if (clientIp) {
            const [bannedIp] = await conn.query("SELECT ip_address FROM banned_ips WHERE ip_address = ?", [clientIp]);
            if (bannedIp) {
                return res.status(403).json({ message: "IP đã bị cấm truy cập và không thể tạo tài khoản mới." });
            }
        }
        
        await conn.beginTransaction();

        const existingUser = await conn.query("SELECT name FROM players WHERE name = ?", [name]);
        if (existingUser.length > 0) {
            await conn.rollback();
            return res.status(409).json({ message: 'Tên đạo hữu này đã tồn tại.' });
        }
        
        const gameData = getGameData();
        const randomRoot = gameData.SPIRITUAL_ROOTS[Math.floor(Math.random() * gameData.SPIRITUAL_ROOTS.length)];
        const assignedRootId = randomRoot.id;
        const defaultAvatarId = 'default_male_1';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await conn.query(
            "INSERT INTO players (name, password, karma, merit, learnedTechniques, activeTechniqueId, lastChallengeTime, pills, herbs, spiritualRoot, honorPoints, enlightenmentPoints, unlockedInsights, purchasedHonorItems, explorationStatus, linh_thach, active_buffs, learned_pvp_skills, equipped_pvp_skill_id, guild_contribution, guild_role, breakthrough_consecutive_failures, combat_power, refinement_dust, unlocked_avatars, equipped_avatar_id, registration_ip, last_login_ip, registration_client_id, last_login_client_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                name, hashedPassword, 0, 0, JSON.stringify([]), null, JSON.stringify({}), JSON.stringify({}), JSON.stringify({}), assignedRootId, 0, 0, JSON.stringify([]), JSON.stringify([]), null, 0, JSON.stringify([]), JSON.stringify([]), null, 0, null, 0, 0, 0, JSON.stringify([defaultAvatarId]), defaultAvatarId,
                clientIp, clientIp, clientId, clientId
            ]
        );

        const wasBanned = await checkAndBanForBotActivity(conn, clientIp, clientId, name, 'register');
        
        await conn.commit();

        if (wasBanned) {
            return res.status(403).json({ message: BOT_BAN_REASON });
        }
        
        res.status(201).json({ message: 'Đăng ký thành công! Giờ bạn có thể đăng nhập.' });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error("Register Error:", err.message);
        res.status(500).json({ message: 'Lỗi máy chủ khi đăng ký.' });
    } finally {
        if (conn) conn.release();
    }
});

// [POST] /api/auth/login - Đăng nhập
router.post('/login', async (req, res) => {
    const { name, password } = req.body;
    const clientIp = req.clientIp;
    const clientId = req.clientId;

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const users = await conn.query("SELECT * FROM players WHERE name = ?", [name]);
        if (users.length === 0) {
            await conn.rollback();
            return res.status(401).json({ message: 'Tên hoặc mật khẩu không đúng.' });
        }
        const user = users[0];

        if (user.is_banned) {
            await conn.rollback();
            return res.status(403).json({ message: `Tài khoản của bạn đã bị khóa. Lý do: ${user.ban_reason || 'Không có lý do cụ thể.'}` });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await conn.rollback();
            return res.status(401).json({ message: 'Tên hoặc mật khẩu không đúng.' });
        }

        await conn.query("UPDATE players SET last_login_ip = ?, last_login_client_id = ? WHERE name = ?", [clientIp, clientId, name]);
        
        const wasBanned = await checkAndBanForBotActivity(conn, clientIp, clientId, name, 'login');

        await conn.commit();

        if (wasBanned) {
            return res.status(403).json({ message: BOT_BAN_REASON });
        }

        const token = jwt.sign({ name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, playerName: user.name });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error("Login Error:", err.message);
        res.status(500).json({ message: 'Lỗi máy chủ khi đăng nhập.' });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;