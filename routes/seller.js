const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.get('/seller/products', (req, res) => {
    if (res.locals.userType !== 'seller') {
        return res.status(403).json({ success: false, message: "Not a seller" });
    }

    db.all(`SELECT * FROM products WHERE owner_id = ? ORDER BY name`, [res.locals.userId], (err, products) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, products });
    });
});

router.post('/seller/products', upload.single('image'), (req, res) => {
    if (res.locals.userType !== 'seller') {
        return res.status(403).json({ success: false, message: "Not a seller" });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: "No image file uploaded" });
    }

    const { name, price, stock } = req.body;

    if (!name || !price || !stock) {
        return res.status(400).json({ success: false, message: "name, price, and stock are required" });
    }

    const productId = crypto.randomUUID();

    db.run(
        `INSERT INTO products (id, owner_id, name, price, stock, image_storage_path) VALUES (?, ?, ?, ?, ?, ?)`,
        [productId, res.locals.userId, name, price, stock, '/uploads/' + req.file.filename],
        function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.status(201).json({
                success: true,
                productId,
                message: `Product ${name} created successfully`,
                imageUrl: '/uploads/' + req.file.filename,
            });
        }
    );
});

router.put('/seller/products/:id', upload.single('image'), (req, res) => {
    if (res.locals.userType !== 'seller') {
        return res.status(403).json({ success: false, message: "Not a seller" });
    }

    const productId = req.params.id;
    const { name, price, stock } = req.body;

    db.get(`SELECT * FROM products WHERE id = ? AND owner_id = ?`, [productId, res.locals.userId], (err, product) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        let query = `UPDATE products SET name = ?, price = ?, stock = ?`;
        let params = [name || product.name, price || product.price, stock || product.stock];

        if (req.file) {
            query += `, image_storage_path = ?`;
            params.push('/uploads/' + req.file.filename);
        }

        query += ` WHERE id = ? AND owner_id = ?`;
        params.push(productId, res.locals.userId);

        db.run(query, params, function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, message: "Product updated successfully" });
        });
    });
});

router.delete('/seller/products/:id', (req, res) => {
    if (res.locals.userType !== 'seller') {
        return res.status(403).json({ success: false, message: "Not a seller" });
    }

    const productId = req.params.id;

    db.get(`SELECT * FROM products WHERE id = ? AND owner_id = ?`, [productId, res.locals.userId], (err, product) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        db.run(`DELETE FROM products WHERE id = ? AND owner_id = ?`, [productId, res.locals.userId], function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, message: "Product deleted successfully" });
        });
    });
});

module.exports = router;
