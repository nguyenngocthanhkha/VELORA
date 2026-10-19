const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// API thêm đánh giá
router.post("/", async (req, res) => {
    try {
        const {
            user_id,
            vehicle_id,
            booking_id,
            rating,
            comment
        } = req.body;

        // Kiểm tra dữ liệu bắt buộc
        if (!user_id || !vehicle_id || !booking_id || !rating) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ thông tin đánh giá"
            });
        }

        // Kiểm tra rating từ 1 đến 5
        if (Number(rating) < 1 || Number(rating) > 5) {
            return res.status(400).json({
                message: "Đánh giá phải từ 1 đến 5 sao"
            });
        }

        // Kiểm tra booking có tồn tại và thuộc đúng user, đúng xe không
        const bookingResult = await pool.query(
            `SELECT booking_id, user_id, vehicle_id, status
             FROM bookings
             WHERE booking_id = $1`,
            [booking_id]
        );

        if (bookingResult.rows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy booking"
            });
        }

        const booking = bookingResult.rows[0];

        // Kiểm tra booking có đúng user không
        if (Number(booking.user_id) !== Number(user_id)) {
            return res.status(400).json({
                message: "Booking không thuộc về người dùng này"
            });
        }

        // Kiểm tra booking có đúng xe không
        if (Number(booking.vehicle_id) !== Number(vehicle_id)) {
            return res.status(400).json({
                message: "Xe không khớp với booking"
            });
        }

        // Chỉ booking đã hoàn thành mới được đánh giá
        if (booking.status !== "completed") {
            return res.status(400).json({
                message: "Chỉ có thể đánh giá sau khi đã trả xe"
            });
        }

        // Kiểm tra booking đã được đánh giá chưa
        const reviewCheck = await pool.query(
            `SELECT review_id
             FROM reviews
             WHERE booking_id = $1`,
            [booking_id]
        );

        if (reviewCheck.rows.length > 0) {
            return res.status(400).json({
                message: "Booking này đã được đánh giá trước đó"
            });
        }

        // Thêm đánh giá
        const result = await pool.query(
            `INSERT INTO reviews
                (user_id, vehicle_id, booking_id, rating, comment)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                user_id,
                vehicle_id,
                booking_id,
                rating,
                comment || null
            ]
        );

        res.status(201).json({
            message: "Đánh giá xe thành công",
            review: result.rows[0]
        });

    } catch (error) {
        console.error("Lỗi thêm đánh giá:", error.message);

        res.status(500).json({
            message: "Không thể thêm đánh giá"
        });
    }
});
// API lấy danh sách đánh giá
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                r.review_id,
                r.user_id,
                u.full_name,
                r.vehicle_id,
                v.brand,
                v.model,
                r.booking_id,
                r.rating,
                r.comment,
                r.created_at
             FROM reviews r
             JOIN users u ON r.user_id = u.user_id
             JOIN vehicles v ON r.vehicle_id = v.vehicle_id
             ORDER BY r.created_at DESC`
        );

        res.status(200).json({
            message: "Lấy danh sách đánh giá thành công",
            reviews: result.rows
        });

    } catch (error) {
        console.error("Lỗi lấy danh sách đánh giá:", error.message);

        res.status(500).json({
            message: "Không thể lấy danh sách đánh giá"
        });
    }
});
// API lấy danh sách đánh giá theo xe
router.get("/vehicle/:vehicle_id", async (req, res) => {
    try {
        const { vehicle_id } = req.params;

        const result = await pool.query(
            `SELECT 
                r.review_id,
                r.user_id,
                u.full_name,
                r.vehicle_id,
                v.brand,
                v.model,
                r.booking_id,
                r.rating,
                r.comment,
                r.created_at
             FROM reviews r
             JOIN users u ON r.user_id = u.user_id
             JOIN vehicles v ON r.vehicle_id = v.vehicle_id
             WHERE r.vehicle_id = $1
             ORDER BY r.created_at DESC`,
            [vehicle_id]
        );

        res.status(200).json({
            message: "Lấy danh sách đánh giá theo xe thành công",
            reviews: result.rows
        });

    } catch (error) {
        console.error("Lỗi lấy đánh giá theo xe:", error.message);

        res.status(500).json({
            message: "Không thể lấy danh sách đánh giá theo xe"
        });
    }
});

// API xóa đánh giá
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const reviewCheck = await pool.query(
            `SELECT review_id
             FROM reviews
             WHERE review_id = $1`,
            [id]
        );

        if (reviewCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy đánh giá"
            });
        }

        await pool.query(
            `DELETE FROM reviews
             WHERE review_id = $1`,
            [id]
        );

        res.status(200).json({
            message: "Xóa đánh giá thành công"
        });

    } catch (error) {
        console.error("Lỗi xóa đánh giá:", error.message);

        res.status(500).json({
            message: "Không thể xóa đánh giá"
        });
    }
});

module.exports = router;
