const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/products', (req, res) => {
    db.all(`SELECT * FROM products ORDER BY name`, [], (err, products) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, products });
    });
});

router.get('/products/:id', (req, res) => {
    db.get(`SELECT * FROM products WHERE id = ?`, [req.params.id], (err, product) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.json({ success: true, product });
    });
});

module.exports = router;
