const pool = require('../config/database');

const getClientIp = (req) => {
    // With `app.set('trust proxy', true)`, req.ip will correctly provide the client's IP
    // even when behind a reverse proxy like Nginx.
    return req.ip; 
};

const checkIpBan = async (req, res, next) => {
    const ip = getClientIp(req);
    const clientId = req.headers['x-client-id'] || null;
    
    // Attach IP and Client ID to the request object for later use in other routes (e.g., auth).
    req.clientIp = ip;
    req.clientId = clientId;

    if (!ip) {
        return next(); // If IP cannot be determined, let the request proceed.
    }

    let conn;
    try {
        conn = await pool.getConnection();
        const [bannedIp] = await conn.query("SELECT ip_address FROM banned_ips WHERE ip_address = ?", [ip]);

        if (bannedIp) {
            // If the IP is found in the banned list, block the request immediately.
            return res.status(403).json({ message: "IP đã bị cấm truy cập." });
        }
        
        // IP is not banned, proceed to the next middleware or route handler.
        next();

    } catch (err) {
        console.error("IP Ban Check Middleware Error:", err);
        // In case of a database error, it's safer to let the request proceed 
        // to avoid blocking legitimate users.
        next();
    } finally {
        if (conn) conn.release();
    }
};

module.exports = {
    checkIpBan
};