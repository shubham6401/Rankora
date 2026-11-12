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
    getAdvancePaymentHistory,
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
    createAddress,
    getAddresses,
    deleteAddress,
    getExecutiveBrandSummary,
    getExecutiveBrandDetails,
    getExecutiveMasterAnalytics,
    getSettledOrders,
    settleExecutivePayout,
    getExecutiveMediatorEarnings,
    deleteOrderBatch,
    getExecutiveMediatorIds,
    toggleMediatorIdStatus,
    getPeerExecutives,
    transferOrderToExecutive,
    getTransferredInOrders,
    getTransferredOutOrders,
    deleteSingleOrderUnit,
    bulkDeleteOrderUnits,
    editExecutiveOrderUnit,
} = require("../controllers/executiveController");

// All executive routes require token verification
router.use(verifyToken);

router.post("/orders", getOrders);
router.get("/orders", getOrders);
router.get("/orders/pending", getPendingOrders);
router.get("/orders/pending_payment", getPendingPaymentOrders);
router.get("/orders/advance_payment_history", getAdvancePaymentHistory);
router.get("/orders/mediator_sent", getMediatorSentOrders);
router.get("/orders/assigned", getAssignedOrders);
router.get("/orders/in_progress", getInProgressOrders);
router.get("/orders/pending_refund", getPendingRefundOrders);
router.get("/orders/pending_verification", getPendingVerificationOrders);
router.get("/orders/completed", getCompletedOrders);
router.get("/orders/settled", getSettledOrders);

router.post("/order/add", addOrder);
router.post("/order/assign/:orderId", assignOrder);
router.post("/order/unassign", unassignOrderUnit);
router.delete("/order/:orderId", deleteOrderBatch);
router.delete("/orders/:orderId", deleteOrderBatch);
router.post("/order/verify-unit", verifyOrderUnit);
router.post("/order/reject-unit-verification", rejectOrderUnitVerification);
router.post("/order/accept-payment/:orderId", acceptMediatorPayment);
router.post(
    "/order/submit-payment/:mediatorId",
    upload.single("paymentScreenshot"),
    submitExecutivePayment
);
router.post(
    "/order/settle-payout",
    upload.single("settlementScreenshot"),
    settleExecutivePayout
);
router.post(
    "/order/settle-orders",
    upload.single("settlementScreenshot"),
    settleExecutivePayout
);

router.get("/mediators", getMediators);
router.get("/brands", getBrands);

// Address Management
router.get("/addresses", getAddresses);
router.post("/addresses", createAddress);
router.delete("/addresses/:id", deleteAddress);

// Brand Summary & Details
router.get("/brands/summary", getExecutiveBrandSummary);
router.get("/brands/:brandUserId/details", getExecutiveBrandDetails);

// Master Analytics
router.get("/analytics", getExecutiveMasterAnalytics);

// Mediator Earnings & Remaining Balances Oversight
router.get("/mediators-earnings", getExecutiveMediatorEarnings);
router.get("/earnings", getExecutiveMediatorEarnings);

// Mediator Platform IDs Oversight
router.get("/mediators/:mediatorId/ids", getExecutiveMediatorIds);
router.patch("/mediators/:mediatorId/ids/:id/status", toggleMediatorIdStatus);

// Executive to Executive Assignment & Transfers
router.get("/peer-executives", getPeerExecutives);
router.post(
    "/order/transfer-to-executive",
    upload.single("paymentScreenshot"),
    transferOrderToExecutive
);
router.get("/orders/transferred-in", getTransferredInOrders);
router.get("/orders/transferred-out", getTransferredOutOrders);

// Unit Level Deletion & Editing
router.delete("/orders/:orderId/units/:unitId", deleteSingleOrderUnit);
router.post("/orders/:orderId/units/bulk-delete", bulkDeleteOrderUnits);
router.put("/orders/:orderId/units/:unitId", editExecutiveOrderUnit);

module.exports = router;
