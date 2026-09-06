const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET || "default_jwt_secret", {
        expiresIn: "7d",
    });
};

// ==========================================
// MEDIATOR AUTH
// ==========================================
const loginMediator = async (req, res, next) => {
    try {
        const { mediatorCode, password } = req.body;

        if (!mediatorCode || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide mediatorCode and password",
            });
        }

        const existingUser = await User.findOne({ mediatorCode, role: "mediator" });
        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: "User does not exist",
            });
        }

        const isMatchedPassword = await bcrypt.compare(password, existingUser.password);
        if (!isMatchedPassword) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password",
            });
        }

        const token = generateToken({
            id: existingUser._id,
            name: existingUser.name,
            role: "mediator",
            mediatorCode: existingUser.mediatorCode,
            teamCode: existingUser.teamCode,
        });

        return res.status(200).json({
            success: true,
            message: "Login successfully",
            token,
            user: {
                id: existingUser._id,
                name: existingUser.name,
                role: "mediator",
                mediatorCode: existingUser.mediatorCode,
                teamCode: existingUser.teamCode,
            },
        });
    } catch (err) {
        next(err);
    }
};

const signupMediator = async (req, res, next) => {
    try {
        const { name, mediatorCode, password, teamCode } = req.body;

        if (!name || !mediatorCode || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide name, mediatorCode, and password",
            });
        }

        // teamCode can come from authenticated executive (req.user.teamCode) or req.body
        const finalTeamCode = req.user?.teamCode || teamCode;
        if (!finalTeamCode) {
            return res.status(400).json({
                success: false,
                message: "Team code is required to register a mediator",
            });
        }

        const existingUser = await User.findOne({ mediatorCode });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already registered with this Mediator Code",
            });
        }

        const hashedPass = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            name,
            mediatorCode,
            password: hashedPass,
            teamCode: finalTeamCode,
            role: "mediator",
        });

        return res.status(201).json({
            success: true,
            message: "user registered successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                role: "mediator",
                mediatorCode: newUser.mediatorCode,
                teamCode: newUser.teamCode,
            },
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// EXECUTIVE AUTH
// ==========================================
const loginExecutive = async (req, res, next) => {
    try {
        const { teamCode, password } = req.body;

        if (!teamCode || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide teamCode and password",
            });
        }

        const existingUser = await User.findOne({
            teamCode,
            role: "executive",
        });

        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: "User does not exist",
            });
        }

        const isMatchedPassword = await bcrypt.compare(password, existingUser.password);
        if (!isMatchedPassword) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password",
            });
        }

        const token = generateToken({
            id: existingUser._id,
            name: existingUser.name,
            role: "executive",
            teamCode: existingUser.teamCode,
        });

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token,
            user: {
                id: existingUser._id,
                name: existingUser.name,
                role: "executive",
                teamCode: existingUser.teamCode,
            },
        });
    } catch (err) {
        next(err);
    }
};

const signupExecutive = async (req, res, next) => {
    try {
        const { name, password, teamCode } = req.body;

        if (!name || !password || !teamCode) {
            return res.status(400).json({
                success: false,
                message: "Please provide name, password, and teamCode",
            });
        }

        const existingUser = await User.findOne({ teamCode });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Executive/Team already registered with this teamCode",
            });
        }

        const hashedPass = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            password: hashedPass,
            teamCode,
            role: "executive",
        });

        return res.status(201).json({
            success: true,
            message: "User registered Successfully",
            user: {
                id: user._id,
                name: user.name,
                role: "executive",
                teamCode: user.teamCode,
            },
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// BRAND AUTH
// ==========================================
const loginBrand = async (req, res, next) => {
    try {
        const { brand, password } = req.body;

        if (!brand || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide brand and password",
            });
        }

        const existingUser = await User.findOne({
            brand,
            role: "brand",
        });

        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: "User does not exist",
            });
        }

        const isMatchedPassword = await bcrypt.compare(password, existingUser.password);
        if (!isMatchedPassword) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password",
            });
        }

        const token = generateToken({
            id: existingUser._id,
            name: existingUser.name,
            role: "brand",
            brand: existingUser.brand,
        });

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token,
            user: {
                id: existingUser._id,
                name: existingUser.name,
                role: "brand",
                brand: existingUser.brand,
            },
        });
    } catch (err) {
        next(err);
    }
};

const signupBrand = async (req, res, next) => {
    try {
        const { name, password, brand } = req.body;

        if (!name || !password || !brand) {
            return res.status(400).json({
                success: false,
                message: "Please provide name, password, and brand name",
            });
        }

        const existingUser = await User.findOne({ brand, role: "brand" });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Brand already registered",
            });
        }

        const hashedPass = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            password: hashedPass,
            brand,
            role: "brand",
        });

        return res.status(201).json({
            success: true,
            message: "User registered Successfully",
            user: {
                id: user._id,
                name: user.name,
                role: "brand",
                brand: user.brand,
            },
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    loginMediator,
    signupMediator,
    loginExecutive,
    signupExecutive,
    loginBrand,
    signupBrand,
};
