const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

router.post('/register', async (req, res) => {
    const { email, password, type } = req.body;

    if (!email || !password) {
        return res.render('register', {
            user: null,
            error: 'Email and password are required'
        });
    }

    if (!type) {
        return res.render('register', {
            user: null,
            error: 'Account type is required'
        });
    }

    const hashedPw = crypto.createHash('sha256').update(password.trim()).digest('hex');

    try {
        await db.execute(
            `INSERT INTO users (email, password, type) VALUES (?, ?, ?)`,
            [email, hashedPw, type]
        );
        res.redirect('/login');
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.render('register', {
                user: null,
                error: 'User already exists'
            });
        }
        res.render('register', {
            user: null,
            error: err.message
        });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render('login', {
            user: null,
            error: 'Email and password are required'
        });
    }

    try {
        const [rows] = await db.execute(`SELECT * FROM users WHERE email = ?`, [email]);
        const user = rows[0];

        if (!user) {
            return res.render('login', {
                user: null,
                error: 'Incorrect email or password'
            });
        }

        const hashedPw = crypto.createHash('sha256').update(password.trim()).digest('hex');
        if (user.password !== hashedPw) {
            return res.render('login', {
                user: null,
                error: 'Incorrect email or password'
            });
        }

        const [accessToken, refreshToken] = await createSecurityTokens(user.id);
        res.cookie('access_token', accessToken, { maxAge: 24 * 60 * 60 * 1000 });
        res.cookie('refresh_token', refreshToken, { maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.redirect('/');
    } catch (err) {
        res.render('login', {
            user: null,
            error: 'Something went wrong'
        });
    }
});

async function createSecurityTokens(userId) {
    const accessToken = crypto.randomUUID();
    const refreshToken = crypto.randomUUID();

    await db.execute(
        `INSERT INTO security_tokens (user_id, access_token, refresh_token) VALUES (?, ?, ?)`,
        [userId, accessToken, refreshToken]
    );

    return [accessToken, refreshToken];
}

router.get('/logout', (req, res) => {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.redirect('/');
});

router.get('/me', (req, res) => {
    if (res.locals.user) {
        return res.json({ success: true, user: res.locals.user });
    }
    res.json({ success: false, user: null });
});

module.exports = router;
