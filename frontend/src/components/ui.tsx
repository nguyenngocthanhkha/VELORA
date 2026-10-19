import { ArrowRight, Car, Check, LoaderCircle, Star, X } from "lucide-react";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { labels } from "../utils/format";

export function State({
  title,
  loading = false,
  action,
}: {
  title: string;
  loading?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="state">
      {loading ? <LoaderCircle className="spin" /> : <Car size={36} />}
      <h2>{title}</h2>
      {action}
    </div>
  );
}

export function Badge({
  status,
  deposit = false,
}: {
  status: string;
  deposit?: boolean;
}) {
  return (
    <span
      className={`badge ${["renting", "completed", "paid"].includes(status) ? "dark" : ""} ${["canceled", "forfeited"].includes(status) ? "muted" : ""}`}
    >
      {deposit && status === "pending"
        ? "Chờ thanh toán cọc"
        : labels[status] || status}
    </span>
  );
}

export function ButtonLink({
  to,
  children,
  outline = false,
  state,
}: {
  to: string;
  children: React.ReactNode;
  outline?: boolean;
  state?: unknown;
}) {
  return (
    <Link className={`btn ${outline ? "outline" : ""}`} to={to} state={state}>
      {children}
      <ArrowRight size={16} />
    </Link>
  );
}

export function Heading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="heading">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <div className="stars">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={17} fill={i < rating ? "currentColor" : "none"} />
      ))}
      <b>{rating} / 5</b>
    </div>
  );
}

export function RentalFields({
  start,
  end,
  rental,
  setStart,
  setEnd,
  setRental,
}: {
  start: string;
  end: string;
  rental: string;
  setStart: (s: string) => void;
  setEnd: (s: string) => void;
  setRental: (s: string) => void;
}) {
  return (
    <>
      <div className="two-grid">
        <label>
          Ngày bắt đầu
          <input
            required
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label>
          Ngày kết thúc
          <input
            required
            min={start}
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>
      <label>Hình thức thuê</label>
      <div className="radio-row">
        <label>
          <input
            type="radio"
            checked={rental === "self-drive"}
            onChange={() => setRental("self-drive")}
          />
          Tự lái
        </label>
        <label>
          <input
            type="radio"
            checked={rental === "with-driver"}
            onChange={() => setRental("with-driver")}
          />
          Có tài xế
        </label>
      </div>
    </>
  );
}

export function Row({ name, value }: { name: string; value: React.ReactNode }) {
  return (
    <div className="info-row">
      <span>{name}</span>
      <div>{value}</div>
    </div>
  );
}

export function Progress({ step }: { step: number }) {
  return (
    <div className="progress">
      {["Đặt xe", "Xác nhận", "Thanh toán cọc", "Đơn thuê"].map((t, i) => (
        <div key={t} className={i + 1 <= step ? "active" : ""}>
          <span>{i + 1 < step ? <Check size={14} /> : i + 1}</span>
          <b>{t}</b>
        </div>
      ))}
    </div>
  );
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="action-row">
          <h2>{title}</h2>
          <button autoFocus aria-label="Đóng" onClick={onClose}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stat({
  title,
  value,
  note,
}: {
  title: string;
  value: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="stat">
      <p>{title}</p>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}
