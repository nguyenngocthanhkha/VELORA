
VELORA – Website thuê xe ô tô trực tuyến
Giới thiệu
VELORA là dự án website hỗ trợ người dùng tìm kiếm, xem thông tin và đặt thuê xe ô tô trực tuyến. Hệ thống có các chức năng quản lý xe, loại xe, tài khoản, đơn thuê, tài xế, thanh toán và đánh giá.

Đây là sản phẩm thực hiện trong học phần Thực hành xây dựng hệ thống.

Công nghệ sử dụng
Frontend: React, TypeScript, Vite, Axios.
Backend: Node.js, Express.
Cơ sở dữ liệu: PostgreSQL.
Thanh toán: Có phần mã nguồn tích hợp VNPay Sandbox được phát triển bổ sung; cần kiểm tra việc kết nối với phiên bản hiện tại trước khi chạy.
Cấu trúc thư mục
VELORA/
├── backend/       # API và xử lý nghiệp vụ
├── frontend/      # Giao diện người dùng
├── bao-cao/       # Báo cáo tiến độ từng tuần
└── README.md      # Giới thiệu dự án
Các chức năng chính
Đăng ký, đăng nhập và quản lý thông tin người dùng.
Xem danh sách, thông tin chi tiết và loại xe.
Đặt xe, theo dõi, hủy và gia hạn đơn thuê.
Xử lý nghiệp vụ trả xe.
Quản lý tài xế và thanh toán.
Đánh giá xe.
Quản trị dữ liệu xe, tài khoản và đơn thuê.
Các nhóm API Backend
Nhóm	Đường dẫn
Người dùng	/api/users
Xe	/api/vehicles
Loại xe	/api/vehicle-types
Đơn thuê	/api/bookings
Tài xế	/api/drivers
Thanh toán	/api/payments
Đánh giá	/api/reviews
Lưu ý: Phần API VNPay /api/vnpay được xây dựng bổ sung; cần đăng ký router và đồng bộ Frontend nếu chưa có trong phiên bản đang tải lên GitHub.

Hướng dẫn chạy trên máy cá nhân
Yêu cầu: Node.js, npm và PostgreSQL.

Tạo cơ sở dữ liệu PostgreSQL và cấu hình kết nối theo dự án Backend.
Mở terminal trong thư mục backend, chạy:
npm install
npm start
Mở terminal khác trong thư mục frontend, chạy:
npm install
npm run dev
Mở địa chỉ Frontend do Vite hiển thị trên terminal. Backend được cấu hình chạy ở http://localhost:5000 trong phiên bản đã báo cáo.
Kiểm tra scripts trong backend/package.json trước khi chạy npm start; nếu dự án dùng lệnh khác thì thực hiện theo cấu hình thực tế.

Bảo mật khi đưa lên GitHub
Không tải lên node_modules/, dist/, .env, mật khẩu cơ sở dữ liệu, JWT secret hoặc khóa bí mật VNPay. Chỉ sử dụng tệp cấu hình mẫu không chứa thông tin thật khi cần hướng dẫn cài đặt.

Báo cáo
Các tài liệu tiến độ được lưu trong thư mục bao-cao/.

Draggable item chatgpt:project:g-p-6ac85e9f93848191b1d33feeb4f58990 was dropped over droppable area chatgpt:project:g-p-6ac85e9f93848191b1d33feeb4f58990
