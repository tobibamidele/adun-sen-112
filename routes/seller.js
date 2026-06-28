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

router.get('/products', (req, res) => {
    if (!res.locals.user || res.locals.user.type !== 'seller') {
        return res.status(403).json({ success: false, message: 'Not a seller' });
    }
    db.all(`SELECT * FROM products WHERE owner_id = ? ORDER BY name`, [res.locals.user.id], (err, products) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, products });
    });
});

router.post('/products', upload.single('image'), (req, res) => {
    if (!res.locals.user || res.locals.user.type !== 'seller') {
        return res.redirect('/login');
    }
    if (!req.file) {
        db.all(`SELECT * FROM products WHERE owner_id = ? ORDER BY name`, [res.locals.user.id], (err, products) => {
            return res.render('seller', {
                user: res.locals.user,
                products: products || [],
                error: 'No image file uploaded'
            });
        });
        return;
    }

    const { name, price, stock } = req.body;
    if (!name || !price || !stock) {
        db.all(`SELECT * FROM products WHERE owner_id = ? ORDER BY name`, [res.locals.user.id], (err, products) => {
            return res.render('seller', {
                user: res.locals.user,
                products: products || [],
                error: 'Name, price, and stock are required'
            });
        });
        return;
    }

    const productId = crypto.randomUUID();
    db.run(
        `INSERT INTO products (id, owner_id, name, price, stock, image_storage_path) VALUES (?, ?, ?, ?, ?, ?)`,
        [productId, res.locals.user.id, name, price, stock, '/uploads/' + req.file.filename],
        function (err) {
            if (err) {
                db.all(`SELECT * FROM products WHERE owner_id = ? ORDER BY name`, [res.locals.user.id], (err2, products) => {
                    return res.render('seller', {
                        user: res.locals.user,
                        products: products || [],
                        error: err.message
                    });
                });
                return;
            }
            res.redirect('/seller');
        }
    );
});

router.put('/products/:id', upload.single('image'), (req, res) => {
    if (!res.locals.user || res.locals.user.type !== 'seller') {
        return res.redirect('/login');
    }
    const productId = req.params.id;
    const { name, price, stock } = req.body;

    db.get(`SELECT * FROM products WHERE id = ? AND owner_id = ?`, [productId, res.locals.user.id], (err, product) => {
        if (err || !product) {
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

        db.run(query, params, function (err) {
            res.redirect('/seller');
        });
    });
});

router.delete('/products/:id', (req, res) => {
    if (!res.locals.user || res.locals.user.type !== 'seller') {
        return res.redirect('/login');
    }
    const productId = req.params.id;

    db.get(`SELECT * FROM products WHERE id = ? AND owner_id = ?`, [productId, res.locals.user.id], (err, product) => {
        if (err || !product) {
            return res.redirect('/seller');
        }

        db.run(`DELETE FROM products WHERE id = ? AND owner_id = ?`, [productId, res.locals.user.id], function (err) {
            res.redirect('/seller');
        });
    });
});

module.exports = router;
