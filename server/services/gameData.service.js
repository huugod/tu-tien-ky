const pool = require('../config/database');

// This object will act as our in-memory cache.
let gameDataCache = {};

const dataTables = [
    'rarities',
    'herbs',
    'pills',
    'recipes',
    'techniques',
    'equipment',
    'insights',
    'exploration_locations',
    'trial_zones',
    'realms',
    'spiritual_roots',
    'honor_shop_items',
    'pvp_skills',
    'combat_log_templates', // NEW: Add combat log templates to the cache
    'css_animations', // NEW: Add css animations to the cache
    'avatars', // NEW: Add avatars to the cache
    'equipment_upgrades', // NEW: For Blacksmith feature
    'pvp_daily_rewards',
    'pvp_weekly_rewards',
];

// Helper to parse JSON fields safely
const parseJsonFields = (items) => {
    return items.map(item => {
        const newItem = { ...item };
        for (const key in newItem) {
            // Attempt to parse fields that look like JSON arrays or objects
            if (typeof newItem[key] === 'string' && (newItem[key].startsWith('{') || newItem[key].startsWith('['))) {
                try {
                    newItem[key] = JSON.parse(newItem[key]);
                } catch (e) {
                    // Not valid JSON, leave as is
                }
            }
        }
        return newItem;
    });
};


const loadAllGameData = async () => {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Loading all game data from database...");
        const newCache = {};

        for (const tableName of dataTables) {
            const rows = await conn.query(`SELECT * FROM ${tableName}`);
            // Store data in a format that's easy to access, e.g., gameData.TECHNIQUES
            const cacheKey = tableName.toUpperCase();
            
            // Special handling for realms to key by index for faster lookups
            if (tableName === 'realms') {
                const realmsArray = [];
                rows.forEach(row => {
                    const parsedRow = parseJsonFields([row])[0];
                    realmsArray[parsedRow.realmIndex] = parsedRow;
                });
                newCache[cacheKey] = realmsArray;
            } else {
                 newCache[cacheKey] = parseJsonFields(rows);
            }
        }

        // Load game config constants
        const configRows = await conn.query(`SELECT config_key, config_value FROM game_config`);
        configRows.forEach(row => {
            let value = row.config_value;
            try {
                // MariaDB driver might return JSON as string.
                if (typeof value === 'string') {
                     value = JSON.parse(value);
                }
            } catch (e) {
                // Not a JSON string, use as is (for simple numbers).
            }
            newCache[row.config_key] = value;
        });
        
        gameDataCache = newCache;
        console.log("Game data loaded successfully. Cached tables:", Object.keys(gameDataCache));
        
    } catch (err) {
        console.error("Fatal Error: Could not load game data from database.", err);
        // Exit the process if critical game data cannot be loaded on startup.
        process.exit(1); 
    } finally {
        if (conn) conn.release();
    }
};

const initializeGameData = async () => {
    await loadAllGameData();
};

const reloadGameData = async () => {
    // This function can be called by an admin endpoint to refresh the cache without restarting the server.
    await loadAllGameData();
};

const getGameData = () => {
    // Returns the current cache.
    // In the future, game logic files will call this instead of requiring constants.js
    return gameDataCache;
};

module.exports = {
    initializeGameData,
    reloadGameData,
    getGameData,
};