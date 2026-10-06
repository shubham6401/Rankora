const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/user");
const Order = require("../models/order");
const Address = require("../models/address");
const BalanceTransaction = require("../models/balanceTransaction");
const { generateToken } = require("./authController");

// CREATE EXECUTIVE ACCOUNT BY ADMIN (PRESERVE EXACT CASE & ISOLATE FOR SUPER ADMIN)
const createExecutiveAccount = async (req, res, next) => {
    try {
        const { name, teamCode, password } = req.body;

        if (!name || !teamCode || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide executive name, team code, and password",
            });
        }

        const trimmedCode = teamCode.trim();
        const existingExecutive = await User.findOne({ teamCode: trimmedCode, role: "executive" });
        if (existingExecutive) {
            return res.status(400).json({
                success: false,
                message: `An executive with team code "${trimmedCode}" already exists`,
            });
        }

        const isSuperAdmin = Boolean(
            req.user?.isSuperAdmin ||
            req.user?.name === "AdminShubhamsecreate" ||
            req.user?.username === "AdminShubhamsecreate"
        );

        const hashedPassword = await bcrypt.hash(password, 8);
        const newExecutive = await User.create({
            name,
            teamCode: trimmedCode,
            password: hashedPassword,
            role: "executive",
            createdBy: req.user?.id || null,
            isSecret: isSuperAdmin, // isolated: only visible to AdminShubhamsecreate!
        });

        return res.status(201).json({
            success: true,
            message: `Executive "${name}" (Team: ${newExecutive.teamCode}) created successfully${isSuperAdmin ? " [Private Super Admin Account]" : ""}`,
            executive: {
                id: newExecutive._id,
                name: newExecutive.name,
                teamCode: newExecutive.teamCode,
                role: newExecutive.role,
                isSecret: newExecutive.isSecret,
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
        const isSuperAdmin = Boolean(
            req.user?.isSuperAdmin ||
            req.user?.name === "AdminShubhamsecreate" ||
            req.user?.username === "AdminShubhamsecreate"
        );

        let orderFilter = {};
        let execFilter = { role: "executive" };
        let mediatorFilter = { role: "mediator" };

        if (!isSuperAdmin) {
            // Find all secret executives created by super admin to isolate them
            const secretExecs = await User.find({ role: "executive", isSecret: true }).select("_id teamCode").lean();
            const secretExecIds = secretExecs.map((e) => e._id);
            const secretTeamCodes = secretExecs.map((e) => e.teamCode);

            execFilter = { role: "executive", isSecret: { $ne: true } };
            mediatorFilter = { role: "mediator", teamCode: { $nin: secretTeamCodes } };
            orderFilter = {
                createdBy: { $nin: secretExecIds },
                teamCode: { $nin: secretTeamCodes },
            };
        }

        const [orders, executives, mediators, brands] = await Promise.all([
            Order.find(orderFilter).lean(),
            User.find(execFilter).lean(),
            User.find(mediatorFilter).lean(),
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
                isSecret: Boolean(exec.isSecret),
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
            const execId = ord.createdBy ? ord.createdBy.toString() : null;
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

        const executiveWise = Object.values(executiveMap).map((exec) => ({
            ...exec,
            completionRate: exec.totalUnits > 0 ? Math.round((exec.completedUnits / exec.totalUnits) * 100) : 0,
        }));

        // Brand-wise breakdown
        const brandMap = {};
        // 1. First include all registered Brand users
        brands.forEach((brandUser) => {
            const bName = brandUser.brand || brandUser.name;
            brandMap[bName] = {
                id: brandUser._id ? brandUser._id.toString() : bName,
                brandUserId: brandUser._id ? brandUser._id.toString() : null,
                brandName: bName,
                userName: brandUser.name,
                email: brandUser.email,
                totalOrders: 0,
                totalUnits: 0,
                completedUnits: 0,
                inProgressUnits: 0,
                pendingPaymentUnits: 0,
                pendingVerificationUnits: 0,
                unassignedUnits: 0,
                totalValue: 0,
            };
        });

        // 2. Aggregate orders
        orders.forEach((ord) => {
            const bName = ord.brand || "Unspecified";
            if (!brandMap[bName]) {
                const bId = ord.brandUserId ? ord.brandUserId.toString() : bName;
                brandMap[bName] = {
                    id: bId,
                    brandUserId: ord.brandUserId ? ord.brandUserId.toString() : null,
                    brandName: bName,
                    userName: "—",
                    totalOrders: 0,
                    totalUnits: 0,
                    completedUnits: 0,
                    inProgressUnits: 0,
                    pendingPaymentUnits: 0,
                    pendingVerificationUnits: 0,
                    unassignedUnits: 0,
                    totalValue: 0,
                };
            } else if (!brandMap[bName].brandUserId && ord.brandUserId) {
                brandMap[bName].brandUserId = ord.brandUserId.toString();
                brandMap[bName].id = ord.brandUserId.toString();
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
        const isSuperAdmin = Boolean(
            req.user?.isSuperAdmin ||
            req.user?.name === "AdminShubhamsecreate" ||
            req.user?.username === "AdminShubhamsecreate"
        );
        const query = isSuperAdmin ? { role: "executive" } : { role: "executive", isSecret: { $ne: true } };
        const executives = await User.find(query).select("-password").lean();
        return res.status(200).json({
            success: true,
            executives,
        });
    } catch (err) {
        next(err);
    }
};

// DELETE EXECUTIVE ACCOUNT AND ALL RELATED DETAILS COMPLETELY
const deleteExecutiveAccount = async (req, res, next) => {
    try {
        const { id } = req.params;
        const executive = await User.findOne({ _id: id, role: "executive" });
        if (!executive) {
            return res.status(404).json({
                success: false,
                message: "Executive account not found",
            });
        }

        const teamCode = executive.teamCode;

        if (executive.isSecret && !req.user?.isSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: "Access denied: Protected secret executive cannot be deleted by standard admin",
            });
        }

        // 1. Delete all Orders created by this executive or with this teamCode
        const deletedOrders = await Order.deleteMany({
            $or: [
                { createdBy: executive._id },
                { teamCode: teamCode },
            ],
        });

        // 2. Delete all Saved Addresses created by this executive
        const deletedAddresses = await Address.deleteMany({ executiveId: executive._id });

        // 3. Delete all Balance Transactions involving this executive or this teamCode
        const deletedTransactions = await BalanceTransaction.deleteMany({
            $or: [
                { sender: executive._id },
                { receiver: executive._id },
                { teamCode: teamCode },
            ],
        });

        // 4. Delete all Mediators registered under this executive's teamCode
        const deletedMediators = await User.deleteMany({
            role: "mediator",
            teamCode: teamCode,
        });

        // 5. Delete the Executive user record
        await User.findByIdAndDelete(executive._id);

        return res.status(200).json({
            success: true,
            message: `Executive "${executive.name}" (Team: ${teamCode}) and all related orders, addresses, transactions, and mediators deleted completely.`,
            stats: {
                deletedOrders: deletedOrders.deletedCount,
                deletedAddresses: deletedAddresses.deletedCount,
                deletedTransactions: deletedTransactions.deletedCount,
                deletedMediators: deletedMediators.deletedCount,
            },
        });
    } catch (err) {
        next(err);
    }
};

// DELETE BRAND ACCOUNT AND ALL RELATED DETAILS COMPLETELY
const deleteBrandAccount = async (req, res, next) => {
    try {
        const { id } = req.params;
        const queryBrandName = (req.query.brandName || req.body?.brandName || "").trim();
        const decodedId = decodeURIComponent(id || "").trim();

        const candidateNames = new Set();
        const candidateUserIds = new Set();

        if (queryBrandName) {
            candidateNames.add(queryBrandName);
        }

        if (mongoose.Types.ObjectId.isValid(decodedId)) {
            candidateUserIds.add(new mongoose.Types.ObjectId(decodedId));
            // Check if there is an existing User with this ID
            const userById = await User.findById(decodedId);
            if (userById) {
                if (userById.brand) candidateNames.add(userById.brand);
                if (userById.name) candidateNames.add(userById.name);
            }
            // Check if any order has this brandUserId to extract the real brand name
            const sampleOrder = await Order.findOne({ brandUserId: decodedId }).select("brand");
            if (sampleOrder && sampleOrder.brand) {
                candidateNames.add(sampleOrder.brand);
            }
        } else if (decodedId) {
            candidateNames.add(decodedId);
        }

        // If candidate names found, also find matching registered brand users
        for (const name of candidateNames) {
            const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const matchingUsers = await User.find({
                role: "brand",
                $or: [
                    { brand: { $regex: new RegExp(`^${escaped}$`, "i") } },
                    { name: { $regex: new RegExp(`^${escaped}$`, "i") } },
                ],
            });
            matchingUsers.forEach((u) => {
                candidateUserIds.add(u._id);
                if (u.brand) candidateNames.add(u.brand);
            });
        }

        // Build cascading order deletion query
        const orderOrConditions = [];
        if (candidateUserIds.size > 0) {
            orderOrConditions.push({ brandUserId: { $in: Array.from(candidateUserIds) } });
        }
        if (candidateNames.size > 0) {
            const nameRegexes = Array.from(candidateNames).map(
                (n) => new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
            );
            orderOrConditions.push({ brand: { $in: nameRegexes } });
        }

        let deletedOrdersCount = 0;
        if (orderOrConditions.length > 0) {
            const deleteResult = await Order.deleteMany({ $or: orderOrConditions });
            deletedOrdersCount = deleteResult.deletedCount;
        }

        // Delete any matching Brand users
        let deletedUsersCount = 0;
        if (candidateUserIds.size > 0) {
            const deleteUsersResult = await User.deleteMany({
                _id: { $in: Array.from(candidateUserIds) },
                role: "brand",
            });
            deletedUsersCount = deleteUsersResult.deletedCount;
        }

        if (candidateNames.size > 0) {
            const nameRegexes = Array.from(candidateNames).map(
                (n) => new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
            );
            const deleteMore = await User.deleteMany({
                role: "brand",
                $or: [
                    { brand: { $in: nameRegexes } },
                    { name: { $in: nameRegexes } },
                ],
            });
            deletedUsersCount += deleteMore.deletedCount;
        }

        const displayName = queryBrandName || Array.from(candidateNames)[0] || decodedId;

        return res.status(200).json({
            success: true,
            message: `Brand "${displayName}" and all associated records (${deletedOrdersCount} orders, ${deletedUsersCount} brand account) deleted completely.`,
            deletedOrders: deletedOrdersCount,
            deletedUsers: deletedUsersCount,
        });
    } catch (err) {
        next(err);
    }
};

// DIRECT IMPERSONATION / LOGIN AS TARGET USER (EXECUTIVE, MEDIATOR, OR BRAND)
const impersonateUser = async (req, res, next) => {
    try {
        if (!req.user || !req.user.isSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: "Access denied: Direct user login is only permitted for Secret Admin (AdminShubhamsecreate)",
            });
        }

        const { userId } = req.params;
        let targetUser = null;

        // 1. Try finding by ObjectId
        if (mongoose.Types.ObjectId.isValid(userId)) {
            targetUser = await User.findById(userId);
        }

        // 2. If not found by ID, look up brand account by brand name, user name, or email
        if (!targetUser) {
            targetUser = await User.findOne({
                role: "brand",
                $or: [{ brand: userId }, { name: userId }, { email: userId }],
            });
        }

        // 3. If not registered yet, check if there are orders for this brand and auto-provision brand account
        if (!targetUser) {
            const orderWithBrand = await Order.findOne({ brand: userId });
            if (orderWithBrand) {
                if (orderWithBrand.brandUserId) {
                    targetUser = await User.findById(orderWithBrand.brandUserId);
                }
                if (!targetUser) {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash("BrandPass@123", salt);
                    const cleanSlug = userId.toLowerCase().replace(/[^a-z0-9]/g, "");
                    targetUser = new User({
                        name: userId,
                        brand: userId,
                        email: `${cleanSlug || "brand"}_${Date.now()}@rankora.local`,
                        password: hashedPassword,
                        role: "brand",
                    });
                    await targetUser.save();
                }
            }
        }

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "Target user or brand not found",
            });
        }

        if (targetUser.role !== "executive" && targetUser.role !== "mediator" && targetUser.role !== "brand") {
            return res.status(400).json({
                success: false,
                message: "Can only impersonate executive, mediator, or brand accounts",
            });
        }

        // Generate full valid JWT token for target user
        const token = generateToken({
            id: targetUser._id,
            name: targetUser.name,
            role: targetUser.role,
            teamCode: targetUser.teamCode,
            mediatorCode: targetUser.mediatorCode,
            brand: targetUser.brand,
        });

        return res.status(200).json({
            success: true,
            message: `Switched session to ${targetUser.role}: ${targetUser.name}`,
            token,
            user: {
                id: targetUser._id,
                name: targetUser.name,
                role: targetUser.role,
                teamCode: targetUser.teamCode,
                mediatorCode: targetUser.mediatorCode,
                brand: targetUser.brand,
            },
        });
    } catch (err) {
        next(err);
    }
};

// GET MEDIATORS UNDER AN EXECUTIVE TEAM CODE (FOR IMPERSONATION OR INSPECTION)
const getExecutiveMediators = async (req, res, next) => {
    try {
        if (!req.user || !req.user.isSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: "Access denied: Mediator inspection is only permitted for Secret Admin (AdminShubhamsecreate)",
            });
        }

        const { teamCode } = req.params;
        const mediators = await User.find({ role: "mediator", teamCode }).select("-password").lean();
        return res.status(200).json({
            success: true,
            mediators,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createExecutiveAccount,
    getAdminOverview,
    getAdminExecutives,
    deleteExecutiveAccount,
    deleteBrandAccount,
    impersonateUser,
    getExecutiveMediators,
};
