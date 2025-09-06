const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const JWT_SECRET = 'your_super_secret_key_for_tu_tien_game'; // CHANGE THIS!

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Yêu cầu xác thực.' });
    }

    let userPayload;
    try {
        userPayload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return res.status(403).json({ message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
    }

    // NEW: Immediate kick mechanism
    // On every authenticated action, check if the player has been banned since their last action.
    let conn;
    try {
        conn = await pool.getConnection();
        const [player] = await conn.query("SELECT is_banned, ban_reason FROM players WHERE name = ?", [userPayload.name]);
        if (!player) {
            return res.status(403).json({ message: 'Người dùng không tồn tại.' });
        }
        if (player.is_banned) {
            // If banned, invalidate the session by sending a 403 error.
            // The client will catch this and log the user out.
            return res.status(403).json({ message: `Tài khoản đã bị khóa. Lý do: ${player.ban_reason || 'Không có lý do.'}` });
        }

        req.user = userPayload;
        next();
    } catch (err) {
        console.error("Auth Middleware DB Error:", err);
        return res.status(500).json({ message: 'Lỗi máy chủ khi xác thực.' });
    } finally {
        if (conn) conn.release();
    }
};

const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Yêu cầu xác thực của quản trị viên.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        // Check for verification error OR if the isAdmin flag is not present/true in the token
        if (err || !user.isAdmin) {
            return res.status(403).json({ message: 'Forbidden: Yêu cầu quyền quản trị.' });
        }
        req.user = user; // The user payload is now { username: '...', isAdmin: true, ... }
        next();
    });
};


module.exports = {
    authenticateToken,
    authenticateAdmin,
    JWT_SECRET,
};