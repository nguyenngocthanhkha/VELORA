const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// API lay danh sach loai xe
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                type_id,
                type_name,
                description
            FROM vehicle_types
            ORDER BY type_id;
        `);

        res.json(result.rows);

    } catch (error) {
        console.error("Loi lay danh sach loai xe:", error.message);

        res.status(500).json({
            message: "Khong the lay danh sach loai xe"
        });
    }
});
// API them loai xe
router.post("/", async (req, res) => {
    try {
        const { type_name, description } = req.body;

        // Kiem tra ten loai xe
        if (!type_name) {
            return res.status(400).json({
                message: "Vui long nhap ten loai xe"
            });
        }

        // Kiem tra loai xe da ton tai
        const typeCheck = await pool.query(
            "SELECT type_id FROM vehicle_types WHERE type_name = $1",
            [type_name]
        );

        if (typeCheck.rows.length > 0) {
            return res.status(400).json({
                message: "Loai xe da ton tai"
            });
        }

        // Them loai xe
        const result = await pool.query(
            `
            INSERT INTO vehicle_types (
                type_name,
                description
            )
            VALUES ($1, $2)
            RETURNING *;
            `,
            [
                type_name,
                description || null
            ]
        );

        res.status(201).json({
            message: "Them loai xe thanh cong",
            vehicleType: result.rows[0]
        });

    } catch (error) {
        console.error("Loi them loai xe:", error.message);

        res.status(500).json({
            message: "Khong the them loai xe"
        });
    }
});
// API sua loai xe
router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { type_name, description } = req.body;

        // Kiem tra loai xe co ton tai khong
        const typeCheck = await pool.query(
            "SELECT type_id FROM vehicle_types WHERE type_id = $1",
            [id]
        );

        if (typeCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Khong tim thay loai xe"
            });
        }

        // Kiem tra ten moi co bi trung khong
        if (type_name) {
            const nameCheck = await pool.query(
                `
                SELECT type_id
                FROM vehicle_types
                WHERE type_name = $1
                AND type_id <> $2
                `,
                [type_name, id]
            );

            if (nameCheck.rows.length > 0) {
                return res.status(400).json({
                    message: "Ten loai xe da ton tai"
                });
            }
        }

        // Cap nhat loai xe
        const result = await pool.query(
            `
            UPDATE vehicle_types
            SET
                type_name = COALESCE($1, type_name),
                description = COALESCE($2, description)
            WHERE type_id = $3
            RETURNING *;
            `,
            [type_name, description, id]
        );

        res.json({
            message: "Cap nhat loai xe thanh cong",
            vehicleType: result.rows[0]
        });

    } catch (error) {
        console.error("Loi cap nhat loai xe:", error.message);

        res.status(500).json({
            message: "Khong the cap nhat loai xe"
        });
    }
});
// API xoa loai xe
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Kiem tra loai xe co ton tai khong
        const typeCheck = await pool.query(
            "SELECT type_id FROM vehicle_types WHERE type_id = $1",
            [id]
        );

        if (typeCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Khong tim thay loai xe"
            });
        }

        // Kiem tra loai xe da duoc su dung cho xe chua
        const vehicleCheck = await pool.query(
            "SELECT vehicle_id FROM vehicles WHERE type_id = $1 LIMIT 1",
            [id]
        );

        if (vehicleCheck.rows.length > 0) {
            return res.status(400).json({
                message: "Khong the xoa loai xe vi dang co xe su dung"
            });
        }

        // Xoa loai xe
        await pool.query(
            "DELETE FROM vehicle_types WHERE type_id = $1",
            [id]
        );

        res.json({
            message: "Xoa loai xe thanh cong"
        });

    } catch (error) {
        console.error("Loi xoa loai xe:", error.message);

        res.status(500).json({
            message: "Khong the xoa loai xe"
        });
    }
});
module.exports = router;