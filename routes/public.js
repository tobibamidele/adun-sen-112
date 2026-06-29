const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/products', async (req, res) => {
    try {
        const [products] = await db.execute(`SELECT * FROM products ORDER BY name`);
        res.json({ success: true, products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/products/:id', async (req, res) => {
    try {
        const [rows] = await db.execute(`SELECT * FROM products WHERE id = ?`, [req.params.id]);
        const product = rows[0];
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
