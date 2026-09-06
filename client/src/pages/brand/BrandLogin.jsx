import { useState } from "react";
import { loginBrandUser } from "../../services/authService";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/auth.css";

export default function BrandLogin() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        password: "",
        brand: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            setLoading(true);
            const loginResponse = await loginBrandUser(formData);
            localStorage.setItem("token", loginResponse.data.token);
            localStorage.setItem("user", JSON.stringify(loginResponse.data.user));
            navigate("/dashboard-brand");
        } catch (err) {
            console.error("Brand login error:", err);
            setError(err.response?.data?.message || "Invalid brand credentials. Please check your brand key and details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="auth-role-pill pill-brand">Brand Portal</span>
                    <h1 className="auth-title">Brand Sign In</h1>
                    <p className="auth-subtitle">Monitor your brand campaigns & live fulfillment pipeline</p>
                </div>

                {error && <div className="auth-error-alert">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="brand-name">Brand Representative Name</label>
                        <input 
                            id="brand-name"
                            className="form-input"
                            value={formData.name} 
                            type="text" 
                            placeholder="Enter your name"
                            required
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="brand-title">Brand / Company Name</label>
                        <input 
                            id="brand-title"
                            className="form-input"
                            value={formData.brand} 
                            type="text" 
                            placeholder="e.g. Nike, Apple, Puma"
                            required
                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })} 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="brand-password">Password</label>
                        <input 
                            id="brand-password"
                            className="form-input"
                            value={formData.password} 
                            type="password" 
                            placeholder="Enter password"
                            required
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                        />
                    </div>

                    <button 
                        id="brand-login-btn"
                        className="auth-submit-btn auth-btn-brand" 
                        type="submit" 
                        disabled={loading}
                    >
                        {loading ? "Authenticating..." : "Sign In to Brand Portal"}
                    </button>
                </form>

                <div className="auth-footer">
                    <div>
                        New brand partner?{" "}
                        <Link to="/signup-brand" className="auth-link">Register Brand</Link>
                    </div>
                    <Link to="/role-selection" className="auth-back-link">
                        ← Back to Role Selection
                    </Link>
                </div>
            </div>
        </div>
    );
}