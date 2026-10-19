const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// API lấy danh sách xe
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                v.vehicle_id,
                v.brand,
                v.model,
                v.year,
                v.license_plate,
                v.price_per_day,
                v.status,
                v.description,
                v.image_url,
                vt.type_name
            FROM vehicles v
            JOIN vehicle_types vt
                ON v.type_id = vt.type_id
            ORDER BY v.vehicle_id;
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Lỗi lấy danh sách xe:", error.message);
        res.status(500).json({
            message: "Không thể lấy danh sách xe"
        });
    }
});


// API lấy chi tiết một xe
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                v.vehicle_id,
                v.brand,
                v.model,
                v.year,
                v.license_plate,
                v.price_per_day,
                v.status,
                v.description,
                v.image_url,
                vt.type_name
            FROM vehicles v
            JOIN vehicle_types vt
                ON v.type_id = vt.type_id
            WHERE v.vehicle_id = $1;
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy xe"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error("Lỗi lấy chi tiết xe:", error.message);
        res.status(500).json({
            message: "Không thể lấy chi tiết xe"
        });
    }
});
// API thêm xe
router.post("/", async (req, res) => {
    try {
        const {
            type_id,
            brand,
            model,
            year,
            license_plate,
            price_per_day,
            status,
            description,
            image_url
        } = req.body;

        // Kiểm tra dữ liệu bắt buộc
        if (
            !type_id ||
            !brand ||
            !model ||
            !year ||
            !license_plate ||
            !price_per_day
        ) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ thông tin xe"
            });
        }

        // Kiểm tra loại xe có tồn tại không
        const typeCheck = await pool.query(
            "SELECT type_id FROM vehicle_types WHERE type_id = $1",
            [type_id]
        );

        if (typeCheck.rows.length === 0) {
            return res.status(400).json({
                message: "Loại xe không tồn tại"
            });
        }

        // Kiểm tra biển số đã tồn tại chưa
        const plateCheck = await pool.query(
            "SELECT vehicle_id FROM vehicles WHERE license_plate = $1",
            [license_plate]
        );

        if (plateCheck.rows.length > 0) {
            return res.status(400).json({
                message: "Biển số xe đã tồn tại"
            });
        }

        // Thêm xe
        const result = await pool.query(
            `
            INSERT INTO vehicles (
                type_id,
                brand,
                model,
                year,
                license_plate,
                price_per_day,
                status,
                description,
                image_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
            `,
            [
                type_id,
                brand,
                model,
                year,
                license_plate,
                price_per_day,
                status || "available",
                description || null,
                image_url || null
            ]
        );

        res.status(201).json({
            message: "Thêm xe thành công",
            vehicle: result.rows[0]
        });

    } catch (error) {
        console.error("Lỗi thêm xe:", error.message);

        res.status(500).json({
            message: "Không thể thêm xe"
        });
    }
});
// API cập nhật thông tin xe
router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            type_id,
            brand,
            model,
            year,
            license_plate,
            price_per_day,
            status,
            description,
            image_url
        } = req.body;

        // Kiểm tra xe có tồn tại không
        const vehicleCheck = await pool.query(
            "SELECT vehicle_id FROM vehicles WHERE vehicle_id = $1",
            [id]
        );

        if (vehicleCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy xe"
            });
        }

        // Kiểm tra loại xe nếu có truyền type_id
        if (type_id) {
            const typeCheck = await pool.query(
                "SELECT type_id FROM vehicle_types WHERE type_id = $1",
                [type_id]
            );

            if (typeCheck.rows.length === 0) {
                return res.status(400).json({
                    message: "Loại xe không tồn tại"
                });
            }
        }

        // Kiểm tra biển số trùng với xe khác
        if (license_plate) {
            const plateCheck = await pool.query(
                `
                SELECT vehicle_id
                FROM vehicles
                WHERE license_plate = $1
                AND vehicle_id <> $2
                `,
                [license_plate, id]
            );

            if (plateCheck.rows.length > 0) {
                return res.status(400).json({
                    message: "Biển số xe đã tồn tại"
                });
            }
        }

        const result = await pool.query(
            `
            UPDATE vehicles
            SET
                type_id = COALESCE($1, type_id),
                brand = COALESCE($2, brand),
                model = COALESCE($3, model),
                year = COALESCE($4, year),
                license_plate = COALESCE($5, license_plate),
                price_per_day = COALESCE($6, price_per_day),
                status = COALESCE($7, status),
                description = COALESCE($8, description),
                image_url = COALESCE($9, image_url)
            WHERE vehicle_id = $10
            RETURNING *;
            `,
            [
                type_id,
                brand,
                model,
                year,
                license_plate,
                price_per_day,
                status,
                description,
                image_url,
                id
            ]
        );

        res.json({
            message: "Cập nhật xe thành công",
            vehicle: result.rows[0]
        });

    } catch (error) {
        console.error("Lỗi cập nhật xe:", error.message);

        res.status(500).json({
            message: "Không thể cập nhật xe"
        });
    }
});
// API xoa xe
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Kiem tra xe co ton tai khong
        const vehicleCheck = await pool.query(
            "SELECT vehicle_id FROM vehicles WHERE vehicle_id = $1",
            [id]
        );

        if (vehicleCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Khong tim thay xe"
            });
        }

        // Kiem tra xe da co don thue chua
        const bookingCheck = await pool.query(
            "SELECT booking_id FROM bookings WHERE vehicle_id = $1 LIMIT 1",
            [id]
        );

        if (bookingCheck.rows.length > 0) {
            return res.status(400).json({
                message: "Khong the xoa xe vi xe da co don thue"
            });
        }

        // Xoa xe
        await pool.query(
            "DELETE FROM vehicles WHERE vehicle_id = $1",
            [id]
        );

        res.json({
            message: "Xoa xe thanh cong"
        });

    } catch (error) {
        console.error("Loi xoa xe:", error.message);

        res.status(500).json({
            message: "Khong the xoa xe"
        });
    }
});

module.exports = router;