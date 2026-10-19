
import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  Badge,
  ButtonLink,
  Heading,
  Progress,
  RentalFields,
  Row,
  State,
} from "../components/ui";

import {
  Summary,
  VehicleImage,
} from "../components/vehicles";

import { useStore } from "../state/appStore";
import { bookingApi } from "../api/bookingApi";
import { reviewApi } from "../api/reviewApi";
import {
  axiosClient,
  apiError,
} from "../api/axiosClient";

import type { Booking } from "../types";
import {
  addDays,
  date,
  money,
  today,
} from "../utils/format";

// ========================================
// YÊU CẦU ĐĂNG NHẬP
// ========================================

function LoginRequired() {
  const loc = useLocation();

  return (
    <State
      title="Đăng nhập để tiếp tục"
      action={
        <ButtonLink
          to="/login"
          state={{ from: loc.pathname }}
        >
          Đăng nhập
        </ButtonLink>
      }
    />
  );
}

// ========================================
// 1. TRANG ĐẶT XE
// ========================================

export function BookingPage({
  confirm = false,
}: {
  confirm?: boolean;
}) {
  const { data, user, execute } = useStore();
  const { vehicleId } = useParams();
  const loc = useLocation();
  const nav = useNavigate();

  const incoming = loc.state || {};

  const [start, setStart] = useState(
    incoming.start || today()
  );

  const [end, setEnd] = useState(
    incoming.end || addDays(today(), 2)
  );

  const [rental, setRental] = useState(
    incoming.rental || "self-drive"
  );

  const [driver, setDriver] = useState(
    incoming.driver || ""
  );

  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const v = data.vehicles.find(
    (v) => v.vehicle_id === Number(vehicleId)
  );

  async function submit() {
    if (!user || !v) return;

    setBusy(true);
    setError("");

    try {
      const b = await execute(
        () =>
          bookingApi.create({
            user_id: user.user_id,
            vehicle_id: v.vehicle_id,
            start_date: start,
            end_date: end,
            rental_type: rental,
            ...(rental === "with-driver"
              ? { driver_id: Number(driver) }
              : {}),
          }),
        "Đã tạo đơn thuê."
      );

      nav("/payment/" + b.booking_id);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <LoginRequired />;

  if (!v) {
    return <State title="Không tìm thấy xe" />;
  }

  return (
    <div className="container page">
      <Heading
        eyebrow={`HÀNH TRÌNH / BƯỚC ${
          confirm ? "02" : "01"
        }`}
        title={
          confirm
            ? "Xác nhận đặt xe"
            : "Thông tin đặt xe"
        }
      />

      <Progress step={confirm ? 2 : 1} />

      <div className="detail-layout">
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();

            if (confirm) {
              void submit();
            } else {
              nav(
                `/booking/${vehicleId}/confirm`,
                {
                  state: {
                    start,
                    end,
                    rental,
                    driver,
                  },
                }
              );
            }
          }}
        >
          <h2>Thông tin người thuê</h2>

          <Row
            name="Họ tên"
            value={user.full_name}
          />

          <Row
            name="Email"
            value={user.email}
          />

          <Row
            name="Điện thoại"
            value={
              user.phone || "Chưa cập nhật"
            }
          />

          <div className="divider" />

          {confirm ? (
            <>
              <Row
                name="Ngày nhận"
                value={date(start)}
              />

              <Row
                name="Ngày trả"
                value={date(end)}
              />

              <Row
                name="Hình thức"
                value={
                  rental === "with-driver"
                    ? "Có tài xế"
                    : "Tự lái"
                }
              />

              {rental === "with-driver" && (
                <Row
                  name="Tài xế"
                  value={
                    data.drivers.find(
                      (d) =>
                        d.driver_id ===
                        Number(driver)
                    )?.full_name ||
                    "Chưa chọn"
                  }
                />
              )}

              <label className="checkbox">
                <input
                  required
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    setChecked(e.target.checked)
                  }
                />
                Tôi xác nhận thông tin đặt xe.
              </label>
            </>
          ) : (
            <>
              <RentalFields
                start={start}
                end={end}
                rental={rental}
                setStart={setStart}
                setEnd={setEnd}
                setRental={setRental}
              />

              {rental === "with-driver" && (
                <label>
                  Tài xế

                  <select
                    required
                    value={driver}
                    onChange={(e) =>
                      setDriver(e.target.value)
                    }
                  >
                    <option value="">
                      Chọn tài xế
                    </option>

                    {data.drivers
                      .filter(
                        (d) =>
                          d.status ===
                          "available"
                      )
                      .map((d) => (
                        <option
                          value={d.driver_id}
                          key={d.driver_id}
                        >
                          {d.full_name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
            </>
          )}

          {error && (
            <p
              role="alert"
              className="form-error"
            >
              {error}
            </p>
          )}

          <button
            className="btn full"
            disabled={
              busy ||
              end < start ||
              v.status !== "available" ||
              (confirm && !checked) ||
              (rental === "with-driver" &&
                !driver)
            }
          >
            {busy
              ? "Đang tạo đơn…"
              : confirm
                ? "Tạo đơn thuê"
                : "Tiếp tục xác nhận"}
          </button>

          {confirm && (
            <ButtonLink
              to={"/booking/" + vehicleId}
              state={{
                start,
                end,
                rental,
                driver,
              }}
              outline
            >
              Chỉnh sửa
            </ButtonLink>
          )}
        </form>

        <Summary
          v={v}
          start={start}
          end={end}
          rental={rental}
        />
      </div>
    </div>
  );
}

// ========================================
// 2. DANH SÁCH ĐƠN THUÊ
// ========================================

export function Orders() {
  const { data, user } = useStore();

  const [status, setStatus] = useState("");

  if (!user) return <LoginRequired />;

  const bookings = data.bookings.filter(
    (b) =>
      b.user_id === user.user_id &&
      (!status || b.status === status)
  );

  return (
    <div className="container page">
      <Heading
        eyebrow="TÀI KHOẢN / ĐƠN THUÊ"
        title="Hành trình của bạn."
      />

      <div className="tabs">
        {[
          ["", "Tất cả"],
          ["pending", "Chờ xác nhận"],
          ["confirmed", "Đã xác nhận"],
          ["completed", "Hoàn thành"],
          ["cancelled", "Đã hủy"],
        ].map(([value, text]) => (
          <button
            key={value}
            className={
              status === value ? "active" : ""
            }
            onClick={() => setStatus(value)}
          >
            {text}
          </button>
        ))}
      </div>

      {bookings.map((b) => {
        const v = data.vehicles.find(
          (v) =>
            v.vehicle_id === b.vehicle_id
        );

        return (
          <article
            className="panel order-card"
            key={b.booking_id}
          >
            {v && <VehicleImage v={v} />}

            <div>
              <span className="eyebrow">
                ĐƠN #{b.booking_id}
              </span>

              <h3>
                {v
                  ? `${v.brand} ${v.model}`
                  : "Xe #" + b.vehicle_id}
              </h3>

              <p>
                {date(b.start_date)} —{" "}
                {date(b.end_date)}
              </p>

              <Badge status={b.status} />

              <Badge
                status={b.deposit_status}
                deposit
              />
            </div>

            <div>
              <b>{money(b.total_amount)}</b>

              <p>
                Cọc: {money(b.deposit_amount)}
              </p>

              <ButtonLink
                to={
                  "/orders/" +
                  b.booking_id
                }
              >
                Chi tiết
              </ButtonLink>
            </div>
          </article>
        );
      })}

      {!bookings.length && (
        <State
          title="Chưa có đơn thuê phù hợp"
          action={
            <ButtonLink to="/cars">
              Chọn xe
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}

// ========================================
// 3. LẤY THÔNG TIN ĐƠN THUÊ
// ========================================

function useBooking() {
  const params = useParams();

  const id = Number(
    params.id || params.bookingId
  );

  const { data, user } = useStore();

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;

    if (!user) return;

    setError("");

    bookingApi
      .detail(id)
      .then((b) => {
        if (!live) return;

        if (
          user.role !== "admin" &&
          b.user_id !== user.user_id
        ) {
          setError(
            "Bạn không có quyền xem đơn này."
          );
        } else {
          setBooking(b);
        }
      })
      .catch((e) => {
        if (live) {
          setError(apiError(e));
        }
      });

    return () => {
      live = false;
    };
  }, [id, user, data.bookings]);

  return {
    b: booking,
    v: data.vehicles.find(
      (v) =>
        v.vehicle_id ===
        booking?.vehicle_id
    ),
    error,
    user,
    id,
  };
}

// ========================================
// 4. CHI TIẾT ĐƠN THUÊ
// ========================================

export function OrderDetail() {
  const {
    b,
    v,
    error,
    user,
    id,
  } = useBooking();

  const { execute } = useStore();

  const [busy, setBusy] = useState(false);
  const [end, setEnd] = useState("");

  async function action(
    work: () => Promise<unknown>,
    message: string
  ) {
    setBusy(true);

    try {
      await execute(work, message);
    } catch {
      // execute đã xử lý thông báo lỗi
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <LoginRequired />;

  if (error) {
    return <State title={error} />;
  }

  if (!b || !v) {
    return (
      <State
        title="Đang tải đơn thuê…"
        loading
      />
    );
  }

  return (
    <div className="container page">
      <Heading
        eyebrow={`ĐƠN THUÊ / #${id}`}
        title={`${v.brand} ${v.model}`}
      />

      <div className="detail-layout">
        <section className="panel">
          <h2>Thông tin đơn thuê</h2>

          <Row
            name="Trạng thái"
            value={
              <Badge status={b.status} />
            }
          />

          <Row
            name="Tiền cọc"
            value={
              <Badge
                status={b.deposit_status}
                deposit
              />
            }
          />

          <Row
            name="Người thuê"
            value={
              b.full_name || user.full_name
            }
          />

          <Row
            name="Email"
            value={
              b.email || user.email
            }
          />

          <Row
            name="Điện thoại"
            value={
              b.phone ||
              user.phone ||
              "Chưa cập nhật"
            }
          />

          {b.driver_name && (
            <Row
              name="Tài xế"
              value={`${b.driver_name} · ${
                b.driver_phone || ""
              }`}
            />
          )}

          <div className="divider" />

          {b.status === "pending" &&
            b.deposit_status ===
              "pending" && (
              <ButtonLink
                to={"/payment/" + id}
              >
                Thanh toán cọc
              </ButtonLink>
            )}

          {b.status === "confirmed" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();

                void action(
                  () =>
                    bookingApi.extend(
                      id,
                      end
                    ),
                  "Đã gia hạn đơn thuê."
                );
              }}
            >
              <label>
                Ngày trả mới

                <input
                  type="date"
                  required
                  min={addDays(
                    b.end_date,
                    1
                  )}
                  value={end}
                  onChange={(e) =>
                    setEnd(e.target.value)
                  }
                />
              </label>

              <button
                className="btn outline"
                disabled={busy}
              >
                Gia hạn
              </button>
            </form>
          )}

          {b.status === "confirmed" &&
            b.deposit_status ===
              "paid" && (
              <ButtonLink
                to={"/return/" + id}
              >
                Trả xe
              </ButtonLink>
            )}

          {b.status === "completed" && (
            <ButtonLink
              to={"/review/" + id}
            >
              Đánh giá chuyến đi
            </ButtonLink>
          )}

          {[
            "pending",
            "confirmed",
          ].includes(b.status) && (
            <button
              className="btn outline"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    "Bạn muốn hủy đơn thuê này?"
                  )
                ) {
                  void action(
                    () =>
                      bookingApi.cancel(id),
                    "Đã hủy đơn thuê."
                  );
                }
              }}
            >
              Hủy đơn thuê
            </button>
          )}

          {b.actual_return_date && (
            <Row
              name="Ngày trả thực tế"
              value={date(
                b.actual_return_date
              )}
            />
          )}
        </section>

        <Summary
          v={v}
          start={b.start_date}
          end={b.end_date}
          rental={b.rental_type}
          amount={b.total_amount}
          deposit={b.deposit_amount}
        />
      </div>
    </div>
  );
}

// ========================================
// 5. THANH TOÁN VNPAY SANDBOX
// ========================================

export function PaymentPage() {
  const {
    b,
    v,
    error,
    user,
    id,
  } = useBooking();

  const [busy, setBusy] = useState(false);
  const [message, setMessage] =
    useState("");

  async function handlePayment(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      // Gửi mã đơn lên Backend.
      // Backend lấy tiền cọc từ PostgreSQL.
      const response = await axiosClient.post(
        "/vnpay/create-payment",
        {
          booking_id: id,
        }
      );

      const paymentUrl =
        response.data?.payment_url;

      if (
        typeof paymentUrl !== "string" ||
        !paymentUrl
      ) {
        throw new Error(
          "Không nhận được link thanh toán VNPay."
        );
      }

      // Kiểm tra URL trước khi chuyển hướng
      const url = new URL(paymentUrl);

      if (
        url.protocol !== "https:" ||
        url.hostname !==
          "sandbox.vnpayment.vn" ||
        url.pathname !==
          "/paymentv2/vpcpay.html"
      ) {
        throw new Error(
          "Đường dẫn VNPay không hợp lệ."
        );
      }

      // Chuyển khách sang VNPay Sandbox
      window.location.assign(
        url.toString()
      );
    } catch (err) {
      console.error(
        "Lỗi thanh toán VNPay:",
        err
      );

      setMessage(
        err instanceof Error &&
        (
          err.message.includes("link thanh toán") ||
          err.message.includes("Đường dẫn")
        )
          ? err.message
          : apiError(err)
      );

      setBusy(false);
    }
  }

  if (!user) return <LoginRequired />;

  if (error) {
    return <State title={error} />;
  }

  if (!b || !v) {
    return (
      <State
        title="Đang tải đơn thuê…"
        loading
      />
    );
  }

  if (
    b.status !== "pending" ||
    b.deposit_status !== "pending"
  ) {
    return (
      <State
        title="Đơn này không cần thanh toán cọc"
        action={
          <ButtonLink
            to={"/orders/" + id}
          >
            Xem đơn thuê
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="container page">
      <Heading
        eyebrow="HÀNH TRÌNH / THANH TOÁN"
        title="Thanh toán tiền cọc"
      />

      <Progress step={3} />

      <div className="detail-layout">
        <form
          className="panel"
          onSubmit={handlePayment}
        >
          <h2>
            {money(b.deposit_amount)}
          </h2>

          <label>
            Phương thức thanh toán

            <select
              value="vnpay"
              disabled
            >
              <option value="vnpay">
                Thanh toán qua VNPay
              </option>
            </select>
          </label>
        <p>
          Thanh toán tiền cọc nhanh chóng và an toàn qua VNPay.
        </p>
          {message && (
            <p
              role="alert"
              className="form-error"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            className="btn full"
            disabled={busy}
          >
            {busy
              ? "Đang chuyển đến VNPay…"
              : "Thanh toán qua VNPay"}
          </button>

          <ButtonLink
            to={"/orders/" + id}
            outline
          >
            Quay lại đơn thuê
          </ButtonLink>
        </form>

        <Summary
          v={v}
          start={b.start_date}
          end={b.end_date}
          rental={b.rental_type}
          amount={b.total_amount}
          deposit={b.deposit_amount}
        />
      </div>
    </div>
  );
}

// ========================================
// 6. TRẢ XE
// ========================================

export function ReturnPage() {
  const {
    b,
    v,
    error,
    user,
    id,
  } = useBooking();

  const { execute, notify } =
    useStore();

  const nav = useNavigate();

  const [returned, setReturned] =
    useState(today());

  const [busy, setBusy] =
    useState(false);

  const [message, setMessage] =
    useState("");

  if (!user) return <LoginRequired />;

  if (error) {
    return <State title={error} />;
  }

  if (!b || !v) {
    return (
      <State
        title="Đang tải đơn thuê…"
        loading
      />
    );
  }

  if (
    b.status !== "confirmed" ||
    b.deposit_status !== "paid"
  ) {
    return (
      <State
        title="Đơn chưa đủ điều kiện trả xe"
        action={
          <ButtonLink
            to={"/orders/" + id}
          >
            Xem đơn thuê
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="container page">
      <Heading
        eyebrow={`ĐƠN THUÊ / #${id}`}
        title="Hoàn tất trả xe"
      />

      <form
        className="panel"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);

          try {
            const result = await execute(
              () =>
                bookingApi.returnVehicle(
                  id,
                  returned
                )
            );

            nav("/orders/" + id);

            notify(
              result.deposit_status ===
                "refunded"
                ? "Đã trả xe, cọc được hoàn lại."
                : "Đã trả xe, cọc bị giữ do trả trễ."
            );
          } catch (e) {
            setMessage(apiError(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>
          {v.brand} {v.model}
        </h2>

        <Row
          name="Hạn trả xe"
          value={date(b.end_date)}
        />

        <label>
          Ngày trả thực tế

          <input
            required
            type="date"
            min={b.start_date}
            value={returned}
            onChange={(e) =>
              setReturned(e.target.value)
            }
          />
        </label>

        <p>
          Backend xác định hoàn cọc
          hoặc giữ cọc theo ngày trả
          thực tế.
        </p>

        {message && (
          <p role="alert">
            {message}
          </p>
        )}

        <button
          className="btn"
          disabled={busy}
        >
          {busy
            ? "Đang xử lý…"
            : "Xác nhận trả xe"}
        </button>
      </form>
    </div>
  );
}

// ========================================
// 7. ĐÁNH GIÁ XE
// ========================================

export function ReviewPage() {
  const {
    b,
    v,
    error,
    user,
    id,
  } = useBooking();

  const { data, execute } =
    useStore();

  const nav = useNavigate();

  const [rating, setRating] =
    useState(5);

  const [comment, setComment] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [message, setMessage] =
    useState("");

  if (!user) return <LoginRequired />;

  if (error) {
    return <State title={error} />;
  }

  if (!b || !v) {
    return (
      <State
        title="Đang tải đơn thuê…"
        loading
      />
    );
  }

  if (
    b.status !== "completed" ||
    data.reviews.some(
      (r) => r.booking_id === id
    )
  ) {
    return (
      <State
        title={
          b.status !== "completed"
            ? "Hoàn tất chuyến đi trước khi đánh giá"
            : "Bạn đã đánh giá chuyến đi này"
        }
        action={
          <ButtonLink
            to={"/orders/" + id}
          >
            Xem đơn thuê
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="container page">
      <Heading
        eyebrow="VELORA / ĐÁNH GIÁ"
        title="Chia sẻ hành trình của bạn."
      />

      <form
        className="panel"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);

          try {
            await execute(
              () =>
                reviewApi.create({
                  user_id: user.user_id,
                  vehicle_id: b.vehicle_id,
                  booking_id: id,
                  rating,
                  comment:
                    comment || null,
                }),
              "Đã gửi đánh giá."
            );

            nav("/orders/" + id);
          } catch (e) {
            setMessage(apiError(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>
          {v.brand} {v.model}
        </h2>

        <label>
          Số sao

          <select
            value={rating}
            onChange={(e) =>
              setRating(
                Number(e.target.value)
              )
            }
          >
            {[5, 4, 3, 2, 1].map(
              (n) => (
                <option
                  key={n}
                  value={n}
                >
                  {n} sao
                </option>
              )
            )}
          </select>
        </label>

        <label>
          Nhận xét

          <textarea
            maxLength={2000}
            value={comment}
            onChange={(e) =>
              setComment(e.target.value)
            }
          />
        </label>

        {message && (
          <p role="alert">
            {message}
          </p>
        )}

        <button
          className="btn"
          disabled={busy}
        >
          {busy
            ? "Đang gửi…"
            : "Gửi đánh giá"}
        </button>
      </form>
    </div>
  );
}
