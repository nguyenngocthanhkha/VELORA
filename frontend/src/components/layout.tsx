import { ChevronDown, Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useStore } from "../state/appStore";

export function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function Header() {
  const { user, setUser } = useStore();
  const [open, setOpen] = useState(false),
    [account, setAccount] = useState(false);
  const loc = useLocation();
  useEffect(() => {
    setOpen(false);
    setAccount(false);
  }, [loc.pathname]);
  return (
    <header>
      <div className="header-inner">
        <Link to="/" className="logo">
          VELORA<span className="logo-dot">®</span>
        </Link>
        <nav className={open ? "open" : ""}>
          <NavLink to="/" end>
            Trang chủ
          </NavLink>
          <NavLink to="/cars">Thuê xe</NavLink>
          <NavLink to="/orders">Đơn thuê</NavLink>
          <a href="/#about">Giới thiệu</a>
          <a href="/#contact">Liên hệ</a>
        </nav>
        <div className="header-actions">
          {user ? (
            <div className="account">
              <button onClick={() => setAccount(!account)}>
                <UserRound size={17} />
                <span>Tài khoản</span>
                <ChevronDown size={13} />
              </button>
              {account && (
                <div className="dropdown">
                  <Link to="/profile">Hồ sơ của bạn</Link>
                  <Link to="/orders">Đơn thuê & lịch sử</Link>
                  {user.role === "admin" && <Link to="/admin">Quản trị</Link>}
                  <button
                    onClick={() => {
                      setUser(null);
                      setAccount(false);
                    }}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link className="login-link" to="/login">
              <UserRound size={17} />
              <span>Đăng nhập</span>
            </Link>
          )}
          <button
            className="menu-toggle"
            aria-label="Mở menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-top">
          <div>
            <Link className="logo" to="/">
              VELORA
            </Link>
            <p>Trải nghiệm cảm giác mới</p>
          </div>
          <div>
            <b>Thông tin liên hệ</b>
            <a href="mailto:veloratrainghiemcamgiacmoi@gmail.com">
              veloratrainghiemcamgiacmoi@gmail.com
            </a>
          </div>
          <div>
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noreferrer"
            >
              Facebook ↗
            </a>
            <a href="https://www.tiktok.com/" target="_blank" rel="noreferrer">
              TikTok ↗
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 VELORA · Nền tảng thuê xe ô tô</span>
          <span>Tự lái hoặc có tài xế. Lựa chọn của bạn.</span>
        </div>
      </div>
    </footer>
  );
}
