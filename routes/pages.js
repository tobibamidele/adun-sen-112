const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const requireSeller = require('../middleware/requireSeller');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [products] = await db.execute(`SELECT * FROM products ORDER BY name`);
        res.render('index', { user: res.locals.user, products });
    } catch (err) {
        res.render('index', { user: res.locals.user, products: [] });
    }
});

router.get('/product/:id', async (req, res) => {
    try {
        const [rows] = await db.execute(`SELECT * FROM products WHERE id = ?`, [req.params.id]);
        const product = rows[0];
        if (!product) return res.redirect('/');
        res.render('product', { user: res.locals.user, product });
    } catch (err) {
        res.redirect('/');
    }
});

router.get('/cart', (req, res) => {
    res.render('cart', { user: res.locals.user });
});

router.get('/checkout', requireAuth, (req, res) => {
    res.render('checkout', { user: res.locals.user });
});

router.get('/orders', requireAuth, async (req, res) => {
    try {
        const [orders] = await db.execute(
            `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
            [res.locals.user.id]
        );

        if (!orders.length) {
            return res.render('orders', { user: res.locals.user, orders: [] });
        }

        const orderIds = orders.map(o => o.id);
        const placeholders = orderIds.map(() => '?').join(',');

        const [items] = await db.execute(
            `SELECT * FROM order_items WHERE order_id IN (${placeholders})`,
            orderIds
        );

        const itemsByOrder = {};
        for (const item of items) {
            if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
            itemsByOrder[item.order_id].push(item);
        }
        for (const order of orders) {
            order.items = itemsByOrder[order.id] || [];
        }

        res.render('orders', { user: res.locals.user, orders });
    } catch (err) {
        res.render('orders', { user: res.locals.user, orders: [] });
    }
});

router.get('/seller', requireSeller, async (req, res) => {
    try {
        const [products] = await db.execute(
            `SELECT * FROM products WHERE owner_id = ? ORDER BY name`,
            [res.locals.user.id]
        );
        res.render('seller', { user: res.locals.user, products });
    } catch (err) {
        res.render('seller', { user: res.locals.user, products: [] });
    }
});

router.get('/login', (req, res) => {
    if (res.locals.user) return res.redirect('/');
    res.render('login', { user: null });
});

router.get('/register', (req, res) => {
    if (res.locals.user) return res.redirect('/');
    res.render('register', { user: null });
});

module.exports = router;
