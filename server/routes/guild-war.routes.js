const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { getFullPlayerQuery } = require('../services/player.service');

const router = express.Router();

// GET /api/guild-war/state - Get current war state for the player
router.get('/state', authenticateToken, async (req, res) => {
    const { name } = req.user;
    let conn;
    try {
        conn = await pool.getConnection();

        // Find the current or next upcoming war
        const [current_war] = await conn.query(
            "SELECT * FROM guild_wars WHERE status != 'COMPLETED' ORDER BY start_time ASC LIMIT 1"
        );

        if (!current_war) {
            return res.status(200).json({ current_war: null });
        }

        const player = await getFullPlayerQuery(conn, name);
        if (!player || !player.guildId) {
             return res.status(200).json({ current_war, is_registered: false, my_match: null, is_leader: false });
        }

        const [guild] = await conn.query("SELECT leaderName FROM guilds WHERE id = ?", [player.guildId]);
        const is_leader = guild ? guild.leaderName === name : false;

        const [registration] = await conn.query(
            "SELECT * FROM guild_war_registrations WHERE war_id = ? AND guild_id = ?",
            [current_war.id, player.guildId]
        );

        const [match] = await conn.query(
            `SELECT m.*, g1.name as guild1_name, g2.name as guild2_name 
             FROM guild_war_matches m
             JOIN guilds g1 ON m.guild1_id = g1.id
             JOIN guilds g2 ON m.guild2_id = g2.id
             WHERE m.war_id = ? AND (m.guild1_id = ? OR m.guild2_id = ?)`,
            [current_war.id, player.guildId, player.guildId]
        );
        
        let my_match_details = null;
        if (match) {
            const opponent_id = match.guild1_id === player.guildId ? match.guild2_id : match.guild1_id;
            const opponent_name = match.guild1_id === player.guildId ? match.guild2_name : match.guild1_name;
            
            const [my_lineup] = await conn.query(
                "SELECT 1 FROM guild_war_lineups WHERE match_id = ? AND round_number = ? AND guild_id = ?",
                [match.id, match.current_round, player.guildId]
            );
            const [opponent_lineup] = await conn.query(
                "SELECT 1 FROM guild_war_lineups WHERE match_id = ? AND round_number = ? AND guild_id = ?",
                [match.id, match.current_round, opponent_id]
            );

            my_match_details = {
                ...match,
                opponent: { id: opponent_id, name: opponent_name },
                my_lineup_submitted: !!my_lineup,
                opponent_lineup_submitted: !!opponent_lineup
            };
        }
        
        // Return full fight results including combat logs
        const fight_results_raw = match ? await conn.query(
            "SELECT * FROM guild_war_fights WHERE match_id = ? ORDER BY round_number, fight_order ASC",
            [match.id]
        ) : [];

        const fight_results = fight_results_raw.map(fight => {
            // Defensively parse the combat log, which might be a string or already an object.
            // This ensures a single malformed log doesn't crash the entire request.
            let combatLogData = [];
            if (fight.combat_log) {
                let parsedLog;
                if (typeof fight.combat_log === 'string') {
                    try {
                        parsedLog = JSON.parse(fight.combat_log);
                    } catch (e) {
                        console.error(`Could not parse combat_log string for guild_war_fights ID ${fight.id}:`, fight.combat_log);
                        parsedLog = []; // Default to empty on failure.
                    }
                } else {
                    // Assume the DB driver already parsed it into an object/array.
                    parsedLog = fight.combat_log;
                }

                // Ensure the final result is always an array.
                if (Array.isArray(parsedLog)) {
                    combatLogData = parsedLog;
                }
            }

            return {
                ...fight,
                combat_log: combatLogData
            };
        });

        res.status(200).json({
            current_war,
            is_registered: !!registration,
            my_match: my_match_details,
            fight_results,
            is_leader, // NEW: Tell the client if they are the leader
        });

    } catch (err) {
        console.error("Get Guild War State Error:", err);
        res.status(500).json({ message: 'Lỗi khi tải trạng thái Tông Môn Chiến.' });
    } finally {
        if (conn) conn.release();
    }
});

