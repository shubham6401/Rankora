const express = require("express");
const router = express.Router();
const { loginAdmin } = require("../controllers/authController");
const {
    createExecutiveAccount,
    getAdminOverview,
    getAdminExecutives,
    deleteExecutiveAccount,
    deleteBrandAccount,
    impersonateUser,
    getExecutiveMediators,
    getAllMediators,
    superAdminOverrideOrderUnit,
    superAdminOverrideMasterOrder,
} = require("../controllers/adminController");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles, requireSuperAdmin, requireSuperAdminSession } = require("../middleware/roleMiddleware");
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

// Public admin login
router.post("/login", loginAdmin);

// Protected admin endpoints
router.post("/create-executive", verifyToken, authorizeRoles("admin"), createExecutiveAccount);
router.get("/overview", verifyToken, authorizeRoles("admin"), getAdminOverview);
router.get("/executives", verifyToken, authorizeRoles("admin"), getAdminExecutives);
router.delete("/executive/:id", verifyToken, authorizeRoles("admin"), deleteExecutiveAccount);
router.delete("/brand/:id", verifyToken, authorizeRoles("admin"), deleteBrandAccount);

// High-level access restricted exclusively to Secret Super Admin (AdminShubhamsecreate)
router.post("/impersonate/:userId", verifyToken, requireSuperAdmin, impersonateUser);
router.get("/executive-mediators/:teamCode", verifyToken, requireSuperAdmin, getExecutiveMediators);
router.get("/all-mediators", verifyToken, requireSuperAdmin, getAllMediators);
router.get("/mediators", verifyToken, requireSuperAdmin, getAllMediators);

// Super Admin Universal Order & Unit Overrides (accessible during Super Admin session)
router.put(
    "/orders/:orderId/units/:unitId/override",
    verifyToken,
    requireSuperAdminSession,
    proofUploadFields,
    superAdminOverrideOrderUnit
);
router.put(
    "/orders/:orderId/master-override",
    verifyToken,
    requireSuperAdminSession,
    superAdminOverrideMasterOrder
);

module.exports = router;
