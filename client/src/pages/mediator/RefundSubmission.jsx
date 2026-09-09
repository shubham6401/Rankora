import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { mediatorRefundSubmit, getOrder } from "../../services/orders";
import "../../styles/orderForm.css";

export default function RefundSubmission() {
    const { id } = useParams();
    const navigate = useNavigate();

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
            setError("Failed to retrieve order details.");
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
                        Upload screenshots of the review, invoice, and seller feedback. Your submission will be sent to the Executive team for verification before moving to Completed.
                    </p>
                </div>

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
                            <span className="context-label">Order ID: </span>{order.orderId || "Submitted"}
                        </div>
                        <div className="context-item">
                            <span className="context-label">Price: </span>₹{order.price}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="form-body">
                    <div className="form-field">
                        <label className="form-field-label">
                            Product Review Screenshot <span className="form-field-req">*</span>
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            className="form-file-input"
                            required
                            onChange={(e) =>
                                setFormData({ ...formData, productReviewScreenshot: e.target.files[0] })
                            }
                        />
                    </div>

                    <div className="form-field">
                        <label className="form-field-label">
                            Platform Invoice Screenshot (Optional)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            className="form-file-input"
                            onChange={(e) =>
                                setFormData({ ...formData, invoiceScreenshot: e.target.files[0] })
                            }
                        />
                    </div>

                    <div className="form-field">
                        <label className="form-field-label">
                            Seller Feedback Screenshot (Optional)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            className="form-file-input"
                            onChange={(e) =>
                                setFormData({ ...formData, sellerFeedbackScreenShot: e.target.files[0] })
                            }
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
                            className="form-btn-submit btn-theme-purple"
                            disabled={submitting}
                        >
                            {submitting ? "Uploading Proofs..." : "Complete & Finalize Order →"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}