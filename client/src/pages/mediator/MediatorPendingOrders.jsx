import { useEffect, useState } from "react";
import { FetchAllPendingOrders } from "../../services/mediator/orders";
import { useNavigate } from "react-router-dom";
import PipelineStepper from "../../component/layout/PipelineStepper";
import "../../styles/ordersTable.css";

export default function MediatorPendingOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        handleFetchAllPendingOrders();
    }, []);

    const handleFetchAllPendingOrders = async () => {
        try {
            setLoading(true);
            const response = await FetchAllPendingOrders();
            setOrders(response.data.orders || []);
        } catch (err) {
            console.error("Failed to fetch pending orders:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="table-page-container">
                <div className="empty-state-card">
                    <div className="empty-state-icon">⏳</div>
                    <h2 className="empty-state-title">Loading In-Progress Orders...</h2>
                    <p className="empty-state-text">Fetching orders currently active and accepted by you.</p>
                </div>
            </div>
        );
    }

    const totalActiveUnits = orders.reduce((acc, order) => {
        const inProgress = (order.orderUnits || []).filter((u) => u.status === "in_progress");
        return acc + (inProgress.length || 1);
    }, 0);

    return (
        <div className="table-page-container">
            {/* Visual Pipeline Stepper */}
            <PipelineStepper role="mediator" />

            {/* TOP HEADER */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge">Stage 2 of Mediator Pipeline</span>
                    <h1 className="table-page-title">
                        ⚡ Stage 2: In-Progress Orders
                    </h1>
                    <p className="table-page-subtitle">
                        Active orders you have accepted. Review product specs, place orders on platforms, and submit order placement proofs.
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
                        onClick={() => navigate("/mediator-neworders")}
                        className="nav-btn nav-btn-primary"
                    >
                        + View New Offers
                    </button>
                </div>
            </div>

            {/* METRICS */}
            <div className="table-metrics-bar">
                <div className="metric-card">
                    <span className="metric-label">Active Orders</span>
                    <span className="metric-value metric-value-primary">{orders.length}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Units in Progress</span>
                    <span className="metric-value metric-value-amber">{totalActiveUnits} Units</span>
                </div>
            </div>

            {/* DATA TABLE */}
            {orders.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">📦</div>
                    <h2 className="empty-state-title">No In-Progress Orders Found</h2>
                    <p className="empty-state-text">
                        Accept new orders from the New Assigned Orders panel to start placing and managing them here.
                    </p>
                    <button
                        onClick={() => navigate("/mediator-neworders")}
                        className="table-btn table-btn-primary"
                    >
                        Check New Orders
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
                                    <th>Executive</th>
                                    <th>Created On</th>
                                    <th>Status</th>
                                    <th>Units Left</th>
                                    <th>Team Code</th>
                                    <th style={{ textAlign: "center" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => {
                                    const inProgressUnits = (order.orderUnits || []).filter(
                                        (u) => u.status === "in_progress"
                                    );
                                    const count = inProgressUnits.length;
                                    const hasRevision = inProgressUnits.some((u) => !!u.verificationRejectionReason);
                                    const revisionUnit = inProgressUnits.find((u) => !!u.verificationRejectionReason) || inProgressUnits[0];

                                    return (
                                        <tr key={order._id} className={hasRevision ? "row-revision-alert" : ""}>
                                            <td className="product-name-cell">
                                                <div style={{ fontWeight: 600 }}>{order.productName}</div>
                                                {hasRevision && revisionUnit?.verificationRejectionReason && (
                                                    <div className="revision-feedback-callout" style={{ marginTop: "6px", maxWidth: "340px" }}>
                                                        <div className="callout-header">
                                                            <span>⚠️ Returned by Executive</span>
                                                        </div>
                                                        <div className="callout-message">
                                                            "{revisionUnit.verificationRejectionReason}"
                                                        </div>
                                                        <div className="callout-action-hint">
                                                            Executive returned this delivery to In Progress. Please fix order placement details.
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td>{order.brand}</td>
                                            <td>{order.orderPlatform}</td>
                                            <td className="price-pill">₹{order.price}</td>
                                            <td>{order.executiveName || "Executive"}</td>
                                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                                                    <span className="status-badge status-badge-in_progress">
                                                        ● In Progress
                                                    </span>
                                                    {hasRevision && (
                                                        <span className="status-badge-revision">
                                                            ⚠️ Revision: Returned
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="qty-pill qty-pill-warning">
                                                    {count} {count === 1 ? "Unit Left" : "Units Left"}
                                                </span>
                                            </td>
                                            <td>{order.teamCode || "N/A"}</td>
                                            <td style={{ textAlign: "center" }}>
                                                <div className="action-btn-group" style={{ justifyContent: "center", flexWrap: "wrap", gap: "6px" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/mediator-order-submission/${revisionUnit?._id || inProgressUnits[0]?._id || order._id}`)}
                                                        className={hasRevision ? "table-btn table-btn-danger" : "table-btn table-btn-primary"}
                                                        style={hasRevision ? { fontWeight: 700 } : {}}
                                                        title={hasRevision ? "Executive requested revision. Click to fix order placement details." : (count > 1 ? `Submit details for next unit (${count} units remaining)` : "Submit placement details")}
                                                    >
                                                        {hasRevision ? "Fix Details ⚠️" : "Submit Details"}
                                                    </button>
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