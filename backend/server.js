const express = require("express");
const path = require("path");
const cors = require("cors");
const pool = require("./config/database");

const vehicleRoutes = require("./routes/vehicleRoutes");
const vehicleTypeRoutes = require("./routes/vehicleTypeRoutes");
const userRoutes = require("./routes/userRouter");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const vnpayRoutes = require("./routes/vnpayRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const driverRoutes = require("./routes/driverRoutes");

// Middleware
const app = express();
const PORT = 5000;

// Middleware chung
app.use(cors());
app.use(express.json());
// Cho phep Frontend truy cap anh xe
app.use("/images", express.static(
    path.join(__dirname, "public", "images")
));

// API Routes
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/vehicle-types", vehicleTypeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/vnpay", vnpayRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/drivers", driverRoutes);

// Test ket noi PostgreSQL
pool.query("SELECT NOW()")
    .then(() => {
        console.log("PostgreSQL connected!");
    })
    .catch((err) => {
        console.log("PostgreSQL connection error:", err.message);
    });

// API kiem tra Backend
app.get("/", (req, res) => {
    res.json({
        message: "VELORA Backend is running!"
    });
});

// Khoi dong server
app.listen(PORT, () => {
    console.log(`VELORA Backend dang chay tai http://localhost:${PORT}`);
});