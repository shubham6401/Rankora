const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true, 
    },
    orderId: {
        type: String,
        // required: true, 
        unique: true,
        sparse: true
    },
    price: {
        type: String,
        required: true,
    },
    orderedScreenshot: {
        type: String,
        // required: true,
    },
    expectedArrivalDate: {
        type: Date,
        // required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        // required: true,
    },
    executiveName: {
        type: String,
        required: true,
    },
    reviewerName: {
        type: String,
    },
    // mediatorName:{
    //     type:String,
    //     required:true,
    // },
    teamCode: {
        type: String,
        required: true,
    },
    // mediatorCode:{
    //     type:String,
    //     required:true,
    // },
    brandUserId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true
    },
    brand: {
        type: String,
        required: true,
    }, 
    orderReceivedOn: {
        type: Date,
    },
    orderPlatform: {
        type: String,
        required: true,
    },
    season: {
        type: String,
        // required: true,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
        productLink: {
        type: String,
        required: true,
    },

    // Assignment state
    status: {
        type: String,
        enum: [
            "pending",
            "assigned",
            "in_progress",
            "pending_refund",
            "completed"
        ],
        default: "pending", 
    },
    postDeliveryDetails: {
        success: {
            type: Boolean,
            default: false,
        },
        productReviewScreenshot: {
            type: String,
        },
        invoiceScreenshot: {
            type: String,
        },
        sellerFeedbackScreenShot: {
            type: String,
        }

    }
}, {
    timestamps: true,
});

const Order = new mongoose.model(
    "Order", orderSchema
);
module.exports = Order;