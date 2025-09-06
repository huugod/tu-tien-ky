const express = require('express');
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateAdmin, JWT_SECRET } = require('../middleware/auth');
const { reloadGameData, getGameData } = require('../services/gameData.service');
const { processRound } = require('../services/guildWar.service'); // Import processRound
const { getFullPlayerQuery } = require('../services/player.service');
const router = express.Router();

// --- PUBLIC ROUTES (No Auth Required) ---

// POST /api/admin/auth/login - Admin login
router.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Tên đăng nhập và mật khẩu là bắt buộc.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        const [admin] = await conn.query("SELECT * FROM admins WHERE username = ?", [username]);
        if (!admin) {
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
        }

        // Create a specific admin token with an isAdmin flag
        const adminToken = jwt.sign(
            { username: admin.username, isAdmin: true },
            JWT_SECRET,
            { expiresIn: '1d' } // Admin sessions last 1 day
        );
        
        res.status(200).json({ admin_token: adminToken, username: admin.username });

    } catch (err) {
        console.error("Admin Login Error:", err);
        res.status(500).json({ message: 'Lỗi máy chủ khi đăng nhập quản trị viên.' });
    } finally {
        if (conn) conn.release();
    }
});


// --- PROTECTED ROUTES (Auth Required for all routes below) ---

// POST /api/admin/reload-gamedata - Reload game data cache
router.post('/reload-gamedata', authenticateAdmin, async (req, res) => {
    try {
        await reloadGameData();
        console.log("Admin triggered game data reload.");
        res.status(200).json({ message: "Dữ liệu game đã được làm mới thành công!" });
    } catch (err) {
        console.error("Failed to reload game data via admin API:", err);
        res.status(500).json({ message: "Lỗi khi làm mới dữ liệu game." });
    }
});

// --- Dashboard Stats ---
router.get('/stats', authenticateAdmin, async (req, res) => {
     let conn;
    try {
        conn = await pool.getConnection();
        const [playerCount] = await conn.query("SELECT COUNT(*) as count FROM players");
        const [guildCount] = await conn.query("SELECT COUNT(*) as count FROM guilds");
        res.status(200).json({
            playerCount: playerCount.count,
            guildCount: guildCount.count
        });
    } catch(err) {
        res.status(500).json({ message: `Error getting stats: ${err.message}` });
    } finally {
        if (conn) conn.release();
    }
});


// --- NEW CONSOLIDATED METADATA ENDPOINT ---
router.get('/metadata/all', authenticateAdmin, async (req, res) => {
    let conn;
    try {
        const gameData = getGameData();
        conn = await pool.getConnection();
        const guilds = await conn.query("SELECT id, name FROM guilds ORDER BY name ASC");

        const bonusTypes = [
            'qi_per_second_multiplier', 'breakthrough_chance_add', 'qi_per_second_base_add',
            'hp_add', 'atk_add', 'def_add', 'hp_mul', 'atk_mul', 'def_mul', 'speed_mul', 'speed_add', 
            'crit_rate_add', 'crit_damage_add', 'dodge_rate_add', 'lifesteal_rate_add', 'counter_rate_add', 
            'hit_rate_add', 'crit_resist_add', 'lifesteal_resist_add', 'counter_resist_add',
            'body_temper_eff_add', 'alchemy_success_base_add', 'alchemy_success_add', 
            'exploration_yield_mul', 'pvp_honor_mul', 'pve_linh_thach_mul',
            // Buffs
            'atk_mul_buff', 'def_mul_buff', 'hp_mul_buff', 'speed_mul_buff', 'breakthrough_chance_add_buff',
            'crit_rate_add_buff', 'qi_per_second_multiplier_buff',
        ];
        
        const buffTypes = [
            { value: 'atk_mul_buff', label: 'Tăng Công (ATK %)' },
            { value: 'def_mul_buff', label: 'Tăng Thủ (DEF %)' },
            { value: 'hp_mul_buff', label: 'Tăng Máu (HP %)' },
            { value: 'speed_mul_buff', label: 'Tăng Tốc Độ (Speed %)' },
            { value: 'breakthrough_chance_add_buff', label: 'Tăng Tỷ Lệ Đột Phá (+%)' },
            { value: 'crit_rate_add_buff', label: 'Tăng Tỷ Lệ Bạo Kích (+%)' },
            { value: 'qi_per_second_multiplier_buff', label: 'Tăng Tốc Độ Tu Luyện (%)' },
        ];

        const equipmentSlots = ['weapon', 'armor', 'accessory'];

        const metadata = {
            bonusTypes: bonusTypes.map(t => ({ value: t, label: t })),
            buffTypes: buffTypes, 
            equipmentSlots: equipmentSlots.map(s => ({ value: s, label: s })),
            itemIds: {
                pills: gameData.PILLS.map(p => ({ value: p.id, label: `${p.name} (${p.id})` })),
                herbs: gameData.HERBS.map(h => ({ value: h.id, label: `${h.name} (${h.id})` })),
                equipment: gameData.EQUIPMENT.map(e => ({ value: e.id, label: `${e.name} (${e.id})` })),
                avatars: gameData.AVATARS.map(a => ({ value: a.id, label: `${a.name} (${a.id})` })),
            },
            rarities: gameData.RARITIES.map(r => ({ value: r.id, label: r.name })),
            guilds: guilds.map(g => ({ value: g.id, label: g.name })),
            insights: gameData.INSIGHTS.map(i => ({ value: i.id, label: `${i.name} (${i.id})` })),
            animations: gameData.CSS_ANIMATIONS.map(a => ({ value: a.class_name, label: a.class_name })),
        };
        res.json(metadata);

    } catch (err) {
        console.error("Error fetching all metadata:", err);
        res.status(500).json({ message: `Error fetching all metadata: ${err.message}` });
    } finally {
        if (conn) conn.release();
    }
});


