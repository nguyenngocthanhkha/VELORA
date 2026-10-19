import { useState } from "react";
import { Link, NavLink, Navigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Badge, Heading, Modal, Stat, State } from "../components/ui";
import { useStore } from "../state/appStore";
import { vehicleApi, vehicleTypeApi } from "../api/vehicleApi";
import { userApi } from "../api/userApi";
import { reviewApi } from "../api/reviewApi";
import { apiError } from "../api/axiosClient";
import { money, date } from "../utils/format";
import type { Vehicle, VehicleType, User } from "../types";
const navigation = [
  ["", "Dashboard"],
  ["users", "Người dùng"],
  ["types", "Loại xe"],
  ["vehicles", "Xe"],
  ["bookings", "Đơn thuê"],
  ["payments", "Thanh toán"],
  ["reviews", "Đánh giá"],
];
type Editing =
  | { kind: "vehicles"; value?: Vehicle }
  | { kind: "types"; value?: VehicleType }
  | { kind: "users"; value: User };
export function Admin() {
  const { data, user, execute } = useStore(),
    loc = useLocation(),
    section = loc.pathname.split("/")[2] || "",
    [open, setOpen] = useState(false),
    [search, setSearch] = useState(""),
    [editing, setEditing] = useState<Editing | null>(null),
    [busy, setBusy] = useState(false);
  if (!user)
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (user.role !== "admin")
    return <State title="Tài khoản không có quyền quản trị" />;
  async function remove(work: () => Promise<unknown>) {
    if (!window.confirm("Xác nhận xóa dữ liệu này?")) return;
    setBusy(true);
    try {
      await execute(work, "Đã xóa dữ liệu.");
    } catch {
    } finally {
      setBusy(false);
    }
  }
  const matches = (s: string) => s.toLowerCase().includes(search.toLowerCase());
  return (
    <div className="admin-layout">
      <aside className={"admin-sidebar " + (open ? "open" : "")}>
        <Link to="/" className="logo">
          VELORA
        </Link>
        <span className="eyebrow">QUẢN TRỊ</span>
        <nav>
          {navigation.map(([p, t]) => (
            <NavLink
              end
              key={p}
              to={"/admin" + (p ? "/" + p : "")}
              onClick={() => {
                setOpen(false);
                setSearch("");
              }}
            >
              {t}
            </NavLink>
          ))}
        </nav>
        <Link className="back-site" to="/">
          Về website
        </Link>
      </aside>
      <div className="admin-content">
        <div className="admin-top">
          <button
            className="menu-toggle"
            aria-label="Mở menu quản trị"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <span>
            VELORA / Quản trị / {navigation.find(([p]) => p === section)?.[1]}
          </span>
          <div>{user.full_name}</div>
        </div>
        <div className="admin-body">
          <Heading
            eyebrow="QUẢN TRỊ VELORA"
            title={
              navigation.find(([p]) => p === section)?.[1] ||
              "Không tìm thấy trang"
            }
          />
          {!section ? (
            <>
              <div className="stats">
                <Stat title="Người dùng" value={data.users.length} />
                <Stat title="Xe" value={data.vehicles.length} />
                <Stat title="Đơn thuê" value={data.bookings.length} />
                <Stat
                  title="Cọc đã ghi nhận"
                  value={money(
                    data.payments
                      .filter((p) => p.payment_status === "paid")
                      .reduce((s, p) => s + p.amount, 0),
                  )}
                />
              </div>
              <section className="panel">
                <h3>Đơn thuê gần đây</h3>
                {data.bookings.slice(0, 8).map((b) => (
                  <p key={b.booking_id}>
                    <Link to={"/orders/" + b.booking_id}>
                      Đơn #{b.booking_id} · {b.full_name}
                    </Link>{" "}
                    · <Badge status={b.status} />
                  </p>
                ))}
              </section>
            </>
          ) : (
            <>
              <div className="admin-toolbar">
                <label>
                  Tìm kiếm
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm trong danh sách"
                  />
                </label>
                {(section === "vehicles" || section === "types") && (
                  <button
                    className="btn"
                    onClick={() => setEditing({ kind: section })}
                  >
                    Thêm {section === "vehicles" ? "xe" : "loại xe"}
                  </button>
                )}
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {(section === "vehicles"
                        ? [
                            "ID",
                            "Xe",
                            "Loại xe",
                            "Giá / ngày",
                            "Trạng thái",
                            "Thao tác",
                          ]
                        : section === "types"
                          ? ["ID", "Tên loại", "Mô tả", "Thao tác"]
                          : section === "users"
                            ? [
                                "ID",
                                "Họ tên",
                                "Email",
                                "Điện thoại",
                                "Vai trò",
                                "Trạng thái",
                                "Thao tác",
                              ]
                            : section === "bookings"
                              ? [
                                  "ID",
                                  "Người thuê",
                                  "Xe",
                                  "Ngày thuê",
                                  "Tổng tiền",
                                  "Trạng thái",
                                  "Chi tiết",
                                ]
                              : section === "payments"
                                ? [
                                    "ID",
                                    "Đơn thuê",
                                    "Khách hàng",
                                    "Số tiền",
                                    "Phương thức",
                                    "Trạng thái",
                                    "Ngày trả",
                                  ]
                                : [
                                    "ID",
                                    "Khách hàng",
                                    "Xe",
                                    "Số sao",
                                    "Nội dung",
                                    "Thao tác",
                                  ]
                      ).map((t) => (
                        <th key={t}>{t}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section === "vehicles" &&
                      data.vehicles
                        .filter((v) =>
                          matches(`${v.brand} ${v.model} ${v.license_plate}`),
                        )
                        .map((v) => (
                          <tr key={v.vehicle_id}>
                            <td>{v.vehicle_id}</td>
                            <td>
                              {v.brand} {v.model}
                              <small>{v.license_plate}</small>
                            </td>
                            <td>{v.type_name}</td>
                            <td>{money(v.price_per_day)}</td>
                            <td>
                              <Badge status={v.status} />
                            </td>
                            <td>
                              <button
                                onClick={() =>
                                  setEditing({ kind: "vehicles", value: v })
                                }
                              >
                                Sửa
                              </button>
                              <button
                                disabled={busy}
                                onClick={() =>
                                  void remove(() =>
                                    vehicleApi.remove(v.vehicle_id),
                                  )
                                }
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                    {section === "types" &&
                      data.vehicleTypes
                        .filter((t) => matches(t.type_name))
                        .map((t) => (
                          <tr key={t.type_id}>
                            <td>{t.type_id}</td>
                            <td>{t.type_name}</td>
                            <td>{t.description || "—"}</td>
                            <td>
                              <button
                                onClick={() =>
                                  setEditing({ kind: "types", value: t })
                                }
                              >
                                Sửa
                              </button>
                              <button
                                disabled={busy}
                                onClick={() =>
                                  void remove(() =>
                                    vehicleTypeApi.remove(t.type_id),
                                  )
                                }
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                    {section === "users" &&
                      data.users
                        .filter((u) => matches(`${u.full_name} ${u.email}`))
                        .map((u) => (
                          <tr key={u.user_id}>
                            <td>{u.user_id}</td>
                            <td>{u.full_name}</td>
                            <td>{u.email}</td>
                            <td>{u.phone || "—"}</td>
                            <td>
                              <Badge status={u.role} />
                            </td>
                            <td>
                              <Badge status={u.status} />
                            </td>
                            <td>
                              <button
                                onClick={() =>
                                  setEditing({ kind: "users", value: u })
                                }
                              >
                                Sửa
                              </button>
                              <button
                                disabled={busy || u.user_id === user.user_id}
                                onClick={async () => {
                                  setBusy(true);
                                  try {
                                    await execute(
                                      () =>
                                        userApi.status(
                                          u.user_id,
                                          u.status === "blocked"
                                            ? "active"
                                            : "blocked",
                                        ),
                                      "Đã cập nhật trạng thái tài khoản.",
                                    );
                                  } catch {
                                  } finally {
                                    setBusy(false);
                                  }
                                }}
                              >
                                {u.status === "blocked" ? "Mở khóa" : "Khóa"}
                              </button>
                            </td>
                          </tr>
                        ))}
                    {section === "bookings" &&
                      data.bookings
                        .filter((b) =>
                          matches(`${b.booking_id} ${b.full_name || ""}`),
                        )
                        .map((b) => (
                          <tr key={b.booking_id}>
                            <td>{b.booking_id}</td>
                            <td>{b.full_name || b.user_id}</td>
                            <td>
                              {data.vehicles.find(
                                (v) => v.vehicle_id === b.vehicle_id,
                              )?.model || b.vehicle_id}
                            </td>
                            <td>
                              {date(b.start_date)} — {date(b.end_date)}
                            </td>
                            <td>{money(b.total_amount)}</td>
                            <td>
                              <Badge status={b.status} />
                              <Badge status={b.deposit_status} deposit />
                            </td>
                            <td>
                              <Link to={"/orders/" + b.booking_id}>
                                Xem đơn
                              </Link>
                            </td>
                          </tr>
                        ))}
                    {section === "payments" &&
                      data.payments
                        .filter((p) =>
                          matches(
                            `${p.payment_id} ${p.booking_id} ${p.full_name || ""}`,
                          ),
                        )
                        .map((p) => (
                          <tr key={p.payment_id}>
                            <td>{p.payment_id}</td>
                            <td>
                              <Link to={"/orders/" + p.booking_id}>
                                #{p.booking_id}
                              </Link>
                            </td>
                            <td>{p.full_name || p.user_id}</td>
                            <td>{money(p.amount)}</td>
                            <td>
                              {p.payment_method === "cash"
                                ? "Tiền mặt"
                                : p.payment_method === "bank_transfer"
                                  ? "Chuyển khoản"
                                  : p.payment_method}
                            </td>
                            <td>
                              <Badge status={p.payment_status} />
                            </td>
                            <td>{p.paid_at ? date(p.paid_at) : "—"}</td>
                          </tr>
                        ))}
                    {section === "reviews" &&
                      data.reviews
                        .filter((r) =>
                          matches(`${r.full_name || ""} ${r.comment || ""}`),
                        )
                        .map((r) => (
                          <tr key={r.review_id}>
                            <td>{r.review_id}</td>
                            <td>{r.full_name || r.user_id}</td>
                            <td>
                              {data.vehicles.find(
                                (v) => v.vehicle_id === r.vehicle_id,
                              )?.model || r.vehicle_id}
                            </td>
                            <td>{r.rating}/5</td>
                            <td>{r.comment || "—"}</td>
                            <td>
                              <button
                                disabled={busy}
                                onClick={() =>
                                  void remove(() =>
                                    reviewApi.remove(r.review_id),
                                  )
                                }
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
              {section === "payments" && (
                <p className="footnote">
                  Giao dịch được ghi nhận từ bước thanh toán cọc của đơn thuê.
                </p>
              )}
            </>
          )}
          {editing && (
            <Editor editing={editing} onClose={() => setEditing(null)} />
          )}
        </div>
      </div>
    </div>
  );
}
function Editor({
  editing,
  onClose,
}: {
  editing: Editing;
  onClose: () => void;
}) {
  const { data, execute } = useStore(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    v = editing.value;
  const field = (
    name: string,
    label: string,
    value: string | number | null | undefined,
    type = "text",
  ) => (
    <label key={name}>
      {label}
      <input
        name={name}
        type={type}
        defaultValue={value ?? ""}
        required={!["description", "image_url", "phone"].includes(name)}
        {...(type === "number"
          ? { min: name === "year" ? 1900 : 1, step: "1" }
          : {})}
      />
    </label>
  );
  return (
    <Modal
      title={
        (v ? "Cập nhật" : "Thêm") +
        " " +
        (editing.kind === "vehicles"
          ? "xe"
          : editing.kind === "types"
            ? "loại xe"
            : "người dùng")
      }
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget),
            s = (key: string) => String(f.get(key) || "");
          setBusy(true);
          setError("");
          try {
            await execute(async () => {
              if (editing.kind === "types") {
                const body = {
                  type_name: s("type_name"),
                  description: s("description"),
                };
                return editing.value
                  ? vehicleTypeApi.update(editing.value.type_id, body)
                  : vehicleTypeApi.create(body);
              }
              if (editing.kind === "users")
                return userApi.update(editing.value.user_id, {
                  full_name: s("full_name"),
                  email: s("email"),
                  phone: s("phone"),
                });
              const body = {
                type_id: Number(s("type_id")),
                brand: s("brand"),
                model: s("model"),
                year: Number(s("year")),
                license_plate: s("license_plate"),
                price_per_day: Number(s("price_per_day")),
                status: s("status"),
                description: s("description"),
                image_url: s("image_url") || null,
              };
              return editing.value
                ? vehicleApi.update(editing.value.vehicle_id, body)
                : vehicleApi.create(body);
            }, "Đã lưu dữ liệu.");
            onClose();
          } catch (e) {
            setError(apiError(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {editing.kind === "vehicles" ? (
          <>
            {field("brand", "Hãng xe", editing.value?.brand)}
            {field("model", "Tên xe", editing.value?.model)}
            {field(
              "year",
              "Năm sản xuất",
              editing.value?.year || new Date().getFullYear(),
              "number",
            )}
            {field("license_plate", "Biển số", editing.value?.license_plate)}
            {field(
              "price_per_day",
              "Giá thuê / ngày",
              editing.value?.price_per_day,
              "number",
            )}
            <label>
              Loại xe
              <select
                required
                name="type_id"
                defaultValue={
                  data.vehicleTypes.find(
                    (t) => t.type_name === editing.value?.type_name,
                  )?.type_id || ""
                }
              >
                <option value="">Chọn loại xe</option>
                {data.vehicleTypes.map((t) => (
                  <option key={t.type_id} value={t.type_id}>
                    {t.type_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Trạng thái
              <select
                name="status"
                defaultValue={editing.value?.status || "available"}
              >
                {["available", "rented", "maintenance"].map((s) => (
                  <option key={s} value={s}>
                    {s === "available"
                      ? "Sẵn sàng"
                      : s === "rented"
                        ? "Đang thuê"
                        : "Bảo trì"}
                  </option>
                ))}
              </select>
            </label>
            {field("image_url", "Đường dẫn ảnh", editing.value?.image_url)}
            {field("description", "Mô tả", editing.value?.description)}
          </>
        ) : editing.kind === "types" ? (
          <>
            {field("type_name", "Tên loại xe", editing.value?.type_name)}
            {field("description", "Mô tả", editing.value?.description)}
          </>
        ) : (
          <>
            {field("full_name", "Họ tên", editing.value.full_name)}
            {field("email", "Email", editing.value.email, "email")}
            {field("phone", "Điện thoại", editing.value.phone)}
          </>
        )}
        {error && <p role="alert">{error}</p>}
        <button className="btn full" disabled={busy}>
          {busy ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
      </form>
    </Modal>
  );
}
