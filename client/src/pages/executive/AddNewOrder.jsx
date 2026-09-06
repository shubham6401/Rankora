import { useState, useEffect } from "react";
import { addExecutiveOrder, fetchAllBrands } from "../../services/executive/order";
import { useNavigate } from "react-router-dom";
import "../../styles/orderForm.css";

export default function AddNewOrder() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({});
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const platforms = [
        "Amazon",
        "Flipkart",
        "Myntra",
        "Ajio",
        "Meesho"
    ];

    useEffect(() => {
        handleFetchAllBrands();
    }, []);

    const handleFetchAllBrands = async () => {
        try {
            const response = await fetchAllBrands();
            setBrands(response.data.users || []);
        } catch (err) {
            console.error("Error loading brands:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            setLoading(true);
            const data = {
                ...formData,
                teamCode: user["teamCode"],
                executiveName: user["name"],
            };

            await addExecutiveOrder(data);
            navigate("/dashboard-executive");
        } catch (err) {
            console.error("Order submission error:", err);
            setError(err.response?.data?.message || "Error submitting order. Please verify details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-page-container">
            <button 
                type="button" 
                className="form-nav-back"
                onClick={() => navigate("/dashboard-executive")}
            >
                ← Back to Executive Dashboard
            </button>

            <div className="form-card">
                <div className="form-header">
                    <span className="form-header-badge badge-blue">Campaign Management</span>
                    <h1 className="form-title">Create New Brand Order Batch</h1>
                    <p className="form-subtitle">
                        Register a new product campaign order batch for mediator allocation and fulfillment.
                    </p>
                </div>

                {error && <div style={{ color: "#e11d48", padding: "10px", background: "#fff1f2", borderRadius: "6px", marginBottom: "16px", fontSize: "13px" }}>{error}</div>}

                <form onSubmit={handleSubmit} className="form-body">
                    {/* Readonly Executive Info */}
                    <div className="context-summary-box">
                        <div className="context-summary-title">Executive Identity</div>
                        <div className="context-grid">
                            <div className="context-item">
                                <span className="context-label">Executive Name: </span>
                                {user["name"] || "Current Executive"}
                            </div>
                            <div className="context-item">
                                <span className="context-label">Team Code: </span>
                                {user["teamCode"] || "N/A"}
                            </div>
                        </div>
                    </div>

                    <div className="form-field">
                        <label className="form-field-label">
                            Product Name <span className="form-field-req">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-input-text"
                            placeholder="e.g. Wireless Noise-Cancelling Earbuds Pro"
                            required
                            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                        />
                    </div>

                    <div className="form-field">
                        <label className="form-field-label">
                            Product Link <span className="form-field-req">*</span>
                        </label>
                        <input
                            type="url"
                            className="form-input-text"
                            placeholder="https://www.amazon.in/dp/..."
                            required
                            onChange={(e) => setFormData({ ...formData, productLink: e.target.value })}
                        />
                    </div>

                    <div className="form-row-2col">
                        <div className="form-field">
                            <label className="form-field-label">
                                Brand Partner <span className="form-field-req">*</span>
                            </label>
                            <select
                                className="form-select-dropdown"
                                value={formData.brandUserId || ""}
                                required
                                onChange={(e) => setFormData({ ...formData, brandUserId: e.target.value })}
                            >
                                <option value="">Select Brand</option>
                                {brands.map((brand) => (
                                    <option key={brand._id} value={brand._id}>
                                        {brand.brand} ({brand.name})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-field">
                            <label className="form-field-label">
                                Order Platform <span className="form-field-req">*</span>
                            </label>
                            <select
                                className="form-select-dropdown"
                                value={formData.orderPlatform || ""}
                                required
                                onChange={(e) => setFormData({ ...formData, orderPlatform: e.target.value })}
                            >
                                <option value="">Select Platform</option>
                                {platforms.map((platform) => (
                                    <option key={platform} value={platform}>
                                        {platform}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row-2col">
                        <div className="form-field">
                            <label className="form-field-label">
                                Unit Quantity <span className="form-field-req">*</span>
                            </label>
                            <input
                                type="number"
                                className="form-input-text"
                                placeholder="Total units (e.g. 20)"
                                min="1"
                                required
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-field-label">
                                Price Per Unit (₹) <span className="form-field-req">*</span>
                            </label>
                            <input
                                type="number"
                                className="form-input-text"
                                placeholder="e.g. 1499"
                                min="0"
                                required
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-submit-row">
                        <button
                            type="button"
                            className="form-nav-back"
                            onClick={() => navigate("/dashboard-executive")}
                            style={{ margin: 0 }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="form-btn-submit btn-theme-blue"
                            disabled={loading}
                        >
                            {loading ? "Registering Order..." : "Create Order Batch →"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}