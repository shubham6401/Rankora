const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");
const {
    getNewOrders,
    acceptOrder,
    rejectOrder,
    getPendingPaymentOrders,
    submitMediatorPayment,
    getPendingOrders,
    submitOrderDetails,
    getRefundPendingOrders,
    submitRefundDetails,
    getCompletedOrders,
    getMediatorSummary,
} = require("../controllers/mediatorController");

// All mediator routes require token verification
router.use(verifyToken);

router.get("/summary", getMediatorSummary);
router.get("/orders/all", getMediatorSummary);
router.get("/new/orders", getNewOrders);
router.post("/order/accept/:orderId", acceptOrder);
router.post("/order/in_progress/:orderId", acceptOrder); // backward compatibility
router.post("/order/reject/:orderId", rejectOrder);
router.get("/orders/pending_payment", getPendingPaymentOrders);
router.post(
    "/order/submit-payment/:orderId",
    upload.single("mediatorPaymentScreenshot"),
    submitMediatorPayment
);
router.get("/orders/pending", getPendingOrders);

// Upload single screenshot for order submission
router.post(
    "/order/submit/:id",
    upload.single("orderedScreenshot"),
    submitOrderDetails
);

router.get("/orders/refund_pending", getRefundPendingOrders);

// Upload review, invoice, and seller feedback screenshots for refund submission
router.post(
    "/refund/submit/:id",
    upload.fields([
        { name: "productReviewScreenshot", maxCount: 1 },
        { name: "invoiceScreenshot", maxCount: 1 },
        { name: "sellerFeedbackScreenShot", maxCount: 1 },
    ]),
    submitRefundDetails
);

router.get("/orders/completed", getCompletedOrders);

module.exports = router;
