import { axiosClient } from "./axiosClient";
import { normalizeVehicle } from "./normalizers";
import type { Vehicle, VehicleType, Driver } from "../types";
export type VehicleInput = {
  type_id: number;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  price_per_day: number;
  status: string;
  description: string;
  image_url: string | null;
};
export const vehicleApi = {
  async list() {
    return (await axiosClient.get<Vehicle[]>("/vehicles")).data.map(
      normalizeVehicle,
    );
  },
  async detail(id: number) {
    return normalizeVehicle(
      (await axiosClient.get<Vehicle>("/vehicles/" + id)).data,
    );
  },
  async create(body: VehicleInput) {
    return (await axiosClient.post("/vehicles", body)).data;
  },
  async update(id: number, body: VehicleInput) {
    return (await axiosClient.patch("/vehicles/" + id, body)).data;
  },
  async remove(id: number) {
    return (await axiosClient.delete("/vehicles/" + id)).data;
  },
};
export const vehicleTypeApi = {
  async list() {
    return (await axiosClient.get<VehicleType[]>("/vehicle-types")).data;
  },
  async create(body: { type_name: string; description: string }) {
    return (await axiosClient.post("/vehicle-types", body)).data;
  },
  async update(id: number, body: { type_name: string; description: string }) {
    return (await axiosClient.patch("/vehicle-types/" + id, body)).data;
  },
  async remove(id: number) {
    return (await axiosClient.delete("/vehicle-types/" + id)).data;
  },
};
export const driverApi = {
  async list() {
    return (await axiosClient.get<Driver[]>("/drivers")).data;
  },
};
