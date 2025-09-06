const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { performAction, updatePlayerState, getFullPlayerQuery } = require('../services/player.service');
const { getGameData } = require('../services/gameData.service');
const { formatNumber, getGuildNextLevelExp } = require('../utils/formatters');

const router = express.Router();

const ROLE_HIERARCHY = { leader: 4, vice_leader: 3, elite: 2, member: 1 };
const ROLES = { leader: 'Tông Chủ', vice_leader: 'Phó Tông Chủ', elite: 'Trưởng Lão', member: 'Thành Viên' };


const getGuildMemberLimit = (level) => {
    if (level <= 0) return 0;
    // Base 10 members at level 1, +2 members for each subsequent level.
    return 10 + (level - 1) * 2;
};

// Helper function to check permissions within a guild
const checkGuildPermissions = async (conn, playerName, requiredRank, targetPlayerName = null) => {
    const manager = await getFullPlayerQuery(conn, playerName);
    if (!manager || !manager.guildId || !manager.guild_role) {
        throw new Error("Không có quyền thực hiện hành động này.");
    }

    const managerRank = ROLE_HIERARCHY[manager.guild_role];
    if (managerRank < requiredRank) {
        throw new Error("Cấp bậc không đủ để thực hiện hành động này.");
    }
    
    if (targetPlayerName) {
        const target = await getFullPlayerQuery(conn, targetPlayerName);
        if (!target || target.guildId !== manager.guildId) {
            throw new Error("Mục tiêu không phải là thành viên của Tông Môn.");
        }
        const targetRank = ROLE_HIERARCHY[target.guild_role];
        if (managerRank <= targetRank) {
             throw new Error("Không thể thực hiện hành động trên người có chức vụ ngang bằng hoặc cao hơn.");
        }
        return { manager, target };
    }

    return { manager, target: null };
};


// GET /api/guilds/list-with-app-status - Get guild list with application status for the current player
router.get('/list-with-app-status', authenticateToken, async (req, res) => {
    const playerName = req.user.name;
    let conn;
    try {
        conn = await pool.getConnection();
        const guilds = await conn.query(`
            SELECT g.id, g.name, g.leaderName, g.level, COUNT(p.name) as memberCount 
            FROM guilds g 
            LEFT JOIN players p ON g.id = p.guildId 
            GROUP BY g.id 
            ORDER BY g.level DESC, memberCount DESC
        `);
        
        const applications = await conn.query("SELECT guild_id FROM guild_applications WHERE player_name = ?", [playerName]);
        const appliedGuildIds = new Set(applications.map(app => app.guild_id));

        const guildsWithStatus = guilds.map(guild => ({
            ...guild,
            hasApplied: appliedGuildIds.has(guild.id),
        }));
        
        res.status(200).json(guildsWithStatus);
    } catch (err) {
        console.error("Get Guilds with App Status Error:", err.message);
        res.status(500).json({ message: 'Lỗi khi tải danh sách Tông Môn.' });
    } finally {
        if (conn) conn.release();
    }
});

// NEW: GET /api/guilds/list - Get all guilds for browsing
router.get('/list', authenticateToken, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const guilds = await conn.query(`
            SELECT g.id, g.name, g.leaderName, g.level, COUNT(p.name) as memberCount 
            FROM guilds g 
            LEFT JOIN players p ON g.id = p.guildId 
            GROUP BY g.id 
            ORDER BY g.level DESC, memberCount DESC
        `);
        res.status(200).json(guilds);
    } catch (err) {
        console.error("Get All Guilds Error:", err.message);
        res.status(500).json({ message: 'Lỗi khi tải danh sách Tông Môn.' });
    } finally {
        if (conn) conn.release();
    }
});


// GET /api/guilds/details/:id - Lấy thông tin chi tiết và thành viên của một Tông Môn
router.get('/details/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    let conn;
    try {
        conn = await pool.getConnection();
        const [guild] = await conn.query("SELECT * FROM guilds WHERE id = ?", [id]);
        if (!guild) {
            return res.status(404).json({ message: 'Không tìm thấy Tông Môn.' });
        }
        const members = await conn.query(
            "SELECT name, realmIndex, guild_role, guild_contribution, is_banned, equipped_avatar_id FROM players WHERE guildId = ?",
            [id]
        );
        res.status(200).json({ ...guild, members });
    } catch (err) {
        console.error("Get Guild Details Error:", err.message);
        res.status(500).json({ message: 'Lỗi khi tải thông tin Tông Môn.' });
    } finally {
        if (conn) conn.release();
    }
});

