module.exports = (req, res, next) => {
    if (!res.locals.user) {
        return res.redirect('/login');
    }
    if (res.locals.user.type !== 'seller') {
        return res.redirect('/');
    }
    next();
};
