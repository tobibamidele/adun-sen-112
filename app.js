const express = require('express');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const path = require('path');
const dotenv = require('dotenv').config();

const pagesRoutes = require('./routes/pages');
const authRoutes = require('./routes/auth');
const publicRoutes = require('./routes/public');
const orderRoutes = require('./routes/orders');
const sellerRoutes = require('./routes/seller');
const loadUser = require('./middleware/loadUser');

const PORT = process.env.PORT || 3000;

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());

app.use('/', (req, _, next) => {
    console.log(`[REQUEST_LOGGER] Incoming ${req.method} request to ${req.url}`);
    next();
});

app.use(loadUser);
app.use('/', pagesRoutes);
app.use('/auth', authRoutes);
app.use('/api', publicRoutes);
app.use('/', orderRoutes);
app.use('/seller', sellerRoutes);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
    console.log(`[+] Server up and running at ${PORT}`);
});
