export const money = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(n) + " ₫";
export const date = (s: string) =>
  new Date(s.slice(0, 10) + "T00:00:00").toLocaleDateString("vi-VN");
export const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
export const addDays = (s: string, n: number) =>
  new Date(Date.parse(s) + n * 86400000).toISOString().slice(0, 10);
export const days = (a: string, b: string) => {
  const diff = Math.floor((Date.parse(b) - Date.parse(a)) / 86400000);
  return Number.isFinite(diff) && diff >= 0 ? diff + 1 : 0;
};
export const quote = (
  price: number,
  start: string,
  end: string,
  rental: string,
) => {
  const base = price * days(start, end),
    driverFee = rental === "with-driver" ? base * 0.2 : 0,
    total = base + driverFee;
  return { base, driverFee, total, deposit: total * 0.3 };
};
export const labels: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  renting: "Đang thuê",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn cọc",
  forfeited: "Mất cọc",
  available: "Sẵn sàng",
  maintenance: "Bảo dưỡng",
  active: "Hoạt động",
  blocked: "Đã khóa",
  self_drive: "Tự lái",
  "self-drive": "Tự lái",
  "with-driver": "Có tài xế",
  customer: "Khách hàng",
  admin: "Quản trị viên",
};