// POST /api/guilds/create - Tạo Tông Môn mới
router.post('/create', authenticateToken, async (req, res) => {
    const { guildName } = req.body;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const gameData = getGameData();
        const creationCosts = gameData.GUILD_CREATION_COST || [];
        const resourceTypeToName = { linh_thach: 'Linh Thạch', qi: 'Linh Khí', merit: 'Công Đức', karma: 'Ác Nghiệp', refinement_dust: 'Bụi Luyện Khí' };

        if (!guildName || guildName.length < 3 || guildName.length > 20) {
            throw new Error('Tên Tông Môn phải từ 3 đến 20 ký tự.');
        }
        if (p.guildId) throw new Error('Bạn đã ở trong một Tông Môn.');

        const updates = {};
        for (const cost of creationCosts) {
            // FIX: Floor the player's resource value before converting to BigInt to handle floats (like qi).
            const playerResource = BigInt(Math.floor(Number(p[cost.type] || 0)));
            if (playerResource < BigInt(cost.amount)) {
                throw new Error(`Không đủ ${resourceTypeToName[cost.type] || cost.type}. Cần ${formatNumber(cost.amount)}.`);
            }
            updates[cost.type] = (playerResource - BigInt(cost.amount)).toString();
        }

        const existingGuild = await conn.query("SELECT id FROM guilds WHERE name = ?", [guildName]);
        if (existingGuild.length > 0) throw new Error('Tên Tông Môn đã tồn tại.');

        const result = await conn.query("INSERT INTO guilds (name, leaderName) VALUES (?, ?)", [guildName, p.name]);
        const newGuildId = result.insertId;

        await updatePlayerState(conn, p.name, {
            ...updates,
            guildId: newGuildId,
            guild_role: 'leader',
        });

        resRef.log = { message: `Chúc mừng! Bạn đã thành lập ${guildName} thành công!`, type: 'success' };
    });
});

// NEW: POST /api/guilds/set-announcement
router.post('/set-announcement', authenticateToken, async (req, res) => {
    const { announcement } = req.body;
    await performAction(req, res, async (conn, p, body, resRef) => {
        if (!p.guildId || p.guild_role !== 'leader') {
            throw new Error("Chỉ Tông Chủ mới có thể đặt thông báo.");
        }
        if (announcement.length > 1000) {
            throw new Error("Thông báo không được dài quá 1000 ký tự.");
        }
        await conn.query("UPDATE guilds SET announcement = ? WHERE id = ?", [announcement, p.guildId]);
        resRef.log = { message: "Đã cập nhật thông báo Tông Môn.", type: 'success' };
    });
});

// POST /api/guilds/contribute - Cống hiến cho Tông Môn
router.post('/contribute', authenticateToken, async (req, res) => {
    const { amount } = req.body;
    await performAction(req, res, async (conn, p, body, resRef) => {
        if (!p.guildId) throw new Error('Bạn không ở trong Tông Môn nào.');
        const contributionAmount = parseInt(amount, 10);
        if (isNaN(contributionAmount) || contributionAmount <= 0) throw new Error('Lượng cống hiến không hợp lệ.');
        if (p.qi < contributionAmount) throw new Error('Linh khí không đủ để cống hiến.');

        const [guild] = await conn.query("SELECT * FROM guilds WHERE id = ? FOR UPDATE", [p.guildId]);
        if (!guild) throw new Error('Tông Môn không tồn tại.');

        // FIX: Use BigInt for calculation to prevent string concatenation and overflow
        const newContribution = (BigInt(p.guild_contribution || 0) + BigInt(contributionAmount)).toString();

        await updatePlayerState(conn, p.name, { 
            qi: p.qi - contributionAmount,
            guild_contribution: newContribution
        });
        
        let newExp = BigInt(guild.exp) + BigInt(contributionAmount);
        let newLevel = guild.level;
        let expForNextLevel = BigInt(getGuildNextLevelExp(newLevel));
        let levelUpLog = '';

        while (newExp >= expForNextLevel) {
            newLevel++;
            newExp -= expForNextLevel;
            expForNextLevel = BigInt(getGuildNextLevelExp(newLevel));
            levelUpLog += `Tông Môn đã dốc sức đồng lòng, đột phá tới cấp ${newLevel}! `;
        }

        await conn.query("UPDATE guilds SET level = ?, exp = ? WHERE id = ?", [newLevel, newExp.toString(), p.guildId]);
        
        resRef.log = { 
            message: levelUpLog || `Bạn đã cống hiến ${formatNumber(contributionAmount)} linh khí cho Tông Môn.`, 
            type: levelUpLog ? 'success' : 'info' 
        };
    });
});

