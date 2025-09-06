const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initializeGameData } = require('./services/gameData.service');
const { initializeGuildWarService } = require('./services/guildWar.service');
const { checkIpBan } = require('./middleware/ip.middleware');
const { initializeScheduler } = require('./services/scheduler.service');

// Import modular routes
const authRoutes = require('./routes/auth.routes');
const playerRoutes = require('./routes/player.routes');
const guildRoutes = require('./routes/guild.routes');
const chatRoutes = require('./routes/chat.routes');
const gameRoutes = require('./routes/game.routes');
const pvpRoutes = require('./routes/pvp.routes');
const marketRoutes = require('./routes/market.routes'); // Import new market routes
const adminRoutes = require('./routes/admin.routes');
const guildWarRoutes = require('./routes/guild-war.routes');
const mailRoutes = require('./routes/mail.routes');


const app = express();

// --- Cấu hình Middleware ---
// FIX: Changed 'true' to 'loopback' for more specific and reliable proxy trusting.
app.set('trust proxy', 'loopback'); // NEW: Enable trust for X-Forwarded-For to get correct client IP
app.use(cors());
app.use(bodyParser.json());

// --- Sử dụng các Routes đã được module hóa ---
// NEW: IP Ban Check Middleware applied to all API routes
app.use('/api', checkIpBan);

// FIX: Reorder routes from most specific to most general to prevent routing conflicts.
// The '/api/admin' route is now correctly placed before the general '/api' routes.
app.use('/api/admin', adminRoutes); // Admin routes (most specific)
app.use('/api/guilds', guildRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/pvp', pvpRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/guild-war', guildWarRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/mail', mailRoutes);

// General game routes should come after more specific ones.
app.use('/api', playerRoutes); // e.g. /api/load, /api/leaderboard
app.use('/api', gameRoutes); // e.g. /api/breakthrough, /api/temper-body


// --- Khởi động Server ---
const port = process.env.PORT || 3001;
app.listen(port, async () => {
    console.log(`Server đang chạy trên cổng ${port}`);
    // Load all game data from DB into cache on startup
    await initializeGameData(); 
    // Start the guild war scheduler
    initializeGuildWarService();
    // Start the main game scheduler for rewards etc.
    initializeScheduler();
});