import { useState } from "react";
import { returnMediatorOrderUnit } from "../../services/mediator/orders";

export default function ReturnOrderModal({ unit, order, onClose, onSuccess }) {
    const [reasonCategory, setReasonCategory] = useState("Buyer Cancelled");
    const [details, setDetails] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleConfirm = async (e) => {
        e.preventDefault();
        setError("");

        const fullReason = `${reasonCategory}: ${details.trim() || "No additional notes provided"}`;

        try {
            setSubmitting(true);
            const unitId = unit?._id || order?.orderUnits?.find((u) => ["in_progress", "pending_refund"].includes(u.status))?._id;
            if (!unitId) {
                setError("Unable to identify unit to return");
                return;
            }

            const res = await returnMediatorOrderUnit(unitId, fullReason);
            if (res.data?.success) {
                alert("✓ Order marked for return! Unit moved to Return Refunds so you can upload refund proof to executive.");
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
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem"
        }} onClick={onClose}>
            <div style={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                maxWidth: "480px",
                width: "100%",
                padding: "1.75rem",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                color: "#0f172a"
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "1.25rem" }}>↩️</span>
                        <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#b91c1c" }}>
                            Initiate Order Return
                        </h3>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748b" }}>
                        ✕
                    </button>
                </div>

                <div style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    fontSize: "13px",
                    color: "#991b1b",
                    marginBottom: "1rem"
                }}>
                    <b>Note:</b> Returning this order unit will move it to the <b>Return Refunds</b> section so you can upload refund payment proof to return the funds to your executive.
                </div>

                {error && (
                    <div style={{ color: "#dc2626", fontSize: "13px", marginBottom: "10px" }}>
                        ⚠️ {error}
                    </div>
                )}

                <div style={{ fontSize: "13px", marginBottom: "12px" }}>
                    <div><b>Product:</b> {order?.productName}</div>
                    <div><b>Platform:</b> {order?.orderPlatform}</div>
                    <div><b>Unit Price:</b> ₹{order?.price}</div>
                </div>

                <form onSubmit={handleConfirm}>
                    <div style={{ marginBottom: "12px" }}>
                        <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", marginBottom: "4px", color: "#334155" }}>
                            Primary Return Reason:
                        </label>
                        <select
                            value={reasonCategory}
                            onChange={(e) => setReasonCategory(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                fontSize: "13.5px",
                                outline: "none",
                                background: "#ffffff"
                            }}
                        >
                            <option value="Buyer Cancelled">Buyer Cancelled / Customer Rejection</option>
                            <option value="Out of Stock">Out of Stock / Delayed Fulfillment</option>
                            <option value="E-Commerce Account Issue">E-Commerce Account / Payment Blocked</option>
                            <option value="Damaged / Wrong Item Received">Damaged / Wrong Item Received</option>
                            <option value="Executive Instruction">Returned per Executive Instruction</option>
                            <option value="Other Reason">Other Reason</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", marginBottom: "4px", color: "#334155" }}>
                            Detailed Explanation (Optional):
                        </label>
                        <textarea
                            rows="3"
                            placeholder="Provide details about why this unit is being returned..."
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
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

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                background: "#ffffff",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "600"
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                padding: "8px 18px",
                                borderRadius: "6px",
                                border: "none",
                                background: "#dc2626",
                                color: "#ffffff",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "700",
                                opacity: submitting ? 0.7 : 1
                            }}
                        >
                            {submitting ? "Processing..." : "Confirm Return Unit ↩️"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
