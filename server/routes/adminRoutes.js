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
} = require("../controllers/adminController");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles, requireSuperAdmin } = require("../middleware/roleMiddleware");

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

module.exports = router;
