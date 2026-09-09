import { useEffect, useState } from "react";
import { FetchAllPendingVerificationOrders } from "../../services/mediator/orders";
import { useNavigate } from "react-router-dom";
import PipelineStepper from "../../component/layout/PipelineStepper";
import "../../styles/ordersTable.css";

export default function MediatorPendingVerification() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProof, setSelectedProof] = useState(null);

    useEffect(() => {
        loadPendingVerificationOrders();
    }, []);

    const loadPendingVerificationOrders = async () => {
        try {
            setLoading(true);
            const response = await FetchAllPendingVerificationOrders();
            setOrders(response.data?.orders || []);
        } catch (err) {
            console.error("Failed to fetch pending verification orders:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="table-page-container">
                <div className="empty-state-card">
                    <div className="empty-state-icon">⏳</div>
                    <h2 className="empty-state-title">Loading Verification Queue...</h2>
                    <p className="empty-state-text">Fetching orders submitted and awaiting executive verification.</p>
                </div>
            </div>
        );
    }

    const totalUnits = orders.reduce((acc, order) => {
        const units = (order.orderUnits || []).filter((u) => u.status === "pending_verification");
        return acc + (units.length || 1);
    }, 0);

    const totalValue = orders.reduce((acc, order) => {
        const units = (order.orderUnits || []).filter((u) => u.status === "pending_verification");
        const price = parseFloat(order.price) || 0;
        return acc + (price * (units.length || 1));
    }, 0);

    return (
        <div className="table-page-container">
            {/* Visual Pipeline Stepper */}
            <PipelineStepper role="mediator" />

            {/* TOP HEADER */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge" style={{ background: "#eef2ff", color: "#4338ca", borderColor: "#c7d2fe" }}>
                        Stage 4 of Mediator Pipeline
                    </span>
                    <h1 className="table-page-title">
                        ⏳ Stage 4: Pending Executive Verification
                    </h1>
                    <p className="table-page-subtitle">
                        Your review proofs, invoices, and seller feedback submissions are under verification by the Executive team. Once approved, units transition to Completed.
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
                        onClick={() => navigate("/mediator-refund_pending-orders")}
                        className="nav-btn nav-btn-default"
                    >
                        Pending Refund →
                    </button>
                    <button
                        onClick={() => navigate("/mediator-completed-orders")}
                        className="nav-btn nav-btn-primary"
                    >
                        Completed Orders →
                    </button>
                </div>
            </div>

            {/* METRICS */}
            <div className="table-metrics-bar">
                <div className="metric-card">
                    <span className="metric-label">Orders in Verification</span>
                    <span className="metric-value" style={{ color: "#4f46e5" }}>{orders.length}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Total Units Awaiting Approval</span>
                    <span className="metric-value">{totalUnits} Units</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Pending Order Value</span>
                    <span className="metric-value metric-value-green">₹{totalValue.toLocaleString()}</span>
                </div>
            </div>

            {/* DATA TABLE */}
            {orders.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">📋</div>
                    <h2 className="empty-state-title">No Orders Awaiting Verification</h2>
                    <p className="empty-state-text">
                        When you submit review screenshots and invoices for delivered items in Stage 3, they will appear here while being reviewed by the Executive.
                    </p>
                    <button
                        onClick={() => navigate("/mediator-refund_pending-orders")}
                        className="nav-btn nav-btn-primary"
                        style={{ marginTop: "14px" }}
                    >
                        View Pending Refund Orders →
                    </button>
                </div>
            ) : (
                <div className="data-table-container">
                    <div className="data-table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Order Info</th>
                                    <th>Product Details</th>
                                    <th>Platform</th>
                                    <th>Units / Price</th>
                                    <th>Submitted Proofs</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => {
                                    const pendingUnits = (order.orderUnits || []).filter(
                                        (u) => u.status === "pending_verification"
                                    );
                                    const unitCount = pendingUnits.length || 1;
                                    const firstUnit = pendingUnits[0] || {};
                                    const postDetails = firstUnit.postDeliveryDetails || {};

                                    return (
                                        <tr key={order._id}>
                                            {/* Order Info */}
                                            <td>
                                                <div className="order-id-cell">
                                                    <span className="order-id-text">
                                                        #{order._id.substring(0, 8)}...
                                                    </span>
                                                    <span className="order-date-text">
                                                        {firstUnit.submittedForVerificationAt
                                                            ? `Submitted ${new Date(firstUnit.submittedForVerificationAt).toLocaleDateString()}`
                                                            : new Date(order.createdAt).toLocaleDateString()}
                                                    </span>
                                                    {firstUnit.reviewerName && (
                                                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                                                            Reviewer: <b>{firstUnit.reviewerName}</b>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Product Details */}
                                            <td>
                                                <div className="product-info-cell">
                                                    <a
                                                        href={order.productLink}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="product-name-link"
                                                        title="Open product link"
                                                    >
                                                        {order.productName} ↗
                                                    </a>
                                                    <div className="product-meta">
                                                        <span className="brand-tag">{order.brand}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Platform */}
                                            <td>
                                                <span className="platform-badge">
                                                    {order.orderPlatform || "Amazon"}
                                                </span>
                                            </td>

                                            {/* Units / Price */}
                                            <td>
                                                <div className="units-cell">
                                                    <span className="units-count">
                                                        {unitCount} {unitCount === 1 ? "Unit" : "Units"}
                                                    </span>
                                                    <span className="unit-price">
                                                        ₹{order.price} each
                                                    </span>
                                                    <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700 }}>
                                                        Total: ₹{(parseFloat(order.price || 0) * unitCount).toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Submitted Proofs Thumbnails (Decluttered & Visual) */}
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                    {pendingUnits.map((u, uIdx) => (
                                                        <div key={u._id || uIdx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                            {pendingUnits.length > 1 && (
                                                                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--slate-600)" }}>
                                                                    Unit #{uIdx + 1} {u.reviewerName ? `(${u.reviewerName})` : ""}:
                                                                </span>
                                                            )}
                                                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                                                                {u.orderedScreenshot && (
                                                                    <div
                                                                        onClick={() => setSelectedProof({ title: "Ordered Screenshot (Order Placement)", url: u.orderedScreenshot })}
                                                                        style={{
                                                                            display: "inline-flex",
                                                                            alignItems: "center",
                                                                            gap: "6px",
                                                                            background: "#ffffff",
                                                                            border: "1px solid var(--slate-300)",
                                                                            padding: "3px 8px 3px 4px",
                                                                            borderRadius: "6px",
                                                                            cursor: "pointer",
                                                                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                                                            transition: "transform 0.15s ease",
                                                                        }}
                                                                        title="Click to zoom Ordered SS"
                                                                    >
                                                                        <img
                                                                            src={u.orderedScreenshot}
                                                                            alt="Ordered SS"
                                                                            style={{ width: "24px", height: "24px", objectFit: "cover", borderRadius: "4px" }}
                                                                        />
                                                                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--slate-800)" }}>
                                                                            🛒 Ordered SS
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {u.postDeliveryDetails?.productReviewScreenshot && (
                                                                    <div
                                                                        onClick={() => setSelectedProof({ title: "Product Review Screenshot", url: u.postDeliveryDetails.productReviewScreenshot })}
                                                                        style={{
                                                                            display: "inline-flex",
                                                                            alignItems: "center",
                                                                            gap: "6px",
                                                                            background: "#eef2ff",
                                                                            border: "1px solid #c7d2fe",
                                                                            padding: "3px 8px 3px 4px",
                                                                            borderRadius: "6px",
                                                                            cursor: "pointer",
                                                                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                                                            transition: "transform 0.15s ease",
                                                                        }}
                                                                        title="Click to zoom Review SS"
                                                                    >
                                                                        <img
                                                                            src={u.postDeliveryDetails.productReviewScreenshot}
                                                                            alt="Review SS"
                                                                            style={{ width: "24px", height: "24px", objectFit: "cover", borderRadius: "4px" }}
                                                                        />
                                                                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#4338ca" }}>
                                                                            ⭐ Review SS
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {u.postDeliveryDetails?.invoiceScreenshot && (
                                                                    <div
                                                                        onClick={() => setSelectedProof({ title: "Invoice Screenshot", url: u.postDeliveryDetails.invoiceScreenshot })}
                                                                        style={{
                                                                            display: "inline-flex",
                                                                            alignItems: "center",
                                                                            gap: "6px",
                                                                            background: "#eff6ff",
                                                                            border: "1px solid #bfdbfe",
                                                                            padding: "3px 8px 3px 4px",
                                                                            borderRadius: "6px",
                                                                            cursor: "pointer",
                                                                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                                                            transition: "transform 0.15s ease",
                                                                        }}
                                                                        title="Click to zoom Invoice SS"
                                                                    >
                                                                        <img
                                                                            src={u.postDeliveryDetails.invoiceScreenshot}
                                                                            alt="Invoice SS"
                                                                            style={{ width: "24px", height: "24px", objectFit: "cover", borderRadius: "4px" }}
                                                                        />
                                                                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#1d4ed8" }}>
                                                                            🧾 Invoice
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {u.postDeliveryDetails?.sellerFeedbackScreenShot && (
                                                                    <div
                                                                        onClick={() => setSelectedProof({ title: "Seller Feedback Screenshot", url: u.postDeliveryDetails.sellerFeedbackScreenShot })}
                                                                        style={{
                                                                            display: "inline-flex",
                                                                            alignItems: "center",
                                                                            gap: "6px",
                                                                            background: "#f8fafc",
                                                                            border: "1px solid #e2e8f0",
                                                                            padding: "3px 8px 3px 4px",
                                                                            borderRadius: "6px",
                                                                            cursor: "pointer",
                                                                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                                                            transition: "transform 0.15s ease",
                                                                        }}
                                                                        title="Click to zoom Feedback SS"
                                                                    >
                                                                        <img
                                                                            src={u.postDeliveryDetails.sellerFeedbackScreenShot}
                                                                            alt="Feedback SS"
                                                                            style={{ width: "24px", height: "24px", objectFit: "cover", borderRadius: "4px" }}
                                                                        />
                                                                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--slate-700)" }}>
                                                                            💬 Feedback
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {!u.orderedScreenshot && !u.postDeliveryDetails?.productReviewScreenshot && !u.postDeliveryDetails?.invoiceScreenshot && !u.postDeliveryDetails?.sellerFeedbackScreenShot && (
                                                                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Proofs Submitted</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td>
                                                <span className="status-badge status-badge-pending_verification">
                                                    ● Pending Verification
                                                </span>
                                            </td>

                                            {/* Action */}
                                            <td>
                                                <div className="action-btn-group">
                                                    <button
                                                        onClick={() => navigate(`/order/${order._id}`)}
                                                        className="table-btn table-btn-detail"
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

            {/* PROOF PREVIEW MODAL */}
            {selectedProof && (
                <div
                    onClick={() => setSelectedProof(null)}
                    className="image-modal-overlay"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="image-modal-content"
                        style={{ maxWidth: "680px" }}
                    >
                        <div className="image-modal-header">
                            <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--slate-700)" }}>
                                {selectedProof.title}
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedProof(null)}
                                className="image-modal-close-btn"
                            >
                                Close ✕
                            </button>
                        </div>
                        <img
                            src={selectedProof.url}
                            alt={selectedProof.title}
                            className="image-modal-img"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
