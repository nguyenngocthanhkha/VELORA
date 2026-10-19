import { axiosClient } from "./axiosClient";
import { normalizeBooking } from "./normalizers";
import type { Booking, BookingInput } from "../types";
export const bookingApi = {
  async list() {
    return (
      await axiosClient.get<{ bookings: Booking[] }>("/bookings")
    ).data.bookings.map(normalizeBooking);
  },
  async detail(id: number) {
    return normalizeBooking(
      (await axiosClient.get<{ booking: Booking }>("/bookings/" + id)).data
        .booking,
    );
  },
  async create(body: BookingInput) {
    return normalizeBooking(
      (await axiosClient.post<{ booking: Booking }>("/bookings", body)).data
        .booking,
    );
  },
  async cancel(id: number) {
    return normalizeBooking(
      (await axiosClient.patch<{ booking: Booking }>(`/bookings/${id}/cancel`))
        .data.booking,
    );
  },
  async extend(id: number, new_end_date: string) {
    return (
      await axiosClient.patch<{
        booking: Booking;
        extra_days: number;
        extra_amount: number;
      }>(`/bookings/${id}/extend`, { new_end_date })
    ).data;
  },
  async returnVehicle(id: number, actual_return_date: string) {
    return normalizeBooking(
      (
        await axiosClient.patch<{ booking: Booking }>(
          `/bookings/${id}/return`,
          { actual_return_date },
        )
      ).data.booking,
    );
  },
};
