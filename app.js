const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const publicRoutes = require('./routes/public');
const orderRoutes = require('./routes/orders');
const sellerRoutes = require('./routes/seller');
const authMiddleware = require('./middleware/auth');

const PORT = 3000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/', (req, _, next) => {
    console.log(`[REQUEST_LOGGER] Incoming ${req.method} request to ${req.url}`);
    next();
});

app.use('/auth', authRoutes);
app.use('/p', authMiddleware, productRoutes);
app.use('/api', publicRoutes);
app.use('/api', authMiddleware, orderRoutes);
app.use('/api', authMiddleware, sellerRoutes);

app.listen(PORT, () => {
    console.log(`[+] Server up and running at ${PORT}`);
});
