import { useState, useEffect } from "react";
import { mediatorOrderSubmit, getOrder } from "../../services/orders";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/orderForm.css";

export default function OrderSubmission() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [order, setOrder] = useState(null);
    const [formData, setFormData] = useState({});
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
            setError("Could not retrieve order details.");
        } finally {
            setLoading(false);
        }
    };

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
                        Record the e-commerce purchase details and order confirmation screenshot for this unit.
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
                            <span className="context-label">Price: </span>₹{order.price}
                        </div>
                        <div className="context-item">
                            <span className="context-label">Units Left: </span>
                            <b style={{ color: "var(--primary-600)" }}>{unitsLeft || 1} Unit(s) Remaining</b>
                        </div>
                        <div className="context-item">
                            <span className="context-label">Executive: </span>{order.executiveName || "N/A"}
                        </div>
                        <div className="context-item">
                            <span className="context-label">Team Code: </span>{order.teamCode || "N/A"}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="form-body">
                    <div className="form-field">
                        <label className="form-field-label">
                            E-Commerce Order ID <span className="form-field-req">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-input-text"
                            placeholder="e.g. 402-1234567-8901234 (Amazon / Flipkart)"
                            required
                            onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                        />
                    </div>

                    <div className="form-field">
                        <label className="form-field-label">
                            Order Confirmation Screenshot <span className="form-field-req">*</span>
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            className="form-file-input"
                            required
                            onChange={(e) => setFormData({ ...formData, orderedScreenshot: e.target.files[0] })}
                        />
                    </div>

                    <div className="form-row-2col">
                        <div className="form-field">
                            <label className="form-field-label">
                                Expected Arrival Date <span className="form-field-req">*</span>
                            </label>
                            <input
                                type="date"
                                className="form-input-text"
                                required
                                onChange={(e) => setFormData({ ...formData, expectedArrivalDate: e.target.value })}
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-field-label">
                                Order Received On (Optional)
                            </label>
                            <input
                                type="date"
                                className="form-input-text"
                                onChange={(e) => setFormData({ ...formData, orderReceivedOn: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-row-2col">
                        <div className="form-field">
                            <label className="form-field-label">
                                Reviewer Account Name <span className="form-field-req">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-input-text"
                                placeholder="Public reviewer profile name"
                                required
                                onChange={(e) => setFormData({ ...formData, reviewerName: e.target.value })}
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-field-label">
                                Season / Campaign Tag
                            </label>
                            <input
                                type="text"
                                className="form-input-text"
                                placeholder="e.g. Spring 2026 Promo"
                                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-field">
                        <label className="form-field-label">
                            Delivery Shipping Address <span className="form-field-req">*</span>
                        </label>
                        <textarea
                            className="form-textarea-input"
                            rows="3"
                            placeholder="Complete delivery address where product is shipped"
                            required
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

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
        </div>
    );
}