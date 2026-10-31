import { useState, useEffect } from "react";
import { mediatorOrderSubmit, getOrder } from "../../services/orders";
import { useParams, useNavigate } from "react-router-dom";
import ProofThumbnail from "../../component/common/ProofThumbnail";
import ProofPreviewModal from "../../component/common/ProofPreviewModal";
import "../../styles/orderForm.css";

export default function OrderSubmission() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [order, setOrder] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [previewModalUrl, setPreviewModalUrl] = useState(null);
    const [newFilePreview, setNewFilePreview] = useState(null);

    // Price state (single price option)
    const [purchasePrice, setPurchasePrice] = useState("");

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const response = await getOrder(id);
            const ord = response.data.order;
            setOrder(ord);

            const unit =
                (ord.orderUnits || []).find((u) => u._id === id) ||
                (ord.orderUnits || []).find((u) => u.status === "in_progress") ||
                {};

            const initialPrice = unit.purchasePrice !== undefined ? unit.purchasePrice : (ord.price || "");
            setPurchasePrice(initialPrice);

            // Pre-fill address if executive provided
            const isExecProvided = unit.addressType === "executive_provided" || (unit.deliveryAddress && unit.deliveryAddress.toLowerCase() !== "yourself");
            const initialAddress = isExecProvided ? unit.deliveryAddress : (unit.address || "");

            // Locked orderReceivedOn date from order.createdAt
            const orderDateStr = ord.createdAt ? new Date(ord.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
            const formattedArrival = unit.expectedArrivalDate
                ? new Date(unit.expectedArrivalDate).toISOString().split("T")[0]
                : "";

            setFormData({
                orderId: unit.orderId || "",
                reviewerName: unit.reviewerName || "",
                expectedArrivalDate: formattedArrival,
                address: initialAddress,
                addressType: isExecProvided ? "executive_provided" : "yourself",
                orderReceivedOn: orderDateStr,
            });
        } catch (err) {
            console.error("Failed to load order:", err);
            setError("Could not retrieve order details.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopyAddress = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const totalPurchasedAmount = Number(purchasePrice) || 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            setSubmitting(true);
            const data = new FormData();

            Object.keys(formData).forEach((key) => {
                if (formData[key] !== undefined && formData[key] !== null) {
                    data.append(key, formData[key]);
                }
            });

            data.append("purchasePrice", purchasePrice);
            data.append("deliveryFee", 0);
            data.append("totalPurchasedAmount", totalPurchasedAmount);

            await mediatorOrderSubmit(id, data);
            alert("✓ Unit placement details submitted successfully!");
            navigate("/mediator-pending-orders", { replace: true });
        } catch (err) {
            console.error("Error submitting order details:", err);
            setError(err.response?.data?.message || "Error submitting order details. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="form-page-container" style={{ textAlign: "center", padding: "60px 0" }}>
                <h2>Loading order submission details...</h2>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="form-page-container">
                <div className="form-card" style={{ textAlign: "center", padding: "40px" }}>
                    <h2>Order Not Found</h2>
                    <p>The requested order unit could not be located.</p>
                    <button className="form-nav-back" onClick={() => navigate(-1)}>
                        ← Return to Orders
                    </button>
                </div>
            </div>
        );
    }

    const currentUnit =
        (order.orderUnits || []).find((u) => u._id === id) ||
        (order.orderUnits || []).find((u) => u.status === "in_progress") ||
        {};
    const unitsLeft = (order.orderUnits || []).filter((u) => u.status === "in_progress").length;
    const isExecutiveAddressProvided = currentUnit.addressType === "executive_provided" || (currentUnit.deliveryAddress && currentUnit.deliveryAddress.toLowerCase() !== "yourself");
    const orderDateStr = order.createdAt ? new Date(order.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

    return (
        <div className="form-page-container">
            <button
                type="button"
                className="form-nav-back"
                onClick={() => navigate(-1)}
            >
                ← Back
            </button>

            <div className="form-card">
                <div className="form-header">
                    <span className="form-header-badge badge-emerald">Fulfillment Stage</span>
                    <h1 className="form-title">Submit Order Placement Details</h1>
                    <p className="form-subtitle">
                        Record the e-commerce purchase details, adjusted pricing/fees, and order confirmation screenshot for this unit.
                    </p>
                </div>

                {/* EXECUTIVE REVISION FEEDBACK ALERT */}
                {currentUnit.verificationRejectionReason && (
                    <div className="revision-feedback-callout" style={{ marginBottom: "20px" }}>
                        <div className="callout-header">
                            <span>⚠️ Returned by Executive from Verification</span>
                            <span className="callout-badge" style={{ background: "#fee2e2", color: "#991b1b" }}>
                                Revision Required
                            </span>
                        </div>
                        <div className="callout-message">
                            "{currentUnit.verificationRejectionReason}"
                        </div>
                        <div className="callout-action-hint">
                            The executive requested revision and returned this order unit to In Progress. Please update the order placement information and screenshot accordingly.
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{ color: "#e11d48", padding: "10px", background: "#fff1f2", borderRadius: "6px", marginBottom: "16px", fontSize: "13px" }}>
                        {error}
                    </div>
                )}

                {/* Read-only Master Product Details */}
                <div className="context-summary-box">
                    <div className="context-summary-title">Product Campaign Information</div>
                    <div className="context-grid">
                        <div className="context-item">
                            <span className="context-label">Product: </span>{order.productName}
                        </div>
                        <div className="context-item">
                            <span className="context-label">Brand: </span>{order.brand}
                        </div>
                        <div className="context-item">
                            <span className="context-label">Platform: </span>{order.orderPlatform}
                        </div>
                        <div className="context-item">
                            <span className="context-label">Target Price: </span>₹{order.price}
                        </div>
                        {order.season && (
                            <div className="context-item">
                                <span className="context-label">Season / Event: </span>🏷️ {order.season}
                            </div>
                        )}
                        <div className="context-item">
                            <span className="context-label">Units Left: </span>
                            <b style={{ color: "var(--primary-600)" }}>{unitsLeft || 1} Unit(s) Remaining</b>
                        </div>
                        <div className="context-item">
                            <span className="context-label">Executive: </span>{order.executiveName || "N/A"}
                        </div>
                        <div className="context-item">
                            <span className="context-label">Order Created: </span>{new Date(order.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="form-body">
                    {/* E-Commerce Order ID */}
                    <div className="form-field">
                        <label className="form-field-label">
                            E-Commerce Order ID <span className="form-field-req">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-input-text"
                            placeholder="e.g. 402-1234567-8901234 (Amazon / Flipkart)"
                            required
                            value={formData.orderId !== undefined ? formData.orderId : (currentUnit.orderId || "")}
                            onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                        />
                    </div>

                    {/* Order Confirmation Screenshot */}
                    <div className="form-field" style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                            <div>
                                <label className="form-field-label" style={{ marginBottom: "2px" }}>
                                    Order Confirmation Screenshot / PDF Receipt {!currentUnit.orderedScreenshot && !newFilePreview && <span className="form-field-req">*</span>}
                                </label>
                                <span style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                                    (Accepts JPG, PNG, WEBP, or PDF)
                                </span>
                            </div>
                            {currentUnit.orderedScreenshot && !newFilePreview && (
                                <span className="status-badge" style={{ background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0", fontSize: "11px" }}>
                                    ✓ Current Proof Active
                                </span>
                            )}
                            {newFilePreview && (
                                <span className="status-badge" style={{ background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe", fontSize: "11px" }}>
                                    ★ New File Selected
                                </span>
                            )}
                        </div>

                        {/* Display Previously Submitted Order Screenshot */}
                        {currentUnit.orderedScreenshot && !newFilePreview && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    background: "#ffffff",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    marginBottom: "12px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <ProofThumbnail
                                        url={currentUnit.orderedScreenshot}
                                        alt="Current Order Proof"
                                        size={44}
                                        onClick={() => setPreviewModalUrl(currentUnit.orderedScreenshot)}
                                    />
                                    <div>
                                        <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#1e293b" }}>
                                            Previously Submitted Order Proof
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                                            Keep this proof, or choose a new file below to replace it.
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPreviewModalUrl(currentUnit.orderedScreenshot)}
                                    className="table-btn table-btn-outline"
                                    style={{ fontSize: "11.5px", padding: "4px 10px" }}
                                >
                                    🔍 View / Zoom
                                </button>
                            </div>
                        )}

                        {/* Display Newly Selected File Preview */}
                        {newFilePreview && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    background: "#eff6ff",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #93c5fd",
                                    marginBottom: "12px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <ProofThumbnail
                                        url={newFilePreview.file}
                                        alt="New File Preview"
                                        size={44}
                                        onClick={() => setPreviewModalUrl(newFilePreview.url)}
                                    />
                                    <div>
                                        <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#1d4ed8" }}>
                                            ✓ New Replacement Attached
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#64748b", wordBreak: "break-all" }}>
                                            {newFilePreview.file.name}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "6px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewModalUrl(newFilePreview.url)}
                                        className="table-btn table-btn-outline"
                                        style={{ fontSize: "11px", padding: "4px 8px" }}
                                    >
                                        🔍 Preview
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData((prev) => {
                                                const copy = { ...prev };
                                                delete copy.orderedScreenshot;
                                                return copy;
                                            });
                                            if (newFilePreview?.url) URL.revokeObjectURL(newFilePreview.url);
                                            setNewFilePreview(null);
                                        }}
                                        className="table-btn table-btn-danger"
                                        style={{ fontSize: "11px", padding: "4px 8px" }}
                                    >
                                        ✕ Clear
                                    </button>
                                </div>
                            </div>
                        )}

                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="form-file-input"
                            required={!currentUnit.orderedScreenshot && !newFilePreview}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setFormData({ ...formData, orderedScreenshot: file });
                                const url = URL.createObjectURL(file);
                                setNewFilePreview({ file, url });
                            }}
                            style={{ background: "#ffffff" }}
                        />
                    </div>

                    {/* Actual Purchase Price (Single Option) */}
                    <div className="form-field">
                        <label className="form-field-label">
                            Actual Purchase Price (₹) <span className="form-field-req">*</span>
                        </label>
                        <div style={{ position: "relative" }}>
                            <span style={{
                                position: "absolute",
                                left: "14px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontWeight: "800",
                                color: "var(--slate-500)",
                                fontSize: "15px"
                            }}>
                                ₹
                            </span>
                            <input
                                type="number"
                                className="form-input-text"
                                placeholder="e.g. 1499"
                                min="0"
                                step="any"
                                value={purchasePrice}
                                required
                                style={{
                                    paddingLeft: "32px",
                                    fontWeight: "700",
                                    fontSize: "15px",
                                    color: "var(--slate-900)"
                                }}
                                onChange={(e) => setPurchasePrice(e.target.value)}
                            />
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", display: "block" }}>
                            Enter the final invoice / purchase price paid for this unit.
                        </span>

                        {order?.price && Number(purchasePrice) > Number(order.price) && (
                            <div
                                style={{
                                    marginTop: "8px",
                                    padding: "10px 14px",
                                    background: "#fff1f2",
                                    border: "1.5px solid #fecdd3",
                                    borderRadius: "8px",
                                    color: "#9f1239",
                                    fontSize: "12.5px",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "8px",
                                    lineHeight: 1.4,
                                }}
                            >
                                <span style={{ fontSize: "16px" }}>⚠️</span>
                                <div>
                                    <b>Price Hike Detected:</b> Entered purchase price of <b>₹{Number(purchasePrice).toLocaleString()}</b> is{" "}
                                    <b>+₹{(Number(purchasePrice) - Number(order.price)).toLocaleString()}</b> higher than the fixed base price of{" "}
                                    <b>₹{Number(order.price).toLocaleString()}</b>.
                                    <div style={{ fontSize: "11.5px", color: "#be123c", marginTop: "2px" }}>
                                        This price increase will be displayed across Brand and Executive dashboards.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dates Section: Expected Arrival & Locked Order Received Date */}
                    <div className="form-row-2col">
                        <div className="form-field">
                            <label className="form-field-label">
                                Expected Arrival Date <span className="form-field-req">*</span>
                            </label>
                            <input
                                type="date"
                                className="form-input-text"
                                required
                                value={formData.expectedArrivalDate !== undefined ? formData.expectedArrivalDate : ""}
                                onChange={(e) => setFormData({ ...formData, expectedArrivalDate: e.target.value })}
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-field-label">
                                Order Received Date (Locked) 🔒
                            </label>
                            <input
                                type="date"
                                className="form-input-text"
                                value={orderDateStr}
                                disabled
                                style={{ backgroundColor: "#f1f5f9", cursor: "not-allowed", color: "#64748b" }}
                            />
                            <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", display: "block" }}>
                                Fixed to campaign creation date
                            </span>
                        </div>
                    </div>

                    {/* Reviewer Account Name */}
                    <div className="form-field">
                        <label className="form-field-label">
                            Reviewer Account Name <span className="form-field-req">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-input-text"
                            placeholder="Public reviewer profile name"
                            required
                            value={formData.reviewerName !== undefined ? formData.reviewerName : (currentUnit.reviewerName || "")}
                            onChange={(e) => setFormData({ ...formData, reviewerName: e.target.value })}
                        />
                    </div>

                    {/* Shipping Address Section with 1-Click Copy */}
                    {isExecutiveAddressProvided ? (
                        <div style={{
                            backgroundColor: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            borderRadius: "10px",
                            padding: "14px 16px",
                            marginBottom: "16px"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e40af", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span>📍</span>
                                    <span>Executive Assigned Shipping Address (Required)</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleCopyAddress(currentUnit.deliveryAddress)}
                                    style={{
                                        backgroundColor: copied ? "#10b981" : "#2563eb",
                                        color: "#ffffff",
                                        border: "none",
                                        padding: "5px 12px",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        transition: "background-color 0.2s"
                                    }}
                                >
                                    <span>{copied ? "✓" : "📋"}</span>
                                    <span>{copied ? "Copied!" : "Copy Address"}</span>
                                </button>
                            </div>

                            <p style={{
                                margin: 0,
                                fontSize: "13.5px",
                                color: "#1e293b",
                                lineHeight: "1.5",
                                background: "#ffffff",
                                padding: "10px 12px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1"
                            }}>
                                {currentUnit.deliveryAddress}
                            </p>
                            <span style={{ fontSize: "11.5px", color: "#64748b", marginTop: "6px", display: "block" }}>
                                Please ship to the exact address above as assigned by your executive.
                            </span>
                        </div>
                    ) : (
                        <div className="form-field">
                            <label className="form-field-label">
                                Delivery Shipping Address <span className="form-field-req">*</span>
                            </label>
                            <textarea
                                className="form-textarea-input"
                                rows="3"
                                placeholder="Enter shipping address used for placing this order"
                                required
                                defaultValue={currentUnit.address || ""}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="form-submit-row">
                        <button
                            type="button"
                            className="form-nav-back"
                            onClick={() => navigate(-1)}
                            style={{ margin: 0 }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="form-btn-submit btn-theme-blue"
                            disabled={submitting}
                        >
                            {submitting ? "Submitting Placement..." : "Confirm & Submit Placement →"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal: Fullscreen Proof Preview (Supports Image & PDF) */}
            {previewModalUrl && (
                <ProofPreviewModal
                    url={previewModalUrl}
                    title="Order Confirmation Proof Preview"
                    onClose={() => setPreviewModalUrl(null)}
                />
            )}
        </div>
    );
}