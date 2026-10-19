
const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const qs = require("qs");
const pool = require("../config/database");

const router = express.Router();

// ======================================
// 1. KIỂM TRA ĐĂNG NHẬP
// ======================================

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Vui lòng đăng nhập để thanh toán",
    });
  }

  try {
    const token = authHeader.split(" ")[1];

    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Phiên đăng nhập đã hết hạn",
    });
  }
}

// ======================================
// 2. XỬ LÝ CHỮ KÝ VNPAY
// ======================================

// Sắp xếp và mã hóa tham số theo mẫu VNPay 2.1.0
function sortObject(obj) {
  const sorted = {};

  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[encodeURIComponent(key)] =
        encodeURIComponent(String(obj[key]))
          .replace(/%20/g, "+");
    });

  return sorted;
}

// Tạo chuỗi ký
function createSignData(params) {
  return qs.stringify(sortObject(params), {
    encode: false,
  });
}

// Tạo chữ ký HMAC-SHA512
function createSignature(params) {
  return crypto
    .createHmac(
      "sha512",
      process.env.VNPAY_HASH_SECRET
    )
    .update(createSignData(params), "utf8")
    .digest("hex");
}

// Kiểm tra chữ ký VNPay
function verifySignature(query) {
  const params = { ...query };
  const receivedHash = params.vnp_SecureHash;

  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  if (
    typeof receivedHash !== "string" ||
    !/^[a-f0-9]{128}$/i.test(receivedHash)
  ) {
    return false;
  }

  const calculatedHash = createSignature(params);

  return crypto.timingSafeEqual(
    Buffer.from(receivedHash, "hex"),
    Buffer.from(calculatedHash, "hex")
  );
}

// ======================================
// 3. LẤY THỜI GIAN VIỆT NAM
// ======================================

function vietnamTime(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type) =>
    parts.find((part) => part.type === type).value;

  return (
    get("year") +
    get("month") +
    get("day") +
    get("hour") +
    get("minute") +
    get("second")
  );
}

// ======================================
// 4. TẠO LINK THANH TOÁN VNPAY
// POST /api/vnpay/create-payment
// ======================================

router.post(
  "/create-payment",
  verifyToken,
  async (req, res) => {
    try {
      const bookingId = Number(req.body.booking_id);

      if (!Number.isSafeInteger(bookingId) || bookingId <= 0) {
        return res.status(400).json({
          message: "Mã đơn đặt xe không hợp lệ",
        });
      }

      const result = await pool.query(
        `SELECT booking_id, user_id,
                deposit_amount, deposit_status, status
         FROM bookings
         WHERE booking_id = $1`,
        [bookingId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Không tìm thấy đơn đặt xe",
        });
      }

      const booking = result.rows[0];

      // Kiểm tra quyền sở hữu
      if (
        Number(booking.user_id) !==
        Number(req.user.user_id)
      ) {
        return res.status(403).json({
          message: "Bạn không có quyền thanh toán đơn này",
        });
      }

      // Chỉ thanh toán đơn đang chờ
      if (
        booking.status !== "pending" ||
        booking.deposit_status !== "pending"
      ) {
        return res.status(400).json({
          message: "Đơn đặt xe không thể thanh toán",
        });
      }

      // Lấy số tiền từ database
      const amount = Number(booking.deposit_amount);

      if (!Number.isSafeInteger(amount) || amount <= 0) {
        return res.status(400).json({
          message: "Số tiền cọc không hợp lệ",
        });
      }

      const {
        VNPAY_TMN_CODE,
        VNPAY_HASH_SECRET,
        VNPAY_URL,
        VNPAY_RETURN_URL,
      } = process.env;

      if (
        !VNPAY_TMN_CODE ||
        !VNPAY_HASH_SECRET ||
        !VNPAY_URL ||
        !VNPAY_RETURN_URL
      ) {
        return res.status(500).json({
          message: "Thiếu cấu hình VNPay trong .env",
        });
      }

      // Tạo mã giao dịch duy nhất
      const txnRef =
        "VELORA" +
        bookingId +
        Date.now() +
        crypto.randomBytes(4).toString("hex");

      // Lưu giao dịch đang chờ
      await pool.query(
        `INSERT INTO vnpay_transactions
           (booking_id, txn_ref, amount, status)
         VALUES ($1, $2, $3, 'pending')`,
        [bookingId, txnRef, amount]
      );

      const vnpParams = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: VNPAY_TMN_CODE,
        vnp_Amount: String(amount * 100),
        vnp_CreateDate: vietnamTime(new Date()),
        vnp_CurrCode: "VND",
        vnp_IpAddr: req.ip || "127.0.0.1",
        vnp_Locale: "vn",
        vnp_OrderInfo:
          "Thanh toan coc don xe " + bookingId,
        vnp_OrderType: "other",
        vnp_ReturnUrl: VNPAY_RETURN_URL,
        vnp_TxnRef: txnRef,
      };

      const signData = createSignData(vnpParams);
      const secureHash = createSignature(vnpParams);

      const paymentUrl =
        VNPAY_URL +
        "?" +
        signData +
        "&vnp_SecureHash=" +
        secureHash;

      return res.json({
        message: "Tạo link VNPay thành công",
        booking_id: bookingId,
        amount,
        txn_ref: txnRef,
        payment_url: paymentUrl,
      });
    } catch (error) {
      console.error("VNPay create-payment:", error);

      return res.status(500).json({
        message: "Không thể tạo thanh toán VNPay",
      });
    }
  }
);

