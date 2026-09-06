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

module.exports = {
    getBrandOrders,
};
