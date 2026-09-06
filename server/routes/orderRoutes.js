const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
    getOrderById,
    getOrderHistory,
} = require("../controllers/orderController");

// Require authentication for order routes
router.use(verifyToken);

router.get("/order/:id", getOrderById);
router.get("/orders/history", getOrderHistory);

module.exports = router;
