const Order = require("../models/order");

// ==========================================
// GET SINGLE ORDER DETAILS
// ==========================================
const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;

        let order = await Order.findById(id)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode teamCode");

        // If not found by master order ID, search by orderUnits ID
        let matchingUnit = null;
        if (!order) {
            order = await Order.findOne({ "orderUnits._id": id })
                .populate("brandUserId", "name brand role")
                .populate("createdBy", "name")
                .populate("orderUnits.mediatorId", "name mediatorCode teamCode");

            if (order) {
                matchingUnit = order.orderUnits.find((u) => u._id.toString() === id);
            }
        }

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const orderObj = order.toObject();

        // Provide backward compatibility fields for DisplayOrder.jsx
        const primaryUnit = matchingUnit || orderObj.orderUnits?.[0] || {};
        orderObj.orderId = orderObj.orderId || primaryUnit.orderId || null;
        orderObj.orderedScreenshot = orderObj.orderedScreenshot || primaryUnit.orderedScreenshot || null;
        orderObj.expectedArrivalDate = orderObj.expectedArrivalDate || primaryUnit.expectedArrivalDate || null;
        orderObj.address = orderObj.address || primaryUnit.address || null;
        orderObj.reviewerName = orderObj.reviewerName || primaryUnit.reviewerName || null;
        orderObj.orderReceivedOn = orderObj.orderReceivedOn || primaryUnit.orderReceivedOn || null;
        orderObj.season = orderObj.season || primaryUnit.season || null;
        orderObj.status = orderObj.status || primaryUnit.status || "unassigned";
        orderObj.assignedTo = primaryUnit.mediatorId || null;
        orderObj.postDeliveryDetails = primaryUnit.postDeliveryDetails || { success: false };

        return res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            order: orderObj,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET USER ORDER HISTORY
// ==========================================
const getOrderHistory = async (req, res, next) => {
    try {
        const user = req.user;
        let query = {};

        if (user.role === "executive") {
            query = user.teamCode ? { teamCode: user.teamCode } : { createdBy: user.id };
        } else if (user.role === "mediator") {
            query = { "orderUnits.mediatorId": user.id };
        } else if (user.role === "brand") {
            query = {
                $or: [
                    { brandUserId: user.id },
                    ...(user.brand ? [{ brand: user.brand }] : []),
                ],
            };
        } else {
            query = { createdBy: user.id };
        }

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

module.exports = {
    getOrderById,
    getOrderHistory,
};
