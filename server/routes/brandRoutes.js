const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
    getBrandOrders,
    updateUnitType,
    bulkUpdateUnitTypes,
    reportUnitIssue,
    resolveUnitIssue,
    clearUnitIssue,
    moveOrderToAllCampaigns,
} = require("../controllers/brandController");

// All brand routes require token verification
router.use(verifyToken);

router.get("/order", getBrandOrders);
router.get("/orders", getBrandOrders);
router.patch("/order/:orderId/unit/:unitId/type", updateUnitType);
router.patch("/units/bulk-type", bulkUpdateUnitTypes);
router.patch("/order/:orderId/unit/:unitId/report-issue", reportUnitIssue);
router.patch("/order/:orderId/unit/:unitId/resolve-issue", resolveUnitIssue);
router.patch("/order/:orderId/unit/:unitId/clear-issue", clearUnitIssue);
router.patch("/order/:orderId/move-to-campaigns", moveOrderToAllCampaigns);

module.exports = router;
