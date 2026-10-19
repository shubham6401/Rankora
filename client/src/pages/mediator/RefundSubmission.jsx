import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { mediatorRefundSubmit, getOrder } from "../../services/orders";
import ProofThumbnail from "../../component/common/ProofThumbnail";
import ProofPreviewModal from "../../component/common/ProofPreviewModal";
import "../../styles/orderForm.css";

export default function RefundSubmission() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [formData, setFormData] = useState({});
    const [filePreviews, setFilePreviews] = useState({});
    const [previewModal, setPreviewModal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const response = await getOrder(id);
            setOrder(response.data.order);
        } catch (err) {
            console.error("Failed to load order:", err);
            setError("Failed to retrieve order details.");
        } finally {
            setLoading(false);
        }
    };

    const handleFilePick = (fieldName, file) => {
        if (!file) return;
        setFormData((prev) => ({ ...prev, [fieldName]: file }));
        const previewUrl = URL.createObjectURL(file);
        setFilePreviews((prev) => ({ ...prev, [fieldName]: { file, url: previewUrl } }));
    };

    const handleClearFile = (fieldName) => {
        setFormData((prev) => {
            const copy = { ...prev };
            delete copy[fieldName];
            return copy;
        });
        if (filePreviews[fieldName]?.url) {
            URL.revokeObjectURL(filePreviews[fieldName].url);
        }
        setFilePreviews((prev) => {
            const copy = { ...prev };
            delete copy[fieldName];
            return copy;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const currentUnit =
            (order?.orderUnits || []).find((u) => u._id === id) ||
            (order?.orderUnits || []).find((u) => u.status === "pending_refund") ||
            {};

        const existingReview = currentUnit.postDeliveryDetails?.productReviewScreenshot;
        if (!formData.productReviewScreenshot && !existingReview) {
            setError("Please upload a Product Review Proof (Image or PDF).");
            return;
        }

        try {
            setSubmitting(true);
            const data = new FormData();
            Object.keys(formData).forEach((key) => {
                if (formData[key] !== undefined && formData[key] !== null) {
                    data.append(key, formData[key]);
                }
            });

            await mediatorRefundSubmit(id, data);
            alert("Delivery & review proofs submitted successfully! Sent to Executive for verification.");
            navigate("/mediator-refund_pending-orders", { replace: true });
        } catch (err) {
            console.error("Error submitting refund proofs:", err);
            setError(err.response?.data?.message || "Error submitting refund details. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="form-page-container" style={{ textAlign: "center", padding: "60px 0" }}>
                <h2>Loading order details...</h2>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="form-page-container">
                <div className="form-card" style={{ textAlign: "center", padding: "40px" }}>
                    <h2>Order Not Found</h2>
                    <p>The specified order could not be located.</p>
                    <button className="form-nav-back" onClick={() => navigate(-1)}>
                        ← Return to Orders
                    </button>
                </div>
            </div>
        );
    }

    const currentUnit =
        (order.orderUnits || []).find((u) => u._id === id) ||
        (order.orderUnits || []).find((u) => u.status === "pending_refund") ||
        {};

    const previousProofs = {
        productReviewScreenshot: currentUnit.postDeliveryDetails?.productReviewScreenshot,
        invoiceScreenshot: currentUnit.postDeliveryDetails?.invoiceScreenshot,
        sellerFeedbackScreenShot: currentUnit.postDeliveryDetails?.sellerFeedbackScreenShot,
    };

    const renderProofUploadField = (fieldName, label, isRequired, note) => {
        const previousFile = previousProofs[fieldName];
        const newFile = filePreviews[fieldName];

        return (
            <div className="form-field" style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                        <label className="form-field-label" style={{ marginBottom: "2px" }}>
                            {label} {isRequired && !previousFile && <span className="form-field-req">*</span>}
                        </label>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                            {note || "Accepts Image (PNG, JPG, WEBP) or PDF"}
                        </span>
                    </div>
                    {previousFile && !newFile && (
                        <span className="status-badge" style={{ background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0", fontSize: "11px" }}>
                            ✓ Current File Active
                        </span>
                    )}
                    {newFile && (
                        <span className="status-badge" style={{ background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe", fontSize: "11px" }}>
                            ★ New File Selected
                        </span>
                    )}
                </div>

                {/* Display Previously Submitted Proof if present */}
                {previousFile && !newFile && (
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
                                url={previousFile}
                                alt={label}
                                size={44}
                                onClick={() => setPreviewModal({ url: previousFile, title: label })}
                            />
                            <div>
                                <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#1e293b" }}>
                                    Previously Submitted Proof
                                </div>
                                <div style={{ fontSize: "11px", color: "#64748b" }}>
                                    Keep this proof, or choose a new file below to replace it.
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setPreviewModal({ url: previousFile, title: label })}
                            className="table-btn table-btn-outline"
                            style={{ fontSize: "11.5px", padding: "4px 10px" }}
                        >
                            🔍 View / Zoom
                        </button>
                    </div>
                )}

                {/* Display Newly Selected File Preview */}
                {newFile && (
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
                                url={newFile.file}
                                alt="New File Preview"
                                size={44}
                                onClick={() => setPreviewModal({ url: newFile.url, title: `New ${label}` })}
                            />
                            <div>
                                <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#1d4ed8" }}>
                                    ✓ New Replacement Attached
                                </div>
                                <div style={{ fontSize: "11px", color: "#64748b", wordBreak: "break-all" }}>
                                    {newFile.file.name}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                            <button
                                type="button"
                                onClick={() => setPreviewModal({ url: newFile.url, title: `New ${label}` })}
                                className="table-btn table-btn-outline"
                                style={{ fontSize: "11px", padding: "4px 8px" }}
                            >
                                🔍 Preview
                            </button>
                            <button
                                type="button"
                                onClick={() => handleClearFile(fieldName)}
                                className="table-btn table-btn-danger"
                                style={{ fontSize: "11px", padding: "4px 8px" }}
                            >
                                ✕ Clear
                            </button>
                        </div>
                    </div>
                )}

                {/* File input (Accepts Image & PDF) */}
                <input
                    type="file"
                    id={`file-input-${fieldName}`}
                    accept="image/*,application/pdf"
                    className="form-file-input"
                    required={isRequired && !previousFile && !newFile}
                    onChange={(e) => handleFilePick(fieldName, e.target.files[0])}
                    style={{ background: "#ffffff" }}
                />
            </div>
        );
    };

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
                    <span className="form-header-badge badge-purple">Verification Submission</span>
                    <h1 className="form-title">Submit Post-Delivery & Review Proofs</h1>
                    <p className="form-subtitle">
                        Upload screenshots of the review, invoice, and seller feedback (Images or PDFs accepted). Your submission will be sent to the Executive team for verification before moving to Completed.
                    </p>
                </div>

                {/* EXECUTIVE REVISION FEEDBACK ALERT */}
                {currentUnit.verificationRejectionReason && (
                    <div className="revision-feedback-callout" style={{ marginBottom: "20px" }}>
                        <div className="callout-header">
                            <span>⚠️ Executive Requested Revision</span>
                            <span className="callout-badge" style={{ background: "#fee2e2", color: "#991b1b" }}>
                                Action Required
                            </span>
                        </div>
                        <div className="callout-message">
                            "{currentUnit.verificationRejectionReason}"
                        </div>
                        <div className="callout-action-hint">
                            Your previously submitted proofs are shown below. You can view them, replace only the incorrect one(s), or keep what was already verified.
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{ color: "#e11d48", padding: "10px", background: "#fff1f2", borderRadius: "6px", marginBottom: "16px", fontSize: "13px" }}>
                        {error}
                    </div>
                )}

                {/* Order Summary Box */}
                <div className="context-summary-box">
                    <div className="context-summary-title">Order Information</div>
                    <div className="context-grid">
                        <div className="context-item">
                            <span className="context-label">Product: </span>{order.productName}
                        </div>
                        <div className="context-item">
                            <span className="context-label">Brand: </span>{order.brand}
                        </div>
                        <div className="context-item">
                            <span className="context-label">Order ID: </span>{currentUnit.orderId || order.orderId || "Submitted"}
                        </div>
                        <div className="context-item">
                            <span className="context-label">Price: </span>₹{order.price}
                        </div>
                        {currentUnit.orderedScreenshot && (
                            <div className="context-item" style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "8px" }}>
                                <span className="context-label">Stage 3 Order Screenshot: </span>
                                <button
                                    type="button"
                                    onClick={() => setPreviewModal({ url: currentUnit.orderedScreenshot, title: "Order Placement Screenshot" })}
                                    className="table-btn table-btn-outline"
                                    style={{ fontSize: "11px", padding: "2px 8px" }}
                                >
                                    🔍 View Order Screenshot
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="form-body">
                    {/* Proof 1: Product Review Proof */}
                    {renderProofUploadField(
                        "productReviewScreenshot",
                        "1. Product Review Proof (Image or PDF)",
                        true,
                        "Required: Screenshot showing the live rating, star count, and review comments."
                    )}

                    {/* Proof 2: Platform Invoice Proof */}
                    {renderProofUploadField(
                        "invoiceScreenshot",
                        "2. Platform Invoice Proof (Image or PDF)",
                        false,
                        "Optional: Invoice downloaded or captured from Amazon/Flipkart."
                    )}

                    {/* Proof 3: Seller Feedback Proof */}
                    {renderProofUploadField(
                        "sellerFeedbackScreenShot",
                        "3. Seller Feedback Proof (Image or PDF)",
                        false,
                        "Optional: Screenshot showing seller storefront feedback submission."
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
                            className="form-btn-submit btn-theme-purple"
                            disabled={submitting}
                        >
                            {submitting ? "Uploading Proofs..." : "Complete & Finalize Order →"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Proof Preview Modal (Supports Image & PDF) */}
            {previewModal && (
                <ProofPreviewModal
                    url={previewModal.url}
                    title={previewModal.title}
                    onClose={() => setPreviewModal(null)}
                />
            )}
        </div>
    );
}