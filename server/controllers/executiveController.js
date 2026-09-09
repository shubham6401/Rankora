const Order = require("../models/order");
const User = require("../models/user");

// ==========================================
// ADD NEW MASTER ORDER
// ==========================================
const addOrder = async (req, res, next) => {
    try {
        const {
            brandUserId,
            quantity,
            productName,
            productLink,
            price,
            orderPlatform,
            executiveName,
            teamCode,
        } = req.body;

        if (!brandUserId || !quantity || !productName || !productLink || !price || !orderPlatform) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required order fields (brandUserId, quantity, productName, productLink, price, orderPlatform)",
            });
        }

        const brandUser = await User.findById(brandUserId);
        if (!brandUser) {
            return res.status(404).json({
                success: false,
                message: "Brand user not found",
            });
        }

        const qtyNum = Number(quantity);
        if (isNaN(qtyNum) || qtyNum < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a valid number greater than or equal to 1",
            });
        }

        const orderUnits = Array.from({ length: qtyNum }, () => ({
            status: "unassigned",
            assignedAt: null,
            completedAt: null,
        }));

        const finalExecutiveName = executiveName || req.user?.name || "Executive";
        const finalTeamCode = teamCode || req.user?.teamCode;
        const brandName = brandUser.brand || brandUser.name;

        const order = new Order({
            createdBy: req.user.id,
            brandUserId: brandUser._id,
            executiveName: finalExecutiveName,
            teamCode: finalTeamCode,
            brand: brandName,
            productName,
            productLink,
            price: String(price),
            quantity: qtyNum,
            orderPlatform,
            summary: {
                unassigned: qtyNum,
                assigned: 0,
                inProgress: 0,
                pendingRefund: 0,
                completed: 0,
            },
            orderUnits,
        });

        await order.save();

        return res.status(201).json({
            success: true,
            message: "Order added successfully",
            order,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// ASSIGN UNASSIGNED UNITS TO MEDIATOR
// ==========================================
const assignOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { mediatorId, quantity } = req.body;

        if (!mediatorId) {
            return res.status(400).json({
                success: false,
                message: "Mediator ID is required",
            });
        }

        const mediator = await User.findById(mediatorId);
        if (!mediator || mediator.role !== "mediator") {
            return res.status(404).json({
                success: false,
                message: "Valid mediator not found",
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const unassignedUnits = order.orderUnits.filter(
            (unit) => unit.status === "unassigned"
        );

        const assignQty = quantity !== undefined ? Number(quantity) : 1;

        if (isNaN(assignQty) || assignQty < 1) {
            return res.status(400).json({
                success: false,
                message: "Assignment quantity must be a positive integer",
            });
        }

        if (unassignedUnits.length < assignQty) {
            return res.status(400).json({
                success: false,
                message: `Not enough unassigned units. Available: ${unassignedUnits.length}, Requested: ${assignQty}`,
            });
        }

        // Slice unassigned units and assign them
        const unitsToAssign = unassignedUnits.slice(0, assignQty);
        const now = new Date();

        const paymentScreenshot = req.file?.path || req.body.paymentScreenshot || null;
        const paymentMessage = req.body.paymentMessage || req.body.message || null;

        unitsToAssign.forEach((unit) => {
            unit.status = "assigned";
            unit.mediatorId = mediator._id;
            unit.assignedAt = now;
            unit.rejectedAt = null;
            if (paymentScreenshot) unit.paymentScreenshot = paymentScreenshot;
            if (paymentMessage) unit.paymentMessage = paymentMessage;
        });

        order.recalculateSummary();
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode");

        return res.status(200).json({
            success: true,
            message: "Order assigned to mediator successfully",
            order: populatedOrder,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET ALL ORDERS (EXECUTIVE TEAM)
// ==========================================
const getOrders = async (req, res, next) => {
    try {
        const teamCode = req.user.teamCode;
        const query = teamCode ? { teamCode } : {};

        const orders = await Order.find(query)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            orders,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET PENDING (UNASSIGNED) ORDERS
// ==========================================
const getPendingOrders = async (req, res, next) => {
    try {
        const teamCode = req.user.teamCode;
        const query = {
            "summary.unassigned": { $gt: 0 },
        };
        if (teamCode) query.teamCode = teamCode;

        const orders = await Order.find(query)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            orders,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET PENDING PAYMENT ORDERS
// ==========================================
const getPendingPaymentOrders = async (req, res, next) => {
    try {
        const teamCode = req.user.teamCode;
        const query = {
            "orderUnits.status": "pending_payment",
        };
        if (teamCode) query.teamCode = teamCode;

        const orders = await Order.find(query)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .sort({ createdAt: -1 });

        const filteredOrders = orders
            .map((order) => {
                const orderObj = order.toObject();
                orderObj.orderUnits = orderObj.orderUnits.filter(
                    (u) => u.status === "pending_payment" && !u.rejectedAt
                );
                return orderObj;
            })
            .filter((o) => o.orderUnits.length > 0);

        return res.status(200).json({
            success: true,
            message: "Pending payment orders fetched successfully",
            orders: filteredOrders,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET ASSIGNED ORDERS
// ==========================================
const getAssignedOrders = async (req, res, next) => {
    try {
        const teamCode = req.user.teamCode;
        const query = {
            "summary.assigned": { $gt: 0 },
        };
        if (teamCode) query.teamCode = teamCode;

        const orders = await Order.find(query)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            orders,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET IN_PROGRESS ORDERS
// ==========================================
const getInProgressOrders = async (req, res, next) => {
    try {
        const teamCode = req.user.teamCode;
        const query = {
            "summary.inProgress": { $gt: 0 },
        };
        if (teamCode) query.teamCode = teamCode;

        const orders = await Order.find(query)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            orders,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET PENDING_REFUND ORDERS
// ==========================================
const getPendingRefundOrders = async (req, res, next) => {
    try {
        const teamCode = req.user.teamCode;
        const query = {
            "summary.pendingRefund": { $gt: 0 },
        };
        if (teamCode) query.teamCode = teamCode;

        const orders = await Order.find(query)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            orders,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET COMPLETED ORDERS
// ==========================================
const getCompletedOrders = async (req, res, next) => {
    try {
        const teamCode = req.user.teamCode;
        const query = {
            "summary.completed": { $gt: 0 },
        };
        if (teamCode) query.teamCode = teamCode;

        const orders = await Order.find(query)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            orders,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET PENDING VERIFICATION ORDERS (FOR EXECUTIVE)
// ==========================================
const getPendingVerificationOrders = async (req, res, next) => {
    try {
        const teamCode = req.user.teamCode;
        const query = {
            "orderUnits.status": "pending_verification",
        };
        if (teamCode) query.teamCode = teamCode;

        const orders = await Order.find(query)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode email phone")
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Orders pending verification fetched successfully",
            orders,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// VERIFY ORDER UNIT (EXECUTIVE APPROVES MEDIATOR PROOFS)
// ==========================================
const verifyOrderUnit = async (req, res, next) => {
    try {
        const { orderId, unitId } = req.body;

        if (!orderId || !unitId) {
            return res.status(400).json({
                success: false,
                message: "orderId and unitId are required",
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const unit = order.orderUnits.id(unitId) || order.orderUnits.find((u) => u._id.toString() === unitId);
        if (!unit) {
            return res.status(404).json({
                success: false,
                message: "Order unit not found",
            });
        }

        if (unit.status !== "pending_verification") {
            return res.status(400).json({
                success: false,
                message: `Cannot verify unit with status '${unit.status}'. Only 'pending_verification' units can be verified.`,
            });
        }

        unit.status = "completed";
        unit.completedAt = new Date();
        unit.verificationRejectionReason = null;

        order.recalculateSummary();
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode");

        return res.status(200).json({
            success: true,
            message: "Unit verified successfully and marked as completed",
            order: populatedOrder,
            unit,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// REJECT / REQUEST REVISION FOR ORDER UNIT (EXECUTIVE ASKS REVISION)
// ==========================================
const rejectOrderUnitVerification = async (req, res, next) => {
    try {
        const { orderId, unitId, reason } = req.body;

        if (!orderId || !unitId) {
            return res.status(400).json({
                success: false,
                message: "orderId and unitId are required",
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const unit = order.orderUnits.id(unitId) || order.orderUnits.find((u) => u._id.toString() === unitId);
        if (!unit) {
            return res.status(404).json({
                success: false,
                message: "Order unit not found",
            });
        }

        if (unit.status !== "pending_verification") {
            return res.status(400).json({
                success: false,
                message: `Cannot request revision for unit with status '${unit.status}'. Only 'pending_verification' units can be revised.`,
            });
        }

        // Revert back to pending_refund so mediator can re-upload proofs
        unit.status = "pending_refund";
        unit.verificationRejectionReason = reason || "Executive requested revision of proof details";

        order.recalculateSummary();
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode");

        return res.status(200).json({
            success: true,
            message: "Revision requested. Unit returned to Pending Refund for mediator correction.",
            order: populatedOrder,
            unit,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// UNASSIGN / REVERT WRONGLY ASSIGNED UNIT OR ORDER (BACK TO UNASSIGNED)
// ==========================================
const unassignOrderUnit = async (req, res, next) => {
    try {
        const { orderId, unitId, mediatorId, quantity } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required",
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        let revertedCount = 0;

        if (unitId) {
            const unit = order.orderUnits.id(unitId) || order.orderUnits.find(u => u._id.toString() === unitId);
            if (!unit) {
                return res.status(404).json({
                    success: false,
                    message: "Order unit not found",
                });
            }
            unit.status = "unassigned";
            unit.mediatorId = null;
            unit.assignedAt = null;
            unit.paymentScreenshot = null;
            unit.paymentSentAt = null;
            revertedCount = 1;
        } else if (mediatorId) {
            const unitsToRevert = order.orderUnits.filter(
                (u) =>
                    u.mediatorId?.toString() === mediatorId.toString() &&
                    (u.status === "pending_payment" || u.status === "assigned")
            );

            const qty = quantity ? Number(quantity) : unitsToRevert.length;
            const selectedUnits = unitsToRevert.slice(0, qty);

            selectedUnits.forEach((unit) => {
                unit.status = "unassigned";
                unit.mediatorId = null;
                unit.assignedAt = null;
                unit.paymentScreenshot = null;
                unit.paymentSentAt = null;
                revertedCount++;
            });
        } else {
            // Revert all pending_payment units of this order
            const pendingUnits = order.orderUnits.filter(u => u.status === "pending_payment");
            pendingUnits.forEach((unit) => {
                unit.status = "unassigned";
                unit.mediatorId = null;
                unit.assignedAt = null;
                unit.paymentScreenshot = null;
                unit.paymentSentAt = null;
                revertedCount++;
            });
        }

        order.recalculateSummary();
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode");

        return res.status(200).json({
            success: true,
            message: `Successfully reverted ${revertedCount} unit(s) back to pending orders`,
            order: populatedOrder,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// SUBMIT PAYMENT PROOF & FORWARD TO ASSIGNED
// ==========================================
const submitExecutivePayment = async (req, res, next) => {
    try {
        const { mediatorId } = req.params;
        const screenshotPath = req.file?.path || req.body.paymentScreenshot;

        if (!mediatorId) {
            return res.status(400).json({
                success: false,
                message: "Mediator ID is required",
            });
        }

        if (!screenshotPath) {
            return res.status(400).json({
                success: false,
                message: "Payment screenshot is required",
            });
        }

        const teamCode = req.user.teamCode;
        const query = {
            "orderUnits.mediatorId": mediatorId,
            "orderUnits.status": { $in: ["pending_payment", "assigned"] },
            "orderUnits.rejectedAt": null,
        };
        if (teamCode) query.teamCode = teamCode;

        const orders = await Order.find(query);

        if (!orders || orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No orders found to attach payment proof for this mediator",
            });
        }

        const now = new Date();
        const paymentMessage = req.body.message || req.body.paymentMessage || null;
        let totalUnitsForwarded = 0;

        for (const order of orders) {
            let orderModified = false;
            for (const unit of order.orderUnits) {
                if (
                    unit.mediatorId?.toString() === mediatorId.toString() &&
                    (unit.status === "pending_payment" || unit.status === "assigned") &&
                    !unit.rejectedAt
                ) {
                    unit.status = "assigned";
                    unit.paymentScreenshot = screenshotPath;
                    unit.paymentMessage = paymentMessage;
                    unit.paymentSentAt = now;
                    orderModified = true;
                    totalUnitsForwarded++;
                }
            }
            if (orderModified) {
                order.recalculateSummary();
                await order.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: `Successfully uploaded payment proof. ${totalUnitsForwarded} unit(s) forwarded to assigned orders.`,
            screenshotUrl: screenshotPath,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET ORDERS SENT BY MEDIATOR (REFUND / PAYMENT SUBMISSIONS)
// ==========================================
const getMediatorSentOrders = async (req, res, next) => {
    try {
        const teamCode = req.user.teamCode;
        const query = {
            "orderUnits.status": "pending_payment",
        };
        if (teamCode) query.teamCode = teamCode;

        const orders = await Order.find(query)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .sort({ createdAt: -1 });

        const filteredOrders = orders
            .map((order) => {
                const orderObj = order.toObject();
                orderObj.orderUnits = orderObj.orderUnits.filter(
                    (u) =>
                        u.status === "pending_payment" &&
                        (u.rejectedAt != null || u.mediatorPaymentScreenshot != null)
                );
                return orderObj;
            })
            .filter((o) => o.orderUnits.length > 0);

        return res.status(200).json({
            success: true,
            message: "Orders sent by mediator fetched successfully",
            orders: filteredOrders,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// ACCEPT MEDIATOR PAYMENT / REFUND & RETURN TO EXECUTIVE PENDING ORDERS
// ==========================================
const acceptMediatorPayment = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { mediatorId, unitIds, quantity } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        let revertedCount = 0;

        order.orderUnits.forEach((unit) => {
            const matchMediator = !mediatorId || unit.mediatorId?.toString() === mediatorId.toString();
            const matchUnit = !unitIds || unitIds.includes(unit._id.toString());
            const isPendingPayment = unit.status === "pending_payment";

            if (matchMediator && matchUnit && isPendingPayment) {
                if (quantity === undefined || revertedCount < Number(quantity)) {
                    unit.status = "unassigned";
                    unit.mediatorId = null;
                    unit.assignedAt = null;
                    revertedCount++;
                }
            }
        });

        if (revertedCount === 0) {
            return res.status(400).json({
                success: false,
                message: "No matching pending payment units found to accept and return to pending",
            });
        }

        order.recalculateSummary();
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode");

        return res.status(200).json({
            success: true,
            message: `Verified payment! Successfully returned ${revertedCount} unit(s) back to Executive Pending Orders.`,
            order: populatedOrder,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET ALL MEDIATORS FOR EXECUTIVE TEAM
// ==========================================
const getMediators = async (req, res, next) => {
    try {
        const teamCode = req.user.teamCode;
        const query = { role: "mediator" };
        if (teamCode) query.teamCode = teamCode;

        const mediators = await User.find(query).select("-password").sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "All mediators are fetched Successfully",
            mediators,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET ALL BRANDS FOR SELECTION DROPDOWN
// ==========================================
const getBrands = async (req, res, next) => {
    try {
        const users = await User.find({ role: "brand" }).select("-password").sort({ name: 1 });

        return res.status(200).json({
            success: true,
            message: "brands were fetched successfully",
            users,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    addOrder,
    assignOrder,
    getOrders,
    getPendingOrders,
    getPendingPaymentOrders,
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
};
