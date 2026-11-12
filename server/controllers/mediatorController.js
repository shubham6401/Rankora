const mongoose = require("mongoose");
const Order = require("../models/order");
const BalanceTransaction = require("../models/balanceTransaction");
const User = require("../models/user");

// ==========================================
// HELPER: SANITIZE / REDACT UNIT SPECIFICATIONS FOR MEDIATORS
// (Warehouse / Empty specifications are strictly executive/brand internal)
// ==========================================
const sanitizeForMediator = (data) => {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.map((item) => sanitizeForMediator(item));
    }
    const obj = typeof data.toObject === "function" ? data.toObject() : { ...data };
    if (obj.unitType !== undefined) {
        delete obj.unitType;
    }
    if (Array.isArray(obj.orderUnits)) {
        obj.orderUnits = obj.orderUnits.map((u) => {
            const unitObj = typeof u.toObject === "function" ? u.toObject() : { ...u };
            delete unitObj.unitType;
            return unitObj;
        });
    }
    return obj;
};

// ==========================================
// GET NEW ASSIGNED ORDERS FOR MEDIATOR
// ==========================================
const getNewOrders = async (req, res, next) => {
    try {
        const mediatorId = req.user.id;

        const orders = await Order.find({
            orderUnits: {
                $elemMatch: {
                    mediatorId: mediatorId,
                    status: "assigned",
                },
            },
        })
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .sort({ createdAt: -1 });

        const mediatorOrders = orders.map((order) => {
            const orderObj = order.toObject();
            orderObj.orderUnits = orderObj.orderUnits.filter(
                (unit) =>
                    unit.mediatorId?._id?.toString() === mediatorId &&
                    unit.status === "assigned"
            );
            return orderObj;
        });

        return res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            orders: sanitizeForMediator(mediatorOrders),
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// ACCEPT ASSIGNED ORDER (MOVE TO IN_PROGRESS)
// ==========================================
const acceptOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const mediatorId = req.user.id;
        const requestedQuantity = req.body?.quantity !== undefined ? Number(req.body.quantity) : null;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Find all assigned units for this mediator
        const assignedUnits = order.orderUnits.filter(
            (unit) =>
                unit.mediatorId?.toString() === mediatorId &&
                unit.status === "assigned"
        );

        if (assignedUnits.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No assigned units found for this mediator to accept",
            });
        }

        const countToAccept = requestedQuantity && requestedQuantity > 0
            ? Math.min(requestedQuantity, assignedUnits.length)
            : assignedUnits.length;

        for (let i = 0; i < countToAccept; i++) {
            assignedUnits[i].status = "in_progress";
        }

        order.recalculateSummary();
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode");

        return res.status(200).json({
            success: true,
            message: "Order Accepted succeffully",
            order: sanitizeForMediator(populatedOrder),
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET IN_PROGRESS / PENDING ORDERS FOR MEDIATOR
// ==========================================
const getPendingOrders = async (req, res, next) => {
    try {
        const mediatorId = req.user.id;

        const orders = await Order.find({
            orderUnits: {
                $elemMatch: {
                    mediatorId: mediatorId,
                    status: "in_progress",
                },
            },
        })
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .sort({ createdAt: -1 });

        const mappedOrders = orders.map((order) => {
            const orderObj = order.toObject();
            orderObj.orderUnits = orderObj.orderUnits.filter(
                (unit) =>
                    unit.mediatorId?._id?.toString() === mediatorId &&
                    unit.status === "in_progress"
            );
            // Backward compatibility
            orderObj.status = "in_progress";
            orderObj.assignedTo = req.user;
            return orderObj;
        });

        return res.status(200).json({
            success: true,
            message: "Pending Orders fetched succeffully",
            orders: sanitizeForMediator(mappedOrders),
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// SUBMIT ORDER DETAILS (IN_PROGRESS -> PENDING_REFUND)
// ==========================================
const submitOrderDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const mediatorId = req.user.id;

        // Try finding by order ID or unit ID
        let order = await Order.findOne({
            $or: [{ _id: id }, { "orderUnits._id": id }],
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Find the unit to update
        let unit = order.orderUnits.find((u) => u._id.toString() === id);

        if (!unit) {
            // Find first in_progress unit for this mediator
            unit = order.orderUnits.find(
                (u) =>
                    u.mediatorId?.toString() === mediatorId &&
                    u.status === "in_progress"
            );
        }

        if (!unit) {
            return res.status(400).json({
                success: false,
                message: "No in-progress order unit found to submit",
            });
        }

        const screenshotPath = req.file?.path || req.body.orderedScreenshot || unit.orderedScreenshot;

        if (req.body.orderId) unit.orderId = req.body.orderId;
        if (screenshotPath) unit.orderedScreenshot = screenshotPath;
        if (req.body.expectedArrivalDate) unit.expectedArrivalDate = req.body.expectedArrivalDate;
        if (req.body.address) unit.address = req.body.address;
        if (req.body.addressType) unit.addressType = req.body.addressType;
        if (req.body.reviewerName) unit.reviewerName = req.body.reviewerName;
        if (req.body.platformId) unit.platformId = req.body.platformId;
        if (req.body.reviewerPlatform) unit.reviewerPlatform = req.body.reviewerPlatform;
        if (req.body.reviewerProfileUrl) unit.reviewerProfileUrl = req.body.reviewerProfileUrl;

        // Record the exact time and date when mediator entered the order details
        unit.orderedAt = req.body.orderedAt ? new Date(req.body.orderedAt) : new Date();

        // Default orderReceivedOn to order createdAt date (format YYYY-MM-DD)
        const orderCreatedDateStr = order.createdAt ? new Date(order.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
        unit.orderReceivedOn = req.body.orderReceivedOn || orderCreatedDateStr;

        // Price & Delivery Fee Adjustments
        if (req.body.purchasePrice !== undefined && req.body.purchasePrice !== "") {
            unit.purchasePrice = Number(req.body.purchasePrice);
        }
        if (req.body.deliveryFee !== undefined && req.body.deliveryFee !== "") {
            unit.deliveryFee = Number(req.body.deliveryFee);
        }
        if (req.body.totalPurchasedAmount !== undefined && req.body.totalPurchasedAmount !== "") {
            unit.totalPurchasedAmount = Number(req.body.totalPurchasedAmount);
        } else if (unit.purchasePrice !== undefined) {
            unit.totalPurchasedAmount = (unit.purchasePrice || 0) + (unit.deliveryFee || 0);
        }

        unit.status = "pending_refund";
        unit.verificationRejectionReason = null;

        order.recalculateSummary();
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order added successfully",
            order: sanitizeForMediator(order),
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET PENDING REFUND ORDERS FOR MEDIATOR
// ==========================================
const getRefundPendingOrders = async (req, res, next) => {
    try {
        const mediatorId = req.user.id;

        const orders = await Order.find({
            orderUnits: {
                $elemMatch: {
                    mediatorId: mediatorId,
                    status: "pending_refund",
                },
            },
        })
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .sort({ createdAt: -1 });

        const mappedOrders = orders.map((order) => {
            const orderObj = order.toObject();
            orderObj.orderUnits = orderObj.orderUnits.filter(
                (unit) =>
                    unit.mediatorId?._id?.toString() === mediatorId &&
                    unit.status === "pending_refund"
            );
            orderObj.status = "pending_refund";
            orderObj.assignedTo = req.user;
            return orderObj;
        });

        return res.status(200).json({
            success: true,
            message: " Orders with refund Pending are fetched succeffully",
            orders: sanitizeForMediator(mappedOrders),
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// SUBMIT REFUND SCREENSHOTS (PENDING_REFUND -> COMPLETED)
// ==========================================
const submitRefundDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const mediatorId = req.user.id;

        let order = await Order.findOne({
            $or: [{ _id: id }, { "orderUnits._id": id }],
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        let unit = order.orderUnits.find((u) => u._id.toString() === id);

        if (!unit) {
            unit = order.orderUnits.find(
                (u) =>
                    u.mediatorId?.toString() === mediatorId &&
                    u.status === "pending_refund"
            );
        }

        if (!unit) {
            return res.status(400).json({
                success: false,
                message: "No refund-pending order unit found to submit",
            });
        }

        const productReviewScreenshot =
            req.files?.productReviewScreenshot?.[0]?.path ||
            req.body.productReviewScreenshot ||
            unit.postDeliveryDetails?.productReviewScreenshot;

        const invoiceScreenshot =
            req.files?.invoiceScreenshot?.[0]?.path ||
            req.body.invoiceScreenshot ||
            unit.postDeliveryDetails?.invoiceScreenshot;

        const sellerFeedbackScreenShot =
            req.files?.sellerFeedbackScreenShot?.[0]?.path ||
            req.body.sellerFeedbackScreenShot ||
            unit.postDeliveryDetails?.sellerFeedbackScreenShot;

        unit.postDeliveryDetails = {
            success: true,
            productReviewScreenshot: productReviewScreenshot || null,
            invoiceScreenshot: invoiceScreenshot || null,
            sellerFeedbackScreenShot: sellerFeedbackScreenShot || null,
        };

        unit.status = "pending_verification";
        unit.submittedForVerificationAt = new Date();
        unit.verificationRejectionReason = null;

        order.recalculateSummary();
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Successfully submitted refund proofs for verification",
            order: sanitizeForMediator(order),
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET PENDING VERIFICATION ORDERS FOR MEDIATOR
// ==========================================
const getPendingVerificationOrders = async (req, res, next) => {
    try {
        const mediatorId = req.user.id;

        const orders = await Order.find({
            orderUnits: {
                $elemMatch: {
                    mediatorId: mediatorId,
                    status: "pending_verification",
                },
            },
        })
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .sort({ updatedAt: -1 });

        const formattedOrders = orders.map((order) => {
            const orderObj = order.toObject();
            orderObj.orderUnits = orderObj.orderUnits.filter(
                (unit) =>
                    unit.status === "pending_verification" &&
                    unit.mediatorId &&
                    (unit.mediatorId._id?.toString() === mediatorId ||
                        unit.mediatorId.toString() === mediatorId)
            );
            return orderObj;
        });

        return res.status(200).json({
            success: true,
            message: "Fetched pending verification orders successfully",
            orders: sanitizeForMediator(formattedOrders),
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET COMPLETED ORDERS FOR MEDIATOR
// ==========================================
const getCompletedOrders = async (req, res, next) => {
    try {
        const mediatorId = req.user.id;

        const orders = await Order.find({
            orderUnits: {
                $elemMatch: {
                    mediatorId: mediatorId,
                    status: "completed",
                },
            },
        })
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .sort({ createdAt: -1 });

        const mappedOrders = orders.map((order) => {
            const orderObj = order.toObject();
            orderObj.orderUnits = orderObj.orderUnits.filter((unit) => {
                const uMedId = (unit.mediatorId?._id || unit.mediatorId)?.toString();
                return uMedId === mediatorId.toString() && unit.status === "completed";
            });
            orderObj.status = "completed";
            orderObj.assignedTo = req.user;
            return orderObj;
        });

        return res.status(200).json({
            success: true,
            message: "Completed Orders fetched succeffully",
            orders: sanitizeForMediator(mappedOrders),
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// REJECT ASSIGNED ORDER (MOVE TO PENDING_PAYMENT FOR REFUND)
// ==========================================
const rejectOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const mediatorId = req.user.id;
        const requestedQuantity = req.body?.quantity !== undefined ? Number(req.body.quantity) : null;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const assignedUnits = order.orderUnits.filter(
            (unit) =>
                unit.mediatorId?.toString() === mediatorId &&
                unit.status === "assigned"
        );

        if (assignedUnits.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No assigned units found for this mediator to reject",
            });
        }

        const countToReject = requestedQuantity && requestedQuantity > 0
            ? Math.min(requestedQuantity, assignedUnits.length)
            : assignedUnits.length;

        const now = new Date();
        let refundRequired = false;
        for (let i = 0; i < countToReject; i++) {
            const unit = assignedUnits[i];
            if (unit.paymentScreenshot) {
                // Advance payment exists, requires refund proof from mediator
                unit.status = "pending_payment";
                unit.rejectedAt = now;
                refundRequired = true;
            } else {
                // Clean rejection: revert unit back to unassigned so executive can reassign
                unit.status = "unassigned";
                unit.mediatorId = null;
                unit.assignedAt = null;
                unit.rejectedAt = now;
            }
        }

        order.recalculateSummary();
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name email teamCode")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode");

        const message = refundRequired
            ? `Successfully rejected ${countToReject} unit(s). Moved to Payment Pending section for refund proof submission.`
            : `Order offer rejected (${countToReject} units). Units returned to Unassigned pool for executive reassignment.`;

        return res.status(200).json({
            success: true,
            message,
            refundRequired,
            order: sanitizeForMediator(populatedOrder),
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET PENDING PAYMENT (REFUND) ORDERS FOR MEDIATOR
// ==========================================
const getPendingPaymentOrders = async (req, res, next) => {
    try {
        const mediatorId = req.user.id;

        const orders = await Order.find({
            orderUnits: {
                $elemMatch: {
                    $or: [
                        { mediatorId: mediatorId },
                        { refundedByMediatorId: mediatorId },
                    ],
                    status: "pending_payment",
                    mediatorPaymentStatus: { $ne: "verified" },
                },
            },
        })
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name email teamCode")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .sort({ createdAt: -1 });

        const mappedOrders = orders.map((order) => {
            const orderObj = order.toObject();
            orderObj.orderUnits = (orderObj.orderUnits || []).filter((unit) => {
                const uMedId = unit.mediatorId?._id ? unit.mediatorId._id.toString() : unit.mediatorId?.toString();
                const uRefMedId = unit.refundedByMediatorId?._id ? unit.refundedByMediatorId._id.toString() : unit.refundedByMediatorId?.toString();
                return (
                    (uMedId === mediatorId || uRefMedId === mediatorId) &&
                    unit.status === "pending_payment" &&
                    unit.mediatorPaymentStatus !== "verified"
                );
            });
            return orderObj;
        }).filter((order) => order.orderUnits.length > 0);

        // Verified refund history for this mediator
        const verifiedOrders = await Order.find({
            orderUnits: {
                $elemMatch: {
                    $or: [
                        { refundedByMediatorId: mediatorId },
                        { mediatorId: mediatorId },
                    ],
                    mediatorPaymentStatus: "verified",
                },
            },
        })
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name email teamCode")
            .sort({ updatedAt: -1 });

        const mappedVerified = verifiedOrders.map((order) => {
            const orderObj = order.toObject();
            orderObj.orderUnits = (orderObj.orderUnits || []).filter((unit) => {
                const uRefMedId = unit.refundedByMediatorId?._id ? unit.refundedByMediatorId._id.toString() : unit.refundedByMediatorId?.toString();
                const uMedId = unit.mediatorId?._id ? unit.mediatorId._id.toString() : unit.mediatorId?.toString();
                return (uRefMedId === mediatorId || uMedId === mediatorId) && unit.mediatorPaymentStatus === "verified";
            });
            return orderObj;
        }).filter((order) => order.orderUnits.length > 0);

        return res.status(200).json({
            success: true,
            message: "Pending payment orders fetched successfully",
            orders: sanitizeForMediator(mappedOrders),
            verifiedOrders: sanitizeForMediator(mappedVerified),
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// SUBMIT MEDIATOR REFUND PAYMENT PROOF & MESSAGE (SEND TO EXECUTIVE)
// ==========================================
const submitMediatorPayment = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const mediatorId = req.user.id;
        const screenshotPath = req.file?.path || req.body.mediatorPaymentScreenshot || req.body.paymentScreenshot;
        const message = req.body.message || req.body.mediatorMessage || "";

        if (!screenshotPath) {
            return res.status(400).json({
                success: false,
                message: "Payment screenshot is required",
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const pendingUnits = order.orderUnits.filter(
            (u) =>
                u.mediatorId?.toString() === mediatorId &&
                u.status === "pending_payment"
        );

        if (pendingUnits.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No pending payment units found for this mediator to submit proof for",
            });
        }

        const now = new Date();
        pendingUnits.forEach((unit) => {
            unit.mediatorPaymentScreenshot = screenshotPath;
            unit.mediatorMessage = message;
            unit.mediatorPaymentSentAt = now;
            unit.mediatorPaymentStatus = "pending";
        });

        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name email teamCode")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode");

        return res.status(200).json({
            success: true,
            message: "Payment proof and message successfully submitted and sent to executive",
            order: populatedOrder,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET MEDIATOR SUMMARY & ALL ASSIGNED ORDERS
// ==========================================
const getMediatorSummary = async (req, res, next) => {
    try {
        const mediatorId = req.user.id;

        const orders = await Order.find({
            $or: [
                { "orderUnits.mediatorId": mediatorId },
                { "orderUnits.refundedByMediatorId": mediatorId },
            ],
        })
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name email teamCode")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .sort({ createdAt: -1 });

        let totalUnits = 0;
        let totalValue = 0;
        let completedValue = 0;

        let newAssignedUnits = 0;
        let pendingPaymentUnits = 0;
        let inProgressUnits = 0;
        let inProgressValue = 0;
        let pendingRefundUnits = 0;
        let pendingRefundValue = 0;
        let pendingVerificationUnits = 0;
        let pendingVerificationValue = 0;
        let completedUnits = 0;
        let settledUnits = 0;
        let settledPayout = 0;
        let awaitingConfirmationUnits = 0;
        let cancelledUnits = 0;
        let cancelledValue = 0;

        let newAssignedOrders = 0;
        let pendingPaymentOrders = 0;
        let inProgressOrders = 0;
        let pendingRefundOrders = 0;
        let pendingVerificationOrders = 0;
        let completedOrders = 0;
        let settledOrders = 0;
        let cancelledOrders = 0;

        const mappedOrders = orders.map((order) => {
            const orderObj = order.toObject();
            const price = parseFloat(order.price) || 0;

            const myUnits = orderObj.orderUnits.filter(
                (u) =>
                    u.mediatorId?._id?.toString() === mediatorId ||
                    u.mediatorId?.toString() === mediatorId ||
                    u.refundedByMediatorId?._id?.toString() === mediatorId ||
                    u.refundedByMediatorId?.toString() === mediatorId
            );

            let hasNewAssigned = false;
            let hasPendingPayment = false;
            let hasInProgress = false;
            let hasPendingRefund = false;
            let hasPendingVerification = false;
            let hasCompleted = false;
            let hasSettled = false;
            let hasCancelled = false;

            myUnits.forEach((unit) => {
                totalUnits++;
                totalValue += price;

                const uRefundMedId = (unit.refundedByMediatorId?._id || unit.refundedByMediatorId)?.toString();
                const isCancelledOrReturned =
                    unit.status === "pending_payment" ||
                    uRefundMedId === mediatorId ||
                    Boolean(unit.returnReason) ||
                    Boolean(unit.rejectedAt);

                if (isCancelledOrReturned && unit.status !== "completed") {
                    cancelledUnits++;
                    cancelledValue += price;
                    hasCancelled = true;
                    if (unit.status === "pending_payment" && unit.mediatorPaymentStatus !== "verified") {
                        pendingPaymentUnits++;
                        hasPendingPayment = true;
                    }
                } else if (unit.status === "assigned") {
                    newAssignedUnits++;
                    hasNewAssigned = true;
                } else if (unit.status === "in_progress") {
                    inProgressUnits++;
                    inProgressValue += price;
                    hasInProgress = true;
                } else if (unit.status === "pending_refund") {
                    pendingRefundUnits++;
                    pendingRefundValue += price;
                    hasPendingRefund = true;
                } else if (unit.status === "pending_verification") {
                    pendingVerificationUnits++;
                    pendingVerificationValue += price;
                    hasPendingVerification = true;
                } else if (unit.status === "completed") {
                    completedUnits++;
                    completedValue += price;
                    hasCompleted = true;

                    if (unit.settlementStatus === "settled") {
                        settledUnits++;
                        settledPayout += parseFloat(unit.settlementAmount || 0);
                        hasSettled = true;
                    } else if (unit.settlementStatus === "pending_confirmation") {
                        awaitingConfirmationUnits++;
                    }
                }
            });

            if (hasNewAssigned) newAssignedOrders++;
            if (hasPendingPayment) pendingPaymentOrders++;
            if (hasInProgress) inProgressOrders++;
            if (hasPendingRefund) pendingRefundOrders++;
            if (hasCancelled) cancelledOrders++;
            if (hasPendingVerification) pendingVerificationOrders++;
            if (hasCompleted) completedOrders++;
            if (hasSettled) settledOrders++;

            orderObj.orderUnits = myUnits;
            orderObj.myUnitsCount = myUnits.length;
            orderObj.myUnitsValue = price * myUnits.length;
            return orderObj;
        });

        return res.status(200).json({
            success: true,
            message: "Mediator summary fetched successfully",
            summary: {
                totalOrders: orders.length,
                totalUnits,
                totalValue,
                completedValue,
                newAssignedUnits,
                newAssignedOrders,
                pendingPaymentUnits,
                pendingPaymentOrders,
                inProgressUnits,
                inProgressOrders,
                pendingRefundUnits,
                pendingRefundOrders,
                pendingVerificationUnits,
                pendingVerificationOrders,
                completedUnits,
                completedOrders,
                settledUnits,
                settledOrders,
                settledPayout,
                awaitingConfirmationUnits,
                cancelledUnits,
                cancelledOrders,
                cancelledValue: Number(cancelledValue.toFixed(2)),
                inProgressValue: Number(inProgressValue.toFixed(2)),
                pendingRefundValue: Number(pendingRefundValue.toFixed(2)),
                pendingVerificationValue: Number(pendingVerificationValue.toFixed(2)),
                orderedFormValue: Number((inProgressValue + pendingRefundValue + pendingVerificationValue + completedValue).toFixed(2)),
            },
            orders: mappedOrders,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// BATCH ACCEPT ORDERS
// ==========================================
const batchAcceptOrders = async (req, res, next) => {
    try {
        const mediatorId = req.user.id;
        const { items } = req.body; // array of { orderId, quantity } or empty to accept all available

        let orders;
        if (Array.isArray(items) && items.length > 0) {
            const orderIds = items.map((i) => i.orderId);
            orders = await Order.find({ _id: { $in: orderIds } });
        } else {
            orders = await Order.find({
                "orderUnits.mediatorId": mediatorId,
                "orderUnits.status": "assigned",
            });
        }

        let totalAccepted = 0;
        for (const order of orders) {
            const itemConfig = Array.isArray(items)
                ? items.find((i) => i.orderId === order._id.toString())
                : null;
            const assignedUnits = order.orderUnits.filter(
                (u) => u.mediatorId?.toString() === mediatorId && u.status === "assigned"
            );
            const countToAccept = itemConfig?.quantity !== undefined && itemConfig?.quantity !== null
                ? Math.min(Number(itemConfig.quantity), assignedUnits.length)
                : assignedUnits.length;

            for (let i = 0; i < countToAccept; i++) {
                assignedUnits[i].status = "in_progress";
                totalAccepted++;
            }
            order.recalculateSummary();
            await order.save();
        }

        return res.status(200).json({
            success: true,
            message: `Successfully accepted ${totalAccepted} unit(s)`,
            totalAccepted,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// BATCH REJECT ORDERS
// ==========================================
const batchRejectOrders = async (req, res, next) => {
    try {
        const mediatorId = req.user.id;
        const { items } = req.body; // array of { orderId, quantity } or empty to reject all available

        let orders;
        if (Array.isArray(items) && items.length > 0) {
            const orderIds = items.map((i) => i.orderId);
            orders = await Order.find({ _id: { $in: orderIds } });
        } else {
            orders = await Order.find({
                "orderUnits.mediatorId": mediatorId,
                "orderUnits.status": "assigned",
            });
        }

        let totalRejected = 0;
        const now = new Date();
        for (const order of orders) {
            const itemConfig = Array.isArray(items)
                ? items.find((i) => i.orderId === order._id.toString())
                : null;
            const assignedUnits = order.orderUnits.filter(
                (u) => u.mediatorId?.toString() === mediatorId && u.status === "assigned"
            );
            const countToReject = itemConfig?.quantity !== undefined && itemConfig?.quantity !== null
                ? Math.min(Number(itemConfig.quantity), assignedUnits.length)
                : assignedUnits.length;

            for (let i = 0; i < countToReject; i++) {
                const unit = assignedUnits[i];
                if (unit.paymentScreenshot) {
                    unit.status = "pending_payment";
                    unit.rejectedAt = now;
                } else {
                    unit.status = "unassigned";
                    unit.mediatorId = null;
                    unit.assignedAt = null;
                    unit.rejectedAt = now;
                }
                totalRejected++;
            }
            order.recalculateSummary();
            await order.save();
        }

        return res.status(200).json({
            success: true,
            message: `Successfully processed rejection for ${totalRejected} unit(s)`,
            totalRejected,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// RETURN ORDER UNIT (FROM IN_PROGRESS OR PENDING_REFUND)
// ==========================================
const returnOrderUnit = async (req, res, next) => {
    try {
        const { unitId } = req.params;
        const { reason, quantity = 1 } = req.body;
        const mediatorId = req.user.id;

        const order = await Order.findOne({ "orderUnits._id": unitId });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order unit not found",
            });
        }

        const unit = order.orderUnits.id(unitId);
        if (!unit) {
            return res.status(404).json({
                success: false,
                message: "Unit not found in order",
            });
        }

        if (unit.mediatorId?.toString() !== mediatorId) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to return this unit",
            });
        }

        if (!["in_progress", "pending_refund"].includes(unit.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot return unit with status '${unit.status}'`,
            });
        }

        const prevStage = unit.status;
        const targetQty = Math.max(1, parseInt(quantity, 10) || 1);

        // Find all units for this mediator in this order with the same status
        const eligibleUnits = order.orderUnits.filter(
            (u) =>
                u.mediatorId?.toString() === mediatorId &&
                u.status === prevStage
        );

        // Put the target unit first, followed by other eligible units
        const unitsToReturn = [
            unit,
            ...eligibleUnits.filter((u) => u._id.toString() !== unit._id.toString()),
        ].slice(0, targetQty);

        const returnTime = new Date();
        unitsToReturn.forEach((u) => {
            u.returnReason = reason || "Order returned by mediator";
            u.returnStage = prevStage;
            u.returnInitiatedAt = returnTime;
            u.refundedByMediatorId = mediatorId;
            u.status = "pending_payment"; // moves to Return Refunds for proof upload to executive
        });

        order.recalculateSummary();
        await order.save();

        return res.status(200).json({
            success: true,
            message: `${unitsToReturn.length} unit(s) marked for return. Please upload refund proof to executive.`,
            count: unitsToReturn.length,
            order: sanitizeForMediator(order),
            unit: sanitizeForMediator(unit),
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET SETTLED ORDERS FOR MEDIATOR
// ==========================================
const getSettledOrders = async (req, res, next) => {
    try {
        const mediatorId = req.user.id;

        const orders = await Order.find({
            orderUnits: {
                $elemMatch: {
                    mediatorId: mediatorId,
                    status: "completed",
                    settlementStatus: "settled",
                },
            },
        })
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .populate("orderUnits.settledBy", "name")
            .sort({ "orderUnits.settledAt": -1, createdAt: -1 });

        const mappedOrders = orders.map((order) => {
            const orderObj = order.toObject();
            orderObj.orderUnits = orderObj.orderUnits.filter((unit) => {
                const uMedId = (unit.mediatorId?._id || unit.mediatorId)?.toString();
                return (
                    uMedId === mediatorId.toString() &&
                    unit.status === "completed" &&
                    unit.settlementStatus === "settled"
                );
            });
            return orderObj;
        });

        return res.status(200).json({
            success: true,
            message: "Settled orders fetched successfully",
            orders: sanitizeForMediator(mappedOrders),
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// CONFIRM SETTLEMENT PAYMENT (BY MEDIATOR)
// ==========================================
const confirmSettlementPayment = async (req, res, next) => {
    try {
        const mediatorId = req.user.id;
        const medIdStr = mediatorId.toString();
        let { unitId, orderId, unitIds, settlementBatchId } = req.body;

        let targetUnitIds = [];
        if (unitIds && Array.isArray(unitIds)) {
            targetUnitIds = unitIds.map((id) => id.toString());
        } else if (unitId) {
            targetUnitIds = [unitId.toString()];
        }

        if (targetUnitIds.length === 0 && !orderId && !settlementBatchId) {
            return res.status(400).json({
                success: false,
                message: "Unit ID, Batch ID, or Order ID is required to confirm settlement",
            });
        }

        const orConditions = [];
        if (settlementBatchId) {
            orConditions.push({ "orderUnits.settlementBatchId": settlementBatchId });
        }
        if (targetUnitIds.length > 0) {
            const objectIds = targetUnitIds
                .filter((id) => mongoose.Types.ObjectId.isValid(id))
                .map((id) => new mongoose.Types.ObjectId(id));
            orConditions.push({ "orderUnits._id": { $in: [...objectIds, ...targetUnitIds] } });
        }
        if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
            orConditions.push({ _id: new mongoose.Types.ObjectId(orderId) });
        }

        let orders = [];
        if (orConditions.length > 0) {
            const medObjId = mongoose.Types.ObjectId.isValid(mediatorId)
                ? new mongoose.Types.ObjectId(mediatorId)
                : mediatorId;

            orders = await Order.find({
                $and: [
                    { $or: orConditions },
                    {
                        $or: [
                            { "orderUnits.mediatorId": mediatorId },
                            { "orderUnits.mediatorId": medObjId },
                        ],
                    },
                ],
            });
        }

        if (!orders || orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Matching orders not found",
            });
        }

        let confirmedCount = 0;
        let totalConfirmedAmount = 0;
        const now = new Date();

        for (const order of orders) {
            let modified = false;
            for (const u of order.orderUnits) {
                const uIdStr = u._id ? u._id.toString() : "";
                const matchesUnit = targetUnitIds.length > 0 ? targetUnitIds.includes(uIdStr) : true;
                const matchesBatch = settlementBatchId ? u.settlementBatchId === settlementBatchId : true;
                const uMedId = (u.mediatorId?._id || u.mediatorId)?.toString();
                const matchesMediator = !uMedId || uMedId === medIdStr;

                if (matchesUnit && matchesBatch && matchesMediator && u.settlementStatus === "pending_confirmation") {
                    u.settlementStatus = "settled";
                    u.mediatorConfirmedAt = now;
                    confirmedCount++;
                    totalConfirmedAmount += parseFloat(u.settlementAmount || 0);
                    modified = true;
                }
            }
            if (modified) {
                order.recalculateSummary();
                await order.save();
            }
        }

        if (confirmedCount === 0) {
            // Check if units were already settled
            const alreadySettled = orders.some((ord) =>
                ord.orderUnits.some((u) => {
                    const uIdStr = u._id ? u._id.toString() : "";
                    const matchesUnit = targetUnitIds.length > 0 ? targetUnitIds.includes(uIdStr) : true;
                    return matchesUnit && u.settlementStatus === "settled";
                })
            );
            if (alreadySettled) {
                return res.status(200).json({
                    success: true,
                    message: "Payout is already confirmed and settled.",
                    alreadySettled: true,
                });
            }

            return res.status(400).json({
                success: false,
                message: "No order units awaiting confirmation were found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: `Confirmed payout of ₹${totalConfirmedAmount.toLocaleString()} for ${confirmedCount} unit(s). Moved to Settled Orders!`,
            confirmedCount,
            totalConfirmedAmount,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET MEDIATOR EARNINGS & FINANCIAL STANDING
// ==========================================
const getMediatorEarnings = async (req, res, next) => {
    try {
        const mediatorId = req.user.id || req.user._id;
        const medIdStr = mediatorId.toString();

        const mediatorUser = await User.findById(mediatorId).select("name mediatorCode teamCode email phone role");

        // Find all orders that have units assigned to this mediator or refunded by this mediator
        const orders = await Order.find({
            $or: [
                { "orderUnits.mediatorId": mediatorId },
                { "orderUnits.refundedByMediatorId": mediatorId },
            ],
        })
            .populate("brandUserId", "name brand role")
            .populate("orderUnits.settledBy", "name")
            .sort({ createdAt: -1 });

        let completedUnitsCount = 0;
        let settledUnitsCount = 0;
        let pendingConfirmationUnitsCount = 0;
        let unsettledUnitsCount = 0;

        let totalSettledAmount = 0;
        let totalPendingConfirmationAmount = 0;
        let estimatedUnsettledAmount = 0;

        let inProgressCount = 0;
        let inProgressValue = 0;
        let pendingRefundCount = 0;
        let pendingRefundValue = 0;
        let pendingVerificationCount = 0;
        let pendingVerificationValue = 0;
        let cancelledCount = 0;
        let cancelledValue = 0;

        const payoutUnitsList = [];

        orders.forEach((order) => {
            const price = parseFloat(order.price) || 0;
            (order.orderUnits || []).forEach((unit) => {
                const uMedId = (unit.mediatorId?._id || unit.mediatorId)?.toString();
                const uRefundMedId = (unit.refundedByMediatorId?._id || unit.refundedByMediatorId)?.toString();
                const isMine = uMedId === medIdStr || uRefundMedId === medIdStr;
                if (!isMine) return;

                const isCancelledOrReturned =
                    unit.status === "pending_payment" ||
                    uRefundMedId === medIdStr ||
                    Boolean(unit.returnReason) ||
                    Boolean(unit.rejectedAt);

                if (isCancelledOrReturned && unit.status !== "completed") {
                    cancelledCount++;
                    cancelledValue += price;
                } else if (unit.status === "in_progress") {
                    inProgressCount++;
                    inProgressValue += price;
                } else if (unit.status === "pending_refund") {
                    pendingRefundCount++;
                    pendingRefundValue += price;
                } else if (unit.status === "pending_verification") {
                    pendingVerificationCount++;
                    pendingVerificationValue += price;
                } else if (unit.status === "completed") {
                    completedUnitsCount++;
                    const rate = parseFloat(unit.settlementAmount || 20);

                    const payoutItem = {
                        _id: unit._id,
                        orderDocId: order._id,
                        productName: order.productName,
                        brand: order.brand,
                        orderPlatform: order.orderPlatform,
                        productLink: order.productLink,
                        price: unit.purchasePrice || price,
                        orderId: unit.orderId || "N/A",
                        reviewerName: unit.reviewerName || "N/A",
                        settlementStatus: unit.settlementStatus || "unsettled",
                        settlementAmount: unit.settlementAmount || 20,
                        settlementScreenshot: unit.settlementScreenshot || null,
                        settlementMessage: unit.settlementMessage || null,
                        settlementBatchId: unit.settlementBatchId || null,
                        settledAt: unit.settledAt || null,
                        mediatorConfirmedAt: unit.mediatorConfirmedAt || null,
                        completedAt: unit.completedAt || order.updatedAt,
                    };

                    if (unit.settlementStatus === "settled") {
                        settledUnitsCount++;
                        totalSettledAmount += parseFloat(unit.settlementAmount || 0);
                    } else if (unit.settlementStatus === "pending_confirmation") {
                        pendingConfirmationUnitsCount++;
                        totalPendingConfirmationAmount += parseFloat(unit.settlementAmount || 0);
                    } else {
                        unsettledUnitsCount++;
                        estimatedUnsettledAmount += rate;
                    }

                    payoutUnitsList.push(payoutItem);
                }
            });
        });

        // Balance Transactions (Advance & Adjustments between Executive and Mediator)
        const balanceTransactions = await BalanceTransaction.find({
            $or: [{ sender: mediatorId }, { receiver: mediatorId }],
        })
            .populate("sender", "name mediatorCode role")
            .populate("receiver", "name mediatorCode role")
            .sort({ createdAt: -1 });

        let totalBalanceReceived = 0; // Received by mediator (from Executive)
        let totalBalanceReturned = 0; // Sent by mediator (to Executive)
        let pendingIncomingBalanceCount = 0;
        let pendingOutgoingBalanceCount = 0;

        balanceTransactions.forEach((tx) => {
            const isSender = (tx.sender?._id || tx.sender)?.toString() === medIdStr;
            const isReceiver = (tx.receiver?._id || tx.receiver)?.toString() === medIdStr;

            if (isReceiver && tx.status === "verified") {
                totalBalanceReceived += tx.amount;
            }
            if (isReceiver && tx.status === "pending") {
                pendingIncomingBalanceCount++;
            }
            if (isSender && tx.status === "verified") {
                totalBalanceReturned += tx.amount;
            }
            if (isSender && tx.status === "pending") {
                pendingOutgoingBalanceCount++;
            }
        });

        const netRemainingBalance = Number((totalBalanceReceived - totalBalanceReturned).toFixed(2));
        const totalCommissionEarned = Number((totalSettledAmount + totalPendingConfirmationAmount + estimatedUnsettledAmount).toFixed(2));
        const pendingPayoutAmount = Number((totalPendingConfirmationAmount + estimatedUnsettledAmount).toFixed(2));

        return res.status(200).json({
            success: true,
            mediator: mediatorUser || { _id: mediatorId, name: req.user.name, teamCode: req.user.teamCode },
            summary: {
                completedUnitsCount,
                settledUnitsCount,
                pendingConfirmationUnitsCount,
                unsettledUnitsCount,
                totalCommissionEarned,
                settledPayoutAmount: Number(totalSettledAmount.toFixed(2)),
                pendingPayoutAmount,
                totalBalanceReceived: Number(totalBalanceReceived.toFixed(2)),
                totalBalanceReturned: Number(totalBalanceReturned.toFixed(2)),
                netRemainingBalance,
                pendingIncomingBalanceCount,
                pendingOutgoingBalanceCount,
                inProgressCount,
                inProgressValue: Number(inProgressValue.toFixed(2)),
                pendingRefundCount,
                pendingRefundValue: Number(pendingRefundValue.toFixed(2)),
                activeCapital: Number((inProgressValue + pendingRefundValue).toFixed(2)),
                cancelledCount,
                cancelledValue: Number(cancelledValue.toFixed(2)),
                exactNetEarnings: Number((totalSettledAmount + netRemainingBalance).toFixed(2)),
            },
            payoutUnits: sanitizeForMediator(payoutUnitsList),
            recentBalanceTransactions: balanceTransactions.slice(0, 10),
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// FEATURE 1: MEDIATOR PLATFORM IDS
// ==========================================
const getMediatorPlatformIds = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select("platformIds").lean();
        return res.status(200).json({
            success: true,
            platformIds: user?.platformIds || [],
        });
    } catch (err) {
        next(err);
    }
};

const addMediatorPlatformId = async (req, res, next) => {
    try {
        const { platform, profileName, profileUrl, identifier, notes } = req.body;
        if (!platform || !profileName) {
            return res.status(400).json({
                success: false,
                message: "Platform (e.g. Amazon, Flipkart) and Profile Name are required",
            });
        }

        const validPlatforms = ["amazon", "flipkart", "myntra", "nykaa", "meesho", "other"];
        const cleanPlatform = String(platform).toLowerCase().trim();
        if (!validPlatforms.includes(cleanPlatform)) {
            return res.status(400).json({
                success: false,
                message: `Invalid platform. Allowed: ${validPlatforms.join(", ")}`,
            });
        }
        const platformFormatted = cleanPlatform.charAt(0).toUpperCase() + cleanPlatform.slice(1);

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!user.platformIds) user.platformIds = [];

        const newId = {
            platform: platformFormatted,
            profileName: String(profileName).trim(),
            profileUrl: profileUrl ? String(profileUrl).trim() : null,
            identifier: identifier ? String(identifier).trim() : null,
            notes: notes ? String(notes).trim() : null,
            status: "active",
            createdAt: new Date(),
        };

        user.platformIds.push(newId);
        await user.save();

        const createdId = user.platformIds[user.platformIds.length - 1];
        return res.status(201).json({
            success: true,
            message: `Platform ID "${profileName}" added successfully`,
            platformId: createdId,
            platformIds: user.platformIds,
        });
    } catch (err) {
        next(err);
    }
};

const updateMediatorPlatformId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { platform, profileName, profileUrl, identifier, notes } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const target = user.platformIds.id(id);
        if (!target) {
            return res.status(404).json({ success: false, message: "Platform ID not found" });
        }

        if (platform) {
            const cleanPlatform = String(platform).toLowerCase().trim();
            const validPlatforms = ["amazon", "flipkart", "myntra", "nykaa", "meesho", "other"];
            if (validPlatforms.includes(cleanPlatform)) target.platform = cleanPlatform.charAt(0).toUpperCase() + cleanPlatform.slice(1);
        }
        if (profileName) target.profileName = String(profileName).trim();
        if (profileUrl !== undefined) target.profileUrl = profileUrl ? String(profileUrl).trim() : null;
        if (identifier !== undefined) target.identifier = identifier ? String(identifier).trim() : null;
        if (notes !== undefined) target.notes = notes ? String(notes).trim() : null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Platform ID updated successfully",
            platformId: target,
            platformIds: user.platformIds,
        });
    } catch (err) {
        next(err);
    }
};

const deleteMediatorPlatformId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.platformIds.pull({ _id: id });
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Platform ID deleted successfully",
            platformIds: user.platformIds,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// FEATURE 3: MEDIATOR ORDER TRACKER & COMMAND CENTER
// ==========================================
const getMediatorTrackedOrders = async (req, res, next) => {
    try {
        const mediatorId = req.user.id;
        const { startDate, endDate, datePreset, dateFilter, search, brand, status, lastOrderId } = req.query;
        const preset = dateFilter || datePreset;

        // Base query: find all orders where at least one unit is assigned to this mediator
        const orders = await Order.find({ "orderUnits.mediatorId": mediatorId })
            .populate("brandUserId", "name brand")
            .populate("createdBy", "name teamCode")
            .sort({ createdAt: -1 })
            .lean();

        let trackedUnits = [];
        const brandStatsMap = {};

        orders.forEach((order) => {
            const bName = order.brand || "Unspecified";
            if (!brandStatsMap[bName]) {
                brandStatsMap[bName] = {
                    brand: bName,
                    totalUnits: 0,
                    completedUnits: 0,
                    inProgressUnits: 0,
                    pendingRefundUnits: 0,
                    pendingVerificationUnits: 0,
                    pendingPaymentUnits: 0,
                    settledUnits: 0,
                    totalEarnings: 0,
                };
            }

            (order.orderUnits || []).forEach((unit, idx) => {
                if (unit.mediatorId && unit.mediatorId.toString() === mediatorId.toString()) {
                    const unitPrice = Number(unit.purchasePrice) || Number(order.price) || 0;

                    brandStatsMap[bName].totalUnits++;
                    if (unit.status === "completed") {
                        brandStatsMap[bName].completedUnits++;
                        brandStatsMap[bName].totalEarnings += unitPrice;
                        if (unit.settlementStatus === "settled") brandStatsMap[bName].settledUnits++;
                    } else if (unit.status === "in_progress") {
                        brandStatsMap[bName].inProgressUnits++;
                    } else if (unit.status === "pending_refund") {
                        brandStatsMap[bName].pendingRefundUnits++;
                    } else if (unit.status === "pending_verification") {
                        brandStatsMap[bName].pendingVerificationUnits++;
                    } else if (unit.status === "pending_payment") {
                        brandStatsMap[bName].pendingPaymentUnits++;
                    }

                    trackedUnits.push({
                        ...unit,
                        unitIndex: idx + 1,
                        orderMongoId: order._id,
                        productName: order.productName,
                        productLink: order.productLink,
                        brand: order.brand,
                        orderPlatform: order.orderPlatform,
                        executiveName: order.executiveName,
                        teamCode: order.teamCode,
                        basePrice: order.price,
                        orderCreatedAt: order.createdAt,
                    });
                }
            });
        });

        // 1. Date Filtering
        if (preset && preset !== "all" && preset !== "custom") {
            const now = new Date();
            let start = null;
            let end = null;

            if (preset === "today") {
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            } else if (preset === "yesterday") {
                const y = new Date(now);
                y.setDate(now.getDate() - 1);
                start = new Date(y.getFullYear(), y.getMonth(), y.getDate());
                end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
            } else if (preset === "7days") {
                start = new Date(now);
                start.setDate(now.getDate() - 7);
                start.setHours(0, 0, 0, 0);
            } else if (preset === "30days" || preset === "thisMonth") {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            if (start) {
                trackedUnits = trackedUnits.filter((u) => {
                    const d = new Date(u.assignedAt || u.orderedAt || u.createdAt || u.orderCreatedAt);
                    if (end) return d >= start && d <= end;
                    return d >= start;
                });
            }
        } else if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if (end) end.setHours(23, 59, 59, 999);

            trackedUnits = trackedUnits.filter((u) => {
                const d = new Date(u.assignedAt || u.orderedAt || u.createdAt || u.orderCreatedAt);
                if (start && end) return d >= start && d <= end;
                if (start) return d >= start;
                if (end) return d <= end;
                return true;
            });
        }

        // 2. Status Filtering
        if (status && status !== "all") {
            trackedUnits = trackedUnits.filter((u) => u.status === status);
        }

        // 3. Brand Filtering
        if (brand && brand !== "all") {
            const targetBrand = brand.toLowerCase().trim();
            trackedUnits = trackedUnits.filter((u) => (u.brand || "").toLowerCase() === targetBrand);
        }

        // 4. Last Order ID Filter
        if (lastOrderId) {
            const targetId = lastOrderId.toLowerCase().trim();
            trackedUnits = trackedUnits.filter((u) => (u.orderId || "").toLowerCase().includes(targetId));
        }

        // 5. Free Search (Order ID, Product Name, Reviewer, Brand)
        if (search) {
            const q = search.toLowerCase().trim();
            trackedUnits = trackedUnits.filter((u) =>
                (u.orderId && u.orderId.toLowerCase().includes(q)) ||
                (u.productName && u.productName.toLowerCase().includes(q)) ||
                (u.reviewerName && u.reviewerName.toLowerCase().includes(q)) ||
                (u.brand && u.brand.toLowerCase().includes(q))
            );
        }

        const brandsList = Object.keys(brandStatsMap);
        const summary = {
            totalUnits: trackedUnits.length,
            completedUnits: trackedUnits.filter((u) => u.status === "completed" || u.status === "settled").length,
            pendingUnits: trackedUnits.filter((u) => u.status !== "completed" && u.status !== "settled").length,
            totalEarnings: trackedUnits.reduce((acc, u) => acc + (u.settlementStatus === "settled" ? Number(u.settlementAmount || 20) : 0), 0),
            activeCapital: trackedUnits.reduce((acc, u) => acc + (["in_progress", "pending_refund", "pending_verification"].includes(u.status) ? Number(u.purchasePrice || u.price || 0) : 0), 0),
        };

        const brandStatsObj = {};
        Object.values(brandStatsMap).forEach((b) => {
            brandStatsObj[b.brand] = {
                brand: b.brand,
                total: b.totalUnits,
                completed: b.completedUnits,
                pending: b.inProgressUnits + b.pendingRefundUnits + b.pendingVerificationUnits + b.pendingPaymentUnits,
                earnings: b.totalEarnings,
                completionRate: b.totalUnits > 0 ? Math.round((b.completedUnits / b.totalUnits) * 100) : 0,
            };
        });

        return res.status(200).json({
            success: true,
            totalFound: trackedUnits.length,
            orders: trackedUnits,
            trackedUnits,
            summary,
            brandsList,
            brandStats: brandStatsObj,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getNewOrders,
    acceptOrder,
    rejectOrder,
    batchAcceptOrders,
    batchRejectOrders,
    returnOrderUnit,
    getPendingPaymentOrders,
    submitMediatorPayment,
    getPendingOrders,
    submitOrderDetails,
    getRefundPendingOrders,
    submitRefundDetails,
    getPendingVerificationOrders,
    getCompletedOrders,
    getSettledOrders,
    getMediatorSummary,
    confirmSettlementPayment,
    getMediatorEarnings,
    getMediatorPlatformIds,
    addMediatorPlatformId,
    updateMediatorPlatformId,
    deleteMediatorPlatformId,
    getMediatorTrackedOrders,
};
