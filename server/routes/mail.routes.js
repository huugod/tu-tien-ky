const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { performAction, updatePlayerState } = require('../services/player.service');
const { getGameData } = require('../services/gameData.service');

const router = express.Router();

// GET /api/mail/ - Get all mail for the player
router.get('/', authenticateToken, async (req, res) => {
    const playerName = req.user.name;
    let conn;
    try {
        conn = await pool.getConnection();
        const mailItems = await conn.query(
            "SELECT id, title, content, rewards, is_read, created_at FROM mail WHERE player_name = ? ORDER BY created_at DESC",
            [playerName]
        );
        res.status(200).json(mailItems);
    } catch (err) {
        console.error("Get Mail Error:", err);
        res.status(500).json({ message: 'Lỗi khi tải thư.' });
    } finally {
        if (conn) conn.release();
    }
});

// GET /api/mail/unread-count - Get count of unread mail
router.get('/unread-count', authenticateToken, async (req, res) => {
    const playerName = req.user.name;
    let conn;
    try {
        conn = await pool.getConnection();
        const [result] = await conn.query(
            "SELECT COUNT(*) as count FROM mail WHERE player_name = ? AND is_read = FALSE",
            [playerName]
        );
        res.status(200).json({ count: result.count });
    } catch (err) {
        console.error("Get Unread Mail Count Error:", err);
        res.status(500).json({ message: 'Lỗi khi đếm thư.' });
    } finally {
        if (conn) conn.release();
    }
});

// POST /api/mail/:id/read - Mark a mail as read
router.post('/:id/read', authenticateToken, async (req, res) => {
    const mailId = req.params.id;
    const playerName = req.user.name;
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(
            "UPDATE mail SET is_read = TRUE WHERE id = ? AND player_name = ?",
            [mailId, playerName]
        );
        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Mark Mail Read Error:", err);
        res.status(500).json({ message: 'Lỗi khi đánh dấu thư.' });
    } finally {
        if (conn) conn.release();
    }
});

// DELETE /api/mail/:id - Delete a mail
router.delete('/:id', authenticateToken, async (req, res) => {
    const mailId = req.params.id;
    const playerName = req.user.name;
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(
            "DELETE FROM mail WHERE id = ? AND player_name = ?",
            [mailId, playerName]
        );
        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Delete Mail Error:", err);
        res.status(500).json({ message: 'Lỗi khi xóa thư.' });
    } finally {
        if (conn) conn.release();
    }
});


// POST /api/mail/:id/claim - Claim rewards from a mail
router.post('/:id/claim', authenticateToken, async (req, res) => {
    const mailId = req.params.id;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const gameData = getGameData();
        const [mail] = await conn.query("SELECT * FROM mail WHERE id = ? AND player_name = ?", [mailId, p.name]);

        if (!mail) throw new Error("Thư không tồn tại.");
        if (!mail.rewards || mail.rewards.length === 0) throw new Error("Thư này không có vật phẩm đính kèm.");

        const rewards = mail.rewards;
        const playerUpdates = {};
        const rewardsLog = [];

        for (const reward of rewards) {
            if (reward.type === 'qi') {
                p.qi = Number(p.qi) + reward.amount;
                playerUpdates.qi = p.qi;
                rewardsLog.push(`${reward.amount} Linh Khí`);
            }
            if (reward.type === 'herb') {
                p.herbs[reward.herbId] = (p.herbs[reward.herbId] || 0) + reward.amount;
                playerUpdates.herbs = p.herbs;
                const herb = gameData.HERBS.find(h => h.id === reward.herbId);
                rewardsLog.push(`${herb?.name} x${reward.amount}`);
            }
            if (reward.type === 'equipment') {
                 await conn.query("INSERT INTO player_equipment (player_name, equipment_id) VALUES (?, ?)", [p.name, reward.equipmentId]);
                 const equipment = gameData.EQUIPMENT.find(t => t.id === reward.equipmentId);
                 rewardsLog.push(`[${equipment.name}]`);
            }
            if (reward.type === 'linh_thach') { 
                p.linh_thach = (BigInt(p.linh_thach || 0) + BigInt(reward.amount)).toString();
                playerUpdates.linh_thach = p.linh_thach;
                rewardsLog.push(`${reward.amount} Linh Thạch`);
            }
            if (reward.type === 'honor_points') {
                p.honorPoints = (p.honorPoints || 0) + reward.amount;
                playerUpdates.honorPoints = p.honorPoints;
                rewardsLog.push(`${reward.amount} Điểm Vinh Dự`);
            }
            if (reward.type === 'avatar') {
                const unlockedAvatars = new Set(p.unlocked_avatars || []);
                if (!unlockedAvatars.has(reward.avatarId)) {
                    unlockedAvatars.add(reward.avatarId);
                    p.unlocked_avatars = Array.from(unlockedAvatars);
                    playerUpdates.unlocked_avatars = p.unlocked_avatars;
                    const avatar = gameData.AVATARS.find(a => a.id === reward.avatarId);
                    if (avatar) rewardsLog.push(`Pháp Tướng [${avatar.name}]`);
                }
            }
        }
        
        if (Object.keys(playerUpdates).length > 0) {
            await updatePlayerState(conn, p.name, playerUpdates);
        }

        // After claiming, set rewards to null and mark as read to prevent re-claiming
        await conn.query("UPDATE mail SET rewards = NULL, is_read = TRUE WHERE id = ?", [mailId]);
        
        resRef.log = { message: `Đã nhận thư! Vật phẩm nhận được: ${rewardsLog.join(', ')}.`, type: 'success' };
    });
});

