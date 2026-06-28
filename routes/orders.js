const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/checkout', (req, res) => {
    if (!res.locals.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = res.locals.user.id;
    const { items } = req.body;

    if (!items || !items.length) {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
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
            res.status(201).json({ success: true, orderId, total, message: 'Order placed successfully' });
        });
    });
});

module.exports = router;
