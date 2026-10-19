const checkAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Chua xac thuc nguoi dung"
        });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Ban khong co quyen Admin"
        });
    }

    next();
};

module.exports = checkAdmin;