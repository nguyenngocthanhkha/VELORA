import { axiosClient } from "./axiosClient";
import { normalizePayment } from "./normalizers";
import type { Payment } from "../types";
export const paymentApi = {
  async list() {
    return (
      await axiosClient.get<{ payments: Payment[] }>("/payments")
    ).data.payments.map(normalizePayment);
  },
  async create(body: {
    booking_id: number;
    amount: number;
    payment_method: string;
  }) {
    return normalizePayment(
      (await axiosClient.post<{ payment: Payment }>("/payments", body)).data
        .payment,
    );
  },
};
