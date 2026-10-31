import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteExecutiveOrderBatch } from "../../services/executive/order";
import PriceDisplay from "../common/PriceDisplay";
import "../../styles/ordersTable.css";

export default function OrderCard({ order, status, onOrderUpdated }) {
    const navigate = useNavigate();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteBatch = async () => {
        const totalU = order.quantity || (order.orderUnits ? order.orderUnits.length : 0);
        const confirmMsg =
            `⚠️ ARE YOU SURE YOU WANT TO DELETE THIS ORDER BATCH?\n\n` +
            `Product: ${order.productName || "Unnamed"}\n` +
            `Brand: ${order.brand || "Unknown"}\n` +
            `Total Units: ${totalU}\n\n` +
            `This will permanently delete the entire order batch and all associated units.\n` +
            `This action CANNOT be undone. Proceed?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            setIsDeleting(true);
            await deleteExecutiveOrderBatch(order._id);
            alert("✓ Order batch deleted successfully.");
            if (onOrderUpdated) {
                onOrderUpdated();
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error("Failed to delete order batch:", err);
            alert(err?.response?.data?.message || "Failed to delete order batch");
            setIsDeleting(false);
        }
    };

    const units = order.orderUnits || [];
    const targetStatus = status ? status.toLowerCase() : null;

    // Filter units matching this table's specific status (e.g. only in_progress accepted units)
    const matchingUnits = targetStatus && targetStatus !== "all"
        ? units.filter((u) => u.status === targetStatus)
        : units;

    // Extract all unique mediators from the matching units
    const assignedMediatorsMap = {};
    matchingUnits.forEach((unit) => {
        if (unit.mediatorId) {
            const mId = unit.mediatorId._id || unit.mediatorId;
            if (!assignedMediatorsMap[mId]) {
                assignedMediatorsMap[mId] = {
                    name: unit.mediatorId.name || "Mediator",
                    mediatorCode: unit.mediatorId.mediatorCode || "N/A",
                    count: 0,
                };
            }
            assignedMediatorsMap[mId].count++;
        }
    });
    const assignedMediatorsList = Object.values(assignedMediatorsMap);

    const whCount = matchingUnits.filter((u) => u.unitType === "warehouse").length;
    const emCount = matchingUnits.filter((u) => u.unitType === "empty").length;

    const getBadgeClass = (s) => {
        const lower = (s || "").toLowerCase();
        if (lower.includes("progress")) return "status-badge status-badge-in_progress";
        if (lower.includes("refund")) return "status-badge status-badge-pending_refund";
        if (lower.includes("complete")) return "status-badge status-badge-completed";
        return "status-badge status-badge-assigned";
    };

    return (
        <tr>
            <td className="product-name-cell">
                <div>{order.productName}</div>
                {(whCount > 0 || emCount > 0) && (
                    <div className="unit-spec-group" style={{ marginTop: "4px" }}>
                        {whCount > 0 && (
                            <span className="unit-spec-chip warehouse">🏢 {whCount} WH</span>
                        )}
                        {emCount > 0 && (
                            <span className="unit-spec-chip empty">📦 {emCount} Empty</span>
                        )}
                    </div>
                )}
            </td>
            <td>{order.brand}</td>
            <td>{order.orderPlatform}</td>
            <td>
                <PriceDisplay
                    basePrice={order.price}
                    actualPrice={
                        matchingUnits.find((u) => u.purchasePrice && Number(u.purchasePrice) > Number(order.price))?.purchasePrice
                    }
                    layout="stack"
                />
            </td>
            <td>{order.executiveName || "-"}</td>
            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
            <td>
                <span className={getBadgeClass(status)}>
                    {(status || "Active").replace("_", " ")}
                </span>
            </td>
            <td>{order.teamCode}</td>

            {/* Assigned Mediator Names */}
            <td>
                {assignedMediatorsList.length > 0 ? (
                    assignedMediatorsList.map((m, i) => (
                        <div key={i} style={{ fontWeight: "600", color: "var(--slate-800)" }}>
                            {m.name} {m.count > 1 && <span style={{ color: "var(--slate-500)", fontWeight: "normal" }}>({m.count} Units)</span>}
                        </div>
                    ))
                ) : (
                    <span style={{ color: "var(--slate-400)", fontStyle: "italic" }}>
                        {status === "in_progress" ? "None Accepted Yet" : "Not Assigned"}
                    </span>
                )}
            </td>

            {/* Assigned Mediator Codes */}
            <td>
                {assignedMediatorsList.length > 0 ? (
                    assignedMediatorsList.map((m, i) => (
                        <div key={i}>
                            <span className="qty-pill">{m.mediatorCode}</span>
                        </div>
                    ))
                ) : (
                    <span style={{ color: "var(--slate-400)", fontStyle: "italic" }}>-</span>
                )}
            </td>

            {/* Actions */}
            <td>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <button
                        type="button"
                        className="table-btn table-btn-primary"
                        onClick={() => navigate(`/order/${order._id}`)}
                    >
                        View Details
                    </button>
                    <button
                        type="button"
                        className="table-btn table-btn-danger"
                        style={{
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "1px solid #fca5a5",
                            padding: "6px 10px",
                            cursor: isDeleting ? "not-allowed" : "pointer"
                        }}
                        disabled={isDeleting}
                        onClick={handleDeleteBatch}
                        title="Permanently delete this entire order batch"
                    >
                        {isDeleting ? "..." : "🗑️"}
                    </button>
                </div>
            </td>
        </tr>
    );
}