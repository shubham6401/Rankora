import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    fetchMediatorPendingPaymentOrders,
    submitMediatorPaymentProof,
} from "../../services/mediator/orders";
import "../../styles/ordersTable.css";

export default function MediatorPendingPayment() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeUploadOrder, setActiveUploadOrder] = useState(null); // order object when modal is open
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadPreview, setUploadPreview] = useState(null);
    const [uploadMessage, setUploadMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [modalImage, setModalImage] = useState(null); // For image zoom

    useEffect(() => {
        loadPendingPayments();
    }, []);

    const loadPendingPayments = async () => {
        try {
            setLoading(true);
            const res = await fetchMediatorPendingPaymentOrders();
            setOrders(res.data?.orders || []);
        } catch (err) {
            console.error("Error fetching pending payment orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenUploadModal = (order) => {
        setActiveUploadOrder(order);
        setUploadFile(null);
        setUploadPreview(null);
        setUploadMessage("");
    };

    const handleCloseUploadModal = () => {
        if (uploadPreview) URL.revokeObjectURL(uploadPreview);
        setActiveUploadOrder(null);
        setUploadFile(null);
        setUploadPreview(null);
        setUploadMessage("");
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadFile(file);
        setUploadPreview(URL.createObjectURL(file));
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        if (!uploadFile) {
            alert("Please attach your refund payment screenshot.");
            return;
        }

        const orderId = activeUploadOrder._id;
        const units = activeUploadOrder.orderUnits || [];
        const priceNum = Number(activeUploadOrder.price) || 0;
        const totalAmount = priceNum * units.length;

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append("mediatorPaymentScreenshot", uploadFile);
            formData.append("message", uploadMessage);

            const res = await submitMediatorPaymentProof(orderId, formData);
            alert(res.data?.message || `Refund proof of ₹${totalAmount.toLocaleString()} sent to executive!`);
            handleCloseUploadModal();
            await loadPendingPayments();
        } catch (err) {
            console.error("Error submitting payment proof:", err);
            alert(err?.response?.data?.message || "Failed to submit payment proof");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="table-page-container">
                <div className="empty-state-card">
                    <div className="empty-state-icon">⏳</div>
                    <h2 className="empty-state-title">Loading Return Refunds...</h2>
                    <p className="empty-state-text">Fetching rejected orders awaiting refund submission.</p>
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
            {/* TOP HEADER - Non-pipeline finance section */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge" style={{ background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }}>
                        ↩️ Rejections & Return Refunds
                    </span>
                    <h1 className="table-page-title">
                        Return Refunds for Rejected Orders
                    </h1>
                    <p className="table-page-subtitle">
                        When you reject offers that had advance payments, upload the refund transaction screenshot here so the Executive can verify and accept the returned payment.
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
                        New Offers →
                    </button>
                </div>
            </div>

            {/* METRICS SUMMARY */}
            <div className="table-metrics-bar">
                <div className="metric-card">
                    <span className="metric-label">Rejected Orders</span>
                    <span className="metric-value metric-value-amber">{orders.length}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Total Units Returned</span>
                    <span className="metric-value">{totalUnitsCount} Units</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Total Refund Due</span>
                    <span className="metric-value metric-value-rose">₹{totalOverallRefund.toLocaleString()}</span>
                </div>
            </div>

            {/* TABLE / EMPTY STATE */}
            {orders.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">✅</div>
                    <h2 className="empty-state-title">No Pending Return Refunds</h2>
                    <p className="empty-state-text">
                        All advance payments and rejected orders are fully settled with the Executive.
                    </p>
                    <button
                        onClick={() => navigate("/mediator-neworders")}
                        className="nav-btn nav-btn-primary"
                        style={{ marginTop: "14px" }}
                    >
                        View Available New Offers →
                    </button>
                </div>
            ) : (
                <div className="data-table-container">
                    <div className="data-table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Order Info</th>
                                    <th>Product / Brand</th>
                                    <th>Platform</th>
                                    <th>Rejected Units</th>
                                    <th>Total Refund Due</th>
                                    <th>Executive</th>
                                    <th>Refund Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => {
                                    const units = order.orderUnits || [];
                                    const unitCount = units.length;
                                    const priceNum = Number(order.price) || 0;
                                    const totalOrderRefund = priceNum * unitCount;
                                    const submittedUnit = units.find((u) => u.mediatorPaymentScreenshot);
                                    const alreadySubmittedProof = submittedUnit?.mediatorPaymentScreenshot;
                                    const alreadySubmittedDate = submittedUnit?.mediatorPaymentSentAt;
                                    const alreadySubmittedMessage = submittedUnit?.mediatorMessage;

                                    return (
                                        <tr key={order._id}>
                                            {/* Order Info */}
                                            <td>
                                                <div className="order-id-cell">
                                                    <span className="order-id-text">
                                                        #{order._id.substring(0, 8)}...
                                                    </span>
                                                    <span className="order-date-text">
                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Product / Brand */}
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

                                            {/* Rejected Units */}
                                            <td>
                                                <div className="units-cell">
                                                    <span className="units-count" style={{ color: "#b91c1c" }}>
                                                        {unitCount} {unitCount === 1 ? "Unit" : "Units"}
                                                    </span>
                                                    <span className="unit-price">
                                                        ₹{priceNum} / unit
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Total Refund Due */}
                                            <td>
                                                <div style={{ fontWeight: 800, fontSize: "14px", color: "#e11d48" }}>
                                                    ₹{totalOrderRefund.toLocaleString()}
                                                </div>
                                            </td>

                                            {/* Executive */}
                                            <td>
                                                <div style={{ fontSize: "12px", color: "#334155" }}>
                                                    <div style={{ fontWeight: 600 }}>
                                                        {order.executiveName || order.createdBy?.name || "Executive"}
                                                    </div>
                                                    {order.teamCode && (
                                                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                                                            Team: {order.teamCode}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Refund Status */}
                                            <td>
                                                {alreadySubmittedProof ? (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                        <span className="status-badge" style={{ background: "#f0fdf4", color: "#15803d", borderColor: "#bbf7d0" }}>
                                                            ✓ Proof Sent
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setModalImage(alreadySubmittedProof)}
                                                            style={{ fontSize: "11px", color: "#2563eb", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
                                                        >
                                                            🔍 View Sent SS
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="status-badge status-badge-pending_payment">
                                                        ● Proof Required
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td>
                                                <div className="action-btn-group">
                                                    {!alreadySubmittedProof ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenUploadModal(order)}
                                                            className="table-btn table-btn-primary"
                                                            style={{ padding: "6px 12px", fontSize: "12px" }}
                                                        >
                                                            📤 Upload Refund
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenUploadModal(order)}
                                                            className="table-btn table-btn-outline"
                                                            style={{ padding: "6px 10px", fontSize: "11.5px" }}
                                                            title="Re-upload or update proof"
                                                        >
                                                            🔄 Update Proof
                                                        </button>
                                                    )}

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

            {/* COMPACT UPLOAD REFUND MODAL */}
            {activeUploadOrder && (
                <div
                    className="app-modal-overlay"
                    onClick={handleCloseUploadModal}
                >
                    <div
                        className="app-modal-content"
                        style={{ maxWidth: "520px" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="app-modal-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                                    Upload Return Refund Proof
                                </h3>
                                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                                    {activeUploadOrder.productName} ({activeUploadOrder.brand})
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseUploadModal}
                                className="app-modal-close"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmitPayment} className="app-modal-body">
                            {/* Summary callout */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "12px 16px",
                                    background: "#fff1f2",
                                    border: "1px solid #fecdd3",
                                    borderRadius: "8px",
                                    marginBottom: "16px",
                                    flexWrap: "wrap",
                                    gap: "8px",
                                }}
                            >
                                <div>
                                    <span style={{ fontSize: "12px", color: "#9f1239", fontWeight: 600 }}>Refund Amount Due:</span>
                                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#be123c" }}>
                                        ₹{((Number(activeUploadOrder.price) || 0) * (activeUploadOrder.orderUnits?.length || 1)).toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ textAlign: "right", fontSize: "12px", color: "#475569" }}>
                                    <div>{activeUploadOrder.orderUnits?.length || 1} Rejected Units</div>
                                    <div style={{ fontWeight: 600 }}>To: {activeUploadOrder.executiveName || "Executive"}</div>
                                </div>
                            </div>

                            {/* File Upload */}
                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                                    Payment Transaction Screenshot <span style={{ color: "#e11d48" }}>*</span>
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    required
                                    onChange={handleFileChange}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        fontSize: "12.5px",
                                        padding: "8px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        boxSizing: "border-box",
                                    }}
                                />

                                {uploadPreview && (
                                    <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                        <img
                                            src={uploadPreview}
                                            alt="Preview"
                                            onClick={() => setModalImage(uploadPreview)}
                                            style={{
                                                width: "54px",
                                                height: "54px",
                                                objectFit: "cover",
                                                borderRadius: "6px",
                                                border: "1px solid #cbd5e1",
                                                cursor: "pointer",
                                            }}
                                            title="Click to zoom"
                                        />
                                        <span style={{ fontSize: "12px", color: "#15803d", fontWeight: 600, wordBreak: "break-all" }}>
                                            ✓ {uploadFile?.name}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Message / Txn note */}
                            <div style={{ marginBottom: "18px" }}>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                                    Note / UTR / Transaction ID (Optional)
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="e.g. Returned ₹1500 via UPI UTR: 4098712398"
                                    value={uploadMessage}
                                    onChange={(e) => setUploadMessage(e.target.value)}
                                    style={{
                                        width: "100%",
                                        fontSize: "12.5px",
                                        padding: "8px 10px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        boxSizing: "border-box",
                                        resize: "vertical",
                                    }}
                                />
                            </div>

                            {/* Actions */}
                            <div className="app-modal-footer" style={{ padding: "12px 0 0 0", borderTop: "1px solid #e2e8f0" }}>
                                <button
                                    type="button"
                                    onClick={handleCloseUploadModal}
                                    className="nav-btn nav-btn-default"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !uploadFile}
                                    className="nav-btn nav-btn-primary"
                                    style={{ background: "#16a34a" }}
                                >
                                    {submitting ? "Uploading..." : "Submit Refund Proof 📤"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FULL IMAGE ZOOM MODAL */}
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
                                Payment Screenshot
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
                            alt="Proof"
                            className="image-modal-img"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
