import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    fetchMediatorPendingPaymentOrders,
    submitMediatorPaymentProof,
} from "../../services/mediator/orders";
import PipelineStepper from "../../component/layout/PipelineStepper";
import "../../styles/ordersTable.css";

export default function MediatorPendingPayment() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submittingOrderId, setSubmittingOrderId] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState({}); // { [orderId]: File }
    const [previewUrls, setPreviewUrls] = useState({}); // { [orderId]: string }
    const [messages, setMessages] = useState({}); // { [orderId]: string }
    const [modalImage, setModalImage] = useState(null);

    useEffect(() => {
        loadPendingPayments();
    }, []);

    const loadPendingPayments = async () => {
        try {
            setLoading(true);
            const res = await fetchMediatorPendingPaymentOrders();
            setOrders(res.data.orders || []);
        } catch (err) {
            console.error("Error fetching pending payment orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (orderId, e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFiles((prev) => ({ ...prev, [orderId]: file }));
        const preview = URL.createObjectURL(file);
        setPreviewUrls((prev) => ({ ...prev, [orderId]: preview }));
    };

    const handleClearFile = (orderId) => {
        setSelectedFiles((prev) => {
            const next = { ...prev };
            delete next[orderId];
            return next;
        });
        setPreviewUrls((prev) => {
            const next = { ...prev };
            if (next[orderId]) URL.revokeObjectURL(next[orderId]);
            delete next[orderId];
            return next;
        });
    };

    const handleSubmitPayment = async (orderId, totalAmount) => {
        const file = selectedFiles[orderId];
        if (!file) {
            alert("Please attach your refund payment screenshot proof first.");
            return;
        }

        const message = messages[orderId] || "";
        const confirmMsg = `Send refund payment proof of ₹${totalAmount.toLocaleString()} to Executive?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            setSubmittingOrderId(orderId);
            const formData = new FormData();
            formData.append("mediatorPaymentScreenshot", file);
            formData.append("message", message);

            const res = await submitMediatorPaymentProof(orderId, formData);
            alert(res.data.message || "Payment proof successfully submitted and sent to executive!");
            handleClearFile(orderId);
            await loadPendingPayments();
        } catch (err) {
            console.error("Error submitting payment proof:", err);
            alert(err?.response?.data?.message || "Failed to submit payment proof");
        } finally {
            setSubmittingOrderId(null);
        }
    };

    if (loading) {
        return (
            <div className="table-page-container">
                <div className="empty-state-card">
                    <div className="empty-state-icon">⏳</div>
                    <h2 className="empty-state-title">Loading Pending Payment Orders...</h2>
                    <p className="empty-state-text">Fetching rejected orders awaiting refund payment submission.</p>
                </div>
            </div>
        );
    }

    const totalOverallRefund = orders.reduce((sum, order) => {
        const units = order.orderUnits || [];
        const price = Number(order.price) || 0;
        return sum + price * units.length;
    }, 0);

    const totalUnitsCount = orders.reduce((sum, order) => sum + (order.orderUnits?.length || 0), 0);

    return (
        <div className="table-page-container">
            {/* Visual Pipeline Stepper */}
            <PipelineStepper role="mediator" />

            {/* TOP HEADER */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge" style={{ background: "#fff1f2", color: "#e11d48", borderColor: "#fecdd3" }}>
                        Stage 5 of Mediator Pipeline
                    </span>
                    <h1 className="table-page-title">
                        💳 Stage 5: Payment Pending (Refunds to Executive)
                    </h1>
                    <p className="table-page-subtitle">
                        Units where you rejected offers and need to upload refund payment proof to the executive.
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
                        onClick={() => navigate("/mediator-new-orders")}
                        className="nav-btn nav-btn-primary"
                    >
                        New Assigned Orders
                    </button>
                </div>
            </div>

            {/* SUMMARY STATS BAR */}
            <div className="table-metrics-bar">
                <div className="metric-card">
                    <span className="metric-label">Orders Requiring Refund</span>
                    <span className="metric-value metric-value-amber">{orders.length} Orders</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Total Units Rejected</span>
                    <span className="metric-value">{totalUnitsCount} Units</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Total Refund Due</span>
                    <span className="metric-value metric-value-rose">₹{totalOverallRefund.toLocaleString()}</span>
                </div>
            </div>

            {/* EMPTY STATE */}
            {orders.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">✅</div>
                    <h2 className="empty-state-title">No Pending Payments</h2>
                    <p className="empty-state-text">
                        You have no rejected orders awaiting refund payment proof submission.
                    </p>
                    <button
                        onClick={() => navigate("/mediator-new-orders")}
                        className="table-btn table-btn-primary"
                    >
                        View New Assigned Orders
                    </button>
                </div>
            ) : (
                /* LIST OF ORDERS REQUIRING REFUND */
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {orders.map((order) => {
                        const units = order.orderUnits || [];
                        const unitCount = units.length;
                        const priceNum = Number(order.price) || 0;
                        const totalOrderRefund = priceNum * unitCount;
                        const isSubmitting = submittingOrderId === order._id;
                        const preview = previewUrls[order._id];
                        const alreadySubmittedProof = units.find((u) => u.mediatorPaymentScreenshot)?.mediatorPaymentScreenshot;
                        const alreadySubmittedMessage = units.find((u) => u.mediatorMessage)?.mediatorMessage;
                        const alreadySubmittedDate = units.find((u) => u.mediatorPaymentSentAt)?.mediatorPaymentSentAt;

                        return (
                            <div key={order._id} className="group-card">
                                {/* HEADER */}
                                <div className="group-card-header">
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                                            <h2 className="group-title">{order.productName}</h2>
                                            <span className="status-badge status-badge-pending">
                                                Brand: {order.brand}
                                            </span>
                                            <span className="status-badge status-badge-rejected">
                                                {unitCount} {unitCount === 1 ? "Unit Rejected" : "Units Rejected"}
                                            </span>
                                        </div>
                                        <div className="group-meta">
                                            <span>Executive: <b>{order.executiveName || order.createdBy?.name || "Executive"}</b></span>
                                            <span>Platform: <b>{order.orderPlatform}</b></span>
                                            <span>Team Code: <b>{order.teamCode || "N/A"}</b></span>
                                        </div>
                                    </div>

                                    {/* TOTAL AMOUNT TO REFUND */}
                                    <div className="group-summary-stats">
                                        <div className="metric-label" style={{ color: "#e11d48" }}>
                                            Total Refund Due
                                        </div>
                                        <div className="group-total-amount" style={{ color: "#be123c" }}>
                                            ₹{totalOrderRefund.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* BODY */}
                                <div>
                                    {/* IF ALREADY SUBMITTED PROOF */}
                                    {alreadySubmittedProof ? (
                                        <div className="proof-upload-box" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
                                                <div>
                                                    <div style={{ color: "#166534", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <span>✓</span> Payment Proof Sent to Executive
                                                    </div>
                                                    <div style={{ color: "var(--slate-600)", fontSize: "13px", marginTop: "4px" }}>
                                                        Submitted on: {new Date(alreadySubmittedDate).toLocaleString()}
                                                    </div>
                                                    {alreadySubmittedMessage && (
                                                        <div style={{ color: "var(--slate-800)", fontSize: "13px", marginTop: "6px", background: "#ffffff", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--slate-200)" }}>
                                                            <b>Your Message:</b> {alreadySubmittedMessage}
                                                        </div>
                                                    )}
                                                    <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "6px" }}>
                                                        Waiting for the executive to verify and click accept. Once accepted, this order will be cleared and sent back to Executive Pending Orders.
                                                    </div>
                                                </div>

                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <img
                                                        src={alreadySubmittedProof}
                                                        alt="Refund Payment SS"
                                                        onClick={() => setModalImage(alreadySubmittedProof)}
                                                        className="proof-thumb"
                                                        style={{ width: "54px", height: "54px" }}
                                                        title="Click to zoom proof"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setModalImage(alreadySubmittedProof)}
                                                        className="table-btn table-btn-outline"
                                                    >
                                                        🔍 View Proof
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* UPLOAD PAYMENT SS & MESSAGE FORM */
                                        <div className="proof-upload-box">
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                                                {/* Left: Upload screenshot */}
                                                <div>
                                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--slate-800)", marginBottom: "6px" }}>
                                                        📸 Upload Refund Payment Screenshot (SS): <span style={{ color: "var(--rose-500)" }}>*</span>
                                                    </label>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileChange(order._id, e)}
                                                        disabled={isSubmitting}
                                                        className="proof-note-input"
                                                        style={{ padding: "6px", width: "100%" }}
                                                    />

                                                    {preview && (
                                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                                                            <img
                                                                src={preview}
                                                                alt="Selected Preview"
                                                                onClick={() => setModalImage(preview)}
                                                                className="proof-thumb"
                                                                style={{ width: "54px", height: "54px" }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleClearFile(order._id)}
                                                                className="table-btn table-btn-danger"
                                                            >
                                                                Remove ✕
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right: Message textarea */}
                                                <div>
                                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--slate-800)", marginBottom: "6px" }}>
                                                        💬 Message / Transaction Details for Executive:
                                                    </label>
                                                    <textarea
                                                        rows="3"
                                                        placeholder="e.g. Refunded ₹2000 via UPI Txn #123456789. Reason: Cannot fulfill 2 units."
                                                        value={messages[order._id] || ""}
                                                        onChange={(e) => setMessages({ ...messages, [order._id]: e.target.value })}
                                                        className="proof-note-input"
                                                        style={{ width: "100%", resize: "vertical" }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ACTION BUTTONS */}
                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--slate-100)" }}>
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/order/${order._id}`)}
                                            className="table-btn table-btn-outline"
                                        >
                                            View Order Details
                                        </button>

                                        {!alreadySubmittedProof && (
                                            <button
                                                type="button"
                                                onClick={() => handleSubmitPayment(order._id, totalOrderRefund)}
                                                disabled={isSubmitting || !selectedFiles[order._id]}
                                                className="table-btn table-btn-success"
                                                style={{ padding: "8px 20px", fontSize: "13.5px" }}
                                            >
                                                {isSubmitting ? "Sending..." : "Send Refund Proof to Executive 📤"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* FULL IMAGE MODAL PREVIEW */}
            {modalImage && (
                <div
                    onClick={() => setModalImage(null)}
                    className="image-modal-overlay"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="image-modal-content"
                    >
                        <div className="image-modal-header">
                            <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--slate-700)" }}>
                                Payment Proof
                            </span>
                            <button
                                onClick={() => setModalImage(null)}
                                className="image-modal-close-btn"
                            >
                                Close ✕
                            </button>
                        </div>
                        <img
                            src={modalImage}
                            alt="Full Payment Proof"
                            className="image-modal-img"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
