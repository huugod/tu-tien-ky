const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { performAction, updatePlayerState, sendSystemMail } = require('../services/player.service');
const { getGameData } = require('../services/gameData.service');

const router = express.Router();

// GET /api/market/listings - Lấy danh sách vật phẩm đang bán
router.get('/listings', authenticateToken, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const gameData = getGameData();

        // 1. Get Equipment listings
        const equipmentListingsRaw = await conn.query(`
            SELECT ml.id, ml.seller_name, ml.price, ml.created_at, ml.expires_at,
                   pe.instance_id, pe.equipment_id, pe.upgrade_level, pe.is_locked
            FROM market_listings ml
            JOIN player_equipment pe ON ml.item_id = pe.instance_id
            WHERE ml.expires_at > NOW()
        `);
        const equipmentListings = equipmentListingsRaw.map(l => {
            const staticItemData = gameData.EQUIPMENT.find(e => e.id === l.equipment_id);
            return {
                id: l.id,
                listing_type: 'equipment',
                seller_name: l.seller_name,
                price: l.price,
                created_at: l.created_at,
                expires_at: l.expires_at,
                item: {
                    ...staticItemData,
                    instance_id: l.instance_id,
                    is_equipped: false, // Items on market are never equipped
                    upgrade_level: l.upgrade_level,
                    is_locked: l.is_locked,
                    bonuses: staticItemData?.bonuses || [],
                }
            };
        });

        // 2. Get Pill listings
        const pillListingsRaw = await conn.query(`
            SELECT * FROM market_listings_pills WHERE expires_at > NOW()
        `);
        const pillListings = pillListingsRaw.map(l => {
            const staticPillData = gameData.PILLS.find(p => p.id === l.pill_id);
            return {
                id: l.id,
                listing_type: 'pill',
                seller_name: l.seller_name,
                quantity: l.quantity,
                price_per_item: l.price_per_item,
                created_at: l.created_at,
                expires_at: l.expires_at,
                item: { ...staticPillData }
            };
        });
        
        // 3. Combine and send
        const allListings = [...equipmentListings, ...pillListings];
        res.status(200).json(allListings);

    } catch (err) {
        console.error("Get Market Listings Error:", err);
        res.status(500).json({ message: 'Lỗi khi tải dữ liệu Chợ Giao Dịch.' });
    } finally {
        if (conn) conn.release();
    }
});

// POST /api/market/list - Đăng bán vật phẩm (EQUIPMENT)
router.post('/list', authenticateToken, async (req, res) => {
    const { itemInstanceId, price } = req.body;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const gameData = getGameData();
        
        const [item] = await conn.query(
            "SELECT * FROM player_equipment WHERE instance_id = ? AND player_name = ? AND is_equipped = FALSE",
            [itemInstanceId, p.name]
        );
        
        if (!item) {
            throw new Error("Vật phẩm không tồn tại trong túi đồ hoặc đang được trang bị.");
        }
        if (!price || price <= 0) {
            throw new Error("Giá bán không hợp lệ.");
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + gameData.MARKET_LISTING_DURATION_HOURS.value);

        await conn.query(
            "INSERT INTO market_listings (seller_name, item_id, price, expires_at) VALUES (?, ?, ?, ?)",
            [p.name, itemInstanceId, price, expiresAt]
        );
        
        const staticItemData = gameData.EQUIPMENT.find(i => i.id === item.equipment_id);
        resRef.log = { message: `Bạn đã đăng bán [${staticItemData?.name}] với giá ${price} Linh Thạch.`, type: 'success' };
    });
});

