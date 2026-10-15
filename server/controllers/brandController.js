const Order = require("../models/order");

// ==========================================
// GET BRAND ORDERS & SUMMARY
// ==========================================
const getBrandOrders = async (req, res, next) => {
    try {
        const brandUserId = req.user.id;
        const brandName = req.user.brand;

        const query = {
            $or: [
                { brandUserId: brandUserId },
                ...(brandName ? [{ brand: brandName }] : []),
            ],
        };

        const orders = await Order.find(query)
            .populate("brandUserId", "name brand role")
            .populate("createdBy", "name")
            .populate("orderUnits.mediatorId", "name mediatorCode")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Brand orders fetched successfully",
            orders,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// UPDATE UNIT TYPE (Warehouse vs Empty)
// ==========================================
const updateUnitType = async (req, res, next) => {
    try {
        const { orderId, unitId } = req.params;
        const { unitType } = req.body; // "warehouse" | "empty" | null

        if (unitType && !["warehouse", "empty"].includes(unitType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid unitType. Must be 'warehouse', 'empty', or null",
            });
        }

        const order = await Order.findOneAndUpdate(
            { _id: orderId, "orderUnits._id": unitId },
            { $set: { "orderUnits.$.unitType": unitType || null } },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order or unit not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: `Unit marked as ${unitType || "unclassified"}`,
            unitId,
            unitType: unitType || null,
            order,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// BULK UPDATE UNIT TYPES
// ==========================================
const bulkUpdateUnitTypes = async (req, res, next) => {
    try {
        const { items, unitType } = req.body; // items: [{ orderId, unitId }], unitType: "warehouse" | "empty" | null

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No units provided for bulk update",
            });
        }

        if (unitType && !["warehouse", "empty"].includes(unitType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid unitType. Must be 'warehouse', 'empty', or null",
            });
        }

        const operations = items
            .filter((it) => it.orderId && it.unitId)
            .map((it) => ({
                updateOne: {
                    filter: { _id: it.orderId, "orderUnits._id": it.unitId },
                    update: { $set: { "orderUnits.$.unitType": unitType || null } },
                },
            }));

        if (operations.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid unit identifiers provided",
            });
        }

        const bulkRes = await Order.bulkWrite(operations);

        return res.status(200).json({
            success: true,
            message: `Successfully classified ${bulkRes.modifiedCount || operations.length} unit(s) as ${unitType || "unclassified"}`,
            count: bulkRes.modifiedCount || operations.length,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// REPORT / FLAG ISSUE ON UNIT
// ==========================================
const reportUnitIssue = async (req, res, next) => {
    try {
        const { orderId, unitId } = req.params;
        const { reason, details } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: "Issue reason is required",
            });
        }

        const issueData = {
            isReported: true,
            reason: reason.trim(),
            details: (details || "").trim(),
            reportedAt: new Date(),
            resolved: false,
            resolvedAt: null,
        };

        const result = await Order.updateOne(
            { _id: orderId, "orderUnits._id": unitId },
            { $set: { "orderUnits.$.brandIssue": issueData } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Order or unit not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Issue flagged successfully",
            brandIssue: issueData,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// RESOLVE FLAGGED ISSUE
// ==========================================
const resolveUnitIssue = async (req, res, next) => {
    try {
        const { orderId, unitId } = req.params;

        const result = await Order.updateOne(
            { _id: orderId, "orderUnits._id": unitId },
            {
                $set: {
                    "orderUnits.$.brandIssue.resolved": true,
                    "orderUnits.$.brandIssue.resolvedAt": new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Order or unit not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Issue marked as resolved",
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// CLEAR / UNFLAG ISSUE
// ==========================================
const clearUnitIssue = async (req, res, next) => {
    try {
        const { orderId, unitId } = req.params;

        const result = await Order.updateOne(
            { _id: orderId, "orderUnits._id": unitId },
            {
                $set: {
                    "orderUnits.$.brandIssue": {
                        isReported: false,
                        reason: null,
                        details: null,
                        reportedAt: null,
                        resolved: false,
                        resolvedAt: null,
                    },
                },
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Order or unit not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Issue unflagged successfully",
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// MOVE ORDER TO ALL ORDERS
// ==========================================
const moveOrderToAllCampaigns = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findByIdAndUpdate(
            orderId,
            { $set: { isMovedToAllCampaigns: true } },
            { new: true }
        );
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Order moved to All Orders successfully",
            order,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getBrandOrders,
    updateUnitType,
    bulkUpdateUnitTypes,
    reportUnitIssue,
    resolveUnitIssue,
    clearUnitIssue,
    moveOrderToAllCampaigns,
};