// POST /api/guilds/apply/:id - Gửi đơn xin gia nhập Tông Môn
router.post('/apply/:id', authenticateToken, async (req, res) => {
    const guildId = req.params.id;
    await performAction(req, res, async (conn, p, body, resRef) => {
        if (p.guildId) throw new Error('Bạn đã ở trong một Tông Môn.');

        const [guild] = await conn.query("SELECT id, name, level FROM guilds WHERE id = ?", [guildId]);
        if (!guild) throw new Error('Tông Môn không tồn tại.');

        const [memberCountResult] = await conn.query("SELECT COUNT(*) as count FROM players WHERE guildId = ?", [guildId]);
        const limit = getGuildMemberLimit(guild.level);
        if (memberCountResult.count >= limit) {
            throw new Error('Tông Môn đã đủ thành viên, không thể gia nhập.');
        }

        try {
             await conn.query(
                "INSERT INTO guild_applications (guild_id, player_name) VALUES (?, ?)",
                [guildId, p.name]
            );
        } catch(err) {
            if (err.code === 'ER_DUP_ENTRY') {
                throw new Error('Bạn đã xin gia nhập Tông Môn này rồi.');
            }
            throw err;
        }

        resRef.log = { message: `Bạn đã xin gia nhập [${guild.name}]. Vui lòng chờ duyệt.`, type: 'success' };
    });
});


// POST /api/guilds/leave - Rời Tông Môn hoặc giải tán
router.post('/leave', authenticateToken, async (req, res) => {
    await performAction(req, res, async (conn, p, body, resRef) => {
        if (!p.guildId) throw new Error('Bạn không ở trong Tông Môn nào.');

        const [guild] = await conn.query("SELECT leaderName FROM guilds WHERE id = ?", [p.guildId]);

        if (!guild) {
            // Guild doesn't exist, player data is stale. Clean it up.
            await updatePlayerState(conn, p.name, { guildId: null, guild_role: null });
            resRef.log = { message: 'Tông Môn không còn tồn tại. Dữ liệu của bạn đã được cập nhật.', type: 'info' };
            return;
        }

        if (guild.leaderName === p.name) {
            // Leader is trying to leave.
            const [memberCountResult] = await conn.query("SELECT COUNT(*) as count FROM players WHERE guildId = ? AND name != ?", [p.guildId, p.name]);

            if (memberCountResult.count > 0) {
                // There are other members. Prevent leaving.
                throw new Error("Bạn phải chuyển chức Tông Chủ cho người khác trước khi có thể rời khỏi Tông Môn.");
            } else {
                // Leader is the last member. Dissolve the guild.
                await conn.query("DELETE FROM guilds WHERE id = ?", [p.guildId]);
                // Also update the player's state
                await updatePlayerState(conn, p.name, { guildId: null, guild_role: null });
                resRef.log = { message: 'Bạn là thành viên cuối cùng. Tông Môn đã được giải tán.', type: 'warning' };
            }
        } else {
            // Normal member is leaving.
            await updatePlayerState(conn, p.name, { guildId: null, guild_role: null });
            resRef.log = { message: 'Bạn đã rời khỏi Tông Môn.', type: 'info' };
        }
    });
});

