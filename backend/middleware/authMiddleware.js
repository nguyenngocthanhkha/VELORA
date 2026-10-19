
const jwt = require("jsonwebtoken");

// Lay khoa JWT tu file .env
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware kiem tra dang nhap
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Kiem tra Authorization header
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Vui long dang nhap"
            });
        }

        // Lay JWT
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Token khong hop le"
            });
        }

        // Xac minh JWT
        const decoded = jwt.verify(token, JWT_SECRET);

        // Luu thong tin nguoi dung
        req.user = decoded;

        next();

    } catch (error) {
        console.error("JWT ERROR:", error.name);

        return res.status(401).json({
            message: "Token khong hop le hoac da het han"
        });
    }
};

module.exports = verifyToken;
