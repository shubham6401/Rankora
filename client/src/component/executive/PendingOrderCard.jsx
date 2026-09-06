import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AssignOrderToMediator } from "../../services/executive/order";
import "../../styles/ordersTable.css";

export default function PendingOrderCard({ order, mediators, status }) {
    const navigate = useNavigate();
    const [showAssign, setShowAssign] = useState(false);
    const [selectedMediator, setSelectedMediator] = useState("");
    const [assignQuantity, setAssignQuantity] = useState("");
    const [assigning, setAssigning] = useState(false);

    const handleAssign = async () => {
        try {
            const quantity = Number(assignQuantity);
            if (!selectedMediator) {
                alert("Please select a mediator");
                return;
            }
            if (!quantity || quantity < 1 || quantity > order.summary.unassigned) {
                alert("Please enter a valid quantity");
                return;
            }
            setAssigning(true);
            await AssignOrderToMediator(order._id, {
                mediatorId: selectedMediator,
                quantity: quantity,
            });
            alert("Order units successfully assigned! Moved to Pending Payment for payment proof upload.");
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.message || "Failed to assign order");
        } finally {
            setAssigning(false);
        }
    };

    return (
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
                    {order.summary.unassigned} Left
                </span>
            </td>
            <td>{order.teamCode}</td>
            <td>
                <div className="action-btn-group">
                    <button
                        type="button"
                        className="table-btn table-btn-outline"
                        onClick={() => navigate(`/order/${order._id}`)}
                    >
                        View Details
                    </button>
                    <button
                        type="button"
                        className="table-btn table-btn-primary"
                        onClick={() => setShowAssign(!showAssign)}
                    >
                        {showAssign ? "Close Assign" : "Assign Mediator"}
                    </button>
                </div>

                {showAssign && (
                    <div className="inline-assign-box">
                        <select
                            className="inline-assign-select"
                            value={selectedMediator}
                            onChange={(e) => setSelectedMediator(e.target.value)}
                        >
                            <option value="">Choose Mediator</option>
                            {mediators.map((mediator) => (
                                <option key={mediator._id} value={mediator._id}>
                                    {mediator.name} ({mediator.mediatorCode})
                                </option>
                            ))}
                        </select>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <input
                                type="number"
                                className="inline-assign-input"
                                min={1}
                                max={order.summary.unassigned}
                                placeholder="Units to assign"
                                value={assignQuantity}
                                onChange={(e) => setAssignQuantity(Number(e.target.value))}
                            />
                            <span style={{ fontSize: "11px", color: "var(--slate-500)", whiteSpace: "nowrap" }}>
                                / {order.summary.unassigned}
                            </span>
                        </div>

                        <button
                            type="button"
                            className="table-btn table-btn-success"
                            disabled={
                                assigning ||
                                !selectedMediator ||
                                assignQuantity < 1 ||
                                assignQuantity > order.summary.unassigned
                            }
                            onClick={handleAssign}
                        >
                            {assigning ? "Assigning..." : "Confirm Assignment"}
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
}