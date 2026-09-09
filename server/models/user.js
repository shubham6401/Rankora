const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ["executive", "mediator", "brand"],
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
}, {
    timestamps: true,
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