// ======================================
// 5. NHẬN KẾT QUẢ IPN TỪ VNPAY
// GET /api/vnpay/ipn
// ======================================

router.get("/ipn", async (req, res) => {
  const reply = (RspCode, Message) =>
    res.json({ RspCode, Message });

  // Kiểm tra chữ ký trước khi truy cập database
  try {
    if (!verifySignature(req.query)) {
      return reply("97", "Invalid signature");
    }

    if (
      req.query.vnp_TmnCode !==
      process.env.VNPAY_TMN_CODE
    ) {
      return reply("97", "Invalid merchant");
    }
  } catch (error) {
    console.error("VNPay signature:", error);
    return reply("99", "Unknown error");
  }

  const txnRef = req.query.vnp_TxnRef;
  const receivedAmount = req.query.vnp_Amount;

  if (
    typeof txnRef !== "string" ||
    !/^\d+$/.test(String(receivedAmount))
  ) {
    return reply("01", "Invalid transaction");
  }

  const client = await pool.connect();
  let inTransaction = false;

  try {
    await client.query("BEGIN");
    inTransaction = true;

    // Khóa giao dịch để tránh IPN xử lý trùng
    const result = await client.query(
      `SELECT *
       FROM vnpay_transactions
       WHERE txn_ref = $1
       FOR UPDATE`,
      [txnRef]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      inTransaction = false;
      return reply("01", "Order not found");
    }

    const transaction = result.rows[0];

    const expectedAmount =
      Number(transaction.amount) * 100;

    if (
      !Number.isSafeInteger(expectedAmount) ||
      String(expectedAmount) !== String(receivedAmount)
    ) {
      await client.query("ROLLBACK");
      inTransaction = false;
      return reply("04", "Invalid amount");
    }

    // Khóa đơn đặt xe
    const bookingResult = await client.query(
      `SELECT booking_id, status, deposit_status
       FROM bookings
       WHERE booking_id = $1
       FOR UPDATE`,
      [transaction.booking_id]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      inTransaction = false;
      return reply("01", "Booking not found");
    }

    const booking = bookingResult.rows[0];

    // Giao dịch này đã xử lý
    if (transaction.status !== "pending") {
      await client.query("ROLLBACK");
      inTransaction = false;
      return reply("02", "Order already confirmed");
    }

    const success =
      req.query.vnp_ResponseCode === "00" &&
      req.query.vnp_TransactionStatus === "00";

    if (success) {
      // Nếu đơn đã thanh toán thì không ghi nhận lần nữa
      if (
        booking.deposit_status !== "pending" ||
        booking.status !== "pending"
      ) {
        await client.query("ROLLBACK");
        inTransaction = false;
        return reply("02", "Booking already processed");
      }

      // Ghi nhận giao dịch thành công
      await client.query(
        `UPDATE vnpay_transactions
         SET status = 'paid',
             vnpay_transaction_no = $1,
             paid_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [
          req.query.vnp_TransactionNo || null,
          transaction.id,
        ]
      );

      // Cập nhật tiền cọc của đơn
      await client.query(
        `UPDATE bookings
         SET deposit_status = 'paid'
         WHERE booking_id = $1`,
        [transaction.booking_id]
      );
    } else {
      // Giao dịch thất bại
      await client.query(
        `UPDATE vnpay_transactions
         SET status = 'failed',
             vnpay_transaction_no = $1
         WHERE id = $2`,
        [
          req.query.vnp_TransactionNo || null,
          transaction.id,
        ]
      );
    }

    await client.query("COMMIT");
    inTransaction = false;

    return reply("00", "Confirm Success");
  } catch (error) {
    if (inTransaction) {
      try {
        await client.query("ROLLBACK");
      } catch (_) {}
    }

    console.error("VNPay IPN:", error);
    return reply("99", "Unknown error");
  } finally {
    client.release();
  }
});

// 6. KHÁCH QUAY VỀ TỪ VNPAY
router.get("/return", async (req, res) => {
  try {
    // Kiểm tra chữ ký VNPay
    if (!verifySignature(req.query)) {
      return res.status(400).send("Chữ ký VNPay không hợp lệ");
    }

    const txnRef = req.query.vnp_TxnRef;

    // Tìm đúng đơn đặt xe bằng mã giao dịch VNPay
    const result = await pool.query(
      `SELECT booking_id
       FROM vnpay_transactions
       WHERE txn_ref = $1`,
      [txnRef]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Không tìm thấy giao dịch");
    }

    const bookingId = result.rows[0].booking_id;

    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5173";

    // Chỉ chuyển hướng, không cập nhật tiền cọc
    return res.redirect(
      `${frontendUrl}/payment-result?bookingId=${bookingId}`
    );
  } catch (error) {
    console.error("VNPay return:", error);
    return res.status(500).send("Lỗi xử lý kết quả VNPay");
  }
});
// ======================================
// 7. XEM TRẠNG THÁI THANH TOÁN
// GET /api/vnpay/status/:bookingId
// ======================================

router.get(
  "/status/:bookingId",
  verifyToken,
  async (req, res) => {
    try {
      const bookingId = Number(req.params.bookingId);

      if (!Number.isSafeInteger(bookingId) || bookingId <= 0) {
        return res.status(400).json({
          message: "Mã đơn không hợp lệ",
        });
      }

      const result = await pool.query(
        `SELECT booking_id, user_id,
                deposit_amount, deposit_status
         FROM bookings
         WHERE booking_id = $1`,
        [bookingId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Không tìm thấy đơn",
        });
      }

      const booking = result.rows[0];

      if (
        Number(booking.user_id) !==
        Number(req.user.user_id)
      ) {
        return res.status(403).json({
          message: "Không có quyền xem đơn này",
        });
      }

      return res.json({
        booking_id: booking.booking_id,
        deposit_amount: booking.deposit_amount,
        deposit_status: booking.deposit_status,
      });
    } catch (error) {
      console.error("VNPay status:", error);

      return res.status(500).json({
        message: "Không thể xem trạng thái thanh toán",
      });
    }
  }
);

//
// 8. ĐỐI SOÁT GIAO DỊCH VNPAY
// GET /api/vnpay/reconcile/:bookingId
// Chỉ kiểm tra, chưa cập nhật database.
//

router.get(
  "/reconcile/:bookingId",
  verifyToken,
  async (req, res) => {
    try {
      const bookingId = Number(req.params.bookingId);

      if (!Number.isSafeInteger(bookingId) || bookingId <= 0) {
        return res.status(400).json({
          message: "Mã đơn không hợp lệ",
        });
      }

      const result = await pool.query(
        `SELECT
            t.txn_ref,
            t.amount,
            t.status AS transaction_status,
            b.user_id,
            b.deposit_status
         FROM vnpay_transactions t
         JOIN bookings b
           ON b.booking_id = t.booking_id
         WHERE t.booking_id = $1
         ORDER BY t.created_at DESC
         LIMIT 1`,
        [bookingId]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          message: "Không tìm thấy giao dịch",
        });
      }

      const transaction = result.rows[0];

      if (
        Number(transaction.user_id) !==
        Number(req.user.user_id)
      ) {
        return res.status(403).json({
          message: "Không có quyền đối soát đơn này",
        });
      }

      const {
        VNPAY_TMN_CODE,
        VNPAY_HASH_SECRET,
      } = process.env;

      if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET) {
        return res.status(500).json({
          message: "Thiếu cấu hình VNPay",
        });
      }

      // Mã giao dịch VELORA chứa thời gian tạo
      // theo cấu trúc:
      // VELORA + bookingId + Date.now() + 8 ký tự hex
      const pattern = new RegExp(
        "^VELORA" + bookingId + "(\\d{13})[a-f0-9]{8}$"
      );

      const match = transaction.txn_ref.match(pattern);

      if (!match) {
        return res.status(400).json({
          message: "Không xác định được ngày tạo giao dịch",
        });
      }

      const transactionDate = vietnamTime(
        new Date(Number(match[1]))
      );

      const params = {
        vnp_RequestId: crypto.randomBytes(16).toString("hex"),
        vnp_Version: "2.1.0",
        vnp_Command: "querydr",
        vnp_TmnCode: VNPAY_TMN_CODE,
        vnp_TxnRef: transaction.txn_ref,
        vnp_OrderInfo: "Truy van giao dich VELORA",
        vnp_TransactionNo: "",
        vnp_TransactionDate: transactionDate,
        vnp_CreateDate: vietnamTime(new Date()),
        vnp_IpAddr: "127.0.0.1",
      };

      // Chữ ký riêng của QueryDr
      const signData = [
        params.vnp_RequestId,
        params.vnp_Version,
        params.vnp_Command,
        params.vnp_TmnCode,
        params.vnp_TxnRef,
        params.vnp_TransactionDate,
        params.vnp_CreateDate,
        params.vnp_IpAddr,
        params.vnp_OrderInfo,
      ].join("|");

      params.vnp_SecureHash = crypto
        .createHmac("sha512", VNPAY_HASH_SECRET)
        .update(signData, "utf8")
        .digest("hex");

      const response = await fetch(
        "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!response.ok) {
        return res.status(502).json({
          message: "VNPay không phản hồi thành công",
          http_status: response.status,
        });
      }

      const data = await response.json();

      // Xác minh chữ ký phản hồi QueryDr
      const fields = [
        "vnp_ResponseId",
        "vnp_Command",
        "vnp_ResponseCode",
        "vnp_Message",
        "vnp_TmnCode",
        "vnp_TxnRef",
        "vnp_Amount",
        "vnp_BankCode",
        "vnp_PayDate",
        "vnp_TransactionNo",
        "vnp_TransactionType",
        "vnp_TransactionStatus",
        "vnp_OrderInfo",
        "vnp_PromotionCode",
        "vnp_PromotionAmount",
      ];

      const responseSignData = fields
        .map((key) => String(data[key] ?? ""))
        .join("|");

      const expectedHash = crypto
        .createHmac("sha512", VNPAY_HASH_SECRET)
        .update(responseSignData, "utf8")
        .digest("hex");

      const receivedHash = data.vnp_SecureHash;

      const validSignature =
        typeof receivedHash === "string" &&
        /^[a-f0-9]{128}$/i.test(receivedHash) &&
        crypto.timingSafeEqual(
          Buffer.from(receivedHash, "hex"),
          Buffer.from(expectedHash, "hex")
        );

      if (!validSignature) {
        return res.status(502).json({
          message: "Chữ ký phản hồi QueryDr không hợp lệ",
        });
      }

      const matchingTransaction =
        data.vnp_TmnCode === VNPAY_TMN_CODE &&
        data.vnp_TxnRef === transaction.txn_ref &&
        String(data.vnp_Amount) ===
          String(Number(transaction.amount) * 100);

              const confirmedPaid =
                matchingTransaction &&
                data.vnp_ResponseCode === "00" &&
                data.vnp_TransactionStatus === "00" &&
                data.vnp_TransactionType === "01" &&
                /^\d{1,15}$/.test(
                  String(data.vnp_TransactionNo ?? "")
                );
                if (confirmedPaid) {
          const client = await pool.connect();

          try {
            await client.query("BEGIN");

            const transactionResult = await client.query(
              `SELECT id, booking_id, status
              FROM vnpay_transactions
              WHERE txn_ref = $1
              FOR UPDATE`,
              [transaction.txn_ref]
            );

            const currentTransaction = transactionResult.rows[0];

            const bookingResult = await client.query(
              `SELECT deposit_status
              FROM bookings
              WHERE booking_id = $1
              FOR UPDATE`,
              [bookingId]
            );

            if (
              currentTransaction &&
              currentTransaction.status === "pending" &&
              bookingResult.rows[0]?.deposit_status === "pending"
            ) {
              await client.query(
                `UPDATE vnpay_transactions
                SET status = 'paid',
                    vnpay_transaction_no = $1,
                    paid_at = CURRENT_TIMESTAMP
                WHERE id = $2`,
                [data.vnp_TransactionNo, currentTransaction.id]
              );

              await client.query(
                `UPDATE bookings
                SET deposit_status = 'paid'
                WHERE booking_id = $1`,
                [bookingId]
              );
            }

            await client.query("COMMIT");
          } catch (error) {
            await client.query("ROLLBACK");
            throw error;
          } finally {
            client.release();
          }
        }
        return res.json({
        booking_id: bookingId,
        txn_ref: transaction.txn_ref,
        local_status: transaction.transaction_status,
        deposit_status: transaction.deposit_status,
        vnpay_response_code: data.vnp_ResponseCode,
        vnpay_transaction_status: data.vnp_TransactionStatus,
        vnpay_transaction_no: data.vnp_TransactionNo,
        vnpay_amount: data.vnp_Amount,
        verified: confirmedPaid,
        message: confirmedPaid
          ? "VNPay xác nhận giao dịch thành công"
          : "Chưa đủ điều kiện xác nhận giao dịch",
      });
    } catch (error) {
      console.error("VNPay reconcile:", error);

      return res.status(500).json({
        message: "Không thể đối soát giao dịch VNPay",
      });
    }
  }
);


module.exports = router;
