import type { Vehicle, Booking, Payment } from "../types";
export const normalizeVehicle = (v: Vehicle): Vehicle => ({
  ...v,
  price_per_day: Number(v.price_per_day),
});
export const normalizeBooking = (b: Booking): Booking => ({
  ...b,
  start_date: b.start_date.slice(0, 10),
  end_date: b.end_date.slice(0, 10),
  actual_return_date: b.actual_return_date?.slice(0, 10) || null,
  total_amount: Number(b.total_amount),
  deposit_amount: Number(b.deposit_amount),
});
export const normalizePayment = (p: Payment): Payment => ({
  ...p,
  amount: Number(p.amount),
});
