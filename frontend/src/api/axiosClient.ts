import axios from "axios";
export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
export const backendOrigin = new URL(apiBaseUrl, window.location.origin).origin;
export const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});
axiosClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("velora.token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      sessionStorage.getItem("velora.token") &&
      !error.config?.url?.includes("/login")
    )
      window.dispatchEvent(new Event("velora-session-expired"));
    return Promise.reject(error);
  },
);
export function apiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response)
      return "Không kết nối được Backend. Hãy kiểm tra server và PostgreSQL.";
    return (
      error.response.data?.message ||
      `Yêu cầu thất bại (${error.response.status})`
    );
  }
  return error instanceof Error
    ? error.message
    : "Có lỗi xảy ra. Vui lòng thử lại.";
}
export function imageUrl(path: string | null): string {
  return path ? new URL(path, backendOrigin).href : "/assets/placeholder.svg";
}
