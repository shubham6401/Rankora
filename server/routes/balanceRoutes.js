const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");
const {
    sendBalance,
    getMyTransactions,
    verifyBalance,
    rejectBalance,
    getTeamMediators,
} = require("../controllers/balanceController");

// All balance routes require authentication
router.use(verifyToken);

router.post("/send", upload.single("paymentScreenshot"), sendBalance);
router.get("/my-transactions", getMyTransactions);
router.post("/verify/:id", verifyBalance);
router.post("/reject/:id", rejectBalance);
router.get("/team-mediators", getTeamMediators);

module.exports = router;
