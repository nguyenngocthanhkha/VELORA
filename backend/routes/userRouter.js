const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const jwt = require("jsonwebtoken");

const authMiddleware = require("../middleware/authMiddleware");
const checkAdmin = require("../middleware/adminMiddleware");

const JWT_SECRET = process.env.JWT_SECRET;

// REGISTER

// API dang ky tai khoan
router.post("/register", async (req, res) => {
    try {
        const { full_name, email, password, phone } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({
                message: "Vui long nhap day du ho ten, email va mat khau"
            });
        }

        const existingUser = await pool.query(
            "SELECT user_id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                message: "Email da duoc su dung"
            });
        }

        const result = await pool.query(
            `INSERT INTO users
            (full_name, email, password, phone)
            VALUES ($1, $2, $3, $4)
            RETURNING user_id, full_name, email, phone, role, status`,
            [full_name, email, password, phone]
        );

        res.status(201).json({
            message: "Dang ky tai khoan thanh cong",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Loi dang ky:", error.message);

        res.status(500).json({
            message: "Khong the dang ky tai khoan"
        });
    }
});



// LOGIN


// API dang nhap
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Vui long nhap email va mat khau"
            });
        }

        const result = await pool.query(
            `SELECT
                user_id,
                full_name,
                email,
                password,
                phone,
                role,
                status
             FROM users
             WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Email hoac mat khau khong dung"
            });
        }

        const user = result.rows[0];

        if (user.password !== password) {
            return res.status(401).json({
                message: "Email hoac mat khau khong dung"
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                message: "Tai khoan da bi khoa"
            });
        }

        // Tao JWT token
        const token = jwt.sign(
            {
                user_id: user.user_id,
                role: user.role
            },
            JWT_SECRET,
            {
                expiresIn: "2h"
            }
        );

        res.status(200).json({
            message: "Dang nhap thanh cong",
            token: token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {
        console.error("Loi dang nhap:", error.message);

        res.status(500).json({
            message: "Khong the dang nhap"
        });
    }
});



// GET ALL USERS - ADMIN


// API lay danh sach nguoi dung
router.get(
    "/",
    authMiddleware,
    checkAdmin,
    async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT
                    user_id,
                    full_name,
                    email,
                    phone,
                    role,
                    status,
                    created_at
                FROM users
                ORDER BY user_id;
            `);

            res.json(result.rows);

        } catch (error) {
            console.error(
                "Loi lay danh sach nguoi dung:",
                error.message
            );

            res.status(500).json({
                message: "Khong the lay danh sach nguoi dung"
            });
        }
    }
);



// GET USER DETAIL - ADMIN


// API lay chi tiet nguoi dung
router.get(
    "/:id",
    authMiddleware,
    checkAdmin,
    async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                `SELECT
                    user_id,
                    full_name,
                    email,
                    phone,
                    role,
                    status,
                    created_at
                 FROM users
                 WHERE user_id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: "Khong tim thay nguoi dung"
                });
            }

            res.json(result.rows[0]);

        } catch (error) {
            console.error(
                "Loi lay chi tiet nguoi dung:",
                error.message
            );

            res.status(500).json({
                message: "Khong the lay chi tiet nguoi dung"
            });
        }
    }
);



// UPDATE USER - ADMIN

// API cap nhat thong tin nguoi dung
router.patch(
    "/:id",
    authMiddleware,
    checkAdmin,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { full_name, email, phone } = req.body;

            const checkUser = await pool.query(
                "SELECT user_id FROM users WHERE user_id = $1",
                [id]
            );

            if (checkUser.rows.length === 0) {
                return res.status(404).json({
                    message: "Khong tim thay nguoi dung"
                });
            }

            if (email) {
                const checkEmail = await pool.query(
                    `SELECT user_id
                     FROM users
                     WHERE email = $1
                     AND user_id <> $2`,
                    [email, id]
                );

                if (checkEmail.rows.length > 0) {
                    return res.status(400).json({
                        message: "Email da duoc su dung"
                    });
                }
            }

            const result = await pool.query(
                `UPDATE users
                 SET
                    full_name = COALESCE($1, full_name),
                    email = COALESCE($2, email),
                    phone = COALESCE($3, phone)
                 WHERE user_id = $4
                 RETURNING
                    user_id,
                    full_name,
                    email,
                    phone,
                    role,
                    status`,
                [full_name, email, phone, id]
            );

            res.json({
                message: "Cap nhat nguoi dung thanh cong",
                user: result.rows[0]
            });

        } catch (error) {
            console.error(
                "Loi cap nhat nguoi dung:",
                error.message
            );

            res.status(500).json({
                message: "Khong the cap nhat nguoi dung"
            });
        }
    }
);



// BLOCK / UNBLOCK USER - ADMIN

// API khoa / mo khoa tai khoan
router.patch(
    "/:id/status",
    authMiddleware,
    checkAdmin,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status || !["active", "blocked"].includes(status)) {
                return res.status(400).json({
                    message: "Status phai la active hoac blocked"
                });
            }

            const checkUser = await pool.query(
                "SELECT user_id FROM users WHERE user_id = $1",
                [id]
            );

            if (checkUser.rows.length === 0) {
                return res.status(404).json({
                    message: "Khong tim thay nguoi dung"
                });
            }

            const result = await pool.query(
                `UPDATE users
                 SET status = $1
                 WHERE user_id = $2
                 RETURNING
                    user_id,
                    full_name,
                    email,
                    phone,
                    role,
                    status`,
                [status, id]
            );

            res.json({
                message: status === "blocked"
                    ? "Khoa tai khoan thanh cong"
                    : "Mo khoa tai khoan thanh cong",

                user: result.rows[0]
            });

        } catch (error) {
            console.error(
                "Loi cap nhat trang thai:",
                error.message
            );

            res.status(500).json({
                message: "Khong the cap nhat trang thai tai khoan"
            });
        }
    }
);


module.exports = router;