import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Badge,
  ButtonLink,
  Heading,
  RentalFields,
  Row,
  Stars,
  State,
} from "../components/ui";
import {
  SearchBar,
  Summary,
  VehicleCard,
  VehicleImage,
} from "../components/vehicles";
import { useStore } from "../state/appStore";
import { vehicleApi } from "../api/vehicleApi";
import { apiError } from "../api/axiosClient";
import type { Vehicle } from "../types";
import { addDays, money, today } from "../utils/format";
export function Home() {
  const { data } = useStore();
  return (
    <>
      <section className="hero">
        <img src="/assets/hero.png" alt="Ô tô bên thành phố lúc hoàng hôn" />
        <div className="hero-shade" />
        <div className="container hero-content">
          <span className="eyebrow">VELORA / THUÊ XE Ô TÔ</span>
          <h1>
            Trải nghiệm
            <br />
            cảm giác mới.
          </h1>
          <p>
            Một chiếc xe phù hợp. Một hành trình theo cách của bạn.
            <br />
            Thuê xe tự lái hoặc có tài xế cùng VELORA.
          </p>
          <ButtonLink to="/cars">Tìm chiếc xe của bạn</ButtonLink>
        </div>
      </section>
      <div className="search-wrap">
        <div className="container">
          <SearchBar />
        </div>
      </div>
      <section className="container section" id="about">
        <span className="eyebrow">01 / VỀ VELORA</span>
        <div className="intro">
          <h2>
            Tự do bắt đầu
            <br />
            từ một lựa chọn.
          </h2>
          <p>
            Đi công tác, trở về nhà hay khám phá một nơi mới.
            <br />
            Chọn chiếc xe phù hợp và để hành trình thuộc về bạn.
          </p>
        </div>
        <div className="benefit-grid">
          {[
            "Xe cho mọi hành trình",
            "Giá thuê minh bạch",
            "Đặt xe thuận tiện",
          ].map((s, i) => (
            <article key={s}>
              <span className="eyebrow">0{i + 1}</span>
              <h3>{s}</h3>
            </article>
          ))}
        </div>
      </section>
      <section className="container section">
        <Heading
          eyebrow="02 / BỘ SƯU TẬP"
          title="Chiếc xe cho hành trình của bạn."
        />
        <div className="vehicle-grid">
          {data.vehicles.slice(0, 3).map((v) => (
            <VehicleCard key={v.vehicle_id} v={v} />
          ))}
        </div>
        {!data.vehicles.length && <State title="Chưa có xe để hiển thị" />}
        <ButtonLink to="/cars" outline>
          Khám phá tất cả xe
        </ButtonLink>
      </section>
      <section className="container section" id="reviews">
        <Heading
          eyebrow="03 / KHÁCH HÀNG"
          title="Những hành trình đã đi cùng nhau."
        />
        <div className="review-grid">
          {data.reviews.slice(0, 3).map((r) => (
            <article className="panel" key={r.review_id}>
              <Stars rating={r.rating} />
              <p>{r.comment || "Khách hàng đã đánh giá chuyến đi."}</p>
              <b>{r.full_name || "Khách hàng"}</b>
            </article>
          ))}
        </div>
        {!data.reviews.length && <p>Chưa có đánh giá.</p>}
      </section>
      <section className="cta">
        <div className="container">
          <span className="eyebrow">VELORA / HÀNH TRÌNH MỚI</span>
          <h2>Bạn đã sẵn sàng lên đường?</h2>
          <ButtonLink to="/cars">Chọn xe ngay</ButtonLink>
        </div>
      </section>
    </>
  );
}
export function Cars() {
  const { data } = useStore(),
    [params] = useSearchParams(),
    [type, setType] = useState(params.get("type") || ""),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState(""),
    [available, setAvailable] = useState(false);
  const cars = data.vehicles
    .filter(
      (v) =>
        (!type || v.type_name === type) &&
        (!available || v.status === "available") &&
        `${v.brand} ${v.model}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "asc"
        ? a.price_per_day - b.price_per_day
        : sort === "desc"
          ? b.price_per_day - a.price_per_day
          : 0,
    );
  return (
    <div className="container page">
      <Heading
        eyebrow="VELORA / BỘ SƯU TẬP"
        title="Chọn xe. Bắt đầu hành trình."
        description="Tìm chiếc xe phù hợp với nhu cầu của bạn."
      />
      <div className="catalog-layout">
        <aside className="panel filters">
          <h3>Bộ lọc</h3>
          <label>
            Tìm kiếm
            <input
              placeholder="Hãng hoặc tên xe"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label>
            Loại xe
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Tất cả</option>
              {data.vehicleTypes.map((t) => (
                <option key={t.type_id}>{t.type_name}</option>
              ))}
            </select>
          </label>
          <label>
            Giá thuê
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="">Mặc định</option>
              <option value="asc">Thấp đến cao</option>
              <option value="desc">Cao đến thấp</option>
            </select>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />
            Chỉ xe sẵn sàng
          </label>
          <button
            className="btn outline"
            onClick={() => {
              setType("");
              setSearch("");
              setSort("");
              setAvailable(false);
            }}
          >
            Xóa bộ lọc
          </button>
        </aside>
        <div>
          <p>{cars.length} xe phù hợp</p>
          <div className="vehicle-grid">
            {cars.map((v) => (
              <VehicleCard key={v.vehicle_id} v={v} />
            ))}
          </div>
          {!cars.length && <State title="Không có xe phù hợp" />}
        </div>
      </div>
    </div>
  );
}
export function Detail() {
  const { id } = useParams(),
    { data } = useStore(),
    nav = useNavigate(),
    [v, setV] = useState<Vehicle | null>(null),
    [error, setError] = useState(""),
    [start, setStart] = useState(today()),
    [end, setEnd] = useState(addDays(today(), 2)),
    [rental, setRental] = useState("self-drive");
  useEffect(() => {
    let live = true;
    setV(null);
    setError("");
    vehicleApi
      .detail(Number(id))
      .then((v) => {
        if (live) setV(v);
      })
      .catch((e) => {
        if (live) setError(apiError(e));
      });
    return () => {
      live = false;
    };
  }, [id]);
  if (error)
    return (
      <State
        title={error}
        action={<ButtonLink to="/cars">Danh sách xe</ButtonLink>}
      />
    );
  if (!v) return <State title="Đang tải thông tin xe…" loading />;
  return (
    <div className="container page">
      <Heading
        eyebrow={`VELORA / ${v.type_name}`}
        title={`${v.brand} ${v.model}`}
        description={v.description || undefined}
      />
      <div className="detail-layout">
        <div>
          <div className="detail-photo">
            <VehicleImage v={v} />
          </div>
          <section className="panel">
            <h2>Thông tin xe</h2>
            <Row name="Hãng xe" value={v.brand} />
            <Row name="Năm sản xuất" value={v.year || "Chưa cập nhật"} />
            <Row name="Biển số" value={v.license_plate} />
            <Row name="Loại xe" value={v.type_name} />
            <Row name="Giá thuê / ngày" value={money(v.price_per_day)} />
            <Row name="Trạng thái" value={<Badge status={v.status} />} />
          </section>
          <section className="panel">
            <h2>Đánh giá khách hàng</h2>
            {data.reviews
              .filter((r) => r.vehicle_id === v.vehicle_id)
              .map((r) => (
                <article key={r.review_id}>
                  <Stars rating={r.rating} />
                  <p>{r.comment}</p>
                  <small>{r.full_name || "Khách hàng"}</small>
                </article>
              ))}
            {!data.reviews.some((r) => r.vehicle_id === v.vehicle_id) && (
              <p>Xe chưa có đánh giá.</p>
            )}
          </section>
        </div>
        <div>
          <form
            className="panel"
            onSubmit={(e) => {
              e.preventDefault();
              nav("/booking/" + v.vehicle_id, {
                state: { start, end, rental },
              });
            }}
          >
            <h3>Đặt xe cho hành trình</h3>
            <RentalFields
              {...{ start, end, rental, setStart, setEnd, setRental }}
            />
            <button
              className="btn full"
              disabled={v.status !== "available" || end < start}
            >
              Đặt xe
            </button>
          </form>
          <Summary {...{ v, start, end, rental }} />
        </div>
      </div>
    </div>
  );
}