// POST /api/guild-war/register - Register guild for the current war
router.post('/register', authenticateToken, async (req, res) => {
    const { name } = req.user;
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const [player] = await conn.query("SELECT p.guildId, g.leaderName FROM players p JOIN guilds g ON p.guildId = g.id WHERE p.name = ?", [name]);
        if (!player) {
            return res.status(403).json({ message: "Bạn không ở trong Tông Môn nào." });
        }
        if (player.leaderName !== name) {
            return res.status(403).json({ message: "Chỉ Tông Chủ mới có thể đăng ký." });
        }

        const [war] = await conn.query("SELECT * FROM guild_wars WHERE status = 'REGISTRATION' LIMIT 1");
        if (!war) {
            return res.status(400).json({ message: "Hiện không trong thời gian đăng ký." });
        }

        await conn.query(
            "INSERT INTO guild_war_registrations (war_id, guild_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE war_id=war_id",
            [war.id, player.guildId]
        );

        await conn.commit();
        res.status(200).json({ message: "Đăng ký tham gia Tông Môn Chiến thành công!" });

    } catch (err) {
        if (conn) await conn.rollback();
        console.error("Guild War Register Error:", err);
        res.status(500).json({ message: 'Lỗi khi đăng ký.' });
    } finally {
        if (conn) conn.release();
    }
});

// GET /api/guild-war/match/:matchId/eligible-members - Get eligible members for lineup
router.get('/match/:matchId/eligible-members', authenticateToken, async (req, res) => {
    const { matchId } = req.params;
    const { name } = req.user;
    let conn;
    try {
        conn = await pool.getConnection();
        const [player] = await conn.query("SELECT guildId FROM players WHERE name = ?", [name]);
        if (!player || !player.guildId) {
            return res.status(403).json({ message: "Bạn không ở trong Tông Môn." });
        }

        const allMembers = await conn.query("SELECT name, realmIndex FROM players WHERE guildId = ? ORDER BY realmIndex DESC, name ASC", [player.guildId]);
        const participatedMembers = await conn.query("SELECT player_name FROM guild_war_match_participants WHERE match_id = ?", [matchId]);
        const participatedNames = new Set(participatedMembers.map(p => p.player_name));

        const memberStatus = allMembers.map(m => ({
            ...m,
            has_participated: participatedNames.has(m.name)
        }));
        
        res.status(200).json(memberStatus);

    } catch (err) {
        console.error("Get Eligible Members Error:", err);
        res.status(500).json({ message: "Lỗi khi tải danh sách thành viên." });
    } finally {
        if (conn) conn.release();
    }
});

// POST /api/guild-war/match/:matchId/lineup - Submit lineup for a round
router.post('/match/:matchId/lineup', authenticateToken, async (req, res) => {
    const { matchId } = req.params;
    const { fighters } = req.body; // fighters is an array of 3 player names
    const { name } = req.user;
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        if (!Array.isArray(fighters) || fighters.length !== 3 || new Set(fighters).size !== 3) {
            return res.status(400).json({ message: "Phải chọn đúng 3 thành viên khác nhau." });
        }

        const [player] = await conn.query("SELECT p.guildId, g.leaderName FROM players p JOIN guilds g ON p.guildId = g.id WHERE p.name = ?", [name]);
        if (!player || player.leaderName !== name) {
            return res.status(403).json({ message: "Chỉ Tông Chủ mới có thể chọn đội hình." });
        }

        const [match] = await conn.query("SELECT * FROM guild_war_matches WHERE id = ? AND status = 'PENDING_LINEUP'", [matchId]);
        if (!match) {
            return res.status(400).json({ message: "Không thể chọn đội hình cho trận này." });
        }

        // Verify fighters are eligible
        for (const fighterName of fighters) {
            const [member] = await conn.query("SELECT guildId FROM players WHERE name = ?", [fighterName]);
            if (!member || member.guildId !== player.guildId) {
                return res.status(400).json({ message: `Thành viên ${fighterName} không hợp lệ.`});
            }
             const [participant] = await conn.query("SELECT 1 FROM guild_war_match_participants WHERE match_id = ? AND player_name = ?", [matchId, fighterName]);
            if (participant) {
                 return res.status(400).json({ message: `Thành viên ${fighterName} đã tham chiến.`});
            }
        }

        await conn.query(
            "INSERT INTO guild_war_lineups (match_id, round_number, guild_id, player1_name, player2_name, player3_name) VALUES (?, ?, ?, ?, ?, ?)",
            [matchId, match.current_round, player.guildId, fighters[0], fighters[1], fighters[2]]
        );
        
        await conn.commit();
        res.status(200).json({ message: "Thiết lập đội hình thành công!" });

    } catch (err) {
        if (conn) await conn.rollback();
        // Handle unique constraint violation gracefully
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Bạn đã thiết lập đội hình cho vòng này rồi." });
        }
        console.error("Submit Lineup Error:", err);
        res.status(500).json({ message: 'Lỗi khi thiết lập đội hình.' });
    } finally {
        if (conn) conn.release();
    }
});


module.exports = router;