// --- Application Management ---
router.get('/applications', authenticateToken, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const player = await getFullPlayerQuery(conn, req.user.name);

        if (!player.guildId || !player.guild_role || ROLE_HIERARCHY[player.guild_role] < ROLE_HIERARCHY.elite) {
            return res.status(403).json([]);
        }

        const applications = await conn.query(
            "SELECT ga.id, ga.player_name, p.realmIndex FROM guild_applications ga JOIN players p ON ga.player_name = p.name WHERE ga.guild_id = ? ORDER BY ga.created_at ASC",
            [player.guildId]
        );
        res.status(200).json(applications);

    } catch(err) {
        res.status(500).json({ message: 'Lỗi tải đơn xin gia nhập.' });
    } finally {
        if (conn) conn.release();
    }
});

router.post('/applications/accept', authenticateToken, async (req, res) => {
    const { applicantName } = req.body;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const { manager } = await checkGuildPermissions(conn, p.name, ROLE_HIERARCHY.elite);
        
        const [applicant] = await conn.query("SELECT * FROM players WHERE name = ?", [applicantName]);
        if (!applicant || applicant.guildId) throw new Error("Người này không thể gia nhập Tông Môn lúc này.");
        
        const [memberCountResult] = await conn.query("SELECT COUNT(*) as count FROM players WHERE guildId = ?", [manager.guildId]);
        const limit = getGuildMemberLimit(manager.guildLevel);
        if (memberCountResult.count >= limit) throw new Error("Tông Môn đã đầy, không thể duyệt thêm.");

        await updatePlayerState(conn, applicantName, { guildId: manager.guildId, guild_role: 'member' });
        await conn.query("DELETE FROM guild_applications WHERE player_name = ? AND guild_id = ?", [applicantName, manager.guildId]);

        resRef.log = { message: `Đã duyệt ${applicantName} gia nhập Tông Môn.`, type: 'success' };
    });
});

router.post('/applications/reject', authenticateToken, async (req, res) => {
     const { applicantName } = req.body;
     await performAction(req, res, async (conn, p, body, resRef) => {
        const { manager } = await checkGuildPermissions(conn, p.name, ROLE_HIERARCHY.elite);
        await conn.query("DELETE FROM guild_applications WHERE player_name = ? AND guild_id = ?", [applicantName, manager.guildId]);
        resRef.log = { message: `Đã từ chối ${applicantName}.`, type: 'info' };
    });
});


// --- Member Management ---
router.post('/manage/promote/:targetName', authenticateToken, async (req, res) => {
    const { targetName } = req.params;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const { target } = await checkGuildPermissions(conn, p.name, ROLE_HIERARCHY.vice_leader, targetName);
        const currentRankNum = ROLE_HIERARCHY[target.guild_role];
        const newRole = Object.keys(ROLES).find(key => ROLE_HIERARCHY[key] === currentRankNum + 1);

        if (!newRole || ROLE_HIERARCHY[newRole] >= ROLE_HIERARCHY[p.guild_role]) {
            throw new Error("Không thể thăng chức cao hơn hoặc bằng cấp của bạn.");
        }
        await updatePlayerState(conn, targetName, { guild_role: newRole });
        resRef.log = { message: `${targetName} đã được thăng lên ${ROLES[newRole]}.`, type: 'success' };
    });
});

router.post('/manage/demote/:targetName', authenticateToken, async (req, res) => {
     const { targetName } = req.params;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const { target } = await checkGuildPermissions(conn, p.name, ROLE_HIERARCHY.vice_leader, targetName);
        const currentRankNum = ROLE_HIERARCHY[target.guild_role];
        const newRole = Object.keys(ROLES).find(key => ROLE_HIERARCHY[key] === currentRankNum - 1);
        
        if (!newRole || currentRankNum <= ROLE_HIERARCHY.member) {
            throw new Error("Không thể giáng cấp thêm.");
        }
        await updatePlayerState(conn, targetName, { guild_role: newRole });
        resRef.log = { message: `${targetName} đã bị giáng xuống ${ROLES[newRole]}.`, type: 'warning' };
    });
});

router.post('/manage/kick/:targetName', authenticateToken, async (req, res) => {
     const { targetName } = req.params;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const { target } = await checkGuildPermissions(conn, p.name, ROLE_HIERARCHY.vice_leader, targetName);
        await updatePlayerState(conn, targetName, { guildId: null, guild_role: null });
        resRef.log = { message: `${targetName} đã bị trục xuất khỏi Tông Môn.`, type: 'danger' };
    });
});


module.exports = router;