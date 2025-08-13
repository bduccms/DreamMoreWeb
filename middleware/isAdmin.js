function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    } else {
        res.status(403).send('Access Denied: Admins only.');
    }
}

module.exports = isAdmin;
