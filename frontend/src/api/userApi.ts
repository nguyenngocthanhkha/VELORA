import { axiosClient } from "./axiosClient";
import type { User } from "../types";
export const userApi = {
  async login(email: string, password: string) {
    return (
      await axiosClient.post<{ token: string; user: User; message: string }>(
        "/users/login",
        { email, password },
      )
    ).data;
  },
  async register(body: {
    full_name: string;
    email: string;
    password: string;
    phone: string;
  }) {
    return (
      await axiosClient.post<{ user: User; message: string }>(
        "/users/register",
        body,
      )
    ).data;
  },
  async list() {
    return (await axiosClient.get<User[]>("/users")).data;
  },
  async update(
    id: number,
    body: { full_name: string; email: string; phone: string },
  ) {
    return (await axiosClient.patch<{ user: User }>("/users/" + id, body)).data
      .user;
  },
  async status(id: number, status: string) {
    return (
      await axiosClient.patch<{ user: User }>(`/users/${id}/status`, { status })
    ).data.user;
  },
};
