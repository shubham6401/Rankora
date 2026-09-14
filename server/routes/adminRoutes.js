const express = require("express");
const router = express.Router();
const { loginAdmin } = require("../controllers/authController");
const {
    createExecutiveAccount,
    getAdminOverview,
    getAdminExecutives,
} = require("../controllers/adminController");
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Public admin login
router.post("/login", loginAdmin);

// Protected admin endpoints
router.post("/create-executive", verifyToken, authorizeRoles("admin"), createExecutiveAccount);
router.get("/overview", verifyToken, authorizeRoles("admin"), getAdminOverview);
router.get("/executives", verifyToken, authorizeRoles("admin"), getAdminExecutives);

module.exports = router;
