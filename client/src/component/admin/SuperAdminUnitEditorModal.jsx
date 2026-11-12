import { useState } from "react";
import { superAdminOverrideOrderUnitApi } from "../../services/admin";
import { isPdfUrl } from "../common/ProofThumbnail";
import ProofPreviewModal from "../common/ProofPreviewModal";
import "../../styles/superAdminModal.css";

export default function SuperAdminUnitEditorModal({
    isOpen,
    onClose,
    order,
    unit,
    unitNumber = 1,
    onSuccess,
}) {
    if (!isOpen || !unit || !order) return null;

    const [formData, setFormData] = useState({
        orderId: unit.orderId || "",
        status: unit.status || "unassigned",
        unitType: unit.unitType || "",
        purchasePrice: unit.purchasePrice !== undefined && unit.purchasePrice !== null ? unit.purchasePrice : "",
        totalPurchasedAmount: unit.totalPurchasedAmount !== undefined && unit.totalPurchasedAmount !== null ? unit.totalPurchasedAmount : "",
        deliveryFee: unit.deliveryFee !== undefined && unit.deliveryFee !== null ? unit.deliveryFee : 0,
        reviewerName: unit.reviewerName || "",
        expectedArrivalDate: unit.expectedArrivalDate ? new Date(unit.expectedArrivalDate).toISOString().split("T")[0] : "",
        orderReceivedOn: unit.orderReceivedOn ? new Date(unit.orderReceivedOn).toISOString().split("T")[0] : "",
        season: unit.season || "",
        deliveryAddress: unit.deliveryAddress || unit.address || "",
        addressType: unit.addressType || "",
        mediatorPaymentStatus: unit.mediatorPaymentStatus || "",
        settlementStatus: unit.settlementStatus || "unsettled",
        settlementAmount: unit.settlementAmount !== undefined && unit.settlementAmount !== null ? unit.settlementAmount : 0,
        paymentMessage: unit.paymentMessage || "",
        mediatorMessage: unit.mediatorMessage || "",
        settlementMessage: unit.settlementMessage || "",
        verificationRejectionReason: unit.verificationRejectionReason || "",
    });

    // File selections (new files selected by user)
    const [selectedFiles, setSelectedFiles] = useState({});
    // Cleared flags for existing files
    const [clearedFiles, setClearedFiles] = useState({});
    // Zoom preview state
    const [zoomPreview, setZoomPreview] = useState(null);
    // Submission state
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleFilePick = (fieldName, file) => {
        if (!file) return;
        setSelectedFiles((prev) => ({ ...prev, [fieldName]: file }));
        setClearedFiles((prev) => ({ ...prev, [fieldName]: false }));
    };

    const handleClearSelectedFile = (fieldName) => {
        setSelectedFiles((prev) => {
            const copy = { ...prev };
            delete copy[fieldName];
            return copy;
        });
    };

    const handleMarkClearExisting = (fieldName) => {
        setClearedFiles((prev) => ({ ...prev, [fieldName]: true }));
        handleClearSelectedFile(fieldName);
    };

    const handleUndoClearExisting = (fieldName) => {
        setClearedFiles((prev) => ({ ...prev, [fieldName]: false }));
    };

    const proofDefinitions = [
        {
            key: "orderedScreenshot",
            label: "1. Order Confirmation Proof",
            icon: "🛒",
            existingUrl: unit.orderedScreenshot,
        },
        {
            key: "productReviewScreenshot",
            label: "2. Product Review Proof",
            icon: "⭐",
            existingUrl: unit.postDeliveryDetails?.productReviewScreenshot,
        },
        {
            key: "invoiceScreenshot",
            label: "3. Tax / Purchase Invoice",
            icon: "🧾",
            existingUrl: unit.postDeliveryDetails?.invoiceScreenshot,
        },
        {
            key: "sellerFeedbackScreenShot",
            label: "4. Seller Feedback Proof",
            icon: "💬",
            existingUrl: unit.postDeliveryDetails?.sellerFeedbackScreenShot,
        },
        {
            key: "paymentScreenshot",
            label: "5. Executive Advance Payment Proof",
            icon: "📤",
            existingUrl: unit.paymentScreenshot,
        },
        {
            key: "mediatorPaymentScreenshot",
            label: "6. Mediator Refund Proof",
            icon: "📥",
            existingUrl: unit.mediatorPaymentScreenshot,
        },
        {
            key: "settlementScreenshot",
            label: "7. Executive Settlement Payout Proof",
            icon: "💰",
            existingUrl: unit.settlementScreenshot,
        },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            const data = new FormData();

            // Append all scalar form fields
            Object.keys(formData).forEach((key) => {
                if (formData[key] !== undefined && formData[key] !== null) {
                    data.append(key, formData[key]);
                }
            });

            // Append newly selected files
            Object.keys(selectedFiles).forEach((fieldKey) => {
                if (selectedFiles[fieldKey]) {
                    data.append(fieldKey, selectedFiles[fieldKey]);
                }
            });

            // Append clear flags
            Object.keys(clearedFiles).forEach((fieldKey) => {
                if (clearedFiles[fieldKey]) {
                    const capitalKey = fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1);
                    data.append(`clear${capitalKey}`, "true");
                }
            });

            const res = await superAdminOverrideOrderUnitApi(order._id, unit._id, data);
            if (res.data?.success) {
                alert(`✓ Super Admin override successfully saved for Unit #${unitNumber}!`);
                if (onSuccess) {
                    onSuccess(res.data.order, res.data.unit);
                }
                onClose();
            }
        } catch (err) {
            console.error("Super Admin override failed:", err);
            setError(err.response?.data?.message || "Failed to update order unit with Super Admin override.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="sa-modal-backdrop" onClick={onClose}>
            <div className="sa-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="sa-modal-header">
                    <div className="sa-modal-title-group">
                        <div className="sa-crown-badge">👑</div>
                        <div>
                            <h2 className="sa-modal-title">
                                Super Admin Unit Override Editor
                                <span style={{ fontSize: "12px", background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "12px", fontWeight: "600" }}>
                                    Unit #{unitNumber}
                                </span>
                            </h2>
                            <p className="sa-modal-subtitle">
                                Product: <b>{order.productName}</b> • Brand: <b>{order.brand}</b> • Unit ID: <code style={{ color: "#ffffff" }}>{unit._id}</code>
                            </p>
                        </div>
                    </div>
                    <button type="button" className="sa-close-btn" onClick={onClose} title="Close">✕</button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 24px", fontSize: "13px", fontWeight: "600", borderBottom: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Modal Body */}
                <form id="sa-override-form" onSubmit={handleSubmit} className="sa-modal-body">
                    {/* Section 1: Order Identifier & Status */}
                    <div className="sa-section-group">
                        <h3 className="sa-section-heading">
                            <span>🔑</span> Order Identifiers &amp; Stage Status
                        </h3>
                        <div className="sa-grid-3">
                            <div className="sa-form-field">
                                <label className="sa-form-label">
                                    Amazon / Marketplace Order ID:
                                </label>
                                <input
                                    type="text"
                                    className="sa-form-input"
                                    placeholder="e.g. 403-1234567-8901234"
                                    value={formData.orderId}
                                    onChange={(e) => handleInputChange("orderId", e.target.value)}
                                />
                            </div>

                            <div className="sa-form-field">
                                <label className="sa-form-label">
                                    Unit Fulfillment Status:
                                </label>
                                <select
                                    className="sa-form-select"
                                    value={formData.status}
                                    onChange={(e) => handleInputChange("status", e.target.value)}
                                >
                                    <option value="unassigned">Unassigned</option>
                                    <option value="pending_payment">Pending Payment (Executive)</option>
                                    <option value="assigned">Assigned (to Mediator)</option>
                                    <option value="in_progress">In Progress (Mediator ordering)</option>
                                    <option value="pending_refund">Pending Refund (Review / Delivery)</option>
                                    <option value="pending_verification">Pending Verification (Under Review)</option>
                                    <option value="completed">Completed (Approved)</option>
                                </select>
                            </div>

                            <div className="sa-form-field">
                                <label className="sa-form-label">
                                    Specification / Classification:
                                </label>
                                <select
                                    className="sa-form-select"
                                    value={formData.unitType}
                                    onChange={(e) => handleInputChange("unitType", e.target.value)}
                                >
                                    <option value="">⚪ Unclassified</option>
                                    <option value="warehouse">🏢 Warehouse</option>
                                    <option value="empty">📦 Empty</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Financials & Settlement */}
                    <div className="sa-section-group">
                        <h3 className="sa-section-heading">
                            <span>💰</span> Pricing, Payouts &amp; Settlement
                        </h3>
                        <div className="sa-grid-3">
                            <div className="sa-form-field">
                                <label className="sa-form-label">
                                    Unit Purchase Price (₹):
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="sa-form-input"
                                    placeholder="₹ Price"
                                    value={formData.purchasePrice}
                                    onChange={(e) => handleInputChange("purchasePrice", e.target.value)}
                                />
                            </div>

                            <div className="sa-form-field">
                                <label className="sa-form-label">
                                    Total Purchased Amount (₹):
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="sa-form-input"
                                    placeholder="₹ Total"
                                    value={formData.totalPurchasedAmount}
                                    onChange={(e) => handleInputChange("totalPurchasedAmount", e.target.value)}
                                />
                            </div>

                            <div className="sa-form-field">
                                <label className="sa-form-label">
                                    Delivery / Shipping Fee (₹):
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="sa-form-input"
                                    placeholder="₹ Delivery Fee"
                                    value={formData.deliveryFee}
                                    onChange={(e) => handleInputChange("deliveryFee", e.target.value)}
                                />
                            </div>

                            <div className="sa-form-field">
                                <label className="sa-form-label">
                                    Settlement Status:
                                </label>
                                <select
                                    className="sa-form-select"
                                    value={formData.settlementStatus}
                                    onChange={(e) => handleInputChange("settlementStatus", e.target.value)}
                                >
                                    <option value="unsettled">Unsettled</option>
                                    <option value="pending_confirmation">Pending Confirmation</option>
                                    <option value="settled">Settled</option>
                                </select>
                            </div>

                            <div className="sa-form-field">
                                <label className="sa-form-label">
                                    Settlement Amount (₹):
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="sa-form-input"
                                    placeholder="₹ Settlement Amount"
                                    value={formData.settlementAmount}
                                    onChange={(e) => handleInputChange("settlementAmount", e.target.value)}
                                />
                            </div>

                            <div className="sa-form-field">
                                <label className="sa-form-label">
                                    Mediator Refund Status:
                                </label>
                                <select
                                    className="sa-form-select"
                                    value={formData.mediatorPaymentStatus}
                                    onChange={(e) => handleInputChange("mediatorPaymentStatus", e.target.value)}
                                >
                                    <option value="">None / Not Refunded</option>
                                    <option value="pending">Pending</option>
                                    <option value="verified">Verified</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Buyer & Logistics Info */}
                    <div className="sa-section-group">
                        <h3 className="sa-section-heading">
                            <span>📦</span> Buyer, Address &amp; Timeline Dates
                        </h3>
                        <div className="sa-grid-3">
                            <div className="sa-form-field">
                                <label className="sa-form-label">
                                    Reviewer / Buyer Name:
                                </label>
                                <input
                                    type="text"
                                    className="sa-form-input"
                                    placeholder="e.g. John Doe"
                                    value={formData.reviewerName}
                                    onChange={(e) => handleInputChange("reviewerName", e.target.value)}
                                />
                            </div>

                            <div className="sa-form-field">
                                <label className="sa-form-label">
                                    Expected Arrival Date:
                                </label>
                                <input
                                    type="date"
                                    className="sa-form-input"
                                    value={formData.expectedArrivalDate}
                                    onChange={(e) => handleInputChange("expectedArrivalDate", e.target.value)}
                                />
                            </div>

                            <div className="sa-form-field">
                                <label className="sa-form-label">
                                    Order Received On:
                                </label>
                                <input
                                    type="date"
                                    className="sa-form-input"
                                    value={formData.orderReceivedOn}
                                    onChange={(e) => handleInputChange("orderReceivedOn", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="sa-grid-2" style={{ marginTop: "12px" }}>
                            <div className="sa-form-field">
                                <label className="sa-form-label">
                                    Address Type:
                                </label>
                                <select
                                    className="sa-form-select"
                                    value={formData.addressType}
                                    onChange={(e) => handleInputChange("addressType", e.target.value)}
                                >
                                    <option value="">Default / Unspecified</option>
                                    <option value="executive_provided">📍 Executive Assigned Address</option>
                                    <option value="yourself">👤 Mediator (Yourself)</option>
                                    <option value="custom">✏️ Custom Address</option>
                                </select>
                            </div>

                            <div className="sa-form-field">
                                <label className="sa-form-label">
                                    Season / Campaign Label:
                                </label>
                                <input
                                    type="text"
                                    className="sa-form-input"
                                    placeholder="e.g. Diwali Fest, Summer 2026"
                                    value={formData.season}
                                    onChange={(e) => handleInputChange("season", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="sa-form-field" style={{ marginTop: "12px" }}>
                            <label className="sa-form-label">
                                Full Shipping / Delivery Address:
                            </label>
                            <textarea
                                className="sa-form-textarea"
                                placeholder="Street, City, Pincode, Landmark, Phone..."
                                value={formData.deliveryAddress}
                                onChange={(e) => handleInputChange("deliveryAddress", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Section 4: Communication Notes & Remarks */}
                    <div className="sa-section-group">
                        <h3 className="sa-section-heading">
                            <span>📝</span> Notes, Remarks &amp; UTR References
                        </h3>
                        <div className="sa-grid-2">
                            <div className="sa-form-field">
                                <label className="sa-form-label">
                                    Executive Advance Payment Note:
                                </label>
                                <textarea
                                    className="sa-form-textarea"
                                    placeholder="Executive transaction message / UTR..."
                                    value={formData.paymentMessage}
                                    onChange={(e) => handleInputChange("paymentMessage", e.target.value)}
                                />
                            </div>

                            <div className="sa-form-field">
                                <label className="sa-form-label">
                                    Mediator Refund Payment Note:
                                </label>
                                <textarea
                                    className="sa-form-textarea"
                                    placeholder="Mediator refund message / UTR..."
                                    value={formData.mediatorMessage}
                                    onChange={(e) => handleInputChange("mediatorMessage", e.target.value)}
                                />
                            </div>

                            <div className="sa-form-field">
                                <label className="sa-form-label">
                                    Final Settlement Note / UTR Reference:
                                </label>
                                <textarea
                                    className="sa-form-textarea"
                                    placeholder="Settlement UTR or remarks..."
                                    value={formData.settlementMessage}
                                    onChange={(e) => handleInputChange("settlementMessage", e.target.value)}
                                />
                            </div>

                            <div className="sa-form-field">
                                <label className="sa-form-label">
                                    Verification Revision / Rejection Reason:
                                </label>
                                <textarea
                                    className="sa-form-textarea"
                                    placeholder="Instructions if returned for revision..."
                                    value={formData.verificationRejectionReason}
                                    onChange={(e) => handleInputChange("verificationRejectionReason", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 5: Universal Proofs & Screenshots (Images & PDFs) */}
                    <div className="sa-section-group">
                        <h3 className="sa-section-heading">
                            <span>🖼️</span> Upload, Replace or Remove Proofs (Images &amp; PDFs)
                        </h3>
                        <p style={{ margin: "0 0 14px", fontSize: "12px", color: "var(--slate-500)" }}>
                            Upload new replacement files (PNG, JPG, WEBP, PDF) for any proof. Changes take effect upon clicking Save.
                        </p>

                        <div className="sa-proofs-grid">
                            {proofDefinitions.map((proof) => {
                                const isCleared = Boolean(clearedFiles[proof.key]);
                                const newFile = selectedFiles[proof.key];
                                const hasExisting = Boolean(proof.existingUrl && !isCleared);
                                const isPdf = hasExisting && isPdfUrl(proof.existingUrl);

                                return (
                                    <div key={proof.key} className="sa-proof-card">
                                        <div className="sa-proof-card-header">
                                            <span className="sa-proof-name">
                                                <span>{proof.icon}</span>
                                                <span>{proof.label}</span>
                                            </span>
                                            {newFile && (
                                                <span style={{ fontSize: "10px", background: "#ecfdf5", color: "#059669", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                                                    NEW FILE
                                                </span>
                                            )}
                                        </div>

                                        {/* Thumbnail Preview Area */}
                                        <div className="sa-proof-thumb-area">
                                            {newFile ? (
                                                <div style={{ textAlign: "center", padding: "8px" }}>
                                                    <div style={{ fontSize: "28px" }}>{newFile.type?.includes("pdf") ? "📄" : "🖼️"}</div>
                                                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#166534", marginTop: "2px", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {newFile.name}
                                                    </div>
                                                    <div style={{ fontSize: "10px", color: "#64748b" }}>
                                                        {(newFile.size / 1024).toFixed(1)} KB
                                                    </div>
                                                </div>
                                            ) : hasExisting ? (
                                                isPdf ? (
                                                    <div
                                                        className="sa-pdf-icon-box"
                                                        onClick={() => setZoomPreview({ url: proof.existingUrl, title: proof.label })}
                                                    >
                                                        <span style={{ fontSize: "32px" }}>📄</span>
                                                        <span>PDF Document</span>
                                                        <span style={{ fontSize: "10px", color: "#2563eb" }}>🔍 View PDF</span>
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={proof.existingUrl}
                                                        alt={proof.label}
                                                        className="sa-proof-img"
                                                        onClick={() => setZoomPreview({ url: proof.existingUrl, title: proof.label })}
                                                    />
                                                )
                                            ) : isCleared ? (
                                                <div style={{ color: "#dc2626", fontSize: "11px", fontWeight: "700" }}>
                                                    🗑️ Marked for Removal
                                                </div>
                                            ) : (
                                                <div className="sa-empty-proof-text">No proof uploaded</div>
                                            )}
                                        </div>

                                        {/* File Input and Action Buttons */}
                                        <div className="sa-file-input-wrapper">
                                            <label className="sa-file-upload-btn">
                                                <span>📁</span>
                                                <span>{hasExisting ? "Replace Image / PDF" : "Upload Image / PDF"}</span>
                                                <input
                                                    type="file"
                                                    accept="image/*,application/pdf"
                                                    style={{ display: "none" }}
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) {
                                                            handleFilePick(proof.key, e.target.files[0]);
                                                        }
                                                    }}
                                                />
                                            </label>

                                            {newFile && (
                                                <button
                                                    type="button"
                                                    className="sa-clear-proof-btn"
                                                    onClick={() => handleClearSelectedFile(proof.key)}
                                                >
                                                    Cancel selected file ✕
                                                </button>
                                            )}

                                            {!newFile && hasExisting && (
                                                <button
                                                    type="button"
                                                    className="sa-clear-proof-btn"
                                                    onClick={() => handleMarkClearExisting(proof.key)}
                                                >
                                                    Delete existing proof 🗑️
                                                </button>
                                            )}

                                            {isCleared && (
                                                <button
                                                    type="button"
                                                    className="sa-clear-proof-btn"
                                                    style={{ color: "#2563eb" }}
                                                    onClick={() => handleUndoClearExisting(proof.key)}
                                                >
                                                    Undo remove ↩
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="sa-modal-footer">
                    <div className="sa-footer-info">
                        <span>🛡️</span>
                        <span><b>Super Admin Protected:</b> Only sessions authorized via AdminShubhamsecreate can apply these overrides.</span>
                    </div>

                    <div className="sa-footer-btn-group">
                        <button type="button" className="sa-cancel-btn" onClick={onClose} disabled={saving}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="sa-override-form"
                            className="sa-save-btn"
                            disabled={saving}
                        >
                            <span>💾</span>
                            <span>{saving ? "Saving Overrides..." : "Save All Overrides (Super Admin)"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Proof Zoom Preview Modal */}
            {zoomPreview && (
                <ProofPreviewModal
                    url={zoomPreview.url}
                    title={zoomPreview.title}
                    onClose={() => setZoomPreview(null)}
                />
            )}
        </div>
    );
}

