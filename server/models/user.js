const mongoose = require("mongoose");

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

const User = mongoose.model("User", userSchema);
module.exports = User;