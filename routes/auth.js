const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

router.post('/register', (req, res) => {
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

    db.run(
        `INSERT INTO users (email, password, type) VALUES (?, ?, ?)`,
        [email, hashedPw, type],
        function (err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.render('register', {
                        user: null,
                        error: 'User already exists'
                    });
                }
                return res.render('register', {
                    user: null,
                    error: err.message
                });
            }

            res.redirect('/login');
        }
    );
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render('login', {
            user: null,
            error: 'Email and password are required'
        });
    }

    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err) {
            return res.render('login', {
                user: null,
                error: 'Something went wrong'
            });
        }

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

        createSecurityTokens(user.id).then(([accessToken, refreshToken]) => {
            res.cookie('access_token', accessToken, { maxAge: 24 * 60 * 60 * 1000 });
            res.cookie('refresh_token', refreshToken, { maxAge: 7 * 24 * 60 * 60 * 1000 });
            res.redirect('/');
        }).catch(() => {
            res.render('login', {
                user: null,
                error: 'Something went wrong'
            });
        });
    });
});

function createSecurityTokens(userId) {
    return new Promise((resolve, reject) => {
        const accessToken = crypto.randomUUID();
        const refreshToken = crypto.randomUUID();

        db.run(
            `INSERT INTO security_tokens
             (user_id, access_token, refresh_token)
             VALUES (?, ?, ?)`,
            [userId, accessToken, refreshToken],
            function (err) {
                if (err) return reject(err);
                resolve([accessToken, refreshToken]);
            }
        );
    });
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
