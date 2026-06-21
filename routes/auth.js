const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

router.post('/register', (req, res) => {
    const { email, password, type } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    if (!type) {
        return res.status(400).json({
            success: false,
            message: "User type is required",
        });
    }

    const hashedPw = crypto.createHash('sha256').update(password.trim()).digest('hex');

    db.run(
        `INSERT INTO users (email, password, type) VALUES (?, ?, ?)`,
        [email, hashedPw, type],
        function (err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({
                        success: false,
                        message: 'User already exists'
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(201).json({
                success: true,
                userId: this.lastID
            });
        }
    );
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    db.get(
        `SELECT * FROM users WHERE email = ?`,
        [email],
        async (err, user) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({
                    success: false,
                    message: "Something went wrong",
                });
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Incorrect email or password",
                })
            }

            const hashedPw = crypto.createHash('sha256').update(password.trim()).digest('hex');
            if (user.password !== hashedPw) {
                return res.status(401).json({
                    success: false,
                    message: "Incorrect email or password",
                });
            }

            const [ accessToken, refreshToken ] = await createSecurityTokens(user.id);
            res.cookie('access_token', accessToken, { maxAge: 24 * 60 * 60 * 1000 });
            res.cookie('refresh_token', refreshToken, { maxAge: 7 * 24 * 60 * 60 * 1000 });
            res.json({
                success: true,
                accessToken,
                refreshToken,
                user: { id: user.id, email: user.email, type: user.type },
                message: "Logged in successfully",
            });
        }
    )
})

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
                if (err) {
                    return reject(err);
                }

                resolve([accessToken, refreshToken]);
            }
        );
    });
}

router.get('/me', (req, res) => {
    const access_token = req.cookies.access_token;
    if (!access_token) {
        return res.json({ success: false, user: null });
    }

    db.get(`SELECT * FROM security_tokens WHERE access_token = ?`, [access_token], (err, token) => {
        if (err || !token || token.revoked) {
            return res.json({ success: false, user: null });
        }

        db.get(`SELECT id, email, type FROM users WHERE id = ?`, [token.user_id], (err, user) => {
            if (err || !user) {
                return res.json({ success: false, user: null });
            }
            res.json({ success: true, user });
        });
    });
});

router.post('/logout', (req, res) => {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.json({ success: true, message: "Logged out" });
});

module.exports = router;
