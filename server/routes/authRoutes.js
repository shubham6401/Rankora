const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
    loginMediator,
    signupMediator,
    loginExecutive,
    signupExecutive,
    loginBrand,
    signupBrand,
} = require("../controllers/authController");

// Mediator auth routes
router.post("/login/mediator", loginMediator);
// Mediator signup can be accessed with token (by executive) or optionally public
router.post("/signup/mediator", (req, res, next) => {
    // If Authorization header is provided, run verifyToken
    if (req.headers.authorization) {
        return verifyToken(req, res, next);
    }
    next();
}, signupMediator);

// Executive auth routes
router.post("/login/executive", loginExecutive);
router.post("/signup/executive", signupExecutive);

// Brand auth routes
router.post("/login/brand", loginBrand);
router.post("/signup/brand", signupBrand);

module.exports = router;