// --- Player Management ---
router.get('/players', authenticateAdmin, async (req, res) => {
    const { search = '' } = req.query;
    let conn;
    try {
        conn = await pool.getConnection();
        const playersList = await conn.query(
            "SELECT name, realmIndex, combat_power, is_banned FROM players WHERE name LIKE ? ORDER BY realmIndex DESC LIMIT 50",
            [`%${search}%`]
        );
        res.status(200).json(playersList);
    } catch (err) {
        res.status(500).json({ message: `Error searching players: ${err.message}` });
    } finally {
        if (conn) conn.release();
    }
});

router.get('/player/:name', authenticateAdmin, async (req, res) => {
    const { name } = req.params;
    let conn;
    try {
        conn = await pool.getConnection();
        const fullPlayer = await getFullPlayerQuery(conn, name);
        if (!fullPlayer) {
            return res.status(404).json({ message: 'Không tìm thấy người chơi.' });
        }
        res.status(200).json(fullPlayer);
    } catch (err) {
        console.error("Admin Get Player Details Error:", err);
        res.status(500).json({ message: `Lỗi khi tải chi tiết người chơi: ${err.message}` });
    } finally {
        if (conn) conn.release();
    }
});

// Helper function to format JS dates/ISO strings to MySQL DATETIME format
const formatDateTimeForDB = (dateString) => {
    if (typeof dateString === 'string' && dateString.includes('T')) {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            // Converts to 'YYYY-MM-DD HH:MM:SS' format
            return date.toISOString().slice(0, 19).replace('T', ' ');
        } catch (e) {
            return dateString;
        }
    }
    return dateString;
};

