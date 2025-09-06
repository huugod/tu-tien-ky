const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { processOfflineGains, calculateTotalBonuses, calculateCombatStats, performAction, updatePlayerState, getFullPlayerQuery } = require('../services/player.service');

const router = express.Router();

// [GET] /api/load - Tải/Đồng bộ trạng thái người chơi
router.get('/load', authenticateToken, async (req, res) => {
    const name = req.user.name;
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const data = await processOfflineGains(conn, name);

        await conn.commit();
        
        res.status(200).json(data);

    } catch (err) {
        if (conn) await conn.rollback();
        console.error("Load/Sync Error:", err.message);
        res.status(500).json({ message: 'Lỗi khi đồng bộ dữ liệu từ máy chủ.' });
    } finally {
        if (conn) conn.release();
    }
});


// [GET] /api/leaderboard - Lấy Bảng Xếp Hạng Lực Chiến
router.get('/leaderboard', authenticateToken, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const leaderboard = await conn.query(
            "SELECT name, realmIndex, combat_power, is_banned FROM players ORDER BY combat_power DESC, realmIndex DESC LIMIT 20"
        );
        res.status(200).json(leaderboard);
    } catch (err) {
        console.error("Leaderboard Error:", err.message);
        res.status(500).json({ message: 'Lỗi khi tải bảng xếp hạng.' });
    } finally {
        if (conn) conn.release();
    }
});

// NEW: [GET] /api/leaderboard/pvp - Lấy Bảng Xếp Hạng Đấu Pháp (Elo)
router.get('/leaderboard/pvp', authenticateToken, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const leaderboard = await conn.query(
            "SELECT name, realmIndex, pvp_elo, is_banned FROM players ORDER BY pvp_elo DESC, realmIndex DESC LIMIT 20"
        );
        res.status(200).json(leaderboard);
    } catch (err) {
        console.error("PvP Leaderboard Error:", err.message);
        res.status(500).json({ message: 'Lỗi khi tải bảng xếp hạng Đấu Pháp.' });
    } finally {
        if (conn) conn.release();
    }
});

// [GET] /api/player/:name - Lấy thông tin của người chơi khác để quan sát
router.get('/player/:name', authenticateToken, async (req, res) => {
    const { name } = req.params;
    let conn;
    try {
        conn = await pool.getConnection();
        const players = await conn.query(
            "SELECT * FROM players WHERE name = ?", // Get all data needed for calculation
            [name]
        );

        if (players.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đạo hữu này.' });
        }
        
        const player = await require('../services/player.service').getFullPlayerQuery(conn, name);

        const bonuses = await calculateTotalBonuses(conn, player);
        const stats = calculateCombatStats(player, bonuses);

        const inspectData = {
            name: player.name,
            realmIndex: player.realmIndex,
            bodyStrength: player.bodyStrength,
            karma: player.karma,
            merit: player.merit,
            combat_power: player.combat_power,
            activeTechniqueId: player.activeTechniqueId,
            spiritualRoot: player.spiritualRoot,
            calculatedHp: stats.hp,
            calculatedAtk: stats.atk,
            calculatedDef: stats.def,
            calculatedSpeed: stats.speed,
            calculatedCritRate: stats.critRate,
            calculatedCritDamage: stats.critDamage,
            calculatedDodgeRate: stats.dodgeRate,
            calculatedLifesteal: stats.lifestealRate,
            calculatedCounter: stats.counterRate,
            calculatedHitRate: stats.hitRate,
            calculatedCritResist: stats.critResist,
            calculatedLifestealResist: stats.lifestealResist,
            calculatedCounterResist: stats.counterResist,
            is_banned: player.is_banned,
            ban_reason: player.ban_reason,
        };
        
        res.status(200).json(inspectData);

    } catch (err) {
        console.error("Inspect Player Error:", err.message);
        res.status(500).json({ message: 'Lỗi khi lấy thông tin người chơi.' });
    } finally {
        if (conn) conn.release();
    }
});

// NEW: Endpoint to equip an avatar
router.post('/equip-avatar', authenticateToken, async (req, res) => {
    const { avatarId } = req.body;
    await performAction(req, res, async (conn, p, body, resRef) => {
        if (!avatarId) {
            throw new Error("Không có Pháp Tướng nào được chọn.");
        }

        const unlockedAvatars = p.unlocked_avatars || [];
        if (!unlockedAvatars.includes(avatarId)) {
            throw new Error("Bạn không sở hữu Pháp Tướng này.");
        }

        await updatePlayerState(conn, p.name, { equipped_avatar_id: avatarId });
        resRef.log = { message: 'Đã thay đổi Pháp Tướng thành công.', type: 'success' };
    });
});


module.exports = router;