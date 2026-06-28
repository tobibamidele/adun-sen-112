const db = require('../db');

module.exports = (req, res, next) => {
    const access_token = req.cookies.access_token;
    if (!access_token) {
        res.locals.user = null;
        return next();
    }

    db.get(
        `SELECT * FROM security_tokens WHERE access_token = ?`,
        [access_token],
        (err, token) => {
            if (err || !token || token.revoked) {
                res.locals.user = null;
                return next();
            }

            db.get(
                `SELECT id, email, type FROM users WHERE id = ?`,
                [token.user_id],
                (err, user) => {
                    res.locals.user = user || null;
                    next();
                }
            );
        }
    );
};
