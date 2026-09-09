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
                <div className="table-card">
                    <div className="table-wrapper">
                        <table className="orders-table">
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

                                                    <button
                                                        type="button"
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

            {/* COMPACT UPLOAD REFUND MODAL */}
            {activeUploadOrder && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.7)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "16px",
                    }}
                    onClick={handleCloseUploadModal}
                >
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "14px",
                            maxWidth: "520px",
                            width: "100%",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                            overflow: "hidden",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div
                            style={{
                                padding: "16px 20px",
                                borderBottom: "1px solid #e2e8f0",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                backgroundColor: "#f8fafc",
                            }}
                        >
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
                                style={{
                                    border: "none",
                                    background: "#e2e8f0",
                                    borderRadius: "6px",
                                    width: "28px",
                                    height: "28px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#475569",
                                    fontWeight: 700,
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmitPayment} style={{ padding: "20px" }}>
                            {/* Summary callout */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "10px 14px",
                                    background: "#fff1f2",
                                    border: "1px solid #fecdd3",
                                    borderRadius: "8px",
                                    marginBottom: "16px",
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
                                    }}
                                />

                                {uploadPreview && (
                                    <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <img
                                            src={uploadPreview}
                                            alt="Preview"
                                            onClick={() => setModalImage(uploadPreview)}
                                            style={{
                                                width: "50px",
                                                height: "50px",
                                                objectFit: "cover",
                                                borderRadius: "6px",
                                                border: "1px solid #cbd5e1",
                                                cursor: "pointer",
                                            }}
                                            title="Click to zoom"
                                        />
                                        <span style={{ fontSize: "12px", color: "#15803d", fontWeight: 600 }}>
                                            ✓ File selected: {uploadFile?.name}
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
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={handleCloseUploadModal}
                                    className="nav-btn nav-btn-default"
                                    style={{ padding: "8px 14px" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !uploadFile}
                                    className="nav-btn nav-btn-primary"
                                    style={{ padding: "8px 18px", background: "#16a34a" }}
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
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10000,
                        padding: "16px",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: "600px",
                            width: "100%",
                            backgroundColor: "#ffffff",
                            borderRadius: "10px",
                            overflow: "hidden",
                        }}
                    >
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontWeight: 700, fontSize: "13px" }}>Payment Screenshot</span>
                            <button
                                onClick={() => setModalImage(null)}
                                style={{ border: "none", background: "none", cursor: "pointer", fontWeight: 700 }}
                            >
                                ✕
                            </button>
                        </div>
                        <div style={{ padding: "16px", textAlign: "center", backgroundColor: "#0b132b" }}>
                            <img
                                src={modalImage}
                                alt="Proof"
                                style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
