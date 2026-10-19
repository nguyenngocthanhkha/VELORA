# Backend VELORA

API Express chạy ở cổng 5000.

- `server.js`: khởi động ứng dụng, CORS, API routes, static images.
- `config/database.js`: tạo kết nối PostgreSQL, đọc `backend/.env` theo đường dẫn cố định.
- `routes/`: xử lý API; các route hiện trực tiếp thực hiện truy vấn SQL.
- `middleware/`: xác thực JWT và quyền admin.
- `public/images/`: ảnh xe.
- `scripts/`: công cụ kiểm tra và bảo trì; không tự chạy khi khởi động backend.
- `logs/`: log chạy server.

```powershell
cd C:\WED\backend
npm run dev
npm run check:db
```

Database hiện dùng: `velora_test`. Điền cấu hình vào `.env` theo `.env.example`; không đưa mật khẩu database vào frontend hoặc git. Chi tiết API xem `../docs/INTEGRATION_NOTES.md`.
