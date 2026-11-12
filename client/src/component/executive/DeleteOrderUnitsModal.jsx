import { useState, useEffect } from "react";
import {
    bulkDeleteExecutiveOrderUnits,
    deleteExecutiveOrderBatch,
} from "../../services/executive/order";

export default function DeleteOrderUnitsModal({
    isOpen,
    onClose,
    order,
    onSuccess,
}) {
    if (!isOpen || !order) return null;

    const units = order.orderUnits || [];
    const [selectedUnitIds, setSelectedUnitIds] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // By default, start with none selected, or if only 1 unit, select it
        if (units.length === 1) {
            setSelectedUnitIds([units[0]._id]);
        } else {
            setSelectedUnitIds([]);
        }
        setError("");
    }, [order]);

    const handleToggleUnit = (unitId) => {
        setSelectedUnitIds((prev) =>
            prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
        );
    };

    const handleToggleAll = () => {
        if (selectedUnitIds.length === units.length) {
            setSelectedUnitIds([]);
        } else {
            setSelectedUnitIds(units.map((u) => u._id));
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedUnitIds.length === 0) {
            setError("Please select at least one unit to delete.");
            return;
        }

        const confirmMsg =
            `Are you sure you want to delete ${selectedUnitIds.length} selected unit(s) from "${order.productName}"?\n\n` +
            `This will reduce the total batch quantity and recalculate financial summaries.`;

        if (!window.confirm(confirmMsg)) return;

        try {
            setIsDeleting(true);
            setError("");
            const res = await bulkDeleteExecutiveOrderUnits(order._id, selectedUnitIds);
            if (res.data?.success) {
                alert(`✓ Successfully deleted ${res.data.deletedCount || selectedUnitIds.length} unit(s).`);
                if (onSuccess) {
                    onSuccess(res.data.order, false);
                }
                onClose();
            }
        } catch (err) {
            console.error("Failed to delete selected units:", err);
            setError(err.response?.data?.message || "Failed to delete selected units.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteEntireBatch = async () => {
        const confirmMsg =
            `⚠️ WARNING: ARE YOU SURE YOU WANT TO PERMANENTLY DELETE THE ENTIRE ORDER BATCH?\n\n` +
            `Product: ${order.productName}\n` +
            `Brand: ${order.brand}\n` +
            `Total Units: ${units.length}\n\n` +
            `This will delete the entire order document and ALL associated units from the system.\n` +
            `This action CANNOT be undone! Proceed?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            setIsDeleting(true);
            setError("");
            const res = await deleteExecutiveOrderBatch(order._id);
            if (res.data?.success) {
                alert(`✓ Order batch "${order.productName}" completely deleted.`);
                if (onSuccess) {
                    onSuccess(null, true);
                }
                onClose();
            }
        } catch (err) {
            console.error("Failed to delete order batch:", err);
            setError(err.response?.data?.message || "Failed to delete order batch.");
        } finally {
            setIsDeleting(false);
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
            padding: "16px",
        }}>
            <div style={{
                background: "#ffffff",
                borderRadius: "14px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                width: "100%",
                maxWidth: "680px",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}>
                {/* Header */}
                <div style={{
                    padding: "18px 24px",
                    borderBottom: "1px solid #fee2e2",
                    background: "#fff1f2",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "22px" }}>🗑️</span>
                            <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#991b1b", margin: 0 }}>
                                Delete Order Units
                            </h2>
                            <span style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                background: "#fee2e2",
                                color: "#b91c1c",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                border: "1px solid #fca5a5",
                            }}>
                                Total Units: {units.length}
                            </span>
                        </div>
                        <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>
                            <b>{order.productName}</b> {order.brand && `• ${order.brand}`}
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
                            padding: "4px 8px",
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Body Content */}
                <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
                    {error && (
                        <div style={{
                            padding: "10px 14px",
                            background: "#fff1f2",
                            border: "1px solid #fecdd3",
                            borderRadius: "8px",
                            color: "#be123c",
                            fontSize: "13px",
                            marginBottom: "16px",
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingBottom: "12px",
                        borderBottom: "1px solid #e2e8f0",
                        marginBottom: "14px",
                    }}>
                        <label style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#334155",
                            cursor: "pointer",
                        }}>
                            <input
                                type="checkbox"
                                checked={selectedUnitIds.length > 0 && selectedUnitIds.length === units.length}
                                onChange={handleToggleAll}
                                style={{ width: "16px", height: "16px", accentColor: "#dc2626", cursor: "pointer" }}
                            />
                            <span>Select All ({units.length} units)</span>
                        </label>

                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: selectedUnitIds.length > 0 ? "#dc2626" : "#64748b" }}>
                            {selectedUnitIds.length} of {units.length} unit(s) selected
                        </span>
                    </div>

                    {units.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b" }}>
                            No order units found in this batch.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {units.map((unit, idx) => {
                                const isSelected = selectedUnitIds.includes(unit._id);
                                const unitNumber = idx + 1;
                                const isUnassigned = unit.status === "unassigned";

                                return (
                                    <div
                                        key={unit._id || idx}
                                        onClick={() => handleToggleUnit(unit._id)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            padding: "12px 14px",
                                            borderRadius: "8px",
                                            border: isSelected ? "1.5px solid #f87171" : "1px solid #e2e8f0",
                                            background: isSelected ? "#fffbfa" : "#ffffff",
                                            cursor: "pointer",
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => {}} // handled by parent div onClick
                                            style={{
                                                width: "17px",
                                                height: "17px",
                                                accentColor: "#dc2626",
                                                cursor: "pointer",
                                            }}
                                        />

                                        <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                                                        Unit #{unitNumber}
                                                    </span>
                                                    <span style={{
                                                        fontSize: "11px",
                                                        fontWeight: 700,
                                                        padding: "2px 8px",
                                                        borderRadius: "10px",
                                                        background: isUnassigned ? "#fef3c7" : "#eff6ff",
                                                        color: isUnassigned ? "#92400e" : "#1d4ed8",
                                                        border: `1px solid ${isUnassigned ? "#fde68a" : "#bfdbfe"}`,
                                                    }}>
                                                        {unit.status?.replace("_", " ")}
                                                    </span>
                                                    {unit.unitType && (
                                                        <span style={{
                                                            fontSize: "10.5px",
                                                            fontWeight: 600,
                                                            color: "#64748b",
                                                        }}>
                                                            ({unit.unitType})
                                                        </span>
                                                    )}
                                                </div>

                                                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
                                                    {unit.orderId ? (
                                                        <span>Order ID: <b>{unit.orderId}</b></span>
                                                    ) : (
                                                        <span style={{ fontStyle: "italic", color: "#94a3b8" }}>No Marketplace ID</span>
                                                    )}
                                                    {unit.reviewerName && <span> • Buyer: {unit.reviewerName}</span>}
                                                </div>
                                            </div>

                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                                                    ₹{unit.purchasePrice || order.price || 0}
                                                </div>
                                                {unit.mediatorId?.name && (
                                                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                                                        Med: {unit.mediatorId.name}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div style={{
                    padding: "16px 24px",
                    borderTop: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                }}>
                    <button
                        type="button"
                        onClick={handleDeleteEntireBatch}
                        disabled={isDeleting}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#dc2626",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            cursor: isDeleting ? "not-allowed" : "pointer",
                            textDecoration: "underline",
                            padding: "4px 0",
                        }}
                        title="Delete entire order batch and all associated units"
                    >
                        ⚠️ Delete Entire Order Batch ({units.length} units)
                    </button>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isDeleting}
                            style={{
                                padding: "9px 16px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                backgroundColor: "#ffffff",
                                color: "#475569",
                                fontWeight: 600,
                                fontSize: "13px",
                                cursor: "pointer",
                            }}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleDeleteSelected}
                            disabled={isDeleting || selectedUnitIds.length === 0}
                            style={{
                                padding: "9px 18px",
                                borderRadius: "6px",
                                border: "none",
                                backgroundColor: selectedUnitIds.length > 0 ? "#dc2626" : "#cbd5e1",
                                color: "#ffffff",
                                fontWeight: 700,
                                fontSize: "13px",
                                cursor: selectedUnitIds.length > 0 && !isDeleting ? "pointer" : "not-allowed",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <span>🗑️</span>
                            <span>
                                {isDeleting
                                    ? "Deleting..."
                                    : `Delete Selected Units (${selectedUnitIds.length})`}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
