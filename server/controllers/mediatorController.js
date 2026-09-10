const Order = require("../models/order");

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
            orders: mediatorOrders,
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
            order: populatedOrder,
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
            orders: mappedOrders,
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
        if (req.body.reviewerName) unit.reviewerName = req.body.reviewerName;
        if (req.body.orderReceivedOn) unit.orderReceivedOn = req.body.orderReceivedOn;
        if (req.body.season) unit.season = req.body.season;

        unit.status = "pending_refund";
        unit.verificationRejectionReason = null;

        order.recalculateSummary();
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order added successfully",
            order,
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
            orders: mappedOrders,
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
            order,
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
            orders: formattedOrders,
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
            orderObj.orderUnits = orderObj.orderUnits.filter(
                (unit) =>
                    unit.mediatorId?._id?.toString() === mediatorId &&
                    unit.status === "completed"
            );
            orderObj.status = "completed";
            orderObj.assignedTo = req.user;
            return orderObj;
        });

        return res.status(200).json({
            success: true,
            message: "Completed Orders fetched succeffully",
            orders: mappedOrders,
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
            order: populatedOrder,
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
                    mediatorId: mediatorId,
                    status: "pending_payment",
                },
            },
        })
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name email teamCode")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode")
            .sort({ createdAt: -1 });

        const mappedOrders = orders.map((order) => {
            const orderObj = order.toObject();
            orderObj.orderUnits = orderObj.orderUnits.filter(
                (unit) =>
                    unit.mediatorId?._id?.toString() === mediatorId &&
                    unit.status === "pending_payment"
            );
            return orderObj;
        });

        // Verified refund history for this mediator
        const verifiedOrders = await Order.find({
            orderUnits: {
                $elemMatch: {
                    refundedByMediatorId: mediatorId,
                    mediatorPaymentStatus: "verified",
                },
            },
        })
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name email teamCode")
            .sort({ updatedAt: -1 });

        const mappedVerified = verifiedOrders.map((order) => {
            const orderObj = order.toObject();
            orderObj.orderUnits = orderObj.orderUnits.filter(
                (unit) =>
                    unit.refundedByMediatorId?.toString() === mediatorId &&
                    unit.mediatorPaymentStatus === "verified"
            );
            return orderObj;
        });

        return res.status(200).json({
            success: true,
            message: "Pending payment orders fetched successfully",
            orders: mappedOrders,
            verifiedOrders: mappedVerified,
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
            "orderUnits.mediatorId": mediatorId,
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
        let pendingRefundUnits = 0;
        let pendingVerificationUnits = 0;
        let completedUnits = 0;

        let newAssignedOrders = 0;
        let pendingPaymentOrders = 0;
        let inProgressOrders = 0;
        let pendingRefundOrders = 0;
        let pendingVerificationOrders = 0;
        let completedOrders = 0;

        const mappedOrders = orders.map((order) => {
            const orderObj = order.toObject();
            const price = parseFloat(order.price) || 0;

            const myUnits = orderObj.orderUnits.filter(
                (u) =>
                    u.mediatorId?._id?.toString() === mediatorId ||
                    u.mediatorId?.toString() === mediatorId
            );

            let hasNewAssigned = false;
            let hasPendingPayment = false;
            let hasInProgress = false;
            let hasPendingRefund = false;
            let hasPendingVerification = false;
            let hasCompleted = false;

            myUnits.forEach((unit) => {
                totalUnits++;
                totalValue += price;

                if (unit.status === "assigned") {
                    newAssignedUnits++;
                    hasNewAssigned = true;
                } else if (unit.status === "pending_payment") {
                    pendingPaymentUnits++;
                    hasPendingPayment = true;
                } else if (unit.status === "in_progress") {
                    inProgressUnits++;
                    hasInProgress = true;
                } else if (unit.status === "pending_refund") {
                    pendingRefundUnits++;
                    hasPendingRefund = true;
                } else if (unit.status === "pending_verification") {
                    pendingVerificationUnits++;
                    hasPendingVerification = true;
                } else if (unit.status === "completed") {
                    completedUnits++;
                    completedValue += price;
                    hasCompleted = true;
                }
            });

            if (hasNewAssigned) newAssignedOrders++;
            if (hasPendingPayment) pendingPaymentOrders++;
            if (hasInProgress) inProgressOrders++;
            if (hasPendingRefund) pendingRefundOrders++;
            if (hasPendingVerification) pendingVerificationOrders++;
            if (hasCompleted) completedOrders++;

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
            },
            orders: mappedOrders,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getNewOrders,
    acceptOrder,
    rejectOrder,
    getPendingPaymentOrders,
    submitMediatorPayment,
    getPendingOrders,
    submitOrderDetails,
    getRefundPendingOrders,
    submitRefundDetails,
    getPendingVerificationOrders,
    getCompletedOrders,
    getMediatorSummary,
};