router.put('/players/:name', authenticateAdmin, async (req, res) => {
    const { name } = req.params;
    const updates = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const [playerBeforeUpdate] = await conn.query("SELECT * FROM players WHERE name = ?", [name]);

        // --- NEW BAN/UNBAN LOGIC ---
        const isNowBanned = updates.is_banned === true || updates.is_banned === 1;
        const wasBanned = playerBeforeUpdate.is_banned === 1;

        if (isNowBanned && !wasBanned) { // BANNING
            const snapshot_data = {
                qi: playerBeforeUpdate.qi,
                realmIndex: playerBeforeUpdate.realmIndex,
                bodyStrength: playerBeforeUpdate.bodyStrength,
                combat_power: playerBeforeUpdate.combat_power,
                refinement_dust: playerBeforeUpdate.refinement_dust,
                linh_thach: playerBeforeUpdate.linh_thach,
                karma: playerBeforeUpdate.karma,
                merit: playerBeforeUpdate.merit,
                honorPoints: playerBeforeUpdate.honorPoints,
                enlightenmentPoints: playerBeforeUpdate.enlightenmentPoints
            };
            await conn.query(
                "INSERT INTO banned_player_snapshots (player_name, snapshot_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE snapshot_data = VALUES(snapshot_data)",
                [name, JSON.stringify(snapshot_data)]
            );
            // Zero out stats
            Object.assign(updates, {
                qi: 0, combat_power: 0, bodyStrength: 0, refinement_dust: 0, linh_thach: 0,
                karma: 0, merit: 0, honorPoints: 0, enlightenmentPoints: 0
            });

        } else if (!isNowBanned && wasBanned) { // UNBANNING
            const [snapshot] = await conn.query("SELECT snapshot_data FROM banned_player_snapshots WHERE player_name = ?", [name]);
            if (snapshot && snapshot.snapshot_data) {
                Object.assign(updates, snapshot.snapshot_data);
                await conn.query("DELETE FROM banned_player_snapshots WHERE player_name = ?", [name]);
            }
        }
        
        // --- REVISED INVENTORY/EQUIPMENT EDITING LOGIC ---
        if (updates.inventory || updates.equipment) {
            const gameData = getGameData(); 

            const equippedItemsFromClient = updates.equipment || [];
            const inventoryItemsFromClient = updates.inventory || [];
            const allItemsFromClient = [...equippedItemsFromClient, ...inventoryItemsFromClient];
            
            const allCurrentItems = await conn.query("SELECT instance_id FROM player_equipment WHERE player_name = ?", [name]);
            const currentInstanceIds = new Set(allCurrentItems.map(item => item.instance_id));
            const clientInstanceIds = new Set(allItemsFromClient.map(item => item.instance_id).filter(Boolean));

            // 1. Delete items that are no longer with the player
            const itemsToDelete = [...currentInstanceIds].filter(id => !clientInstanceIds.has(id));
            if (itemsToDelete.length > 0) {
                await conn.query("DELETE FROM player_equipment WHERE instance_id IN (?)", [itemsToDelete]);
            }

            // 2. Process equipped items
            for (const item of equippedItemsFromClient) {
                const staticData = gameData.EQUIPMENT.find(e => e.id === item.id);
                if (!staticData) continue; 

                if (item.instance_id) { // Update existing item
                    await conn.query(
                        "UPDATE player_equipment SET equipment_id = ?, is_equipped = TRUE, slot = ?, upgrade_level = ?, is_locked = ? WHERE instance_id = ?",
                        [item.id, staticData.slot, item.upgrade_level || 0, !!item.is_locked, item.instance_id]
                    );
                } else { // Add new equipped item
                    await conn.query(
                        "INSERT INTO player_equipment (player_name, equipment_id, is_equipped, slot, upgrade_level, is_locked) VALUES (?, ?, TRUE, ?, ?, ?)",
                        [name, item.id, staticData.slot, item.upgrade_level || 0, !!item.is_locked]
                    );
                }
            }
            
            // 3. Process inventory items
            for (const item of inventoryItemsFromClient) {
                 const staticData = gameData.EQUIPMENT.find(e => e.id === item.id);
                 if (!staticData) continue; 

                if (item.instance_id) { // Update existing item
                    await conn.query(
                        "UPDATE player_equipment SET equipment_id = ?, is_equipped = FALSE, slot = NULL, upgrade_level = ?, is_locked = ? WHERE instance_id = ?",
                        [item.id, item.upgrade_level || 0, !!item.is_locked, item.instance_id]
                    );
                } else { // Add new inventory item
                    await conn.query(
                        "INSERT INTO player_equipment (player_name, equipment_id, is_equipped, slot, upgrade_level, is_locked) VALUES (?, ?, FALSE, NULL, ?, ?)",
                        [name, item.id, item.upgrade_level || 0, !!item.is_locked]
                    );
                }
            }

            delete updates.inventory;
            delete updates.equipment;
        }

        delete updates.name;
        delete updates.updated_at;
        delete updates.guildName;
        delete updates.guildLevel;
        delete updates.guildExp;

        const columns = Object.keys(updates);
        if (columns.length > 0) {
            const setClause = columns.map(col => `\`${col}\` = ?`).join(', ');
            // FIX: Handle datetime formatting and other types consistently
            const values = columns.map(col => {
                let value = updates[col];
                if (typeof value === 'boolean') {
                    return value ? 1 : 0;
                }
                if (typeof value === 'object' && value !== null) {
                    return JSON.stringify(value);
                }
                // Apply the datetime formatter to fix the bug
                return formatDateTimeForDB(value);
            });
            await conn.query(`UPDATE players SET ${setClause} WHERE name = ?`, [...values, name]);
        }

        await conn.commit();
        res.status(200).json({ message: `Cập nhật người chơi ${name} thành công.` });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error("Update Player Error:", err);
        res.status(500).json({ message: `Lỗi khi cập nhật người chơi: ${err.message}` });
    } finally {
        if (conn) conn.release();
    }
});



