import { useState } from "react";
import { returnMediatorOrderUnit } from "../../services/mediator/orders";
import "../../styles/theme.css";

export default function ReturnOrderModal({ unit, order, stage, onClose, onSuccess }) {
    const currentStage = stage || unit?.status || (order?.orderUnits?.find((u) => ["pending_refund", "in_progress"].includes(u.status))?.status) || "in_progress";
    const isRefundPending = currentStage === "pending_refund";

    const availableUnits = (order?.orderUnits || []).filter((u) => u.status === currentStage);
    const maxUnits = availableUnits.length > 0 ? availableUnits.length : 1;

    const [quantity, setQuantity] = useState(1);
    const [reasonCategory, setReasonCategory] = useState(isRefundPending ? "Order Cancelled" : "Buyer Cancelled");
    const [details, setDetails] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const unitPrice = parseFloat(order?.price) || 0;
    const totalRefundAmount = unitPrice * quantity;

    const handleConfirm = async (e) => {
        e.preventDefault();
        setError("");

        const fullReason = `${reasonCategory}: ${details.trim() || "No additional notes provided"}`;

        try {
            setSubmitting(true);
            const unitId = unit?._id || availableUnits[0]?._id || order?.orderUnits?.find((u) => ["in_progress", "pending_refund"].includes(u.status))?._id;
            if (!unitId) {
                setError("Unable to identify unit to return");
                return;
            }

            const res = await returnMediatorOrderUnit(unitId, fullReason, quantity);
            if (res.data?.success) {
                alert(`✓ ${quantity} unit(s) marked for return! Moved to Return Refunds so you can upload refund proof to executive.`);
                if (onSuccess) onSuccess();
                onClose();
            }
        } catch (err) {
            console.error("Return order error:", err);
            setError(err.response?.data?.message || "Failed to return order unit");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px"
        }} onClick={onClose}>
            <div
                className="saas-card"
                style={{
                    maxWidth: "520px",
                    width: "100%",
                    padding: "26px",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "20px" }}>↩️</span>
                        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#dc2626" }}>
                            Initiate Order Return
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--slate-400)" }}
                    >
                        ✕
                    </button>
                </div>

                <div style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    fontSize: "13px",
                    color: "#991b1b",
                    marginBottom: "16px",
                    lineHeight: "1.4"
                }}>
                    <b>Note:</b> Returning order unit(s) will move them to the <b>Return Refunds</b> section so you can upload refund payment proof to return the funds to your executive.
                </div>

                {error && (
                    <div style={{ color: "#dc2626", fontSize: "13px", marginBottom: "12px" }}>
                        ⚠️ {error}
                    </div>
                )}

                <div style={{
                    background: "var(--slate-50)",
                    border: "1px solid var(--slate-200)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    fontSize: "13px",
                    marginBottom: "16px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "6px"
                }}>
                    <div><span style={{ color: "var(--slate-500)" }}>Product:</span> <b>{order?.productName}</b></div>
                    <div><span style={{ color: "var(--slate-500)" }}>Platform:</span> <b>{order?.orderPlatform}</b></div>
                    <div><span style={{ color: "var(--slate-500)" }}>Unit Price:</span> <b style={{ color: "var(--primary-600)" }}>₹{unitPrice}</b></div>
                    <div><span style={{ color: "var(--slate-500)" }}>Available Units:</span> <b style={{ color: "#d97706" }}>{maxUnits} Unit(s)</b></div>
                </div>

                <form onSubmit={handleConfirm} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {/* Unit Selection Option */}
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <label style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--slate-700)", textTransform: "uppercase" }}>
                                Units to Return:
                            </label>
                            <span style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                                Available: <b>{maxUnits}</b>
                            </span>
                        </div>
                        <select
                            value={quantity}
                            onChange={(e) => setQuantity(Math.min(maxUnits, Math.max(1, Number(e.target.value))))}
                            className="saas-select"
                            style={{ fontWeight: 600, fontSize: "13px" }}
                        >
                            {Array.from({ length: maxUnits }, (_, i) => i + 1).map((qty) => (
                                <option key={qty} value={qty}>
                                    {qty} {qty === 1 ? "Unit" : "Units"} (₹{(unitPrice * qty).toLocaleString()})
                                </option>
                            ))}
                        </select>
                        <div style={{
                            marginTop: "6px",
                            padding: "6px 10px",
                            backgroundColor: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            borderRadius: "6px",
                            fontSize: "12px",
                            color: "#1d4ed8",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <span>Total Refund Due to Executive:</span>
                            <strong style={{ fontSize: "13px" }}>₹{totalRefundAmount.toLocaleString()}</strong>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", marginBottom: "4px", color: "var(--slate-700)", textTransform: "uppercase" }}>
                            Primary Return Reason:
                        </label>
                        <select
                            value={reasonCategory}
                            onChange={(e) => setReasonCategory(e.target.value)}
                            className="saas-select"
                        >
                            <option value="Order Cancelled">Order Cancelled</option>
                            <option value="Buyer Cancelled">Buyer Cancelled / Customer Rejection</option>
                            <option value="Out of Stock">Out of Stock / Delayed Fulfillment</option>
                            <option value="E-Commerce Account Issue">E-Commerce Account / Payment Blocked</option>
                            <option value="Damaged / Wrong Item Received">Damaged / Wrong Item Received</option>
                            <option value="Executive Instruction">Returned per Executive Instruction</option>
                            <option value="Other Reason">Other Reason</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", marginBottom: "4px", color: "var(--slate-700)", textTransform: "uppercase" }}>
                            Detailed Explanation (Optional):
                        </label>
                        <textarea
                            rows="3"
                            placeholder="Provide details about why the unit(s) are being returned..."
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="saas-input"
                            style={{ resize: "vertical" }}
                        />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="saas-btn saas-btn-outline"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="saas-btn saas-btn-danger"
                        >
                            {submitting ? "Processing..." : `Confirm Return (${quantity} Unit${quantity > 1 ? "s" : ""}) ↩️`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