// POST /api/market/buy/:id - Mua vật phẩm (EQUIPMENT)
router.post('/buy/:id', authenticateToken, async (req, res) => {
    const listingId = req.params.id;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const gameData = getGameData();
        const [listing] = await conn.query("SELECT * FROM market_listings WHERE id = ? AND expires_at > NOW() FOR UPDATE", [listingId]);
        
        if (!listing) throw new Error("Vật phẩm không còn tồn tại hoặc đã hết hạn.");
        if (listing.seller_name === p.name) throw new Error("Bạn không thể mua vật phẩm của chính mình.");
        
        if (BigInt(p.linh_thach) < BigInt(listing.price)) throw new Error("Không đủ Linh Thạch.");

        const tax = Math.floor(listing.price * gameData.MARKET_TAX_RATE.value);
        const amountToSeller = BigInt(listing.price) - BigInt(tax);

        await updatePlayerState(conn, p.name, {
            linh_thach: (BigInt(p.linh_thach) - BigInt(listing.price)).toString(),
        });
        await conn.query("UPDATE player_equipment SET player_name = ? WHERE instance_id = ?", [p.name, listing.item_id]);
        
        const [itemInfo] = await conn.query("SELECT e.name FROM equipment e JOIN player_equipment pe ON e.id = pe.equipment_id WHERE pe.instance_id = ?", [listing.item_id]);
        
        // Send mail to seller instead of directly giving money
        const mailTitle = `Vật phẩm đã bán`;
        const mailContent = `Đạo hữu ${p.name} đã mua [${itemInfo?.name}] của bạn. Sau khi trừ thuế, bạn nhận được ${amountToSeller.toString()} Linh Thạch.`;
        const mailRewards = [{ type: 'linh_thach', amount: Number(amountToSeller) }];
        await sendSystemMail(conn, listing.seller_name, mailTitle, mailContent, mailRewards);

        await conn.query("DELETE FROM market_listings WHERE id = ?", [listingId]);
        
        resRef.log = { message: `Mua thành công [${itemInfo?.name}]!`, type: 'success' };
    });
});

// POST /api/market/cancel/:id - Hủy bán vật phẩm (EQUIPMENT)
router.post('/cancel/:id', authenticateToken, async (req, res) => {
    const listingId = req.params.id;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const [listing] = await conn.query("SELECT * FROM market_listings WHERE id = ? AND seller_name = ? FOR UPDATE", [listingId, p.name]);
        if (!listing) throw new Error("Đây không phải vật phẩm của bạn.");
        
        await conn.query("DELETE FROM market_listings WHERE id = ?", [listingId]);
        
        const [itemInfo] = await conn.query("SELECT * from equipment where id = (SELECT equipment_id from player_equipment where instance_id = ?)", [listing.item_id]);
        resRef.log = { message: `Bạn đã hủy bán [${itemInfo?.name}].`, type: 'info' };
    });
});


// GET /api/market/my-listings - Lấy danh sách vật phẩm của tôi
router.get('/my-listings', authenticateToken, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const gameData = getGameData();
        
        const equipmentListingsRaw = await conn.query(`
            SELECT ml.id, ml.seller_name, ml.price, ml.created_at, ml.expires_at,
                   pe.instance_id, pe.equipment_id, pe.upgrade_level, pe.is_locked
            FROM market_listings ml
            JOIN player_equipment pe ON ml.item_id = pe.instance_id
            WHERE ml.seller_name = ?
        `, [req.user.name]);
        const equipmentListings = equipmentListingsRaw.map(l => {
             const staticItemData = gameData.EQUIPMENT.find(e => e.id === l.equipment_id);
             return {
                id: l.id, listing_type: 'equipment', seller_name: l.seller_name, price: l.price, created_at: l.created_at, expires_at: l.expires_at,
                item: { 
                    ...staticItemData, 
                    instance_id: l.instance_id, 
                    is_equipped: false,
                    upgrade_level: l.upgrade_level,
                    is_locked: l.is_locked,
                    bonuses: staticItemData?.bonuses || [] 
                }
             };
        });

        const pillListingsRaw = await conn.query(`
            SELECT * FROM market_listings_pills WHERE seller_name = ?
        `, [req.user.name]);
        const pillListings = pillListingsRaw.map(l => {
             const staticPillData = gameData.PILLS.find(p => p.id === l.pill_id);
             return {
                id: l.id, listing_type: 'pill', seller_name: l.seller_name, quantity: l.quantity, price_per_item: l.price_per_item, created_at: l.created_at, expires_at: l.expires_at,
                item: { ...staticPillData }
             };
        });
        
        const allListings = [...equipmentListings, ...pillListings];
        allListings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        res.status(200).json(allListings);
    } catch (err) {
        console.error("Get My Listings Error:", err);
        res.status(500).json({ message: 'Lỗi khi tải danh sách vật phẩm đang bán.' });
    } finally {
        if (conn) conn.release();
    }
});

