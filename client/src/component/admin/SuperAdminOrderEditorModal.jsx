import { useState } from "react";
import { superAdminOverrideMasterOrderApi } from "../../services/admin";
import "../../styles/superAdminModal.css";

export default function SuperAdminOrderEditorModal({
    isOpen,
    onClose,
    order,
    onSuccess,
}) {
    if (!isOpen || !order) return null;

    const [formData, setFormData] = useState({
        productName: order.productName || "",
        brand: order.brand || "",
        price: order.price || "",
        orderPlatform: order.orderPlatform || "",
        productLink: order.productLink || "",
        season: order.season || "",
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            const res = await superAdminOverrideMasterOrderApi(order._id, formData);
            if (res.data?.success) {
                alert("✓ Master Order details updated successfully via Super Admin override!");
                if (onSuccess) {
                    onSuccess(res.data.order);
                }
                onClose();
            }
        } catch (err) {
            console.error("Master order override failed:", err);
            setError(err.response?.data?.message || "Failed to update master order details.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="sa-modal-backdrop" onClick={onClose}>
            <div className="sa-modal-card" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="sa-modal-header">
                    <div className="sa-modal-title-group">
                        <div className="sa-crown-badge">👑</div>
                        <div>
                            <h2 className="sa-modal-title">Edit Master Order (Super Admin)</h2>
                            <p className="sa-modal-subtitle">
                                Order ID: <code style={{ color: "#ffffff" }}>{order._id}</code>
                            </p>
                        </div>
                    </div>
                    <button type="button" className="sa-close-btn" onClick={onClose} title="Close">✕</button>
                </div>

                {error && (
                    <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 24px", fontSize: "13px", fontWeight: "600", borderBottom: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <form id="sa-order-override-form" onSubmit={handleSubmit} className="sa-modal-body">
                    <div className="sa-form-field">
                        <label className="sa-form-label">Product Name / Title:</label>
                        <input
                            type="text"
                            className="sa-form-input"
                            value={formData.productName}
                            onChange={(e) => handleInputChange("productName", e.target.value)}
                            required
                        />
                    </div>

                    <div className="sa-grid-2">
                        <div className="sa-form-field">
                            <label className="sa-form-label">Brand Name:</label>
                            <input
                                type="text"
                                className="sa-form-input"
                                value={formData.brand}
                                onChange={(e) => handleInputChange("brand", e.target.value)}
                                required
                            />
                        </div>

                        <div className="sa-form-field">
                            <label className="sa-form-label">Base Order Price (₹):</label>
                            <input
                                type="text"
                                className="sa-form-input"
                                value={formData.price}
                                onChange={(e) => handleInputChange("price", e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="sa-grid-2">
                        <div className="sa-form-field">
                            <label className="sa-form-label">Order Platform:</label>
                            <input
                                type="text"
                                className="sa-form-input"
                                placeholder="e.g. Amazon, Flipkart"
                                value={formData.orderPlatform}
                                onChange={(e) => handleInputChange("orderPlatform", e.target.value)}
                                required
                            />
                        </div>

                        <div className="sa-form-field">
                            <label className="sa-form-label">Season / Campaign:</label>
                            <input
                                type="text"
                                className="sa-form-input"
                                placeholder="e.g. Q4 2026, Summer Fest"
                                value={formData.season}
                                onChange={(e) => handleInputChange("season", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="sa-form-field">
                        <label className="sa-form-label">Product URL / Marketplace Link:</label>
                        <input
                            type="url"
                            className="sa-form-input"
                            placeholder="https://www.amazon.in/dp/..."
                            value={formData.productLink}
                            onChange={(e) => handleInputChange("productLink", e.target.value)}
                            required
                        />
                    </div>
                </form>

                <div className="sa-modal-footer">
                    <div className="sa-footer-info">
                        <span>🛡️</span>
                        <span>Super Admin Master Control</span>
                    </div>

                    <div className="sa-footer-btn-group">
                        <button type="button" className="sa-cancel-btn" onClick={onClose} disabled={saving}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="sa-order-override-form"
                            className="sa-save-btn"
                            disabled={saving}
                        >
                            <span>💾</span>
                            <span>{saving ? "Saving..." : "Save Order"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

