const Order = require("../models/order");
const User = require("../models/user");
const Address = require("../models/address");

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
            season,
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
            season: season ? season.trim() : "General",
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
        const { mediatorId, quantity, unitAddresses } = req.body;

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

        unitsToAssign.forEach((unit, idx) => {
            unit.status = paymentScreenshot ? "assigned" : "pending_payment";
            unit.mediatorId = mediator._id;
            unit.assignedAt = now;
            unit.rejectedAt = null;
            if (paymentScreenshot) {
                unit.paymentScreenshot = paymentScreenshot;
                unit.paymentSentAt = now;
            }
            if (paymentMessage) unit.paymentMessage = paymentMessage;

            if (Array.isArray(unitAddresses) && unitAddresses[idx]) {
                const addrInfo = unitAddresses[idx];
                if (typeof addrInfo === "object" && addrInfo !== null) {
                    unit.addressType = addrInfo.addressType || "executive_provided";
                    unit.deliveryAddress = addrInfo.deliveryAddress || "";
                    unit.address = addrInfo.deliveryAddress || "";
                } else if (typeof addrInfo === "string") {
                    unit.addressType = addrInfo.toLowerCase().includes("yourself") ? "yourself" : "executive_provided";
                    unit.deliveryAddress = addrInfo;
                    unit.address = addrInfo;
                }
            }
        });

        order.recalculateSummary();
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode");

        return res.status(200).json({
            success: true,
            message: paymentScreenshot
                ? "Order assigned and forwarded to mediator successfully"
                : "Order assigned to mediator successfully and moved to Advance Payment",
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
        const { orderId, unitId, reason, targetStatus } = req.body;

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

        // Destination state chosen by executive: 'in_progress' or 'pending_refund' (default)
        const finalStatus = targetStatus === "in_progress" ? "in_progress" : "pending_refund";
        unit.status = finalStatus;
        unit.verificationRejectionReason = reason || "Executive requested revision of proof details";
        unit.rejectedAt = new Date();

        order.recalculateSummary();
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode");

        const statusLabel = finalStatus === "in_progress" ? "In Progress" : "Pending Refund";
        return res.status(200).json({
            success: true,
            message: `Revision requested. Unit returned to ${statusLabel} for mediator correction.`,
            order: populatedOrder,
            unit,
            targetStatus: finalStatus,
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
            message: `Successfully uploaded payment proof. ${totalUnitsForwarded} unit(s) forwarded to mediator for verification.`,
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
                    unit.refundedByMediatorId = unit.mediatorId;
                    unit.mediatorPaymentStatus = "verified";
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

// ==========================================
// EXECUTIVE ADDRESS MANAGEMENT
// ==========================================
const createAddress = async (req, res, next) => {
    try {
        const { label, recipientName, phoneNumber, addressLine1, addressLine2, city, state, pincode } = req.body;
        if (!label || !recipientName || !phoneNumber || !addressLine1 || !city || !state || !pincode) {
            return res.status(400).json({
                success: false,
                message: "All address fields (label, recipientName, phoneNumber, addressLine1, city, state, pincode) are required",
            });
        }
        const address = await Address.create({
            executiveId: req.user.id,
            executiveName: req.user.name || "Executive",
            teamCode: req.user.teamCode || "",
            label: label.trim(),
            recipientName: recipientName.trim(),
            phoneNumber: phoneNumber.trim(),
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2 ? addressLine2.trim() : "",
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
        });
        return res.status(201).json({
            success: true,
            message: "Address saved successfully",
            address,
        });
    } catch (err) {
        next(err);
    }
};

const getAddresses = async (req, res, next) => {
    try {
        const query = {
            $or: [
                { executiveId: req.user.id },
            ],
        };
        if (req.user.teamCode) {
            query.$or.push({ teamCode: req.user.teamCode });
        }
        const addresses = await Address.find(query).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            addresses,
        });
    } catch (err) {
        next(err);
    }
};

const deleteAddress = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await Address.findOneAndDelete({ _id: id, executiveId: req.user.id });
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }
        return res.status(200).json({ success: true, message: "Address deleted successfully" });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// EXECUTIVE BRAND OVERVIEW & DETAILS
// ==========================================
const getExecutiveBrandSummary = async (req, res, next) => {
    try {
        const teamCode = req.user.teamCode;
        const orders = await Order.find(teamCode ? { teamCode } : {})
            .populate("brandUserId", "name brand role email")
            .lean();

        const brandMap = {};
        orders.forEach((ord) => {
            const brandKey = (ord.brandUserId?._id || ord.brand || "Unknown").toString();
            if (!brandMap[brandKey]) {
                brandMap[brandKey] = {
                    brandId: ord.brandUserId?._id || null,
                    brandName: ord.brand || ord.brandUserId?.brand || ord.brandUserId?.name || "Unknown Brand",
                    userName: ord.brandUserId?.name || "",
                    totalOrders: 0,
                    totalUnits: 0,
                    unassignedUnits: 0,
                    assignedUnits: 0,
                    inProgressUnits: 0,
                    pendingRefundUnits: 0,
                    pendingVerificationUnits: 0,
                    completedUnits: 0,
                    totalAmount: 0,
                };
            }
            const bm = brandMap[brandKey];
            bm.totalOrders++;
            const units = ord.orderUnits || [];
            bm.totalUnits += units.length;
            const unitPrice = Number(ord.price) || 0;
            bm.totalAmount += unitPrice * units.length;

            units.forEach((u) => {
                if (u.status === "unassigned") bm.unassignedUnits++;
                else if (u.status === "assigned" || u.status === "pending_payment") bm.assignedUnits++;
                else if (u.status === "in_progress") bm.inProgressUnits++;
                else if (u.status === "pending_refund") bm.pendingRefundUnits++;
                else if (u.status === "pending_verification") bm.pendingVerificationUnits++;
                else if (u.status === "completed") bm.completedUnits++;
            });
        });

        const brandSummaries = Object.values(brandMap).map((b) => ({
            ...b,
            completionRate: b.totalUnits > 0 ? Math.round((b.completedUnits / b.totalUnits) * 100) : 0,
        })).sort((a, b) => b.totalOrders - a.totalOrders);

        return res.status(200).json({
            success: true,
            brandSummaries,
        });
    } catch (err) {
        next(err);
    }
};

const getExecutiveBrandDetails = async (req, res, next) => {
    try {
        const { brandUserId } = req.params;
        const teamCode = req.user.teamCode;

        const brandUser = await User.findById(brandUserId).select("-password").lean();
        const query = {
            $and: [
                teamCode ? { teamCode } : {},
                {
                    $or: [
                        { brandUserId },
                        ...(brandUser?.brand ? [{ brand: brandUser.brand }] : []),
                        ...(brandUser?.name ? [{ brand: brandUser.name }] : []),
                    ],
                },
            ],
        };

        const orders = await Order.find(query)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            brand: brandUser || { name: "Brand", _id: brandUserId },
            orders,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// MASTER ANALYTICS & BREAKDOWNS
// ==========================================
const getExecutiveMasterAnalytics = async (req, res, next) => {
    try {
        const teamCode = req.user.teamCode;
        const { startDate, endDate, createdDate, date, brandUserId, mediatorId, status } = req.query;

        const filter = teamCode ? { teamCode } : {};

        const singleDate = createdDate || date;
        if (singleDate) {
            const startOfDay = new Date(singleDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(singleDate);
            endOfDay.setHours(23, 59, 59, 999);
            filter.createdAt = {
                $gte: startOfDay,
                $lte: endOfDay,
            };
        } else if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                filter.createdAt.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        if (brandUserId && brandUserId !== "all") {
            filter.brandUserId = brandUserId;
        }

        const orders = await Order.find(filter)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .sort({ createdAt: -1 })
            .lean();

        let filteredOrders = orders;
        if (mediatorId && mediatorId !== "all") {
            filteredOrders = filteredOrders.filter((ord) =>
                ord.orderUnits?.some((u) => u.mediatorId?._id?.toString() === mediatorId || u.mediatorId?.toString() === mediatorId)
            );
        }

        if (status && status !== "all") {
            filteredOrders = filteredOrders.filter((ord) => {
                const s = ord.summary || {};
                if (status === "completed") return s.completed > 0;
                if (status === "in_progress") return s.inProgress > 0;
                if (status === "pending_refund") return s.pendingRefund > 0;
                if (status === "pending_payment") return s.pendingPayment > 0;
                if (status === "unassigned") return s.unassigned > 0;
                return true;
            });
        }

        const brandStats = {};
        const mediatorStats = {};
        const dateStats = {};
        let totalUnits = 0;
        let totalCompleted = 0;
        let totalAssigned = 0;
        let totalInProgress = 0;
        let totalPendingRefund = 0;
        let totalPendingPayment = 0;
        let totalUnassigned = 0;

        filteredOrders.forEach((ord) => {
            const bKey = (ord.brandUserId?._id || ord.brand || "Unknown").toString();
            if (!brandStats[bKey]) {
                brandStats[bKey] = {
                    id: ord.brandUserId?._id || null,
                    name: ord.brand || ord.brandUserId?.brand || ord.brandUserId?.name || "Unknown Brand",
                    totalOrders: 0,
                    totalUnits: 0,
                    completed: 0,
                    inProgress: 0,
                    pendingRefund: 0,
                    pendingPayment: 0,
                    unassigned: 0,
                };
            }
            brandStats[bKey].totalOrders++;

            const d = new Date(ord.createdAt);
            const dateKey = !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "Unknown";
            const formattedDate = !isNaN(d.getTime())
                ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                : "Unknown Date";

            if (!dateStats[dateKey]) {
                dateStats[dateKey] = {
                    date: dateKey,
                    formattedDate,
                    totalOrders: 0,
                    totalUnits: 0,
                    completed: 0,
                    assigned: 0,
                    inProgress: 0,
                    pendingRefund: 0,
                    pendingPayment: 0,
                    pendingVerification: 0,
                    pending: 0,
                    unassigned: 0,
                };
            }
            dateStats[dateKey].totalOrders++;

            const units = ord.orderUnits || [];
            units.forEach((u) => {
                totalUnits++;
                brandStats[bKey].totalUnits++;
                dateStats[dateKey].totalUnits++;

                const medId = u.mediatorId?._id ? u.mediatorId._id.toString() : (u.mediatorId ? u.mediatorId.toString() : "Unassigned");
                const medName = u.mediatorId?.name || (medId === "Unassigned" ? "Unassigned" : "Mediator");
                const medCode = u.mediatorId?.mediatorCode || "";

                if (!mediatorStats[medId]) {
                    mediatorStats[medId] = {
                        id: medId,
                        name: medName,
                        mediatorCode: medCode,
                        totalUnits: 0,
                        completed: 0,
                        inProgress: 0,
                        pendingRefund: 0,
                        pendingPayment: 0,
                        assigned: 0,
                        unassigned: 0,
                    };
                }
                mediatorStats[medId].totalUnits++;

                if (u.status === "completed") {
                    totalCompleted++;
                    brandStats[bKey].completed++;
                    mediatorStats[medId].completed++;
                    dateStats[dateKey].completed++;
                } else if (u.status === "in_progress") {
                    totalInProgress++;
                    brandStats[bKey].inProgress++;
                    mediatorStats[medId].inProgress++;
                    dateStats[dateKey].inProgress++;
                } else if (u.status === "pending_refund") {
                    totalPendingRefund++;
                    brandStats[bKey].pendingRefund++;
                    mediatorStats[medId].pendingRefund++;
                    dateStats[dateKey].pendingRefund++;
                } else if (u.status === "pending_payment") {
                    totalPendingPayment++;
                    brandStats[bKey].pendingPayment++;
                    mediatorStats[medId].pendingPayment++;
                    dateStats[dateKey].pendingPayment++;
                } else if (u.status === "pending_verification") {
                    dateStats[dateKey].pendingVerification = (dateStats[dateKey].pendingVerification || 0) + 1;
                } else if (u.status === "assigned") {
                    totalAssigned++;
                    mediatorStats[medId].assigned = (mediatorStats[medId].assigned || 0) + 1;
                    dateStats[dateKey].assigned++;
                } else if (u.status === "unassigned") {
                    totalUnassigned++;
                    brandStats[bKey].unassigned++;
                    mediatorStats[medId].unassigned++;
                    dateStats[dateKey].unassigned++;
                }
            });
        });

        const brandBreakdown = Object.values(brandStats);
        brandBreakdown.forEach((b) => {
            b.notDone = Math.max(0, (b.totalUnits || 0) - (b.completed || 0));
            b.completionRate = b.totalUnits > 0 ? Math.round((b.completed / b.totalUnits) * 100) : 0;
        });

        const mediatorBreakdown = Object.values(mediatorStats);
        mediatorBreakdown.forEach((m) => {
            m.notDone = Math.max(0, (m.totalUnits || 0) - (m.completed || 0));
            m.completionRate = m.totalUnits > 0 ? Math.round((m.completed / m.totalUnits) * 100) : 0;
        });

        const dateBreakdown = Object.values(dateStats).sort((a, b) => b.date.localeCompare(a.date));
        dateBreakdown.forEach((item) => {
            item.notDone = Math.max(0, (item.totalUnits || 0) - (item.completed || 0));
            item.pending = (item.pendingRefund || 0) + (item.pendingPayment || 0) + (item.pendingVerification || 0);
            item.completionRate = item.totalUnits > 0 ? Math.round((item.completed / item.totalUnits) * 100) : 0;
        });

        return res.status(200).json({
            success: true,
            totals: {
                totalOrders: filteredOrders.length,
                totalUnits,
                totalCompleted,
                totalNotDone: Math.max(0, totalUnits - totalCompleted),
                totalAssigned,
                totalInProgress,
                totalPendingRefund,
                totalPendingPayment,
                totalUnassigned,
                completionRate: totalUnits > 0 ? Math.round((totalCompleted / totalUnits) * 100) : 0,
            },
            brandBreakdown,
            mediatorBreakdown,
            dateBreakdown,
            orders: filteredOrders,
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
    createAddress,
    getAddresses,
    deleteAddress,
    getExecutiveBrandSummary,
    getExecutiveBrandDetails,
    getExecutiveMasterAnalytics,
};
