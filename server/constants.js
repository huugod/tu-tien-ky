// This file is intentionally left blank.
// All game data is now loaded from the database into a cache via gameData.service.js.
// This ensures the database is the single source of truth and prevents data inconsistencies
// between the server and the database schema.
// All server-side logic should now import and use `getGameData()` from `gameData.service.js`
// instead of relying on hardcoded constants from this file.

module.exports = {};
