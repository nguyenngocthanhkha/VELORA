import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

type PaymentStatus = "checking" | "paid" | "pending" | "error";

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [status, setStatus] = useState<PaymentStatus>("checking");
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    if (!bookingId) {
      setStatus("error");
      return;
    }

    let cancelled = false;

    async function checkPayment() {
      const token = sessionStorage.getItem("velora.token");

      if (!token) {
        setStatus("error");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/api/vnpay/status/${bookingId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Không thể kiểm tra thanh toán");
        }

        const data = await response.json();

        if (cancelled) return;

        setAmount(Number(data.deposit_amount));

        setStatus(
          data.deposit_status === "paid" ? "paid" : "pending"
        );
      } catch (error) {
        if (!cancelled) setStatus("error");
      }
    }

    checkPayment();

    // IPN có thể đến sau khi khách được chuyển hướng
    const interval = setInterval(checkPayment, 3000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [bookingId]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 40,
          borderRadius: 16,
          maxWidth: 500,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ color: status === "paid" ? "#16a34a" : "#222" }}>
          {status === "paid"
            ? "✓ Thanh toán thành công!"
            : status === "checking"
            ? "Đang kiểm tra thanh toán..."
            : status === "pending"
            ? "Đang chờ xác nhận từ VNPay"
            : "Không thể kiểm tra thanh toán"}
        </h1>

        <p>Đơn thuê xe #{bookingId}</p>

        {status === "paid" && (
          <h2 style={{ color: "#16a34a" }}>
            {amount.toLocaleString("vi-VN")} VNĐ
          </h2>
        )}

        <p>
          {status === "paid"
            ? "VELORA đã ghi nhận tiền cọc thành công."
            : status === "pending"
            ? "Hệ thống đang chờ xác nhận thanh toán."
            : "Vui lòng kiểm tra trạng thái đơn thuê xe."}
        </p>

        <Link to="/" style={{ color: "#2563eb" }}>
          Quay lại VELORA
        </Link>
      </div>
    </div>
  );
}