const express = require ("express");
const router = express.Router();
const pool = require("../config/database");

//API tạo thanh toán 
router.post("/", async (req,res)=>{
    try{
        const{
            booking_id,
            amount,
            payment_method,
        } = req.body;
        
        if (payment_method === "vnpay") {
            return res.status(400).json({
                message: "Vui lòng thanh toán VNPay qua cổng Sandbox"
            });
        }

        // Kiểm tra dữ liệu bắt buộc 
        if(! booking_id || ! amount || ! payment_method){
            return res.status(400).json({
                message:"vui lòng nhập đầy đủ thông tin thanh toán"
        });
        }

        // Kiểm tra booking có tồn tại không 
          const bookingResult = await pool.query(
            `SELECT booking_id, total_amount, deposit_amount, status
             FROM bookings
             WHERE booking_id = $1`,
            [booking_id]
        );
        if (bookingResult.rows.length === 0){
            return res.status(404).json({
                message:"booking không tồn tại"
            });
        }
        const booking = bookingResult.rows[0];
        
        // không cho thanh toán booking đã hủy
         if (booking.status === "cancelled") {
            return res.status(400).json({
                message: "Không thể thanh toán booking đã bị hủy"
            });
        }
        // Kiểm tra số tiền thanh toán phải đúng tiền cọc
        if (Number(amount) !== Number(booking.deposit_amount)) {
            return res.status(400).json({
                message: `Số tiền cọc phải là ${booking.deposit_amount}`
            });
        }
        // Tạo payment
        const result = await pool.query(
            `INSERT INTO payments
                (booking_id, amount, payment_method, payment_status, paid_at)
             VALUES ($1, $2, $3, 'paid', CURRENT_TIMESTAMP)
             RETURNING *`,
            [booking_id, amount, payment_method]
        );
        
        // Cập nhật trạng thái booking
        await pool.query(
            `UPDATE bookings
             SET status = 'confirmed',
                 deposit_status = 'paid'
             WHERE booking_id = $1`,
            [booking_id]
        );
        res.status(201).json({
            message: "Thanh toán tiền cọc thành công",
            payment: result.rows[0]
        });

    } catch (error) {
        console.error("Lỗi thanh toán:", error.message);

        res.status(500).json({
            message: "Không thể thanh toán"
        });
    }
});
// API lấy danh sách thanh toán
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                p.payment_id,
                p.booking_id,
                b.user_id,
                u.full_name,
                b.vehicle_id,
                v.brand,
                v.model,
                p.amount,
                p.payment_method,
                p.payment_status,
                p.paid_at
            FROM payments p
            JOIN bookings b
                ON p.booking_id = b.booking_id
            JOIN users u
                ON b.user_id = u.user_id
            JOIN vehicles v
                ON b.vehicle_id = v.vehicle_id
            ORDER BY p.payment_id DESC
        `);

        res.status(200).json({
            message: "Lấy danh sách thanh toán thành công",
            payments: result.rows
        });

    } catch (error) {
        console.error("Lỗi lấy danh sách thanh toán:", error.message);

        res.status(500).json({
            message: "Không thể lấy danh sách thanh toán"
        });
    }
});
// API xem chi tiết thanh toán
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT
                p.payment_id,
                p.booking_id,
                b.user_id,
                u.full_name,
                u.email,
                u.phone,
                b.vehicle_id,
                v.brand,
                v.model,
                v.license_plate,
                b.start_date,
                b.end_date,
                p.amount,
                p.payment_method,
                p.payment_status,
                p.paid_at
             FROM payments p
             JOIN bookings b
                ON p.booking_id = b.booking_id
             JOIN users u
                ON b.user_id = u.user_id
             JOIN vehicles v
                ON b.vehicle_id = v.vehicle_id
             WHERE p.payment_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy thanh toán"
            });
        }

        res.status(200).json({
            message: "Lấy chi tiết thanh toán thành công",
            payment: result.rows[0]
        });

    } catch (error) {
        console.error("Lỗi lấy chi tiết thanh toán:", error.message);

        res.status(500).json({
            message: "Không thể lấy chi tiết thanh toán"
        });
    }
});
module.exports = router;