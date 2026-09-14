const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Order = require("../models/order");

// CREATE EXECUTIVE ACCOUNT BY ADMIN
const createExecutiveAccount = async (req, res, next) => {
    try {
        const { name, teamCode, password } = req.body;

        if (!name || !teamCode || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide executive name, team code, and password",
            });
        }

        const existingExecutive = await User.findOne({ teamCode, role: "executive" });
        if (existingExecutive) {
            return res.status(400).json({
                success: false,
                message: `An executive with team code "${teamCode}" already exists`,
            });
        }

        const hashedPassword = await bcrypt.hash(password, 8);
        const newExecutive = await User.create({
            name,
            teamCode: teamCode.trim().toUpperCase(),
            password: hashedPassword,
            role: "executive",
        });

        return res.status(201).json({
            success: true,
            message: `Executive "${name}" (Team: ${newExecutive.teamCode}) created successfully`,
            executive: {
                id: newExecutive._id,
                name: newExecutive.name,
                teamCode: newExecutive.teamCode,
                role: newExecutive.role,
                createdAt: newExecutive.createdAt,
            },
        });
    } catch (err) {
        next(err);
    }
};

// GET GLOBAL ADMIN OVERVIEW (EXECUTIVE-WISE, BRAND-WISE, STATUSES)
const getAdminOverview = async (req, res, next) => {
    try {
        const [orders, executives, mediators, brands] = await Promise.all([
            Order.find().lean(),
            User.find({ role: "executive" }).lean(),
            User.find({ role: "mediator" }).lean(),
            User.find({ role: "brand" }).lean(),
        ]);

        // Global counters
        const globalStats = {
            totalOrders: orders.length,
            totalUnits: 0,
            unassignedUnits: 0,
            pendingPaymentUnits: 0,
            assignedUnits: 0,
            inProgressUnits: 0,
            pendingRefundUnits: 0,
            pendingVerificationUnits: 0,
            completedUnits: 0,
            totalExecutives: executives.length,
            totalMediators: mediators.length,
            totalBrands: brands.length,
        };

        orders.forEach((ord) => {
            const units = ord.orderUnits || [];
            globalStats.totalUnits += units.length;
            units.forEach((u) => {
                if (u.status === "unassigned") globalStats.unassignedUnits++;
                else if (u.status === "pending_payment") globalStats.pendingPaymentUnits++;
                else if (u.status === "assigned") globalStats.assignedUnits++;
                else if (u.status === "in_progress") globalStats.inProgressUnits++;
                else if (u.status === "pending_refund") globalStats.pendingRefundUnits++;
                else if (u.status === "pending_verification") globalStats.pendingVerificationUnits++;
                else if (u.status === "completed") globalStats.completedUnits++;
            });
        });

        // Executive-wise breakdown
        const executiveMap = {};
        executives.forEach((exec) => {
            executiveMap[exec._id.toString()] = {
                id: exec._id,
                name: exec.name,
                teamCode: exec.teamCode,
                createdAt: exec.createdAt,
                mediatorCount: mediators.filter((m) => m.teamCode === exec.teamCode).length,
                totalOrders: 0,
                totalUnits: 0,
                completedUnits: 0,
                inProgressUnits: 0,
                pendingPaymentUnits: 0,
                pendingVerificationUnits: 0,
                unassignedUnits: 0,
            };
        });

        orders.forEach((ord) => {
            const execId = ord.createdBy?.toString();
            if (execId && executiveMap[execId]) {
                executiveMap[execId].totalOrders++;
                (ord.orderUnits || []).forEach((u) => {
                    executiveMap[execId].totalUnits++;
                    if (u.status === "completed") executiveMap[execId].completedUnits++;
                    else if (u.status === "in_progress") executiveMap[execId].inProgressUnits++;
                    else if (u.status === "pending_payment") executiveMap[execId].pendingPaymentUnits++;
                    else if (u.status === "pending_verification") executiveMap[execId].pendingVerificationUnits++;
                    else if (u.status === "unassigned") executiveMap[execId].unassignedUnits++;
                });
            }
        });

        const executiveWise = Object.values(executiveMap);

        // Brand-wise breakdown
        const brandMap = {};
        orders.forEach((ord) => {
            const bName = ord.brand || "Unspecified";
            if (!brandMap[bName]) {
                brandMap[bName] = {
                    brandName: bName,
                    totalOrders: 0,
                    totalUnits: 0,
                    completedUnits: 0,
                    inProgressUnits: 0,
                    pendingPaymentUnits: 0,
                    pendingVerificationUnits: 0,
                    unassignedUnits: 0,
                    totalValue: 0,
                };
            }

            brandMap[bName].totalOrders++;
            const price = Number(ord.price) || 0;

            (ord.orderUnits || []).forEach((u) => {
                brandMap[bName].totalUnits++;
                brandMap[bName].totalValue += price;
                if (u.status === "completed") brandMap[bName].completedUnits++;
                else if (u.status === "in_progress") brandMap[bName].inProgressUnits++;
                else if (u.status === "pending_payment") brandMap[bName].pendingPaymentUnits++;
                else if (u.status === "pending_verification") brandMap[bName].pendingVerificationUnits++;
                else if (u.status === "unassigned") brandMap[bName].unassignedUnits++;
            });
        });

        const brandWise = Object.values(brandMap).map((b) => ({
            ...b,
            completionRate: b.totalUnits > 0 ? Math.round((b.completedUnits / b.totalUnits) * 100) : 0,
        }));

        return res.status(200).json({
            success: true,
            globalStats,
            executiveWise,
            brandWise,
            executiveBreakdown: executiveWise,
            brandBreakdown: brandWise,
        });
    } catch (err) {
        next(err);
    }
};

// GET ALL EXECUTIVES
const getAdminExecutives = async (req, res, next) => {
    try {
        const executives = await User.find({ role: "executive" }).select("-password").lean();
        return res.status(200).json({
            success: true,
            executives,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createExecutiveAccount,
    getAdminOverview,
    getAdminExecutives,
};
