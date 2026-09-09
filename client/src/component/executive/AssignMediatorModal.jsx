import { useState } from "react";
import { AssignOrderToMediator } from "../../services/executive/order";
import "../../styles/appLayout.css";

export default function AssignMediatorModal({
    order,
    mediators = [],
    onClose,
    onSuccess,
}) {
    const unassignedUnits = order.summary?.unassigned || 0;
    const [selectedMediator, setSelectedMediator] = useState("");
    const [quantity, setQuantity] = useState(unassignedUnits > 0 ? 1 : 0);
    const [assigning, setAssigning] = useState(false);

    const priceNum = Number(order.price) || 0;
    const currentQty = Math.min(Math.max(1, Number(quantity) || 1), unassignedUnits);
    const totalAdvanceAmount = priceNum * currentQty;

    const handleConfirmAssign = async () => {
        if (!selectedMediator) {
            alert("Please select a mediator");
            return;
        }
        if (!currentQty || currentQty < 1 || currentQty > unassignedUnits) {
            alert("Please enter a valid quantity within available units");
            return;
        }

        const medObj = mediators.find((m) => m._id === selectedMediator);
        const confirmMsg = `Assign ${currentQty} unit(s) of "${order.productName}" to ${medObj?.name || "selected mediator"}?\n\nTotal Order Value: ₹${totalAdvanceAmount.toLocaleString()}\nThis order will be forwarded directly to the mediator's "New Offers" for acceptance verification.`;
        if (!window.confirm(confirmMsg)) return;

        try {
            setAssigning(true);
            await AssignOrderToMediator(order._id, {
                mediatorId: selectedMediator,
                quantity: currentQty,
            });
            alert("✓ Order successfully assigned! Forwarded to mediator's New Offers for verification.");
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to assign order:", err);
            alert(err?.response?.data?.message || "Failed to assign order");
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div className="app-modal-overlay" onClick={onClose}>
            <div
                className="app-modal-dialog"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="app-modal-header">
                    <div>
                        <h2 className="app-modal-title">🤝 Assign Units to Mediator</h2>
                        <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "2px" }}>
                            Allocate units from <b>{order.productName}</b>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="app-modal-close"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="app-modal-body">
                    {/* Order Details Brief */}
                    <div
                        style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            padding: "12px 16px",
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "10px",
                            fontSize: "13px",
                        }}
                    >
                        <div>
                            <span style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" }}>Brand</span>
                            <div style={{ fontWeight: "700", color: "#0f172a" }}>{order.brand}</div>
                        </div>
                        <div>
                            <span style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" }}>Platform</span>
                            <div style={{ fontWeight: "700", color: "#0f172a" }}>{order.orderPlatform}</div>
                        </div>
                        <div>
                            <span style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" }}>Price / Unit</span>
                            <div style={{ fontWeight: "700", color: "#2563eb" }}>₹{order.price}</div>
                        </div>
                        <div>
                            <span style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" }}>Available to Assign</span>
                            <div style={{ fontWeight: "700", color: "#d97706" }}>{unassignedUnits} Units</div>
                        </div>
                    </div>

                    {/* Choose Mediator */}
                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: "700",
                                color: "#334155",
                                marginBottom: "6px",
                            }}
                        >
                            Select Destination Mediator:
                        </label>
                        <select
                            value={selectedMediator}
                            onChange={(e) => setSelectedMediator(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "14px",
                                outline: "none",
                                background: "#ffffff",
                                boxSizing: "border-box",
                            }}
                        >
                            <option value="">-- Choose a team mediator --</option>
                            {mediators.map((med) => (
                                <option key={med._id} value={med._id}>
                                    {med.name} — Code: {med.mediatorCode || "N/A"}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Quantity Stepper */}
                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: "700",
                                color: "#334155",
                                marginBottom: "6px",
                            }}
                        >
                            Number of Units to Assign:
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <button
                                type="button"
                                onClick={() => setQuantity(Math.max(1, currentQty - 1))}
                                disabled={currentQty <= 1 || assigning}
                                className="app-btn app-btn-secondary"
                                style={{ width: "42px", height: "42px", fontSize: "18px", padding: 0 }}
                            >
                                -
                            </button>
                            <input
                                type="number"
                                min={1}
                                max={unassignedUnits}
                                value={quantity}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (!isNaN(val)) {
                                        setQuantity(Math.min(Math.max(1, val), unassignedUnits));
                                    }
                                }}
                                style={{
                                    width: "90px",
                                    height: "42px",
                                    textAlign: "center",
                                    fontSize: "16px",
                                    fontWeight: "800",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    boxSizing: "border-box",
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setQuantity(Math.min(unassignedUnits, currentQty + 1))}
                                disabled={currentQty >= unassignedUnits || assigning}
                                className="app-btn app-btn-secondary"
                                style={{ width: "42px", height: "42px", fontSize: "18px", padding: 0 }}
                            >
                                +
                            </button>
                            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>
                                out of <b>{unassignedUnits}</b> available
                            </span>
                        </div>
                    </div>

                    {/* Financial Preview Box */}
                    <div
                        style={{
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            borderRadius: "10px",
                            padding: "14px 16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <div>
                            <div style={{ fontSize: "12px", color: "#1e40af", fontWeight: "700" }}>
                                Advance Payment Calculation:
                            </div>
                            <div style={{ fontSize: "13px", color: "#3b82f6", marginTop: "2px" }}>
                                ₹{priceNum.toLocaleString()} × {currentQty} unit{currentQty > 1 ? "s" : ""}
                            </div>
                        </div>
                        <div style={{ fontSize: "20px", fontWeight: "800", color: "#1d4ed8" }}>
                            ₹{totalAdvanceAmount.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="app-modal-footer">
                    <button
                        type="button"
                        className="app-btn app-btn-outline"
                        onClick={onClose}
                        disabled={assigning}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="app-btn app-btn-primary"
                        disabled={!selectedMediator || currentQty < 1 || assigning}
                        onClick={handleConfirmAssign}
                    >
                        {assigning ? "Assigning..." : `Confirm Assign (${currentQty} Units)`}
                    </button>
                </div>
            </div>
        </div>
    );
}
