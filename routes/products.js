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

router.get('/:id/list', async (req, res) => {
    if (res.locals.userType !== 'seller') {
        res.status(403).json({
            success: false,
            message: "Not a seller",
        })
    }

    if (res.locals.userId !== req.params.id) {
        res.status(403).json({
            success: false,
            message: "Forbidden",
        })
    }

    const id = req.params.id
    db.get(
        `SELECT * FROM products WHERE id = ?`,
        [id],
        async (err, products) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({
                    success: false,
                    message: "Something went wrong",
                });
            }

            if (!products) {
                return res.status(404).json({
                    success: false,
                    message: "no product found",
                });
            }

            return res.json(products);
        }
    )
})

router.put('/:id/create', upload.single('image'), (req, res) => {
    if (res.locals.userId !== req.params.id || res.locals.userType !== 'seller') {
        return res.status(403).json({
            success: false,
            message: "Forbidden",
        });
    }

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No image file uploaded",
        });
    }

    const { name, price, stock } = req.body;

    if (!name || !price || ! stock) {
        return res.status(400).json({
            success: false,
            message: "One of these is required: (name, price, stock)"
        });
    }

    const productId = crypto.randomUUID().toString();

    db.run(
        `INSERT INTO 
            products (id, owner_id, name, price, stock, image_storage_path) 
            VALUES (?, ?, ?, ?, ?, ?)
        `,
        [productId, req.params.id, name, price, stock, '/uploads/' + req.file.filename],
        (err) => {
            if (err) {
                console.log(err.message);
                return res.status(500).json({
                    success: false,
                    message: err.message,
                });
            }

            return res.status(201).json({
                success: true,
                productId: this.lastID,
                message: `Product ${name} created successfully`,
                imageUrl: '/uploads/' + req.file.filename,
            });
        }
    )
})

module.exports = router;