// NEW: List of tables that are part of the static game data cache
const gameDataTables = [
    'herbs', 'pills', 'recipes', 'techniques', 'equipment', 'insights',
    'exploration_locations', 'trial_zones', 'realms', 'spiritual_roots',
    'honor_shop_items', 'pvp_skills', 'game_config', 'combat_log_templates',
    'rarities', 'breakthrough_failure_bonuses', 'css_animations', 'avatars',
    'equipment_upgrades', 'pvp_daily_rewards', 'pvp_weekly_rewards'
];


// --- Generic CRUD Helper ---
const createCrudEndpoints = (tableName, primaryKey = 'id') => {
    // GET /api/admin/{tableName} - Get all items
    router.get(`/${tableName}`, authenticateAdmin, async (req, res) => {
        let conn;
        try {
            conn = await pool.getConnection();
            let query = `SELECT * FROM ${tableName}`;
            if (tableName === 'guilds') {
                query = `
                    SELECT g.*, COUNT(p.name) as memberCount 
                    FROM guilds g 
                    LEFT JOIN players p ON g.id = p.guildId 
                    GROUP BY g.id
                `;
            }
            const items = await conn.query(query);

            if (tableName === 'game_config') {
                items.forEach(item => {
                    if (typeof item.config_value !== 'object' && item.config_value !== null) {
                        item.config_value = String(item.config_value);
                    }
                });
            }

            res.status(200).json(items);
        } catch (err) {
            res.status(500).json({ message: `Lỗi khi lấy dữ liệu ${tableName}: ${err.message}` });
        } finally {
            if (conn) conn.release();
        }
    });

    // POST /api/admin/{tableName} - Create a new item
    router.post(`/${tableName}`, authenticateAdmin, async (req, res) => {
        let conn;
        try {
            conn = await pool.getConnection();
            const itemData = { ...req.body };

            if (primaryKey in itemData && (itemData[primaryKey] === '' || itemData[primaryKey] === null)) {
                const [pkColumnInfo] = await conn.query(
                    `SELECT EXTRA FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
                    [tableName, primaryKey]
                );
                if (pkColumnInfo && pkColumnInfo.EXTRA.includes('auto_increment')) {
                     delete itemData[primaryKey];
                }
            }
            
            const columns = Object.keys(itemData);
            if (columns.length === 0) {
                throw new Error("Không có dữ liệu để tạo mục.");
            }

            const escapedColumns = columns.map(col => `\`${col}\``).join(', ');
            const placeholders = columns.map(() => '?').join(', ');
            // FIX: Automatically handle boolean conversion and stringify objects/arrays before sending to DB
            const values = columns.map(col => {
                let value = itemData[col];
                if (typeof value === 'boolean') {
                    value = value ? 1 : 0;
                } else if (typeof value === 'object' && value !== null) {
                    value = JSON.stringify(value);
                }
                return formatDateTimeForDB(value);
            });

            await conn.query(`INSERT INTO ${tableName} (${escapedColumns}) VALUES (${placeholders})`, values);
            
            if (gameDataTables.includes(tableName)) {
                await reloadGameData();
            }

            res.status(201).json({ message: `Tạo mục ${tableName} thành công.` });
        } catch (err) {
            console.error(`Error creating item in ${tableName}:`, err);
            res.status(500).json({ message: `Lỗi khi tạo mục ${tableName}: ${err.message}` });
        } finally {
            if (conn) conn.release();
        }
    });

    // PUT /api/admin/{tableName}/:id - Update an item
    router.put(`/${tableName}/:key`, authenticateAdmin, async (req, res) => {
        const { key } = req.params;
        let conn;
        try {
            conn = await pool.getConnection();
            const updates = { ...req.body };
            delete updates[primaryKey]; 
            
            if (tableName === 'guilds') {
                delete updates.memberCount;
            }

            const columns = Object.keys(updates);
            // FIX: Automatically handle boolean conversion and stringify objects/arrays before sending to DB
            const setClause = columns.map(col => `\`${col}\` = ?`).join(', ');
            const values = columns.map(col => {
                let value = updates[col];
                if (typeof value === 'boolean') {
                    value = value ? 1 : 0;
                } else if (typeof value === 'object' && value !== null) {
                    value = JSON.stringify(value);
                }
                return formatDateTimeForDB(value);
            });

            if (columns.length > 0) {
                await conn.query(`UPDATE ${tableName} SET ${setClause} WHERE \`${primaryKey}\` = ?`, [...values, key]);
            } else {
                 return res.status(200).json({ message: 'Không có gì để cập nhật.' });
            }
            
            if (gameDataTables.includes(tableName)) {
                await reloadGameData();
            }

            res.status(200).json({ message: `Cập nhật mục ${tableName} thành công.` });
        } catch (err) {
            res.status(500).json({ message: `Lỗi khi cập nhật ${tableName}: ${err.sql ? err.sql : err.message}` });
        } finally {
            if (conn) conn.release();
        }
    });

    // DELETE /api/admin/{tableName}/:id - Delete an item
    router.delete(`/${tableName}/:key`, authenticateAdmin, async (req, res) => {
        const { key } = req.params;
        let conn;
        try {
            conn = await pool.getConnection();
            await conn.query(`DELETE FROM ${tableName} WHERE \`${primaryKey}\` = ?`, [key]);
            
            if (gameDataTables.includes(tableName)) {
                await reloadGameData();
            }

            res.status(200).json({ message: `Xóa mục ${tableName} thành công.` });
        } catch (err) {
            res.status(500).json({ message: `Lỗi khi xóa ${tableName}: ${err.message}` });
        } finally {
            if (conn) conn.release();
        }
    });
};

// --- Create all CRUD endpoints for game data ---
createCrudEndpoints('herbs');
createCrudEndpoints('pills');
createCrudEndpoints('recipes');
createCrudEndpoints('techniques');
createCrudEndpoints('equipment');
createCrudEndpoints('insights');
createCrudEndpoints('exploration_locations');
createCrudEndpoints('trial_zones');
createCrudEndpoints('realms', 'realmIndex');
createCrudEndpoints('breakthrough_failure_bonuses', 'failure_count');
createCrudEndpoints('spiritual_roots');
createCrudEndpoints('honor_shop_items');
createCrudEndpoints('events');
createCrudEndpoints('gift_codes', 'code');
createCrudEndpoints('guilds');
createCrudEndpoints('market_listings');
createCrudEndpoints('market_listings_pills'); // NEW: Add CRUD for pill market
createCrudEndpoints('game_config', 'config_key');
createCrudEndpoints('guild_wars'); 
createCrudEndpoints('pvp_skills'); 
createCrudEndpoints('combat_log_templates', 'id');
createCrudEndpoints('rarities');
createCrudEndpoints('css_animations', 'class_name');
createCrudEndpoints('avatars'); // NEW: Add CRUD for avatars
createCrudEndpoints('equipment_upgrades', 'upgrade_level'); // NEW: Add CRUD for upgrades
createCrudEndpoints('pvp_daily_rewards'); // NEW: PvP Rewards
createCrudEndpoints('pvp_weekly_rewards'); // NEW: PvP Rewards
createCrudEndpoints('announcements'); // NEW: For scrolling announcements


// --- Guild War Management Endpoints ---

// GET /api/admin/guild_war_details - Get comprehensive details of the active war
router.get('/guild_war_details', authenticateAdmin, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const [active_war] = await conn.query("SELECT * FROM guild_wars WHERE status != 'COMPLETED' ORDER BY start_time ASC LIMIT 1");
        if (!active_war) {
            return res.status(200).json({ active_war: null, matches: [] });
        }

        const matches = await conn.query(`
            SELECT 
                m.*,
                g1.name as guild1_name,
                g2.name as guild2_name
            FROM guild_war_matches m
            JOIN guilds g1 ON m.guild1_id = g1.id
            JOIN guilds g2 ON m.guild2_id = g2.id
            WHERE m.war_id = ?
        `, [active_war.id]);
        
        for (const match of matches) {
            const lineups = await conn.query("SELECT * FROM guild_war_lineups WHERE match_id = ? AND round_number = ?", [match.id, match.current_round]);
            match.guild1_lineup = lineups.find(l => l.guild_id === match.guild1_id) || null;
            match.guild2_lineup = lineups.find(l => l.guild_id === match.guild2_id) || null;
        }

        res.status(200).json({ active_war, matches });

    } catch (err) {
        res.status(500).json({ message: `Lỗi khi lấy chi tiết Tông Môn Chiến: ${err.message}` });
    } finally {
        if (conn) conn.release();
    }
});

// POST /api/admin/guild_war/force_process/:matchId - Manually trigger round processing
router.post('/guild_war/force_process/:matchId', authenticateAdmin, async (req, res) => {
    const { matchId } = req.params;
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();
        
        await processRound(conn, matchId);
        
        await conn.commit();
        res.status(200).json({ message: `Đã xử lý vòng đấu cho trận ${matchId}.` });
    } catch (err) {
        if(conn) await conn.rollback();
        res.status(500).json({ message: `Lỗi khi xử lý vòng đấu: ${err.message}` });
    } finally {
        if (conn) conn.release();
    }
});


module.exports = router;