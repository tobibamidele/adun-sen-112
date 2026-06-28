const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const requireSeller = require('../middleware/requireSeller');

const router = express.Router();

router.get('/', (req, res) => {
    db.all(`SELECT * FROM products ORDER BY name`, [], (err, products) => {
        res.render('index', { user: res.locals.user, products: products || [] });
    });
});

router.get('/product/:id', (req, res) => {
    db.get(`SELECT * FROM products WHERE id = ?`, [req.params.id], (err, product) => {
        if (!product) return res.redirect('/');
        res.render('product', { user: res.locals.user, product });
    });
});

router.get('/cart', (req, res) => {
    res.render('cart', { user: res.locals.user });
});

router.get('/checkout', requireAuth, (req, res) => {
    res.render('checkout', { user: res.locals.user });
});

router.get('/orders', requireAuth, (req, res) => {
    db.all(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`, [res.locals.user.id], (err, orders) => {
        if (!orders || !orders.length) {
            return res.render('orders', { user: res.locals.user, orders: [] });
        }

        const orderIds = orders.map(o => o.id);
        const placeholders = orderIds.map(() => '?').join(',');

        db.all(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`, orderIds, (err, items) => {
            const itemsByOrder = {};
            for (const item of items) {
                if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
                itemsByOrder[item.order_id].push(item);
            }
            for (const order of orders) {
                order.items = itemsByOrder[order.id] || [];
            }
            res.render('orders', { user: res.locals.user, orders });
        });
    });
});

router.get('/seller', requireSeller, (req, res) => {
    db.all(`SELECT * FROM products WHERE owner_id = ? ORDER BY name`, [res.locals.user.id], (err, products) => {
        res.render('seller', { user: res.locals.user, products: products || [] });
    });
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
