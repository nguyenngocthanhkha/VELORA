
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, LoaderCircle, LogOut } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { userApi } from "../api/userApi";
import { apiError } from "../api/axiosClient";
import { useStore } from "../state/appStore";
import { Heading, ButtonLink, State, Row, Stat } from "../components/ui";

// Kiem tra du lieu dang nhap va dang ky
const authSchema = z.object({
  full_name: z.string().optional(),
  email: z.string().email("Email chưa hợp lệ"),
  phone: z.string().optional(),
  password: z.string().min(6, "Mật khẩu cần ít nhất 6 ký tự"),
  confirm: z.string().optional(),
});

type Values = z.infer<typeof authSchema>;

// TRANG DANG NHAP / DANG KY
export function Auth({ register = false }: { register?: boolean }) {
  const { setUser, notify } = useStore();
  const nav = useNavigate();
  const location = useLocation();

  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(authSchema),
  });

  // Xu ly dang nhap va dang ky
  async function submit(v: Values) {
    setError("");

    if (register) {
      if (
        !v.full_name?.trim() ||
        !/^\+?[\d\s]{9,15}$/.test(v.phone || "")
      ) {
        setError("Vui lòng nhập họ tên và số điện thoại hợp lệ.");
        return;
      }

      if (v.password !== v.confirm) {
        setError("Mật khẩu xác nhận chưa khớp.");
        return;
      }
    }

    try {
      if (register) {
        // DANG KY TAI KHOAN
        const r = await userApi.register({
          full_name: v.full_name!.trim(),
          email: v.email,
          password: v.password,
          phone: v.phone!.trim(),
        });

        notify(r.message);
        nav("/login");
      } else {
        // DANG NHAP TAI KHOAN
        const r = await userApi.login(v.email, v.password);

        // Luu JWT vao sessionStorage
        sessionStorage.setItem("velora.token", r.token);

        // Luu thong tin nguoi dung
        setUser(r.user);
        notify("Đăng nhập thành công");

     
        // =====================================
        // KET THUC PHAN TEST VNPAY
        // =====================================

        // Chuyen trang sau khi dang nhap
        const from = location.state?.from;

        nav(
          typeof from === "string" &&
            from.startsWith("/") &&
            !from.startsWith("//")
            ? from
            : r.user.role === "admin"
              ? "/admin"
              : "/orders"
        );
      }
    } catch (e) {
      setError(apiError(e));
    }
  }

  return (
    <div className="container auth-layout">
      <div className="auth-visual">
        <img
          src="/assets/hero.png"
          alt="Hành trình VELORA"
        />

        <div>
          <span className="eyebrow">
            TRẢI NGHIỆM CẢM GIÁC MỚI
          </span>

          <h1>
            {register ? (
              <>
                Mỗi hành trình.
                <br />
                Một cảm giác mới.
              </>
            ) : (
              <>
                Chào mừng bạn
                <br />
                trở lại.
              </>
            )}
          </h1>

          <p>
            Chọn xe, đặt thuê và lưu lại trải nghiệm
            cùng VELORA.
          </p>
        </div>
      </div>

      <div className="auth-form">
        <Heading
          eyebrow="TÀI KHOẢN VELORA"
          title={register ? "Đăng ký" : "Đăng nhập"}
          description={
            register
              ? "Bắt đầu hành trình của riêng bạn."
              : "Tiếp tục hành trình và quản lý đơn thuê của bạn."
          }
        />

        <form onSubmit={handleSubmit(submit)}>
          {register && (
            <label>
              Họ và tên
              <input
                {...field("full_name")}
                required
                autoComplete="name"
                placeholder="Nhập họ và tên"
              />
            </label>
          )}

          <label>
            Email
            <input
              {...field("email")}
              type="email"
              autoComplete="email"
              placeholder="ban@example.com"
            />

            {errors.email && (
              <small className="error">
                {errors.email.message}
              </small>
            )}
          </label>

          {register && (
            <label>
              Số điện thoại
              <input
                {...field("phone")}
                required
                autoComplete="tel"
                placeholder="090 123 4567"
              />
            </label>
          )}

          <label>
            Mật khẩu

            <div className="password-input">
              <input
                {...field("password")}
                aria-label="Mật khẩu"
                type={show ? "text" : "password"}
                autoComplete={
                  register
                    ? "new-password"
                    : "current-password"
                }
                placeholder="Ít nhất 6 ký tự"
              />

              <button
                type="button"
                onClick={() => setShow(!show)}
              >
                {show ? "Ẩn" : "Hiện"}
              </button>
            </div>

            {errors.password && (
              <small className="error">
                {errors.password.message}
              </small>
            )}
          </label>

          {register && (
            <label>
              Xác nhận mật khẩu

              <input
                {...field("confirm")}
                required
                type="password"
                autoComplete="new-password"
              />
            </label>
          )}

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button
            className="btn full"
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <LoaderCircle
                className="spin"
                size={16}
              />
            )}{" "}

            {register
              ? "Tạo tài khoản"
              : "Đăng nhập"}

            <ArrowRight size={16} />
          </button>
        </form>

        <p className="auth-switch">
          {register
            ? "Đã có tài khoản?"
            : "Chưa có tài khoản?"}{" "}

          <Link
            to={register ? "/login" : "/register"}
          >
            {register
              ? "Đăng nhập"
              : "Đăng ký tài khoản"}
          </Link>
        </p>
      </div>
    </div>
  );
}

// TRANG HO SO NGUOI DUNG
export function Profile() {
  const { user, setUser, data } = useStore();
  const nav = useNavigate();

  if (!user) {
    return (
      <State
        title="Đăng nhập để xem hồ sơ"
        action={
          <ButtonLink to="/login">
            Đăng nhập
          </ButtonLink>
        }
      />
    );
  }

  const mine = data.bookings.filter(
    (b) => b.user_id === user.user_id
  );

  return (
    <div className="container page">
      <Heading
        eyebrow="TÀI KHOẢN VELORA"
        title="Hồ sơ của bạn"
        description="Thông tin tài khoản và những hành trình đã lưu."
      />

      <div className="profile-layout">
        <aside className="panel">
          <div className="avatar">
            {user.full_name
              .split(" ")
              .slice(-2)
              .map((s) => s[0])
              .join("")}
          </div>

          <h3>{user.full_name}</h3>
          <p>{user.email}</p>

          <div className="divider" />

          <Link to="/orders">
            Đơn thuê & lịch sử →
          </Link>

          <button
            className="logout"
            onClick={() => {
              setUser(null);
              nav("/");
            }}
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </aside>

        <section>
          <div className="panel">
            <h3>Thông tin cá nhân</h3>

            <Row
              name="Họ và tên"
              value={user.full_name}
            />

            <Row
              name="Email"
              value={user.email}
            />

            <Row
              name="Số điện thoại"
              value={
                user.phone || "Chưa cung cấp"
              }
            />
          </div>

          <div className="stats three">
            <Stat
              title="Tổng đơn thuê"
              value={mine.length}
            />

            <Stat
              title="Đã xác nhận"
              value={
                mine.filter(
                  (b) => b.status === "confirmed"
                ).length
              }
            />

            <Stat
              title="Hoàn tất"
              value={
                mine.filter(
                  (b) => b.status === "completed"
                ).length
              }
            />
          </div>

          <ButtonLink outline to="/orders">
            Xem đơn thuê & lịch sử
          </ButtonLink>
        </section>
      </div>
    </div>
  );
}
