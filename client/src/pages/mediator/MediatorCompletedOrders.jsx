import { useEffect, useState } from "react";
import { FetchAllCompletedOrders } from "../../services/mediator/orders";
import { useNavigate } from "react-router-dom";
import PipelineStepper from "../../component/layout/PipelineStepper";
import "../../styles/ordersTable.css";

export default function MediatorCompletedOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        handleFetchAllCompletedOrders();
    }, []);

    const handleFetchAllCompletedOrders = async () => {
        try {
            setLoading(true);
            const response = await FetchAllCompletedOrders();
            setOrders(response.data.orders || []);
        } catch (err) {
            console.error("Failed to fetch completed orders:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="table-page-container">
                <div className="empty-state-card">
                    <div className="empty-state-icon">⏳</div>
                    <h2 className="empty-state-title">Loading Completed Orders...</h2>
                    <p className="empty-state-text">Fetching orders that have completed their entire lifecycle.</p>
                </div>
            </div>
        );
    }

    const totalCompletedUnits = orders.reduce((acc, order) => {
        const units = (order.orderUnits || []).filter((u) => u.status === "completed");
        return acc + (units.length || 1);
    }, 0);

    return (
        <div className="table-page-container">
            {/* Visual Pipeline Stepper */}
            <PipelineStepper role="mediator" />

            {/* TOP HEADER */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge" style={{ background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0" }}>
                        Stage 5 of Mediator Pipeline
                    </span>
                    <h1 className="table-page-title">
                        ✅ Stage 5: Completed Orders Archive
                    </h1>
                    <p className="table-page-subtitle">
                        Archived orders where order placement and refund post-delivery details were successfully fulfilled.
                    </p>
                </div>
                <div className="table-header-actions">
                    <button
                        onClick={() => navigate("/panel-mediator")}
                        className="nav-btn nav-btn-default"
                    >
                        ← Dashboard
                    </button>
                    <button
                        onClick={() => navigate("/mediator-pending-orders")}
                        className="nav-btn nav-btn-primary"
                    >
                        In-Progress Orders →
                    </button>
                </div>
            </div>

            {/* METRICS */}
            <div className="table-metrics-bar">
                <div className="metric-card">
                    <span className="metric-label">Completed Orders</span>
                    <span className="metric-value metric-value-emerald">{orders.length}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Fulfilled Units</span>
                    <span className="metric-value">{totalCompletedUnits} Units</span>
                </div>
            </div>

            {/* DATA TABLE */}
            {orders.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">🎉</div>
                    <h2 className="empty-state-title">No Completed Orders Yet</h2>
                    <p className="empty-state-text">
                        Orders that have finished their full cycle including review submission will show here.
                    </p>
                    <button
                        onClick={() => navigate("/mediator-pending-orders")}
                        className="table-btn table-btn-primary"
                    >
                        View In-Progress Orders
                    </button>
                </div>
            ) : (
                <div className="data-table-container">
                    <div className="data-table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Brand</th>
                                    <th>Platform</th>
                                    <th>Price</th>
                                    <th>Order ID</th>
                                    <th>Reviewer</th>
                                    <th>Created On</th>
                                    <th>Status</th>
                                    <th>Team Code</th>
                                    <th style={{ textAlign: "center" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => {
                                    const completedUnits = (order.orderUnits || []).filter(
                                        (u) => u.status === "completed"
                                    );
                                    const primaryUnit = completedUnits[0] || {};
                                    const orderIdDisplay = primaryUnit.orderId || order.orderId || "Completed";
                                    const reviewerDisplay = primaryUnit.reviewerName || order.reviewerName || "N/A";

                                    return (
                                        <tr key={order._id}>
                                            <td className="product-name-cell">
                                                {order.productName}
                                            </td>
                                            <td>{order.brand}</td>
                                            <td>{order.orderPlatform}</td>
                                            <td className="price-pill">₹{order.price}</td>
                                            <td style={{ fontWeight: 700, color: "var(--primary-600)" }}>
                                                {orderIdDisplay}
                                            </td>
                                            <td>{reviewerDisplay}</td>
                                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <span className="status-badge status-badge-completed">
                                                    ● Completed
                                                </span>
                                            </td>
                                            <td>{order.teamCode || "N/A"}</td>
                                            <td style={{ textAlign: "center" }}>
                                                {order.productLink ? (
                                                    <a
                                                        href={order.productLink.startsWith("http") ? order.productLink : `https://${order.productLink}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="table-btn table-btn-outline"
                                                        title="Open product link in new tab"
                                                    >
                                                        🛍️ View Product ↗
                                                    </a>
                                                ) : (
                                                    <span style={{ fontSize: "11px", color: "var(--slate-400)", fontStyle: "italic" }}>No link</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}