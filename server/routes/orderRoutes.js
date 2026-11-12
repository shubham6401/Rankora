const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { requireSuperAdminSession } = require("../middleware/roleMiddleware");
const {
    getOrderById,
    getOrderHistory,
} = require("../controllers/orderController");
const { deleteOrderBatch } = require("../controllers/executiveController");
const {
    superAdminOverrideOrderUnit,
    superAdminOverrideMasterOrder,
} = require("../controllers/adminController");
const { upload } = require("../config/cloudinary");

const proofUploadFields = upload.fields([
    { name: "orderedScreenshot", maxCount: 1 },
    { name: "productReviewScreenshot", maxCount: 1 },
    { name: "invoiceScreenshot", maxCount: 1 },
    { name: "sellerFeedbackScreenShot", maxCount: 1 },
    { name: "paymentScreenshot", maxCount: 1 },
    { name: "mediatorPaymentScreenshot", maxCount: 1 },
    { name: "settlementScreenshot", maxCount: 1 },
]);

// Require authentication for order routes
router.use(verifyToken);

router.get("/order/:id", getOrderById);
router.delete("/order/:id", deleteOrderBatch);
router.get("/orders/history", getOrderHistory);

// Super Admin Universal Overrides (accessible ONLY during active Super Admin session)
router.put(
    "/orders/:orderId/units/:unitId/super-admin-override",
    requireSuperAdminSession,
    proofUploadFields,
    superAdminOverrideOrderUnit
);
router.put(
    "/orders/:orderId/master-override",
    requireSuperAdminSession,
    superAdminOverrideMasterOrder
);

module.exports = router;
