const db = require('../db');

module.exports = (req, res, next) => {
    const access_token = req.cookies.access_token;
    db.get(
        `SELECT * FROM security_tokens WHERE access_token = ?`,
        [access_token],
        (err, token) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({
                    success: false,
                    message: "Something went wrong",
                });
            }

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }

            if (token.revoked) {
                return res.status(401).json({
                    success: false,
                    message: "Expired or invalid token",
                });
            }

            res.locals.userId = token.user_id;

            db.get(
                `SELECT type FROM users WHERE id = ?`, 
                [token.user_id],
                (err, row) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Something went wrong"
                        });
                    }

                    res.locals.userType = row?.type;
                    next();
                }
            )
        }
    )
}
