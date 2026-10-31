const mongoose = require("mongoose");

const postDeliveryDetailsSchema = new mongoose.Schema({
    success: {
        type: Boolean,
        default: false,
    },
    productReviewScreenshot: {
        type: String,
        default: null,
    },
    invoiceScreenshot: {
        type: String,
        default: null,
    },
    sellerFeedbackScreenShot: {
        type: String,
        default: null,
    },
}, { _id: false });

const orderUnitSchema = new mongoose.Schema({
    mediatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    orderId: {
        type: String,
        default: null,
    },
    orderedAt: {
        type: Date,
        default: null,
    },
    unitType: {
        type: String,
        enum: ["warehouse", "empty", null],
        default: null,
    },
    orderedScreenshot: {
        type: String,
        default: null,
    },
    expectedArrivalDate: {
        type: Date,
        default: null,
    },
    address: {
        type: String,
        default: null,
    },
    deliveryAddress: {
        type: String,
        default: null,
    },
    addressType: {
        type: String,
        enum: ["custom", "executive_provided", "yourself", null],
        default: null,
    },
    purchasePrice: {
        type: Number,
        default: null,
    },
    deliveryFee: {
        type: Number,
        default: 0,
    },
    totalPurchasedAmount: {
        type: Number,
        default: null,
    },
    reviewerName: {
        type: String,
        default: null,
    },
    orderReceivedOn: {
        type: Date,
        default: null,
    },
    season: {
        type: String,
        default: null,
    },
    status: {
        type: String,
        enum: [
            "unassigned",
            "pending_payment",
            "assigned",
            "in_progress",
            "pending_refund",
            "pending_verification",
            "completed"
        ],
        default: "unassigned",
    },
    paymentScreenshot: {
        type: String,
        default: null,
    },
    paymentMessage: {
        type: String,
        default: null,
    },
    paymentSentAt: {
        type: Date,
        default: null,
    },
    advanceBatchId: {
        type: String,
        default: null,
    },
    mediatorPaymentScreenshot: {
        type: String,
        default: null,
    },
    mediatorMessage: {
        type: String,
        default: null,
    },
    mediatorPaymentSentAt: {
        type: Date,
        default: null,
    },
    mediatorPaymentStatus: {
        type: String,
        enum: ["pending", "verified", null],
        default: null,
    },
    refundedByMediatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    rejectedAt: {
        type: Date,
        default: null,
    },
    assignedAt: {
        type: Date,
        default: null,
    },
    completedAt: {
        type: Date,
        default: null,
    },
    settlementStatus: {
        type: String,
        enum: ["unsettled", "pending_confirmation", "settled", null],
        default: "unsettled",
    },
    settlementAmount: {
        type: Number,
        default: 0,
    },
    settlementScreenshot: {
        type: String,
        default: null,
    },
    settlementMessage: {
        type: String,
        default: null,
    },
    settlementBatchId: {
        type: String,
        default: null,
    },
    settledAt: {
        type: Date,
        default: null,
    },
    settledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    mediatorConfirmedAt: {
        type: Date,
        default: null,
    },
    submittedForVerificationAt: {
        type: Date,
        default: null,
    },
    verificationRejectionReason: {
        type: String,
        default: null,
    },
    returnReason: {
        type: String,
        default: null,
    },
    returnStage: {
        type: String,
        enum: ["in_progress", "pending_refund", null],
        default: null,
    },
    returnInitiatedAt: {
        type: Date,
        default: null,
    },
    postDeliveryDetails: {
        type: postDeliveryDetailsSchema,
        default: () => ({}),
    },
    brandIssue: {
        isReported: { type: Boolean, default: false },
        reason: { type: String, default: null },
        details: { type: String, default: null },
        reportedAt: { type: Date, default: null },
        resolved: { type: Boolean, default: false },
        resolvedAt: { type: Date, default: null },
    }
}, { timestamps: true });

const orderSummarySchema = new mongoose.Schema({
    unassigned: {
        type: Number,
        default: 0,
    },
    pendingPayment: {
        type: Number,
        default: 0,
    },
    assigned: {
        type: Number,
        default: 0,
    },
    inProgress: {
        type: Number,
        default: 0,
    },
    pendingRefund: {
        type: Number,
        default: 0,
    },
    pendingVerification: {
        type: Number,
        default: 0,
    },
    completed: {
        type: Number,
        default: 0,
    },
    settled: {
        type: Number,
        default: 0,
    },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    brandUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    executiveName: {
        type: String,
        required: true,
        trim: true,
    },
    teamCode: {
        type: String,
        required: true,
        trim: true,
    },
    brand: {
        type: String,
        required: true,
        trim: true,
    },
    productName: {
        type: String,
        required: true,
        trim: true,
    },
    productLink: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: String,
        required: true,
        trim: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    orderPlatform: {
        type: String,
        required: true,
        trim: true,
    },
    season: {
        type: String,
        trim: true,
        default: null,
    },
    summary: {
        type: orderSummarySchema,
        default: () => ({}),
    },
    orderUnits: [orderUnitSchema],
    isMovedToAllCampaigns: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Helper method to recalculate summary from units
orderSchema.methods.recalculateSummary = function () {
    const summary = {
        unassigned: 0,
        pendingPayment: 0,
        assigned: 0,
        inProgress: 0,
        pendingRefund: 0,
        pendingVerification: 0,
        completed: 0,
        settled: 0,
    };

    for (const unit of this.orderUnits) {
        if (unit.status === "unassigned") summary.unassigned++;
        else if (unit.status === "pending_payment") summary.pendingPayment++;
        else if (unit.status === "assigned") summary.assigned++;
        else if (unit.status === "in_progress") summary.inProgress++;
        else if (unit.status === "pending_refund") summary.pendingRefund++;
        else if (unit.status === "pending_verification") summary.pendingVerification++;
        else if (unit.status === "completed") {
            summary.completed++;
            if (unit.settlementStatus === "settled") summary.settled++;
        }
    }

    this.summary = summary;
    return summary;
};

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
