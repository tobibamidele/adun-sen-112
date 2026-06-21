const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/checkout', (req, res) => {
    const userId = res.locals.userId;
    const { items } = req.body;

    if (!items || !items.length) {
        return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    db.serialize(() => {
        db.run(`INSERT INTO orders (user_id, total) VALUES (?, ?)`, [userId, total], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }

            const orderId = this.lastID;
            const stmt = db.prepare(`INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`);

            for (const item of items) {
                stmt.run(orderId, item.product_id, item.quantity, item.price);
            }

            stmt.finalize();
            res.status(201).json({ success: true, orderId, total, message: "Order placed successfully" });
        });
    });
});

router.get('/orders', (req, res) => {
    const userId = res.locals.userId;

    db.all(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`, [userId], (err, orders) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }

        if (!orders.length) {
            return res.json({ success: true, orders: [] });
        }

        const orderIds = orders.map(o => o.id);
        const placeholders = orderIds.map(() => '?').join(',');

        db.all(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`, orderIds, (err, items) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }

            const itemsByOrder = {};
            for (const item of items) {
                if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
                itemsByOrder[item.order_id].push(item);
            }

            for (const order of orders) {
                order.items = itemsByOrder[order.id] || [];
            }

            res.json({ success: true, orders });
        });
    });
});

module.exports = router;
