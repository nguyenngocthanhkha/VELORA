import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../state/appStore";
import type { Vehicle } from "../types";
import { imageUrl } from "../api/axiosClient";
import { date, days, money, quote, today } from "../utils/format";
import { Row, Badge } from "./ui";
export function VehicleImage({
  v,
  className,
}: {
  v: Vehicle;
  className?: string;
}) {
  return (
    <img
      className={className}
      src={imageUrl(v.image_url)}
      alt={`${v.brand} ${v.model}`}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = "/assets/placeholder.svg";
      }}
    />
  );
}
export function SearchBar() {
  const nav = useNavigate(),
    { data } = useStore();
  return (
    <form
      className="search-bar"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        nav("/cars?type=" + encodeURIComponent(String(f.get("type"))));
      }}
    >
      <label>
        Xe bạn muốn thuê
        <select name="type">
          <option value="">Tất cả mẫu xe</option>
          {data.vehicleTypes.map((t) => (
            <option key={t.type_id}>{t.type_name}</option>
          ))}
        </select>
      </label>
      <div className="search-description">
        <span className="eyebrow">BỘ SƯU TẬP VELORA</span>
        <p>Chọn xe và kiểm tra lịch thuê khi đặt xe.</p>
      </div>
      <button className="btn">
        Tìm xe
        <ArrowRight size={17} />
      </button>
    </form>
  );
}
export function VehicleCard({ v }: { v: Vehicle }) {
  return (
    <article className="vehicle-card">
      <Link to={"/cars/" + v.vehicle_id} className="car-photo">
        <VehicleImage v={v} />
        <span className="photo-tag">{v.type_name}</span>
      </Link>
      <div className="car-info">
        <span className="eyebrow">
          {v.type_name} {v.year && `· ${v.year}`}
        </span>
        <h3>
          <Link to={"/cars/" + v.vehicle_id}>
            {v.brand} {v.model}
          </Link>
        </h3>
        <Badge status={v.status} />
        <div className="car-bottom">
          <div>
            <b>{money(v.price_per_day)}</b>
            <small>/ ngày</small>
          </div>
          <Link className="mini-btn" to={"/cars/" + v.vehicle_id}>
            Xem xe
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function Summary({
  v,
  start,
  end,
  rental,
  amount,
  deposit,
}: {
  v: Vehicle;
  start: string;
  end: string;
  rental: string;
  amount?: number;
  deposit?: number;
}) {
  const estimated = quote(v.price_per_day, start, end, rental);
  return (
    <aside className="summary panel soft">
      <h3>Xe bạn đã chọn</h3>
      <VehicleImage v={v} />
      <h3>
        {v.brand} {v.model} {v.year}
      </h3>
      <p>
        {v.type_name} · {v.license_plate}
      </p>
      <div className="divider" />
      <Row name="Nhận xe" value={date(start)} />
      <Row name="Trả xe" value={date(end)} />
      <Row
        name="Hình thức"
        value={rental === "with-driver" ? "Có tài xế" : "Tự lái"}
      />
      <div className="divider" />
      <p>
        {money(v.price_per_day)} × {days(start, end)} ngày
      </p>
      {rental === "with-driver" && amount === undefined && (
        <Row name="Phí tài xế dự kiến" value={money(estimated.driverFee)} />
      )}
      <Row
        name={amount === undefined ? "Tiền thuê dự kiến" : "Tổng tiền thuê"}
        value={<b className="amount">{money(amount ?? estimated.total)}</b>}
      />
      <Row
        name={deposit === undefined ? "Cọc dự kiến (30%)" : "Tiền cọc (riêng)"}
        value={<b>{money(deposit ?? estimated.deposit)}</b>}
      />
      <p className="footnote">
        {amount === undefined
          ? "Giá dự kiến tính cả ngày nhận và ngày trả. Số tiền chính thức được xác nhận khi tạo đơn."
          : "Tiền thuê và tiền cọc được theo dõi riêng theo đơn."}
      </p>
    </aside>
  );
}
