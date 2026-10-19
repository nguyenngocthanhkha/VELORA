import PaymentResult from "./pages/PaymentResult";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Check, X } from "lucide-react";
import { Footer, Header, ScrollTop } from "./components/layout";
import { ButtonLink, State } from "./components/ui";
import { Auth, Profile } from "./pages/Account";
import { Admin } from "./pages/Admin";
import { Home, Cars, Detail } from "./pages/Catalog";
import {
  BookingPage,
  Orders,
  OrderDetail,
  PaymentPage,
  ReturnPage,
  ReviewPage,
} from "./pages/Rental";
import { Context, initial } from "./state/appStore";
import { vehicleApi, vehicleTypeApi, driverApi } from "./api/vehicleApi";
import { reviewApi } from "./api/reviewApi";
import { bookingApi } from "./api/bookingApi";
import { paymentApi } from "./api/paymentApi";
import { userApi } from "./api/userApi";
import { apiError } from "./api/axiosClient";
import type { User } from "./types";
import "./styles.css";
function readSession(): User | null {
  try {
    const token = sessionStorage.getItem("velora.token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp || payload.exp * 1000 <= Date.now())
      throw Error("expired");
    return JSON.parse(sessionStorage.getItem("velora.user") || "null");
  } catch {
    sessionStorage.removeItem("velora.token");
    sessionStorage.removeItem("velora.user");
    return null;
  }
}
function App() {
  const [data, setData] = useState(initial),
    [user, setUserState] = useState<User | null>(readSession),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [toast, setToast] = useState("");
  const generation = useRef(0);
  const setUser = useCallback((u: User | null) => {
    generation.current++;
    setUserState(u);
    setData(initial);
    if (u) sessionStorage.setItem("velora.user", JSON.stringify(u));
    else {
      sessionStorage.removeItem("velora.token");
      sessionStorage.removeItem("velora.user");
    }
  }, []);
  const refresh = useCallback(async () => {
    const version = ++generation.current;
    setError("");
    try {
      const [
        vehicles,
        vehicleTypes,
        reviews,
        drivers,
        bookings,
        payments,
        users,
      ] = await Promise.all([
        vehicleApi.list(),
        vehicleTypeApi.list(),
        reviewApi.list(),
        driverApi.list(),
        user ? bookingApi.list() : Promise.resolve([]),
        user ? paymentApi.list() : Promise.resolve([]),
        user?.role === "admin"
          ? userApi.list()
          : Promise.resolve(user ? [user] : []),
      ]);
      if (version === generation.current)
        setData({
          vehicles,
          vehicleTypes,
          reviews,
          drivers,
          bookings: bookings.filter(
            (b) => user?.role === "admin" || b.user_id === user?.user_id,
          ),
          payments: payments.filter(
            (p) => user?.role === "admin" || p.user_id === user?.user_id,
          ),
          users,
        });
    } catch (e) {
      if (version === generation.current) setError(apiError(e));
      throw e;
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    void refresh().catch(() => {});
  }, [refresh]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const expired = () => {
      setUser(null);
      setToast("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    };
    window.addEventListener("velora-session-expired", expired);
    return () => window.removeEventListener("velora-session-expired", expired);
  }, [setUser]);
  async function execute<T>(
    work: () => Promise<T>,
    message?: string,
  ): Promise<T> {
    let result: T;
    try {
      result = await work();
    } catch (e) {
      setToast(apiError(e));
      throw e;
    }
    if (message) setToast(message);
    try {
      await refresh();
    } catch {
      setToast(
        "Đã lưu dữ liệu, nhưng chưa tải được kết quả mới. Vui lòng thử tải lại.",
      );
    }
    return result;
  }
  return (
    <Context.Provider
      value={{
        data,
        user,
        setUser,
        notify: setToast,
        refresh,
        execute,
        loading,
        error,
      }}
    >
      <BrowserRouter>
        <ScrollTop />
        {error && (
          <div className="connection-error" role="alert">
            {error}
            <button onClick={() => void refresh().catch(() => {})}>
              Thử lại
            </button>
          </div>
        )}
        {loading ? (
          <State title="Đang tải dữ liệu…" loading />
        ) : (
          <Routes>
            <Route path="/admin/*" element={<Admin />} />
            <Route path="*" element={<Public />} />
          </Routes>
        )}
        {toast && (
          <div className="toast" role="status">
            <Check size={18} />
            {toast}
            <button aria-label="Đóng thông báo" onClick={() => setToast("")}>
              <X size={16} />
            </button>
          </div>
        )}
      </BrowserRouter>
    </Context.Provider>
  );
}
function Public() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/payment-result" element={<PaymentResult />} />
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth register />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/cars/:id" element={<Detail />} />
          <Route path="/booking/:vehicleId" element={<BookingPage />} />
          <Route
            path="/booking/:vehicleId/confirm"
            element={<BookingPage confirm />}
          />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/payment/:bookingId" element={<PaymentPage />} />
          <Route path="/return/:bookingId" element={<ReturnPage />} />
          <Route path="/review/:bookingId" element={<ReviewPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="*"
            element={
              <State
                title="Không tìm thấy trang"
                action={<ButtonLink to="/">Về trang chủ</ButtonLink>}
              />
            }
          />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
