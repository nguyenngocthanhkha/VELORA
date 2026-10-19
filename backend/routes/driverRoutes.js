const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// GET /api/drivers
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                driver_id,
                full_name,
                phone,
                license_number,
                status
            FROM drivers
            ORDER BY driver_id ASC
        `);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("GET /api/drivers error:", error);
        res.status(500).json({
            message: "Loi server khi lay danh sach tai xe"
        });
    }
});
// POST /api/drivers
router.post("/", async (req, res) => {
    try {
        const {
            full_name,
            phone,
            license_number,
            status
        } = req.body;

        // Kiem tra du lieu bat buoc
        if (!full_name || !phone || !license_number) {
            return res.status(400).json({
                message: "Vui long nhap day du thong tin tai xe"
            });
        }

        // Neu khong truyen status thi mac dinh la available
        const driverStatus = status || "available";

        const result = await pool.query(
            `
            INSERT INTO drivers
                (full_name, phone, license_number, status)
            VALUES
                ($1, $2, $3, $4)
            RETURNING
                driver_id,
                full_name,
                phone,
                license_number,
                status
            `,
            [
                full_name,
                phone,
                license_number,
                driverStatus
            ]
        );

        res.status(201).json({
            message: "Them tai xe thanh cong",
            driver: result.rows[0]
        });

    } catch (error) {
        console.error("POST /api/drivers error:", error);

        // Loi trung license_number
        if (error.code === "23505") {
            return res.status(400).json({
                message: "So bang lai da ton tai"
            });
        }

        res.status(500).json({
            message: "Loi server khi them tai xe"
        });
    }
});
// PATCH /api/drivers/:id
router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            full_name,
            phone,
            license_number,
            status
        } = req.body;

        const result = await pool.query(
            `
            UPDATE drivers
            SET
                full_name = COALESCE($1, full_name),
                phone = COALESCE($2, phone),
                license_number = COALESCE($3, license_number),
                status = COALESCE($4, status)
            WHERE driver_id = $5
            RETURNING
                driver_id,
                full_name,
                phone,
                license_number,
                status
            `,
            [
                full_name,
                phone,
                license_number,
                status,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Khong tim thay tai xe"
            });
        }

        res.status(200).json({
            message: "Cap nhat tai xe thanh cong",
            driver: result.rows[0]
        });

    } catch (error) {
        console.error("PATCH /api/drivers/:id error:", error);

        if (error.code === "23505") {
            return res.status(400).json({
                message: "So bang lai da ton tai"
            });
        }

        res.status(500).json({
            message: "Loi server khi cap nhat tai xe"
        });
    }
});
// DELETE /api/drivers/:id
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Kiem tra tai xe da duoc dung trong booking chua
        const bookingCheck = await pool.query(
            `
            SELECT booking_id
            FROM bookings
            WHERE driver_id = $1
            LIMIT 1
            `,
            [id]
        );

        if (bookingCheck.rows.length > 0) {
            return res.status(400).json({
                message: "Khong the xoa tai xe da duoc su dung trong booking"
            });
        }

        const result = await pool.query(
            `
            DELETE FROM drivers
            WHERE driver_id = $1
            RETURNING driver_id, full_name
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Khong tim thay tai xe"
            });
        }

        res.status(200).json({
            message: "Xoa tai xe thanh cong",
            driver: result.rows[0]
        });

    } catch (error) {
        console.error("DELETE /api/drivers/:id error:", error);

        res.status(500).json({
            message: "Loi server khi xoa tai xe"
        });
    }
});
module.exports = router;