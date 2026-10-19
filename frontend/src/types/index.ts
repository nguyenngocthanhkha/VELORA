export interface Vehicle {
  vehicle_id: number;
  type_id?: number;
  brand: string;
  model: string;
  year: number | null;
  license_plate: string;
  price_per_day: number;
  status: string;
  description: string | null;
  image_url: string | null;
  type_name: string;
}
export interface Booking {
  booking_id: number;
  user_id: number;
  vehicle_id: number;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
  rental_type: string;
  deposit_amount: number;
  deposit_status: string;
  actual_return_date: string | null;
  driver_id: number | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  full_name?: string;
  email?: string;
  phone?: string | null;
}
export interface Review {
  review_id: number;
  user_id: number;
  vehicle_id: number;
  booking_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  full_name?: string;
  brand?: string;
  model?: string;
}
export interface User {
  user_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: "customer" | "admin";
  status: string;
}
export interface Payment {
  payment_id: number;
  booking_id: number;
  user_id?: number;
  amount: number;
  payment_method: string;
  payment_status: string;
  paid_at: string | null;
  full_name?: string;
}
export interface VehicleType {
  type_id: number;
  type_name: string;
  description: string | null;
}
export interface Driver {
  driver_id: number;
  full_name: string;
  phone: string;
  license_number: string;
  status: string;
}
export interface Dataset {
  vehicles: Vehicle[];
  bookings: Booking[];
  users: User[];
  reviews: Review[];
  payments: Payment[];
  vehicleTypes: VehicleType[];
  drivers: Driver[];
}
export interface BookingInput {
  user_id: number;
  vehicle_id: number;
  start_date: string;
  end_date: string;
  rental_type: string;
  driver_id?: number;
}
