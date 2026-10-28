import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AssignMediatorModal from "./AssignMediatorModal";
import { deleteExecutiveOrderBatch } from "../../services/executive/order";
import "../../styles/ordersTable.css";

export default function PendingOrderCard({ order, mediators, status, onOrderUpdated }) {
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const unassignedUnits = order.summary?.unassigned || 0;
    const unassignedList = (order.orderUnits || []).filter((u) => u.status === "unassigned");
    const whCount = unassignedList.filter((u) => u.unitType === "warehouse").length;
    const emCount = unassignedList.filter((u) => u.unitType === "empty").length;

    const handleDeleteBatch = async () => {
        const confirmMsg = `Are you sure you want to permanently delete this order batch?\n\n` +
            `Product: ${order.productName}\n` +
            `Brand: ${order.brand}\n` +
            `Total Units: ${order.quantity}\n` +
            `Unassigned Units: ${unassignedUnits}\n\n` +
            `This action will permanently delete the entire batch and cannot be undone.`;

        if (!window.confirm(confirmMsg)) return;

        try {
            setDeleting(true);
            const res = await deleteExecutiveOrderBatch(order._id);
            if (res.data?.success) {
                alert(`Order batch "${order.productName}" deleted successfully!`);
                if (onOrderUpdated) onOrderUpdated();
            }
        } catch (err) {
            console.error("Error deleting order batch:", err);
            alert(err?.response?.data?.message || "Failed to delete order batch.");
        } finally {
            setDeleting(false);
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
                <td className="price-pill">₹{order.price}</td>
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
                            disabled={deleting}
                            onClick={handleDeleteBatch}
                            title="Permanently delete this order batch"
                        >
                            {deleting ? "..." : "🗑️ Delete"}
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
        </>
    );
}