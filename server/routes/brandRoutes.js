const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { getBrandOrders } = require("../controllers/brandController");

// All brand routes require token verification
router.use(verifyToken);

router.get("/order", getBrandOrders);
router.get("/orders", getBrandOrders);

module.exports = router;
