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

router.get('/products', async (req, res) => {
    if (!res.locals.user || res.locals.user.type !== 'seller') {
        return res.status(403).json({ success: false, message: 'Not a seller' });
    }

    try {
        const [products] = await db.execute(
            `SELECT * FROM products WHERE owner_id = ? ORDER BY name`,
            [res.locals.user.id]
        );
        res.json({ success: true, products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/products', upload.single('image'), async (req, res) => {
    if (!res.locals.user || res.locals.user.type !== 'seller') {
        return res.redirect('/login');
    }

    const fetchProducts = async () => {
        const [rows] = await db.execute(
            `SELECT * FROM products WHERE owner_id = ? ORDER BY name`,
            [res.locals.user.id]
        );
        return rows;
    };

    if (!req.file) {
        const products = await fetchProducts();
        return res.render('seller', {
            user: res.locals.user,
            products,
            error: 'No image file uploaded'
        });
    }

    const { name, price, stock } = req.body;
    if (!name || !price || !stock) {
        const products = await fetchProducts();
        return res.render('seller', {
            user: res.locals.user,
            products,
            error: 'Name, price, and stock are required'
        });
    }

    const productId = crypto.randomUUID();

    try {
        await db.execute(
            `INSERT INTO products (id, owner_id, name, price, stock, image_storage_path) VALUES (?, ?, ?, ?, ?, ?)`,
            [productId, res.locals.user.id, name, price, stock, '/uploads/' + req.file.filename]
        );
        res.redirect('/seller');
    } catch (err) {
        const products = await fetchProducts();
        res.render('seller', {
            user: res.locals.user,
            products,
            error: err.message
        });
    }
});

router.put('/products/:id', upload.single('image'), async (req, res) => {
    if (!res.locals.user || res.locals.user.type !== 'seller') {
        return res.redirect('/login');
    }

    const productId = req.params.id;
    const { name, price, stock } = req.body;

    try {
        const [rows] = await db.execute(
            `SELECT * FROM products WHERE id = ? AND owner_id = ?`,
            [productId, res.locals.user.id]
        );
        const product = rows[0];

        if (!product) {
            return res.redirect('/seller');
        }

        let query = `UPDATE products SET name = ?, price = ?, stock = ?`;
        let params = [name || product.name, price || product.price, stock || product.stock];

        if (req.file) {
            query += `, image_storage_path = ?`;
            params.push('/uploads/' + req.file.filename);
        }

        query += ` WHERE id = ? AND owner_id = ?`;
        params.push(productId, res.locals.user.id);

        await db.execute(query, params);
        res.redirect('/seller');
    } catch (err) {
        res.redirect('/seller');
    }
});

router.delete('/products/:id', async (req, res) => {
    if (!res.locals.user || res.locals.user.type !== 'seller') {
        return res.redirect('/login');
    }

    const productId = req.params.id;

    try {
        const [rows] = await db.execute(
            `SELECT * FROM products WHERE id = ? AND owner_id = ?`,
            [productId, res.locals.user.id]
        );

        if (!rows[0]) {
            return res.redirect('/seller');
        }

        await db.execute(
            `DELETE FROM products WHERE id = ? AND owner_id = ?`,
            [productId, res.locals.user.id]
        );
        res.redirect('/seller');
    } catch (err) {
        res.redirect('/seller');
    }
});

module.exports = router;
