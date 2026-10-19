# VELORA — frontend kết nối API

Frontend React + TypeScript + Vite tại `C:\WED\frontend`; Express tại `C:\WED\backend`; PostgreSQL dump tại `C:\WED\database\velora_db.sql`. DBeaver là công cụ quản lý PostgreSQL.

## Chạy trên máy

1. Kiểm tra kết nối PostgreSQL trong DBeaver. Điền cấu hình thật trong `C:\WED\backend\.env` theo `.env.example`. Không đưa file này vào git.
2. Database cần có các bảng trong file SQL. Chỉ khôi phục dump vào database mới/rỗng, không ghi đè database đang có dữ liệu. Dump chứa lệnh COPY và lệnh riêng của psql; sử dụng PostgreSQL 18 `psql` hoặc công cụ restore tương thích.
3. Mở terminal backend:

```powershell
cd C:\WED\backend
npm run dev
```

4. Mở terminal frontend:

```powershell
cd C:\WED\frontend
npm run dev
```

Mở `http://localhost:5173`. Backend mặc định `http://localhost:5000/api`; có thể cấu hình frontend bằng `VITE_API_BASE_URL` trong `.env.local` theo `.env.example` rồi khởi động lại Vite.

## Cấu trúc và luồng dữ liệu

```text
src/pages/             Catalog, Account, Rental, Admin
src/components/        Layout, form, thông báo, thẻ xe
src/api/               Axios, user/vehicle/booking/payment/review API
src/api/normalizers.ts Chuyển số tiền PostgreSQL thành number
src/state/appStore.tsx Trạng thái dữ liệu trả về từ server
src/main.tsx           Session, tải dữ liệu, routes và tải lại sau mutation
src/types/             Kiểu dữ liệu API
tests/ui.mjs           Kiểm thử trình duyệt theo hợp đồng API
```

Giao diện → API service → Express → PostgreSQL → response → cập nhật giao diện. Đăng nhập lấy JWT thật; sessionStorage chỉ giữ phiên đăng nhập, dữ liệu nghiệp vụ tải lại từ backend. Ảnh xe lấy từ đường dẫn backend, thiếu ảnh dùng hình trung tính.

Đặt xe gửi xe, khách hàng, ngày thuê, hình thức và tài xế. Backend tính tiền và cọc. Thanh toán cọc ghi nhận giao dịch qua API hiện có, không tích hợp cổng thanh toán. Gia hạn cập nhật trực tiếp khi backend chấp nhận. Trả xe để backend quyết định trạng thái cọc. Đánh giá chỉ cho đơn hoàn thành. Quản trị dùng API thêm/sửa/xóa xe, loại xe, sửa thông tin/khóa người dùng và xóa đánh giá.

Không có dữ liệu mẫu trong ứng dụng. Bản demo ban đầu đã được lưu trong `C:\WED\archive\velora-demo.bundle`. Các fixture của kiểm thử chỉ chạy trong trình duyệt test.

## Kiểm tra

```powershell
npm run build
node tests\ui.mjs
```

Test UI dùng phản hồi API kiểm thử, không chứng minh kết nối PostgreSQL. Kiểm thử dữ liệu thật đã đạt bằng `node tests\live.mjs`: tạo tài khoản và các đơn tạm, kiểm tra luồng thực tế, rồi dọn đúng các bản ghi kiểm thử. Database đang dùng là `velora_test`.

Backend được cung cấp hiện chỉ có middleware kiểm tra JWT/admin ở các route quản lý người dùng. Các route nghiệp vụ khác cần bổ sung kiểm tra quyền và chủ sở hữu trước khi triển khai công khai. Trang quản trị frontend đã kiểm tra vai trò; kiểm tra frontend không thay thế bảo vệ backend.

Bản website demo đã xuất bản trước đây vẫn là bản trình diễn. Bản tích hợp này chạy trên máy; cần host backend và PostgreSQL rồi cấu hình URL API HTTPS để xuất bản bản kết nối thật.
