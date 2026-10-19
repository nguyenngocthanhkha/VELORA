const express = require("express");
const router = express.Router();
const pool = require("../config/database");


// API 1: TAO BOOKING
// POST /api/bookings

router.post("/", async (req, res) => {
    try {
        const {
            user_id,
            vehicle_id,
            start_date,
            end_date,
            rental_type = "self-drive",
            driver_id
        } = req.body;

        // Kiem tra du lieu bat buoc
        if (!user_id || !vehicle_id || !start_date || !end_date) {
            return res.status(400).json({
                message: "Vui long nhap day du thong tin dat xe"
            });
        }

        // Kiem tra hinh thuc thue
        if (
            rental_type !== "self-drive" &&
            rental_type !== "with-driver"
        ) {
            return res.status(400).json({
                message: "Hinh thuc thue khong hop le"
            });
        }

        // Kiem tra ngay thue
        if (new Date(end_date) < new Date(start_date)) {
            return res.status(400).json({
                message: "Ngay ket thuc phai sau hoac bang ngay bat dau"
            });
        }

        // KIEM TRA XE

        const vehicleResult = await pool.query(
            `
            SELECT vehicle_id, price_per_day, status
            FROM vehicles
            WHERE vehicle_id = $1
            `,
            [vehicle_id]
        );

        if (vehicleResult.rows.length === 0) {
            return res.status(404).json({
                message: "Khong tim thay xe"
            });
        }

        const vehicle = vehicleResult.rows[0];

        // Kiem tra xe co dang hoat dong khong
        if (vehicle.status !== "available") {
            return res.status(400).json({
                message: "Xe hien khong kha dung"
            });
        }

   
        // KIEM TRA LICH XE
     
        const overlapResult = await pool.query(
            `
            SELECT booking_id
            FROM bookings
            WHERE vehicle_id = $1
            AND status IN ('pending', 'confirmed')
            AND start_date <= $3
            AND end_date >= $2
            `,
            [vehicle_id, start_date, end_date]
        );

        if (overlapResult.rows.length > 0) {
            return res.status(400).json({
                message: "Xe da duoc dat trong khoang thoi gian nay"
            });
        }

      
        // KIEM TRA TAI XE
        // Chi kiem tra khi rental_type = with-driver
    
        if (rental_type === "with-driver") {

            // Bat buoc phai co driver_id
            if (!driver_id) {
                return res.status(400).json({
                    message: "Vui long chon tai xe"
                });
            }

            // Kiem tra tai xe co ton tai khong
            const driverResult = await pool.query(
                `
                SELECT driver_id, full_name, status
                FROM drivers
                WHERE driver_id = $1
                `,
                [driver_id]
            );

            if (driverResult.rows.length === 0) {
                return res.status(404).json({
                    message: "Khong tim thay tai xe"
                });
            }

            const driver = driverResult.rows[0];

            // Kiem tra tai xe co dang san sang khong
            if (driver.status !== "available") {
                return res.status(400).json({
                    message: "Tai xe hien khong kha dung"
                });
            }

            // Kiem tra tai xe co bi trung lich khong
            const driverOverlapResult = await pool.query(
                `
                SELECT booking_id
                FROM bookings
                WHERE driver_id = $1
                AND status IN ('pending', 'confirmed')
                AND start_date <= $3
                AND end_date >= $2
                `,
                [driver_id, start_date, end_date]
            );

            if (driverOverlapResult.rows.length > 0) {
                return res.status(400).json({
                    message: "Tai xe da duoc dat trong khoang thoi gian nay"
                });
            }
        }

    
        // TINH SO NGAY VA TIEN
       
        const start = new Date(start_date);
        const end = new Date(end_date);

        const numberOfDays =
            Math.floor(
                (end - start) /
                (1000 * 60 * 60 * 24)
            ) + 1;

        // Tien thue xe truoc phi tai xe
        const baseAmount =
              numberOfDays * Number(vehicle.price_per_day);

        // Phi tai xe = 20% neu thue xe co tai xe
        const driverFee =
              rental_type === "with-driver"
              ? baseAmount * 0.2
              : 0;

        // Tong tien bao gom phi tai xe
        const totalAmount = baseAmount + driverFee;

        // Tien coc = 30% tong tien
        const depositAmount = totalAmount * 0.3;

        // TAO BOOKING
        
        const result = await pool.query(
            `
            INSERT INTO bookings
            (
                user_id,
                vehicle_id,
                start_date,
                end_date,
                total_amount,
                rental_type,
                driver_id,
                deposit_amount,
                deposit_status,
                status
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                'pending',
                'pending'
            )
            RETURNING *
            `,
            [
                user_id,
                vehicle_id,
                start_date,
                end_date,
                totalAmount,
                rental_type,
                driver_id || null,
                depositAmount
            ]
        );

        res.status(201).json({
            message: "Dat xe thanh cong",
            booking: result.rows[0]
        });

    } catch (error) {
        console.error("Loi dat booking:", error.message);

        res.status(500).json({
            message: "Khong the dat xe"
        });
    }
});