// NEW: POST /api/market/list-pill
router.post('/list-pill', authenticateToken, async (req, res) => {
    const { pillId, quantity, price } = req.body;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const gameData = getGameData();
        const pillData = gameData.PILLS.find(pi => pi.id === pillId);

        if (!pillData) throw new Error("Loại đan dược này không tồn tại.");
        const qty = parseInt(quantity, 10);
        const pricePerItem = parseInt(price, 10);
        if (isNaN(qty) || qty <= 0) throw new Error("Số lượng không hợp lệ.");
        if (isNaN(pricePerItem) || pricePerItem <= 0) throw new Error("Giá bán không hợp lệ.");

        const playerPillCount = p.pills[pillId] || 0;
        if (playerPillCount < qty) throw new Error(`Không đủ [${pillData.name}]. Cần ${qty}, có ${playerPillCount}.`);

        const newPills = { ...p.pills };
        newPills[pillId] -= qty;
        if (newPills[pillId] <= 0) delete newPills[pillId];
        await updatePlayerState(conn, p.name, { pills: newPills });

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + gameData.MARKET_LISTING_DURATION_HOURS.value);

        await conn.query(
            "INSERT INTO market_listings_pills (seller_name, pill_id, quantity, price_per_item, expires_at) VALUES (?, ?, ?, ?, ?)",
            [p.name, pillId, qty, pricePerItem, expiresAt]
        );

        resRef.log = { message: `Bạn đã đăng bán ${qty} [${pillData.name}] với giá ${pricePerItem}/viên.`, type: 'success' };
    });
});

// NEW: POST /api/market/buy-pill/:id
router.post('/buy-pill/:id', authenticateToken, async (req, res) => {
    const listingId = req.params.id;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const gameData = getGameData();
        const [listing] = await conn.query("SELECT * FROM market_listings_pills WHERE id = ? AND expires_at > NOW() FOR UPDATE", [listingId]);

        if (!listing) throw new Error("Vật phẩm không còn tồn tại hoặc đã hết hạn.");
        if (listing.seller_name === p.name) throw new Error("Bạn không thể mua vật phẩm của chính mình.");
        
        const totalPrice = BigInt(listing.price_per_item) * BigInt(listing.quantity);
        if (BigInt(p.linh_thach) < totalPrice) throw new Error("Không đủ Linh Thạch.");

        const tax = totalPrice * BigInt(Math.floor(gameData.MARKET_TAX_RATE.value * 100)) / BigInt(100);
        const amountToSeller = totalPrice - tax;

        // 1. Update Buyer: subtract linh_thach, add pills
        const buyerPills = { ...p.pills };
        buyerPills[listing.pill_id] = (buyerPills[listing.pill_id] || 0) + listing.quantity;
        await updatePlayerState(conn, p.name, {
            linh_thach: (BigInt(p.linh_thach) - totalPrice).toString(),
            pills: buyerPills
        });
        
        const pillData = gameData.PILLS.find(pi => pi.id === listing.pill_id);

        // 2. Send mail to Seller instead of directly giving money
        const mailTitle = `Vật phẩm đã bán`;
        const mailContent = `Đạo hữu ${p.name} đã mua ${listing.quantity} [${pillData?.name}] của bạn. Sau khi trừ thuế, bạn nhận được ${amountToSeller.toString()} Linh Thạch.`;
        const mailRewards = [{ type: 'linh_thach', amount: Number(amountToSeller) }];
        await sendSystemMail(conn, listing.seller_name, mailTitle, mailContent, mailRewards);

        // 3. Delete listing
        await conn.query("DELETE FROM market_listings_pills WHERE id = ?", [listingId]);
        
        resRef.log = { message: `Mua thành công ${listing.quantity} [${pillData.name}]!`, type: 'success' };
    });
});

// NEW: POST /api/market/cancel-pill/:id
router.post('/cancel-pill/:id', authenticateToken, async (req, res) => {
    const listingId = req.params.id;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const [listing] = await conn.query("SELECT * FROM market_listings_pills WHERE id = ? AND seller_name = ? FOR UPDATE", [listingId, p.name]);
        if (!listing) throw new Error("Đây không phải vật phẩm của bạn.");

        const newPills = { ...p.pills };
        newPills[listing.pill_id] = (newPills[listing.pill_id] || 0) + listing.quantity;
        await updatePlayerState(conn, p.name, { pills: newPills });
        
        await conn.query("DELETE FROM market_listings_pills WHERE id = ?", [listingId]);
        
        const pillData = getGameData().PILLS.find(pi => pi.id === listing.pill_id);
        resRef.log = { message: `Bạn đã hủy bán ${listing.quantity} [${pillData.name}].`, type: 'info' };
    });
});


module.exports = router;
