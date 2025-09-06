const pool = require('../config/database');
const { getGameData } = require('./gameData.service');
const { sendSystemMail } = require('./player.service'); // NEW: Import the centralized mail function

const distributeRewards = async (conn, rewardType) => {
    const gameData = getGameData();
    const rewardTable = rewardType === 'daily' ? 'PVP_DAILY_REWARDS' : 'PVP_WEEKLY_REWARDS';
    const rewardTiers = gameData[rewardTable] || [];

    if (rewardTiers.length === 0) {
        console.log(`Scheduler: No ${rewardType} reward tiers configured. Skipping distribution.`);
        return;
    }
    
    // Get top players by Elo
    const topPlayers = await conn.query(
        "SELECT name, pvp_elo, (@rank \\:= @rank + 1) AS `rank` FROM players, (SELECT @rank \\:= 0) r ORDER BY pvp_elo DESC"
    );

    for (const player of topPlayers) {
        const tier = rewardTiers.find(t => player.rank >= t.rank_start && player.rank <= t.rank_end);
        if (tier) {
            const title = rewardType === 'daily' 
                ? `Phần Thưởng Đấu Pháp Hàng Ngày (Hạng ${player.rank})` 
                : `Phần Thưởng Mùa Đấu Pháp (Hạng ${player.rank})`;
            
            const content = `Chúc mừng bạn đã đạt thành tích cao trong xếp hạng Đấu Pháp. Đây là phần thưởng của bạn.`;
                
            // Use the new centralized mail function
            await sendSystemMail(conn, player.name, title, content, tier.rewards);
        }
    }
    console.log(`Scheduler: Distributed ${rewardType} rewards to ${topPlayers.length} players.`);
};

const resetEloForNewSeason = async (conn) => {
    await conn.query("UPDATE players SET pvp_elo = 1000");
    console.log("Scheduler: PvP Elo has been reset for the new season.");
};

const scheduleTasks = () => {
    let conn;
    setInterval(async () => {
        try {
            const now = new Date();
            const isMidnight = now.getHours() === 0 && now.getMinutes() === 0;
            const isMonday = now.getDay() === 1;

            if (isMidnight) {
                conn = await pool.getConnection();
                await conn.beginTransaction();
                
                // Weekly rewards and reset take precedence on Monday midnight
                if (isMonday) {
                    await distributeRewards(conn, 'weekly');
                    await resetEloForNewSeason(conn);
                }
                
                // Daily rewards run every day at midnight
                await distributeRewards(conn, 'daily');
                
                await conn.commit();
            }
        } catch (err) {
            if (conn) await conn.rollback();
            console.error("Scheduler Error:", err);
        } finally {
            if (conn) conn.release();
        }
    }, 60 * 1000); // Check every minute
};

const initializeScheduler = () => {
    console.log("Scheduler Initialized. Checking for tasks every minute.");
    scheduleTasks();
};

module.exports = {
    initializeScheduler
};
