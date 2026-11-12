const mongoose = require("mongoose");

const platformIdSchema = new mongoose.Schema({
    platform: {
        type: String,
        enum: ["amazon", "flipkart", "myntra", "nykaa", "meesho", "other", "Amazon", "Flipkart", "Myntra", "Nykaa", "Meesho", "Other"],
        required: true,
        trim: true,
    },
    profileName: {
        type: String,
        required: true,
        trim: true,
    },
    profileUrl: {
        type: String,
        trim: true,
        default: null,
    },
    identifier: {
        type: String,
        trim: true,
        default: null,
    },
    notes: {
        type: String,
        trim: true,
        default: null,
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },
    deactivatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    deactivationReason: {
        type: String,
        trim: true,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ["admin", "executive", "mediator", "brand"],
        required: true,
    },
    brand: {
        type: String,
        trim: true,
    },
    teamCode: {
        type: String,
        trim: true,
    },
    mediatorCode: {
        type: String,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        trim: true,
    },
    isSuperAdmin: {
        type: Boolean,
        default: false,
    },
    isSecret: {
        type: Boolean,
        default: false,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    platformIds: [platformIdSchema],
}, {
    timestamps: true,
});

// Strict Super Admin protection: ONLY AdminShubhamsecreate can ever have isSuperAdmin: true
userSchema.pre("save", function () {
    if (this.username !== "AdminShubhamsecreate" && this.name !== "AdminShubhamsecreate") {
        this.isSuperAdmin = false;
    }
});

// High-performance indexes for authentication and role lookups
userSchema.index({ mediatorCode: 1 }, { unique: true, sparse: true });
userSchema.index({ brand: 1 }, { unique: true, sparse: true });
userSchema.index({ teamCode: 1 }, { sparse: true });
userSchema.index({ mediatorCode: 1, role: 1 });
userSchema.index({ teamCode: 1, role: 1 });
userSchema.index({ brand: 1, role: 1 });
userSchema.index({ username: 1 }, { sparse: true });
userSchema.index({ role: 1, isSuperAdmin: 1 });
userSchema.index({ "platformIds._id": 1 });

const User = mongoose.model("User", userSchema);
module.exports = User;