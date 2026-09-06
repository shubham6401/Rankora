const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const executiveRoutes = require("./routes/executiveRoutes");
const mediatorRoutes = require("./routes/mediatorRoutes");
const brandRoutes = require("./routes/brandRoutes");
const orderRoutes = require("./routes/orderRoutes");
const balanceRoutes = require("./routes/balanceRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy and running",
        timestamp: new Date().toISOString(),
    });
});

// ==========================================
// ROUTES
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/executive", executiveRoutes);
app.use("/api/mediator", mediatorRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/balance", balanceRoutes);
app.use("/api", orderRoutes);

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================
app.use(notFound);
app.use(errorHandler);

// ==========================================
// SERVER INITIALIZATION
// ==========================================
const PORT = process.env.PORT || 8000;

if (process.env.NODE_ENV !== "test") {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Server Running on port ${PORT}`);
        });
    }).catch((err) => {
        console.error("Failed to connect to database:", err);
    });
}

module.exports = app;
