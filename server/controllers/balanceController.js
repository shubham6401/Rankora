const BalanceTransaction = require("../models/balanceTransaction");
const User = require("../models/user");

// ==========================================
// SEND BALANCE PAYMENT (EXECUTIVE OR MEDIATOR)
// ==========================================
const sendBalance = async (req, res, next) => {
    try {
        const user = req.user;
        const amount = Number(req.body.amount);
        const reason = req.body.reason || "Price Difference Adjustment";
        const message = req.body.message || "";
        const screenshotPath = req.file?.path || req.body.paymentScreenshot;

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid positive amount (₹) is required",
            });
        }

        if (!screenshotPath) {
            return res.status(400).json({
                success: false,
                message: "Payment proof screenshot is required",
            });
        }

        let receiverUser;
        let direction;

        if (user.role === "executive") {
            const mediatorId = req.body.receiverId || req.body.mediatorId;
            if (!mediatorId) {
                return res.status(400).json({
                    success: false,
                    message: "Please select a mediator to send balance to",
                });
            }

            receiverUser = await User.findById(mediatorId);
            if (!receiverUser || receiverUser.role !== "mediator") {
                return res.status(404).json({
                    success: false,
                    message: "Selected mediator not found",
                });
            }

            if (user.teamCode && receiverUser.teamCode !== user.teamCode) {
                return res.status(403).json({
                    success: false,
                    message: "You can only settle balance with mediators in your team",
                });
            }

            direction = "executive_to_mediator";
        } else if (user.role === "mediator") {
            receiverUser = await User.findOne({
                teamCode: user.teamCode,
                role: "executive",
            });

            if (!receiverUser) {
                return res.status(404).json({
                    success: false,
                    message: "Team executive not found to receive balance",
                });
            }

            direction = "mediator_to_executive";
        } else {
            return res.status(403).json({
                success: false,
                message: "Only executives and mediators can settle balance",
            });
        }

        const currentUserId = user.id || user._id;

        const transaction = await BalanceTransaction.create({
            sender: currentUserId,
            senderRole: user.role,
            receiver: receiverUser._id,
            receiverRole: receiverUser.role,
            teamCode: user.teamCode || receiverUser.teamCode,
            amount,
            direction,
            reason,
            message,
            paymentScreenshot: screenshotPath,
            status: "pending",
        });

        const populated = await BalanceTransaction.findById(transaction._id)
            .populate("sender", "name mediatorCode role teamCode")
            .populate("receiver", "name mediatorCode role teamCode");

        return res.status(201).json({
            success: true,
            message: `Balance payment of ₹${amount.toLocaleString()} sent successfully to ${receiverUser.name}. Awaiting verification.`,
            transaction: populated,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET USER'S BALANCE TRANSACTIONS & SUMMARY
// ==========================================
const getMyTransactions = async (req, res, next) => {
    try {
        const userId = (req.user.id || req.user._id).toString();

        const transactions = await BalanceTransaction.find({
            $or: [{ sender: userId }, { receiver: userId }],
        })
            .populate("sender", "name mediatorCode role teamCode")
            .populate("receiver", "name mediatorCode role teamCode")
            .sort({ createdAt: -1 });

        let totalSentVerified = 0;
        let totalReceivedVerified = 0;
        let pendingIncomingCount = 0;
        let pendingOutgoingCount = 0;

        transactions.forEach((tx) => {
            const isSender = tx.sender?._id?.toString() === userId.toString();
            const isReceiver = tx.receiver?._id?.toString() === userId.toString();

            if (isSender) {
                if (tx.status === "verified") totalSentVerified += tx.amount;
                if (tx.status === "pending") pendingOutgoingCount++;
            }
            if (isReceiver) {
                if (tx.status === "verified") totalReceivedVerified += tx.amount;
                if (tx.status === "pending") pendingIncomingCount++;
            }
        });

        return res.status(200).json({
            success: true,
            transactions,
            summary: {
                totalSentVerified,
                totalReceivedVerified,
                netBalance: totalReceivedVerified - totalSentVerified,
                pendingIncomingCount,
                pendingOutgoingCount,
                totalTransactions: transactions.length,
            },
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// VERIFY INCOMING BALANCE PAYMENT
// ==========================================
const verifyBalance = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = (req.user.id || req.user._id).toString();

        const transaction = await BalanceTransaction.findById(id)
            .populate("sender", "name mediatorCode role")
            .populate("receiver", "name mediatorCode role");

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Balance transaction not found",
            });
        }

        const receiverId = (transaction.receiver?._id || transaction.receiver)?.toString();
        if (receiverId !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only verify balance payments sent to you",
            });
        }

        if (transaction.status === "verified") {
            return res.status(400).json({
                success: false,
                message: "This payment has already been verified",
            });
        }

        transaction.status = "verified";
        transaction.verifiedAt = new Date();
        transaction.rejectedAt = null;
        transaction.rejectionReason = null;
        await transaction.save();

        return res.status(200).json({
            success: true,
            message: `Successfully verified balance payment of ₹${transaction.amount.toLocaleString()} from ${transaction.sender.name}!`,
            transaction,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// REJECT INCOMING BALANCE PAYMENT
// ==========================================
const rejectBalance = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = (req.user.id || req.user._id).toString();
        const { reason } = req.body;

        const transaction = await BalanceTransaction.findById(id)
            .populate("sender", "name mediatorCode role")
            .populate("receiver", "name mediatorCode role");

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Balance transaction not found",
            });
        }

        const receiverId = (transaction.receiver?._id || transaction.receiver)?.toString();
        if (receiverId !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only reject balance payments sent to you",
            });
        }

        transaction.status = "rejected";
        transaction.rejectedAt = new Date();
        transaction.rejectionReason = reason || "Payment proof could not be verified";
        await transaction.save();

        return res.status(200).json({
            success: true,
            message: `Balance payment of ₹${transaction.amount.toLocaleString()} was rejected.`,
            transaction,
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GET TEAM MEDIATORS (FOR EXECUTIVE DROPDOWN)
// ==========================================
const getTeamMediators = async (req, res, next) => {
    try {
        const teamCode = req.user.teamCode;
        const mediators = await User.find({
            teamCode,
            role: "mediator",
        })
            .select("name mediatorCode teamCode")
            .sort({ name: 1 });

        return res.status(200).json({
            success: true,
            mediators,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    sendBalance,
    getMyTransactions,
    verifyBalance,
    rejectBalance,
    getTeamMediators,
};
