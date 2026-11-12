import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PriceDisplay from "../common/PriceDisplay";
import DeleteOrderUnitsModal from "./DeleteOrderUnitsModal";
import OrderUnitSelectorModal from "./OrderUnitSelectorModal";
import ExecutiveUnitEditorModal from "./ExecutiveUnitEditorModal";
import "../../styles/ordersTable.css";

export default function OrderCard({ order, status, onOrderUpdated }) {
    const navigate = useNavigate();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectorModalOpen, setSelectorModalOpen] = useState(false);
    const [editorModal, setEditorModal] = useState({ isOpen: false, unit: null, unitNumber: 1 });

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

    const handleEditClick = () => {
        if (units.length <= 1) {
            const primaryUnit = units[0] || {};
            setEditorModal({ isOpen: true, unit: primaryUnit, unitNumber: 1 });
        } else {
            setSelectorModalOpen(true);
        }
    };

    return (
        <>
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
                            title="View order details and units"
                        >
                            Details
                        </button>
                        <button
                            type="button"
                            className="table-btn"
                            style={{
                                backgroundColor: "#eff6ff",
                                color: "#1d4ed8",
                                border: "1px solid #bfdbfe",
                                fontWeight: 700,
                            }}
                            onClick={handleEditClick}
                            title="Edit marketplace order ID, price, reviewer name, etc."
                        >
                            ✏️ Edit
                        </button>
                        <button
                            type="button"
                            className="table-btn table-btn-danger"
                            style={{
                                background: "#fee2e2",
                                color: "#dc2626",
                                border: "1px solid #fca5a5",
                                padding: "6px 10px",
                                cursor: "pointer",
                            }}
                            onClick={() => setDeleteModalOpen(true)}
                            title="Delete specific units or entire order batch"
                        >
                            🗑️ Delete
                        </button>
                    </div>
                </td>
            </tr>

            {deleteModalOpen && (
                <DeleteOrderUnitsModal
                    isOpen={deleteModalOpen}
                    order={order}
                    onClose={() => setDeleteModalOpen(false)}
                    onSuccess={() => {
                        if (onOrderUpdated) onOrderUpdated();
                    }}
                />
            )}

            {selectorModalOpen && (
                <OrderUnitSelectorModal
                    isOpen={selectorModalOpen}
                    order={order}
                    onClose={() => setSelectorModalOpen(false)}
                    onSelectUnit={(unit, unitNumber) => {
                        setEditorModal({ isOpen: true, unit, unitNumber });
                    }}
                />
            )}

            {editorModal.isOpen && (
                <ExecutiveUnitEditorModal
                    isOpen={editorModal.isOpen}
                    order={order}
                    unit={editorModal.unit}
                    unitNumber={editorModal.unitNumber}
                    onClose={() => setEditorModal({ isOpen: false, unit: null, unitNumber: 1 })}
                    onSuccess={() => {
                        if (onOrderUpdated) onOrderUpdated();
                    }}
                />
            )}
        </>
    );
}
