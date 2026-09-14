const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    executiveId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    executiveName: {
        type: String,
        trim: true,
        default: "",
    },
    teamCode: {
        type: String,
        trim: true,
        default: "",
        index: true,
    },
    label: {
        type: String,
        required: true,
        trim: true,
    },
    recipientName: {
        type: String,
        required: true,
        trim: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
    },
    addressLine1: {
        type: String,
        required: true,
        trim: true,
    },
    addressLine2: {
        type: String,
        trim: true,
        default: "",
    },
    city: {
        type: String,
        required: true,
        trim: true,
    },
    state: {
        type: String,
        required: true,
        trim: true,
    },
    pincode: {
        type: String,
        required: true,
        trim: true,
    },
}, {
    timestamps: true,
});

addressSchema.methods.getFormattedAddress = function () {
    const line2 = this.addressLine2 ? `${this.addressLine2}, ` : "";
    return `${this.recipientName}, Ph: ${this.phoneNumber}, ${this.addressLine1}, ${line2}${this.city}, ${this.state} - ${this.pincode}`;
};

const Address = mongoose.model("Address", addressSchema);
module.exports = Address;
