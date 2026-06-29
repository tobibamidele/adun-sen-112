const db = require('../db');

module.exports = async (req, res, next) => {
    const access_token = req.cookies.access_token;
    if (!access_token) {
        res.locals.user = null;
        return next();
    }

    try {
        const [tokenRows] = await db.execute(
            `SELECT * FROM security_tokens WHERE access_token = ?`,
            [access_token]
        );
        const token = tokenRows[0];

        if (!token || token.revoked) {
            res.locals.user = null;
            return next();
        }

        const [userRows] = await db.execute(
            `SELECT id, email, type FROM users WHERE id = ?`,
            [token.user_id]
        );
        res.locals.user = userRows[0] || null;
        next();
    } catch (err) {
        res.locals.user = null;
        next();
    }
};
