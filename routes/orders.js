const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/checkout', async (req, res) => {
    if (!res.locals.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = res.locals.user.id;
    const { items } = req.body;

    if (!items || !items.length) {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
        const [orderResult] = await db.execute(
            `INSERT INTO orders (user_id, total) VALUES (?, ?)`,
            [userId, total]
        );

        const orderId = orderResult.insertId;

        for (const item of items) {
            await db.execute(
                `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
                [orderId, item.product_id, item.quantity, item.price]
            );
        }

        res.status(201).json({ success: true, orderId, total, message: 'Order placed successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
