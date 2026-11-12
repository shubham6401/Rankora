import { useState } from "react";
import { editExecutiveOrderUnit } from "../../services/executive/order";

export default function ExecutiveUnitEditorModal({
    isOpen,
    onClose,
    order,
    unit,
    unitNumber,
    onSuccess,
}) {
    if (!isOpen || !unit) return null;

    const [form, setForm] = useState({
        orderId: unit.orderId || "",
        purchasePrice: unit.purchasePrice !== undefined && unit.purchasePrice !== null ? unit.purchasePrice : "",
        reviewerName: unit.reviewerName || "",
        expectedArrivalDate: unit.expectedArrivalDate
            ? new Date(unit.expectedArrivalDate).toISOString().split("T")[0]
            : "",
        deliveryAddress: unit.deliveryAddress || unit.address || "",
        addressType: unit.addressType || "yourself",
        unitType: unit.unitType || "warehouse",
        season: unit.season || "",
        paymentMessage: unit.paymentMessage || "",
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError("");

        try {
            setSaving(true);
            const res = await editExecutiveOrderUnit(order._id, unit._id, form);
            if (res.data?.success) {
                if (onSuccess) {
                    onSuccess(res.data.order, res.data.unit);
                }
                onClose();
            }
        } catch (err) {
            console.error("Failed to update unit fields:", err);
            setError(err.response?.data?.message || "Failed to update unit operational fields.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
        }}>
            <div style={{
                background: "#ffffff",
                borderRadius: "14px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                width: "100%",
                maxWidth: "600px",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
            }}>
                {/* Header */}
                <div style={{
                    padding: "16px 22px",
                    borderBottom: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "20px" }}>✏️</span>
                            <h2 style={{ fontSize: "16.5px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                                Edit Unit #{unitNumber} Details
                            </h2>
                            <span style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                padding: "2px 8px",
                                borderRadius: "10px"
                            }}>
                                {unit.status?.replace("_", " ")}
                            </span>
                        </div>
                        <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                            Operational field editor: Update marketplace order ID, purchase price, reviewer info, and address.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            border: "none",
                            background: "transparent",
                            fontSize: "20px",
                            color: "#94a3b8",
                            cursor: "pointer",
                            padding: "4px 8px"
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
                    <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>
                        {error && (
                            <div style={{
                                padding: "10px 14px",
                                background: "#fff1f2",
                                border: "1px solid #fecdd3",
                                borderRadius: "8px",
                                color: "#be123c",
                                fontSize: "13px",
                                marginBottom: "16px"
                            }}>
                                {error}
                            </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                            {/* Marketplace Order ID */}
                            <div>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                                    Marketplace Order ID
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 402-1234567-8901234"
                                    value={form.orderId}
                                    onChange={(e) => handleChange("orderId", e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            {/* Purchase Price */}
                            <div>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                                    Purchase Price (₹)
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 1499"
                                    value={form.purchasePrice}
                                    onChange={(e) => handleChange("purchasePrice", e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                            {/* Reviewer Account Name */}
                            <div>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                                    Reviewer Account Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Public reviewer name"
                                    value={form.reviewerName}
                                    onChange={(e) => handleChange("reviewerName", e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            {/* Expected Arrival Date */}
                            <div>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                                    Expected Arrival Date
                                </label>
                                <input
                                    type="date"
                                    value={form.expectedArrivalDate}
                                    onChange={(e) => handleChange("expectedArrivalDate", e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                            {/* Unit Classification */}
                            <div>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                                    Unit Classification
                                </label>
                                <select
                                    value={form.unitType}
                                    onChange={(e) => handleChange("unitType", e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        background: "#ffffff",
                                        boxSizing: "border-box"
                                    }}
                                >
                                    <option value="warehouse">🏢 Warehouse Delivery</option>
                                    <option value="empty">📦 Empty Delivery</option>
                                </select>
                            </div>

                            {/* Address Type */}
                            <div>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                                    Address Mode
                                </label>
                                <select
                                    value={form.addressType}
                                    onChange={(e) => handleChange("addressType", e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        background: "#ffffff",
                                        boxSizing: "border-box"
                                    }}
                                >
                                    <option value="yourself">👤 Yourself (Mediator's Address)</option>
                                    <option value="executive_provided">📍 Executive Assigned Address</option>
                                </select>
                            </div>
                        </div>

                        {/* Delivery Address Text */}
                        <div style={{ marginBottom: "14px" }}>
                            <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                                Shipping / Delivery Address
                            </label>
                            <textarea
                                rows="2"
                                placeholder="Recipient name, phone, complete street address, city, state, pin..."
                                value={form.deliveryAddress}
                                onChange={(e) => handleChange("deliveryAddress", e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "13px",
                                    outline: "none",
                                    boxSizing: "border-box",
                                    resize: "vertical"
                                }}
                            />
                        </div>

                        {/* Season & Payment Note */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                                    Season / Campaign Tag
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Diwali Sale 2026"
                                    value={form.season}
                                    onChange={(e) => handleChange("season", e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                                    Payment Note / Memo
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Advance paid via UPI"
                                    value={form.paymentMessage}
                                    onChange={(e) => handleChange("paymentMessage", e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: "14px 22px",
                        borderTop: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "10px"
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                background: "#ffffff",
                                color: "#475569",
                                fontSize: "13px",
                                fontWeight: 600,
                                cursor: "pointer"
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                padding: "8px 20px",
                                borderRadius: "6px",
                                border: "none",
                                background: "#2563eb",
                                color: "#ffffff",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: saving ? "not-allowed" : "pointer",
                                opacity: saving ? 0.7 : 1
                            }}
                        >
                            {saving ? "Saving Changes..." : "Save Unit Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
