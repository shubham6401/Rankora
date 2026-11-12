import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AssignMediatorModal from "./AssignMediatorModal";
import PriceDisplay from "../common/PriceDisplay";
import DeleteOrderUnitsModal from "./DeleteOrderUnitsModal";
import OrderUnitSelectorModal from "./OrderUnitSelectorModal";
import ExecutiveUnitEditorModal from "./ExecutiveUnitEditorModal";
import "../../styles/ordersTable.css";

export default function PendingOrderCard({ order, mediators, status, onOrderUpdated }) {
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectorModalOpen, setSelectorModalOpen] = useState(false);
    const [editorModal, setEditorModal] = useState({ isOpen: false, unit: null, unitNumber: 1 });

    const units = order.orderUnits || [];
    const unassignedUnits = order.summary?.unassigned || 0;
    const unassignedList = units.filter((u) => u.status === "unassigned");
    const whCount = unassignedList.filter((u) => u.unitType === "warehouse").length;
    const emCount = unassignedList.filter((u) => u.unitType === "empty").length;

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
                    <PriceDisplay basePrice={order.price} />
                </td>
                <td>{order.executiveName || "-"}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                    <span className="status-badge status-badge-pending">
                        {status || "unassigned"}
                    </span>
                </td>
                <td>
                    <span className="qty-pill">{order.quantity}</span>
                </td>
                <td>
                    <span className="qty-pill qty-pill-warning">
                        {unassignedUnits} Left
                    </span>
                </td>
                <td>{order.teamCode}</td>
                <td>
                    <div className="action-btn-group" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <button
                            type="button"
                            className="table-btn table-btn-outline"
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
                            className="table-btn table-btn-primary"
                            disabled={unassignedUnits <= 0}
                            onClick={() => setModalOpen(true)}
                            title="Assign available units to a mediator"
                        >
                            🤝 Assign
                        </button>
                        <button
                            type="button"
                            className="table-btn table-btn-danger"
                            onClick={() => setDeleteModalOpen(true)}
                            title="Delete specific units or entire order batch"
                        >
                            🗑️ Delete
                        </button>
                    </div>
                </td>
            </tr>

            {modalOpen && (
                <AssignMediatorModal
                    order={order}
                    mediators={mediators}
                    onClose={() => setModalOpen(false)}
                    onSuccess={() => {
                        if (onOrderUpdated) onOrderUpdated();
                    }}
                />
            )}

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
