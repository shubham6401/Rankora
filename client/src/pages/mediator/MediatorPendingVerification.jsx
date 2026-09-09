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
                <div className="table-card">
                    <div className="table-wrapper">
                        <table className="orders-table">
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

                                            {/* Submitted Proofs Thumbnails */}
                                            <td>
                                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                                                    {postDetails.productReviewScreenshot ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedProof({ title: "Review Screenshot", url: postDetails.productReviewScreenshot })}
                                                            style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "6px", border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4338ca", cursor: "pointer", fontWeight: 600 }}
                                                        >
                                                            ⭐ Review SS
                                                        </button>
                                                    ) : null}
                                                    {postDetails.invoiceScreenshot ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedProof({ title: "Invoice Screenshot", url: postDetails.invoiceScreenshot })}
                                                            style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "6px", border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", cursor: "pointer", fontWeight: 600 }}
                                                        >
                                                            🧾 Invoice SS
                                                        </button>
                                                    ) : null}
                                                    {postDetails.sellerFeedbackScreenShot ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedProof({ title: "Seller Feedback", url: postDetails.sellerFeedbackScreenShot })}
                                                            style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#334155", cursor: "pointer", fontWeight: 600 }}
                                                        >
                                                            💬 Feedback SS
                                                        </button>
                                                    ) : null}
                                                    {!postDetails.productReviewScreenshot && !postDetails.invoiceScreenshot && !postDetails.sellerFeedbackScreenShot && (
                                                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>Proofs Submitted</span>
                                                    )}
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
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.75)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "16px",
                    }}
                    onClick={() => setSelectedProof(null)}
                >
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "12px",
                            maxWidth: "680px",
                            width: "100%",
                            maxHeight: "90vh",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                padding: "14px 18px",
                                borderBottom: "1px solid #e2e8f0",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                                {selectedProof.title}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setSelectedProof(null)}
                                style={{
                                    border: "none",
                                    background: "#f1f5f9",
                                    borderRadius: "6px",
                                    padding: "4px 8px",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    color: "#475569",
                                }}
                            >
                                ✕ Close
                            </button>
                        </div>
                        <div
                            style={{
                                padding: "16px",
                                overflowY: "auto",
                                textAlign: "center",
                                backgroundColor: "#0b132b",
                            }}
                        >
                            <img
                                src={selectedProof.url}
                                alt={selectedProof.title}
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "75vh",
                                    objectFit: "contain",
                                    borderRadius: "6px",
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