// API 2: LAY DANH SACH BOOKING
// GET /api/bookings

router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                b.booking_id,
                b.user_id,
                u.full_name,
                u.email,
                u.phone,

                b.vehicle_id,
                v.brand,
                v.model,
                v.year,
                v.license_plate,
                v.price_per_day,

                b.driver_id,
                d.full_name AS driver_name,
                d.phone AS driver_phone,
                d.license_number AS driver_license,

                b.start_date,
                b.end_date,
                b.rental_type,
                b.total_amount,
                b.deposit_amount,
                b.deposit_status,
                b.actual_return_date,
                b.status,
                b.created_at

            FROM bookings b

            JOIN users u
                ON b.user_id = u.user_id

            JOIN vehicles v
                ON b.vehicle_id = v.vehicle_id

            LEFT JOIN drivers d
                ON b.driver_id = d.driver_id

            ORDER BY b.booking_id DESC;
        `);

        res.status(200).json({
            message: "Lay danh sach booking thanh cong",
            bookings: result.rows
        });

    } catch (error) {
        console.error(
            "Loi lay danh sach booking:",
            error.message
        );

        res.status(500).json({
            message: "Khong the lay danh sach booking"
        });
    }
});


// API 3: HUY BOOKING
// PATCH /api/bookings/:id/cancel

router.patch("/:id/cancel", async (req, res) => {
    try {
        const { id } = req.params;

        const checkResult = await pool.query(
            `
            SELECT booking_id, status
            FROM bookings
            WHERE booking_id = $1
            `,
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                message: "Khong tim thay booking"
            });
        }

        const booking = checkResult.rows[0];

        if (booking.status === "completed") {
            return res.status(400).json({
                message: "Khong the huy booking da hoan thanh"
            });
        }

        if (booking.status === "cancelled") {
            return res.status(400).json({
                message: "Booking da duoc huy truoc do"
            });
        }

        const result = await pool.query(
            `
            UPDATE bookings
            SET status = 'cancelled'
            WHERE booking_id = $1
            RETURNING *
            `,
            [id]
        );

        res.status(200).json({
            message: "Huy booking thanh cong",
            booking: result.rows[0]
        });

    } catch (error) {
        console.error(
            "Loi huy booking:",
            error.message
        );

        res.status(500).json({
            message: "Khong the huy booking"
        });
    }
});


// API 4: XEM CHI TIET BOOKING
// GET /api/bookings/:id

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                b.booking_id,
                b.user_id,
                u.full_name,
                u.email,
                u.phone,

                b.vehicle_id,
                v.brand,
                v.model,
                v.year,
                v.license_plate,
                v.price_per_day,

                b.driver_id,
                d.full_name AS driver_name,
                d.phone AS driver_phone,
                d.license_number AS driver_license,

                b.start_date,
                b.end_date,
                b.rental_type,
                b.total_amount,
                b.deposit_amount,
                b.deposit_status,
                b.actual_return_date,
                b.status,
                b.created_at

            FROM bookings b

            JOIN users u
                ON b.user_id = u.user_id

            JOIN vehicles v
                ON b.vehicle_id = v.vehicle_id

            LEFT JOIN drivers d
                ON b.driver_id = d.driver_id

            WHERE b.booking_id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Khong tim thay booking"
            });
        }

        res.status(200).json({
            message: "Lay chi tiet booking thanh cong",
            booking: result.rows[0]
        });

    } catch (error) {
        console.error(
            "Loi lay chi tiet booking:",
            error.message
        );

        res.status(500).json({
            message: "Khong the lay chi tiet booking"
        });
    }
});


// API 5: GIA HAN BOOKING
// PATCH /api/bookings/:id/extend

router.patch("/:id/extend", async (req, res) => {
    try {
        const { id } = req.params;
        const { new_end_date } = req.body;

        if (!new_end_date) {
            return res.status(400).json({
                message: "Vui long nhap ngay ket thuc moi"
            });
        }

        const newEndDate = new Date(new_end_date);

        if (isNaN(newEndDate.getTime())) {
            return res.status(400).json({
                message: "Ngay ket thuc moi khong hop le"
            });
        }

        
        const bookingResult = await pool.query(
                `
                SELECT
                    booking_id,
                    vehicle_id,
                    driver_id,
                    start_date,
                    end_date,
                    total_amount,
                    rental_type,
                    status,
                    deposit_status
                FROM bookings
                WHERE booking_id = $1
             `,
             [id]
        );

        if (bookingResult.rows.length === 0) {
            return res.status(404).json({
                message: "Khong tim thay booking"
            });
        }

        const booking = bookingResult.rows[0];

        if (booking.status !== "confirmed") {
            return res.status(400).json({
                message: "Chi booking da xac nhan moi duoc gia han"
            });
        }

        const currentEndDate = new Date(booking.end_date);

        if (newEndDate <= currentEndDate) {
            return res.status(400).json({
                message: "Ngay ket thuc moi phai sau ngay ket thuc hien tai"
            });
        }

        // Kiem tra xe
        const overlapResult = await pool.query(
            `
            SELECT booking_id
            FROM bookings
            WHERE vehicle_id = $1
            AND booking_id <> $2
            AND status IN ('pending', 'confirmed')
            AND start_date <= $3
            AND end_date > $4
            `,
            [
                booking.vehicle_id,
                id,
                new_end_date,
                booking.end_date
            ]
        );

        if (overlapResult.rows.length > 0) {
            return res.status(400).json({
                message: "Xe da duoc dat trong khoang thoi gian gia han"
            });
        }

        // Neu booking co tai xe thi kiem tra tai xe
        if (booking.driver_id) {

            const driverOverlapResult = await pool.query(
                `
                SELECT booking_id
                FROM bookings
                WHERE driver_id = $1
                AND booking_id <> $2
                AND status IN ('pending', 'confirmed')
                AND start_date <= $3
                AND end_date > $4
                `,
                [
                    booking.driver_id,
                    id,
                    new_end_date,
                    booking.end_date
                ]
            );

            if (driverOverlapResult.rows.length > 0) {
                return res.status(400).json({
                    message: "Tai xe da co lich khac trong thoi gian gia han"
                });
            }
        }

        const vehicleResult = await pool.query(
            `
            SELECT price_per_day
            FROM vehicles
            WHERE vehicle_id = $1
            `,
            [booking.vehicle_id]
        );

        if (vehicleResult.rows.length === 0) {
            return res.status(404).json({
                message: "Khong tim thay xe"
            });
        }

        const pricePerDay =
            Number(vehicleResult.rows[0].price_per_day);

        const extraDays = Math.floor(
            (newEndDate - currentEndDate) /
            (1000 * 60 * 60 * 24)
        );

        
        const extraBaseAmount =
              extraDays * pricePerDay;

        const extraDriverFee =
              booking.rental_type === "with-driver"
        ? extraBaseAmount * 0.2
        : 0;

        const extraAmount =
              extraBaseAmount + extraDriverFee;

        const newTotalAmount =
              Number(booking.total_amount) + extraAmount;
        const result = await pool.query(
            `
            UPDATE bookings
            SET
                end_date = $1,
                total_amount = $2
            WHERE booking_id = $3
            RETURNING *
            `,
            [
                new_end_date,
                newTotalAmount,
                id
            ]
        );

        res.status(200).json({
            message: "Gia han booking thanh cong",
            extra_days: extraDays,
            extra_amount: extraAmount,
            booking: result.rows[0]
        });

    } catch (error) {
        console.error(
            "Loi gia han booking:",
            error.message
        );

        res.status(500).json({
            message: "Khong the gia han booking"
        });
    }
});


// API 6: TRA XE
// PATCH /api/bookings/:id/return

router.patch("/:id/return", async (req, res) => {
    try {
        const { id } = req.params;
        const { actual_return_date } = req.body;

        if (!actual_return_date) {
            return res.status(400).json({
                message: "Vui long nhap ngay tra xe"
            });
        }

        const returnDate = new Date(actual_return_date);

        if (isNaN(returnDate.getTime())) {
            return res.status(400).json({
                message: "Ngay tra xe khong hop le"
            });
        }

        const bookingResult = await pool.query(
            `
            SELECT
                booking_id,
                start_date,
                end_date,
                status,
                deposit_amount,
                deposit_status
            FROM bookings
            WHERE booking_id = $1
            `,
            [id]
        );

        if (bookingResult.rows.length === 0) {
            return res.status(404).json({
                message: "Khong tim thay booking"
            });
        }

        const booking = bookingResult.rows[0];

        if (booking.status === "cancelled") {
            return res.status(400).json({
                message: "Booking da bi huy, khong the tra xe"
            });
        }

        if (booking.status === "completed") {
            return res.status(400).json({
                message: "Booking da duoc tra xe truoc do"
            });
        }

        if (booking.status !== "confirmed") {
            return res.status(400).json({
                message: "Booking chua duoc xac nhan, khong the tra xe"
            });
        }

        if (booking.deposit_status !== "paid") {
            return res.status(400).json({
                message: "Booking chua thanh toan tien coc, khong the tra xe"
            });
        }

        let depositStatus;

        if (
            new Date(actual_return_date) <=
            new Date(booking.end_date)
        ) {
            depositStatus = "refunded";
        } else {
            depositStatus = "forfeited";
        }

        const result = await pool.query(
            `
            UPDATE bookings
            SET
                actual_return_date = $1,
                deposit_status = $2,
                status = 'completed'
            WHERE booking_id = $3
            RETURNING *
            `,
            [
                actual_return_date,
                depositStatus,
                id
            ]
        );

        res.status(200).json({
            message: "Tra xe thanh cong",
            booking: result.rows[0]
        });

    } catch (error) {
        console.error(
            "Loi tra xe:",
            error.message
        );

        res.status(500).json({
            message: "Khong the tra xe"
        });
    }
});


module.exports = router;