export default function OrderUnitSelectorModal({
    isOpen,
    onClose,
    order,
    onSelectUnit,
}) {
    if (!isOpen || !order) return null;

    const units = order.orderUnits || [];

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
                    borderBottom: "1px solid #bfdbfe",
                    background: "#eff6ff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "22px" }}>✏️</span>
                            <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#1e40af", margin: 0 }}>
                                Select Unit to Edit
                            </h2>
                            <span style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                background: "#dbeafe",
                                color: "#1d4ed8",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                border: "1px solid #bfdbfe",
                            }}>
                                {units.length} Units Available
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

                {/* Units List */}
                <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
                    <p style={{ margin: "0 0 14px 0", fontSize: "13px", color: "#475569" }}>
                        Select any unit below to edit its <b>Marketplace Order ID, Purchase Price, Reviewer Name, Address, or Notes</b>:
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {units.map((unit, idx) => {
                            const unitNumber = idx + 1;
                            const isUnassigned = unit.status === "unassigned";

                            return (
                                <div
                                    key={unit._id || idx}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "12px 16px",
                                        borderRadius: "8px",
                                        border: "1px solid #e2e8f0",
                                        background: "#ffffff",
                                        transition: "all 0.15s ease",
                                        flexWrap: "wrap",
                                        gap: "10px",
                                    }}
                                >
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#0f172a" }}>
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
                                                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                                                    {unit.unitType === "warehouse" ? "🏢 Warehouse" : unit.unitType === "empty" ? "📦 Empty" : "Regular"}
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                                            <span>
                                                Order ID: <b>{unit.orderId || "Not set yet"}</b>
                                            </span>
                                            {unit.reviewerName && <span> • Buyer: {unit.reviewerName}</span>}
                                            <span> • Price: ₹{unit.purchasePrice || order.price || 0}</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSelectUnit(unit, unitNumber);
                                            onClose();
                                        }}
                                        style={{
                                            padding: "7px 14px",
                                            borderRadius: "6px",
                                            border: "1px solid #2563eb",
                                            backgroundColor: "#2563eb",
                                            color: "#ffffff",
                                            fontWeight: 700,
                                            fontSize: "12.5px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            boxShadow: "0 1px 3px rgba(37,99,235,0.2)",
                                        }}
                                    >
                                        <span>✏️</span>
                                        <span>Edit Unit #{unitNumber}</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: "14px 24px",
                    borderTop: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    display: "flex",
                    justifyContent: "flex-end",
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            color: "#475569",
                            fontWeight: 600,
                            fontSize: "13px",
                            cursor: "pointer",
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

