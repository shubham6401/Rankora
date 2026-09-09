import { useEffect, useState } from "react";
import { FetchAllRefund_PendingOrders } from "../../services/mediator/orders";
import { useNavigate } from "react-router-dom";
import PipelineStepper from "../../component/layout/PipelineStepper";
import "../../styles/ordersTable.css";

export default function MediatorRefundPendingOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        handleFetchAllRefund_PendingOrders();
    }, []);

    const handleFetchAllRefund_PendingOrders = async () => {
        try {
            setLoading(true);
            const response = await FetchAllRefund_PendingOrders();
            setOrders(response.data.orders || []);
        } catch (err) {
            console.error("Failed to fetch refund pending orders:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="table-page-container">
                <div className="empty-state-card">
                    <div className="empty-state-icon">⏳</div>
                    <h2 className="empty-state-title">Loading Refund-Pending Orders...</h2>
                    <p className="empty-state-text">Fetching orders placed and awaiting post-delivery refund submission.</p>
                </div>
            </div>
        );
    }

    const totalUnits = orders.reduce((acc, order) => {
        const units = (order.orderUnits || []).filter((u) => u.status === "pending_refund");
        return acc + (units.length || 1);
    }, 0);

    return (
        <div className="table-page-container">
            {/* Visual Pipeline Stepper */}
            <PipelineStepper role="mediator" />

            {/* TOP HEADER */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge" style={{ background: "#faf5ff", color: "#7c3aed", borderColor: "#e9d8fd" }}>
                        Stage 3 of Mediator Pipeline
                    </span>
                    <h1 className="table-page-title">
                        📦 Stage 3: Orders with Refund Pending
                    </h1>
                    <p className="table-page-subtitle">
                        Placed orders awaiting delivery and review proof submissions for refund reimbursement.
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
                    <span className="metric-label">Pending Refund Orders</span>
                    <span className="metric-value metric-value-purple">{orders.length}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Total Units Awaiting Proof</span>
                    <span className="metric-value">{totalUnits} Units</span>
                </div>
            </div>

            {/* DATA TABLE */}
            {orders.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">📬</div>
                    <h2 className="empty-state-title">No Orders with Pending Refund</h2>
                    <p className="empty-state-text">
                        Orders submitted with placement details will appear here once placed, awaiting your review and delivery screenshots.
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
                                    <th>Units Left</th>
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
                                    const pendingRefundUnits = (order.orderUnits || []).filter(
                                        (u) => u.status === "pending_refund"
                                    );
                                    const count = pendingRefundUnits.length;
                                    const primaryUnit = pendingRefundUnits[0] || {};
                                    const hasRevision = pendingRefundUnits.some((u) => !!u.verificationRejectionReason);
                                    const revisionUnit = pendingRefundUnits.find((u) => !!u.verificationRejectionReason) || primaryUnit;
                                    const orderIdDisplay = primaryUnit.orderId || order.orderId || "Submitted";
                                    const reviewerDisplay = primaryUnit.reviewerName || order.reviewerName || "N/A";

                                    return (
                                        <tr key={order._id} className={hasRevision ? "row-revision-alert" : ""}>
                                            <td className="product-name-cell">
                                                <div style={{ fontWeight: 600 }}>{order.productName}</div>
                                                {hasRevision && revisionUnit.verificationRejectionReason && (
                                                    <div className="revision-feedback-callout" style={{ marginTop: "6px", maxWidth: "340px" }}>
                                                        <div className="callout-header">
                                                            <span>⚠️ Executive Feedback</span>
                                                        </div>
                                                        <div className="callout-message">
                                                            "{revisionUnit.verificationRejectionReason}"
                                                        </div>
                                                        <div className="callout-action-hint">
                                                            Click Fix Proofs to re-upload the requested screenshots.
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td>{order.brand}</td>
                                            <td>{order.orderPlatform}</td>
                                            <td className="price-pill">₹{order.price}</td>
                                            <td>
                                                <span className="qty-pill qty-pill-warning">
                                                    {count} {count === 1 ? "Unit Left" : "Units Left"}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 700, color: "var(--primary-600)" }}>
                                                {orderIdDisplay}
                                            </td>
                                            <td>{reviewerDisplay}</td>
                                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                                                    <span className="status-badge status-badge-pending_refund">
                                                        ● Pending Refund
                                                    </span>
                                                    {hasRevision && (
                                                        <span className="status-badge-revision">
                                                            ⚠️ Revision Needed
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{order.teamCode || "N/A"}</td>
                                            <td style={{ textAlign: "center" }}>
                                                <div className="action-btn-group" style={{ justifyContent: "center", flexWrap: "wrap", gap: "6px" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/mediator-refund-submission/${revisionUnit?._id || primaryUnit?._id || order._id}`)}
                                                        className={hasRevision ? "table-btn table-btn-danger" : "table-btn table-btn-primary"}
                                                        style={hasRevision ? { fontWeight: 700 } : { background: "#7c3aed" }}
                                                        title={hasRevision ? "Executive requested revision on proofs. Click to fix." : (count > 1 ? `Submit delivery review proof (${count} units remaining)` : "Submit delivery review proof")}
                                                    >
                                                        {hasRevision ? "Fix Proofs ⚠️" : "Submit Delivery Proof"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/order/${order._id}`)}
                                                        className="table-btn table-btn-outline"
                                                    >
                                                        Details
                                                    </button>
                                                </div>
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