// NEW: Endpoint to claim all rewards from all mails
router.post('/claim-all', authenticateToken, async (req, res) => {
    await performAction(req, res, async (conn, p, body, resRef) => {
        const gameData = getGameData();
        const mailsToClaim = await conn.query(
            "SELECT id, rewards FROM mail WHERE player_name = ? AND rewards IS NOT NULL AND JSON_LENGTH(rewards) > 0 FOR UPDATE",
            [p.name]
        );

        if (mailsToClaim.length === 0) {
            throw new Error("Không có vật phẩm nào để nhận.");
        }

        const totalRewards = {};
        const playerUpdates = {};
        let rewardsLog = [];
        const mailIdsToUpdate = [];
        
        // Aggregate all rewards
        for (const mail of mailsToClaim) {
            mailIdsToUpdate.push(mail.id);
            for (const reward of mail.rewards) {
                if (reward.type === 'qi' || reward.type === 'linh_thach' || reward.type === 'honor_points') {
                    totalRewards[reward.type] = (totalRewards[reward.type] || 0) + reward.amount;
                } else if (reward.type === 'herb') {
                    totalRewards.herbs = totalRewards.herbs || {};
                    totalRewards.herbs[reward.herbId] = (totalRewards.herbs[reward.herbId] || 0) + reward.amount;
                } else {
                    totalRewards.items = totalRewards.items || [];
                    totalRewards.items.push(reward);
                }
            }
        }

        // Apply aggregated rewards
        if (totalRewards.qi) { p.qi = Number(p.qi) + totalRewards.qi; playerUpdates.qi = p.qi; rewardsLog.push(`${totalRewards.qi} Linh Khí`); }
        if (totalRewards.linh_thach) { p.linh_thach = (BigInt(p.linh_thach || 0) + BigInt(totalRewards.linh_thach)).toString(); playerUpdates.linh_thach = p.linh_thach; rewardsLog.push(`${totalRewards.linh_thach} Linh Thạch`); }
        if (totalRewards.honor_points) { p.honorPoints = (p.honorPoints || 0) + totalRewards.honor_points; playerUpdates.honorPoints = p.honorPoints; rewardsLog.push(`${totalRewards.honor_points} Điểm Vinh Dự`); }
        
        if (totalRewards.herbs) {
            for(const herbId in totalRewards.herbs) {
                 p.herbs[herbId] = (p.herbs[herbId] || 0) + totalRewards.herbs[herbId];
                 const herb = gameData.HERBS.find(h => h.id === herbId);
                 rewardsLog.push(`${herb?.name} x${totalRewards.herbs[herbId]}`);
            }
            playerUpdates.herbs = p.herbs;
        }

        if (totalRewards.items) {
             for (const reward of totalRewards.items) {
                if (reward.type === 'equipment') {
                    await conn.query("INSERT INTO player_equipment (player_name, equipment_id) VALUES (?, ?)", [p.name, reward.equipmentId]);
                    const equipment = gameData.EQUIPMENT.find(t => t.id === reward.equipmentId);
                    rewardsLog.push(`[${equipment.name}]`);
                }
                 if (reward.type === 'avatar') {
                    const unlockedAvatars = new Set(p.unlocked_avatars || []);
                    if (!unlockedAvatars.has(reward.avatarId)) {
                        unlockedAvatars.add(reward.avatarId);
                        p.unlocked_avatars = Array.from(unlockedAvatars);
                        playerUpdates.unlocked_avatars = p.unlocked_avatars;
                        const avatar = gameData.AVATARS.find(a => a.id === reward.avatarId);
                        if (avatar) rewardsLog.push(`Pháp Tướng [${avatar.name}]`);
                    }
                }
             }
        }
        
        if (Object.keys(playerUpdates).length > 0) {
            await updatePlayerState(conn, p.name, playerUpdates);
        }

        // Mark all claimed mails as read and empty
        await conn.query("UPDATE mail SET rewards = NULL, is_read = TRUE WHERE id IN (?)", [mailIdsToUpdate]);
        
        resRef.log = { message: `Đã nhận tất cả vật phẩm từ ${mailsToClaim.length} thư: ${rewardsLog.join(', ')}.`, type: 'success' };
    });
});

module.exports = router;
