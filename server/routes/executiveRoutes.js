const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");
const {
    addOrder,
    assignOrder,
    getOrders,
    getPendingOrders,
    getPendingPaymentOrders,
    getAssignedOrders,
    getInProgressOrders,
    getPendingRefundOrders,
    getPendingVerificationOrders,
    getCompletedOrders,
    verifyOrderUnit,
    rejectOrderUnitVerification,
    unassignOrderUnit,
    submitExecutivePayment,
    getMediatorSentOrders,
    acceptMediatorPayment,
    getMediators,
    getBrands,
} = require("../controllers/executiveController");

// All executive routes require token verification
router.use(verifyToken);

router.post("/orders", getOrders);
router.get("/orders", getOrders);
router.get("/orders/pending", getPendingOrders);
router.get("/orders/pending_payment", getPendingPaymentOrders);
router.get("/orders/mediator_sent", getMediatorSentOrders);
router.get("/orders/assigned", getAssignedOrders);
router.get("/orders/in_progress", getInProgressOrders);
router.get("/orders/pending_refund", getPendingRefundOrders);
router.get("/orders/pending_verification", getPendingVerificationOrders);
router.get("/orders/completed", getCompletedOrders);

router.post("/order/add", addOrder);
router.post("/order/assign/:orderId", assignOrder);
router.post("/order/unassign", unassignOrderUnit);
router.post("/order/verify-unit", verifyOrderUnit);
router.post("/order/reject-unit-verification", rejectOrderUnitVerification);
router.post("/order/accept-payment/:orderId", acceptMediatorPayment);
router.post(
    "/order/submit-payment/:mediatorId",
    upload.single("paymentScreenshot"),
    submitExecutivePayment
);

router.get("/mediators", getMediators);
router.get("/brands", getBrands);

module.exports = router;
