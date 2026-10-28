const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
    getOrderById,
    getOrderHistory,
} = require("../controllers/orderController");
const { deleteOrderBatch } = require("../controllers/executiveController");

// Require authentication for order routes
router.use(verifyToken);

router.get("/order/:id", getOrderById);
router.delete("/order/:id", deleteOrderBatch);
router.get("/orders/history", getOrderHistory);

module.exports = router;
