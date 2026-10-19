import { createContext, useContext } from "react";
import type { Dataset, User } from "../types";
export type Store = {
  data: Dataset;
  user: User | null;
  setUser: (u: User | null) => void;
  notify: (s: string) => void;
  refresh: () => Promise<void>;
  execute: <T>(work: () => Promise<T>, message?: string) => Promise<T>;
  loading: boolean;
  error: string;
};
export const Context = createContext<Store>(null!);
export const useStore = () => useContext(Context);
export const initial: Dataset = {
  vehicles: [],
  bookings: [],
  users: [],
  reviews: [],
  payments: [],
  vehicleTypes: [],
  drivers: [],
};
