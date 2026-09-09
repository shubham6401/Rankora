import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AssignMediatorModal from "./AssignMediatorModal";
import "../../styles/ordersTable.css";

export default function PendingOrderCard({ order, mediators, status, onOrderUpdated }) {
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);

    const unassignedUnits = order.summary?.unassigned || 0;

    return (
        <>
            <tr>
                <td className="product-name-cell">{order.productName}</td>
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
                    <div className="action-btn-group" style={{ display: "flex", gap: "8px" }}>
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