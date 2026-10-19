import { axiosClient } from "./axiosClient";
import type { Review } from "../types";
export const reviewApi = {
  async list() {
    return (await axiosClient.get<{ reviews: Review[] }>("/reviews")).data
      .reviews;
  },
  async create(body: {
    user_id: number;
    vehicle_id: number;
    booking_id: number;
    rating: number;
    comment: string | null;
  }) {
    return (await axiosClient.post<{ review: Review }>("/reviews", body)).data
      .review;
  },
  async remove(id: number) {
    return (await axiosClient.delete("/reviews/" + id)).data;
  },
};
