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
    const [verifiedOrders, setVerifiedOrders] = useState([]);
    const [activeTab, setActiveTab] = useState("pending"); // "pending" | "verified"
    const [loading, setLoading] = useState(true);
    const [activeUploadOrder, setActiveUploadOrder] = useState(null);
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
            setVerifiedOrders(res.data?.verifiedOrders || []);
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
                    <p className="empty-state-text">Fetching rejected orders and return refund statuses.</p>
                </div>
            </div>
        );
    }

    const currentList = activeTab === "pending" ? orders : verifiedOrders;

    const totalOverallRefund = orders.reduce((sum, order) => {
        const units = order.orderUnits || [];
        const price = Number(order.price) || 0;
        return sum + price * units.length;
    }, 0);

    const totalUnitsCount = orders.reduce((sum, order) => sum + (order.orderUnits?.length || 0), 0);

    return (
        <div className="table-page-container">
            {/* TOP HEADER */}
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
                    <span className="metric-label">Pending Return Orders</span>
                    <span className="metric-value metric-value-amber">{orders.length}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Pending Refund Units</span>
                    <span className="metric-value">{totalUnitsCount} Units</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Pending Refund Due</span>
                    <span className="metric-value metric-value-rose">₹{totalOverallRefund.toLocaleString()}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Verified Refunds</span>
                    <span className="metric-value metric-value-emerald">{verifiedOrders.length}</span>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "10px" }}>
                <button
                    type="button"
                    onClick={() => setActiveTab("pending")}
                    className={activeTab === "pending" ? "nav-btn nav-btn-primary" : "nav-btn nav-btn-default"}
                    style={{ fontSize: "13px", padding: "8px 16px" }}
                >
                    ⏳ Active Pending ({orders.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("verified")}
                    className={activeTab === "verified" ? "nav-btn nav-btn-primary" : "nav-btn nav-btn-default"}
                    style={{ fontSize: "13px", padding: "8px 16px" }}
                >
                    ✓ Verified History ({verifiedOrders.length})
                </button>
            </div>

            {/* TABLE / EMPTY STATE */}
            {currentList.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">{activeTab === "pending" ? "✅" : "📄"}</div>
                    <h2 className="empty-state-title">
                        {activeTab === "pending" ? "No Pending Return Refunds" : "No Verified Refunds Yet"}
                    </h2>
                    <p className="empty-state-text">
                        {activeTab === "pending"
                            ? "All advance payments and rejected orders are fully settled with the Executive."
                            : "Once the Executive verifies and accepts your refund proofs, they will appear here in your verified history."}
                    </p>
                    {activeTab === "pending" && (
                        <button
                            onClick={() => navigate("/mediator-neworders")}
                            className="nav-btn nav-btn-primary"
                            style={{ marginTop: "14px" }}
                        >
                            View Available New Offers →
                        </button>
                    )}
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
                                    <th>Total Refund</th>
                                    <th>Executive</th>
                                    <th>Refund Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentList.map((order) => {
                                    const units = order.orderUnits || [];
                                    const unitCount = units.length;
                                    const priceNum = Number(order.price) || 0;
                                    const totalOrderRefund = priceNum * unitCount;
                                    const submittedUnit = units.find((u) => u.mediatorPaymentScreenshot) || units[0];
                                    const alreadySubmittedProof = submittedUnit?.mediatorPaymentScreenshot;
                                    const alreadySubmittedDate = submittedUnit?.mediatorPaymentSentAt;
                                    const paymentStatus = submittedUnit?.mediatorPaymentStatus;
                                    const isVerified = activeTab === "verified" || paymentStatus === "verified";

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
                                                    <span className="units-count" style={{ color: isVerified ? "#15803d" : "#b91c1c" }}>
                                                        {unitCount} {unitCount === 1 ? "Unit" : "Units"}
                                                    </span>
                                                    <span className="unit-price">
                                                        ₹{priceNum} / unit
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Total Refund Due */}
                                            <td>
                                                <div style={{ fontWeight: 800, fontSize: "14px", color: isVerified ? "#15803d" : "#e11d48" }}>
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
                                                {isVerified ? (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                        <span className="status-badge status-badge-completed" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                            ✓ Verified
                                                        </span>
                                                        {alreadySubmittedProof && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setModalImage(alreadySubmittedProof)}
                                                                style={{ fontSize: "11px", color: "#2563eb", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
                                                            >
                                                                🔍 View Proof
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : alreadySubmittedProof ? (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                        <span className="status-badge" style={{ background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                            ⏳ Pending Verification
                                                        </span>
                                                        {alreadySubmittedDate && (
                                                            <span style={{ fontSize: "10.5px", color: "var(--slate-500)" }}>
                                                                Sent: {new Date(alreadySubmittedDate).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => setModalImage(alreadySubmittedProof)}
                                                            style={{ fontSize: "11px", color: "#2563eb", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
                                                        >
                                                            🔍 View Sent Proof
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="status-badge" style={{ background: "#fff7ed", color: "#c2410c", borderColor: "#fed7aa" }}>
                                                        ⚠️ Proof Required
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td>
                                                <div className="action-btn-group">
                                                    {!isVerified && (
                                                        !alreadySubmittedProof ? (
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
                                                        )
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

            {/* OVERHAULED UPLOAD REFUND MODAL */}
            {activeUploadOrder && (
                <div
                    className="app-modal-overlay"
                    onClick={handleCloseUploadModal}
                >
                    <div
                        className="app-modal-dialog"
                        style={{ maxWidth: "520px" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="app-modal-header">
                            <div>
                                <h3 className="app-modal-title">
                                    Upload Return Refund Proof
                                </h3>
                                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--slate-500)" }}>
                                    {activeUploadOrder.productName} ({activeUploadOrder.brand})
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseUploadModal}
                                className="app-modal-close"
                                title="Close modal"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmitPayment}>
                            <div className="app-modal-body">
                                {/* Summary Callout */}
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "14px 16px",
                                        background: "#f0fdf4",
                                        border: "1px solid #bbf7d0",
                                        borderRadius: "8px",
                                        flexWrap: "wrap",
                                        gap: "10px",
                                    }}
                                >
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#166534", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                            Refund Amount Due
                                        </span>
                                        <div style={{ fontSize: "20px", fontWeight: 800, color: "#15803d" }}>
                                            ₹{((Number(activeUploadOrder.price) || 0) * (activeUploadOrder.orderUnits?.length || 1)).toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right", fontSize: "12px", color: "var(--slate-600)" }}>
                                        <div><b>{activeUploadOrder.orderUnits?.length || 1}</b> Rejected Unit(s)</div>
                                        <div style={{ marginTop: "2px" }}>Recipient: <b>{activeUploadOrder.executiveName || "Executive"}</b></div>
                                    </div>
                                </div>

                                {/* Styled File Upload Dropzone */}
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "8px" }}>
                                        Payment Transaction Screenshot <span style={{ color: "#e11d48" }}>*</span>
                                    </label>

                                    {!uploadPreview ? (
                                        <label
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                padding: "24px 16px",
                                                border: "2px dashed #cbd5e1",
                                                borderRadius: "10px",
                                                backgroundColor: "#f8fafc",
                                                cursor: "pointer",
                                                transition: "all 0.2s ease",
                                                textAlign: "center",
                                            }}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.style.borderColor = "var(--primary-600)";
                                            }}
                                            onDragLeave={(e) => {
                                                e.currentTarget.style.borderColor = "#cbd5e1";
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.style.borderColor = "#cbd5e1";
                                                const file = e.dataTransfer.files?.[0];
                                                if (file) {
                                                    setUploadFile(file);
                                                    setUploadPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        >
                                            <div style={{ fontSize: "32px", marginBottom: "6px" }}>📤</div>
                                            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--slate-800)" }}>
                                                Click to select or drag & drop screenshot
                                            </div>
                                            <div style={{ fontSize: "11px", color: "var(--slate-400)", marginTop: "4px" }}>
                                                PNG, JPG, WEBP formats accepted
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                required
                                                onChange={handleFileChange}
                                                style={{ display: "none" }}
                                            />
                                        </label>
                                    ) : (
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "12px 14px",
                                                border: "1px solid #bbf7d0",
                                                borderRadius: "8px",
                                                backgroundColor: "#f0fdf4",
                                                gap: "12px",
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <img
                                                    src={uploadPreview}
                                                    alt="Preview"
                                                    onClick={() => setModalImage(uploadPreview)}
                                                    style={{
                                                        width: "56px",
                                                        height: "56px",
                                                        objectFit: "cover",
                                                        borderRadius: "6px",
                                                        border: "1px solid #86efac",
                                                        cursor: "pointer",
                                                    }}
                                                    title="Click to zoom preview"
                                                />
                                                <div>
                                                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#166534" }}>
                                                        ✓ Screenshot Attached
                                                    </div>
                                                    <div style={{ fontSize: "11px", color: "var(--slate-500)", wordBreak: "break-all" }}>
                                                        {uploadFile?.name}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
                                                    setUploadFile(null);
                                                    setUploadPreview(null);
                                                }}
                                                className="table-btn table-btn-outline"
                                                style={{ padding: "4px 8px", fontSize: "11px", color: "#dc2626", borderColor: "#fecaca" }}
                                            >
                                                ✕ Remove
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Message / Txn note */}
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "6px" }}>
                                        Note / UTR / Transaction ID (Optional)
                                    </label>
                                    <textarea
                                        rows="2"
                                        placeholder="e.g. Returned ₹1500 via UPI UTR: 4098712398"
                                        value={uploadMessage}
                                        onChange={(e) => setUploadMessage(e.target.value)}
                                        style={{
                                            width: "100%",
                                            fontSize: "13px",
                                            padding: "10px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            boxSizing: "border-box",
                                            resize: "vertical",
                                            fontFamily: "inherit",
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="app-modal-footer">
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
                                    {submitting ? "Uploading Proof..." : "Submit Refund Proof 📤"}
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
