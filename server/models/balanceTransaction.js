const mongoose = require("mongoose");

const balanceTransactionSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        senderRole: {
            type: String,
            enum: ["executive", "mediator"],
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverRole: {
            type: String,
            enum: ["executive", "mediator"],
            required: true,
        },
        teamCode: {
            type: String,
            required: true,
            trim: true,
        },
        amount: {
            type: Number,
            required: true,
            min: [1, "Amount must be at least ₹1"],
        },
        direction: {
            type: String,
            enum: ["executive_to_mediator", "mediator_to_executive"],
            required: true,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
            default: "Price Adjustment",
        },
        message: {
            type: String,
            trim: true,
            default: "",
        },
        paymentScreenshot: {
            type: String,
            required: [true, "Payment screenshot is required as proof"],
        },
        status: {
            type: String,
            enum: ["pending", "verified", "rejected"],
            default: "pending",
        },
        verifiedAt: {
            type: Date,
            default: null,
        },
        rejectedAt: {
            type: Date,
            default: null,
        },
        rejectionReason: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

balanceTransactionSchema.index({ sender: 1, createdAt: -1 });
balanceTransactionSchema.index({ receiver: 1, status: 1 });
balanceTransactionSchema.index({ teamCode: 1 });

const BalanceTransaction = mongoose.model("BalanceTransaction", balanceTransactionSchema);

module.exports = BalanceTransaction;
