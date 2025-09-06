const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const MAX_CHAT_MESSAGES = 100;

// GET /api/chat/messages - Lấy tin nhắn
router.get('/messages', authenticateToken, async (req, res) => {
    const sinceId = parseInt(req.query.since, 10) || 0;
    let conn;
    try {
        conn = await pool.getConnection();
        let messages;
        if (sinceId > 0) {
            messages = await conn.query(
                `SELECT cm.id, cm.playerName, cm.message, UNIX_TIMESTAMP(cm.timestamp) as timestamp, a.url as avatarUrl
                 FROM chat_messages cm
                 LEFT JOIN players p ON cm.playerName = p.name
                 LEFT JOIN avatars a ON p.equipped_avatar_id = a.id
                 WHERE cm.id > ? ORDER BY cm.timestamp ASC`,
                [sinceId]
            );
        } else {
             messages = await conn.query(
                `SELECT
                    last_messages.id,
                    last_messages.playerName,
                    last_messages.message,
                    UNIX_TIMESTAMP(last_messages.timestamp) as timestamp,
                    a.url as avatarUrl
                FROM (
                    SELECT * FROM chat_messages ORDER BY id DESC LIMIT ?
                ) as last_messages
                LEFT JOIN players p ON last_messages.playerName = p.name
                LEFT JOIN avatars a ON p.equipped_avatar_id = a.id
                ORDER BY last_messages.timestamp ASC`,
                [MAX_CHAT_MESSAGES]
            );
        }
        res.status(200).json(messages.map(m => ({...m, timestamp: m.timestamp * 1000 }))); // Convert to JS timestamp
    } catch (err) {
        console.error("Chat Get Error:", err.message);
        res.status(500).json({ message: 'Lỗi khi tải tin nhắn.' });
    } finally {
        if (conn) conn.release();
    }
});

// POST /api/chat/send - Gửi tin nhắn
router.post('/send', authenticateToken, async (req, res) => {
    const { message } = req.body;
    const playerName = req.user.name;

    if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 200) {
        return res.status(400).json({ message: 'Tin nhắn không hợp lệ.' });
    }
    
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        await conn.query(
            "INSERT INTO chat_messages (playerName, message) VALUES (?, ?)",
            [playerName, message.trim()]
        );
        
        // Prune old messages to keep the table size manageable
        await conn.query(
            `DELETE FROM chat_messages WHERE id NOT IN (SELECT id FROM (SELECT id FROM chat_messages ORDER BY id DESC LIMIT ?) as t)`
            , [MAX_CHAT_MESSAGES]
        );

        await conn.commit();
        res.status(201).json({ message: 'Gửi tin nhắn thành công.' });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error("Chat Send Error:", err.message);
        res.status(500).json({ message: 'Lỗi khi gửi tin nhắn.' });
    } finally {
        if (conn) conn.release();
    }
});


module.exports = router;