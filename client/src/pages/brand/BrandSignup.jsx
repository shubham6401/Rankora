import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUpBrandUser } from "../../services/authService";
import "../../styles/auth.css";

export default function BrandSignup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        password: "",
        brand: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");

        if (!formData.name.trim()) {
            setError("Representative name is required");
            return;
        }
        if (!formData.brand.trim()) {
            setError("Brand name is required");
            return;
        }
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        try {
            setLoading(true);
            await signUpBrandUser(formData);
            setSuccessMsg("Brand account registered successfully! Redirecting to login...");
            setTimeout(() => {
                navigate("/login-brand", { replace: true });
            }, 1200);
        } catch (err) {
            console.error("Brand signup error:", err);
            setError(err.response?.data?.message || "Failed to register brand partner. Please check details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="auth-role-pill pill-brand">Brand Portal</span>
                    <h1 className="auth-title">Register Brand</h1>
                    <p className="auth-subtitle">Onboard your brand for nationwide promotion campaigns</p>
                </div>

                {error && <div className="auth-error-alert">{error}</div>}
                {successMsg && <div className="auth-success-alert">{successMsg}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="brand-reg-name">Representative Name</label>
                        <input 
                            id="brand-reg-name"
                            className="form-input"
                            value={formData.name} 
                            type="text" 
                            placeholder="Enter contact person name"
                            required
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="brand-reg-brand">Brand / Company Name</label>
                        <input 
                            id="brand-reg-brand"
                            className="form-input"
                            value={formData.brand} 
                            type="text" 
                            placeholder="e.g. Nike, Apple, Puma"
                            required
                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })} 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="brand-reg-password">Password</label>
                        <input 
                            id="brand-reg-password"
                            className="form-input"
                            value={formData.password} 
                            type="password" 
                            placeholder="Minimum 6 characters"
                            required
                            minLength={6}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                        />
                    </div>

                    <button 
                        id="brand-reg-submit-btn"
                        className="auth-submit-btn auth-btn-brand" 
                        type="submit" 
                        disabled={loading}
                    >
                        {loading ? "Registering..." : "Create Brand Account"}
                    </button>
                </form>

                <div className="auth-footer">
                    <div>
                        Already registered?{" "}
                        <Link to="/login-brand" className="auth-link">Sign In</Link>
                    </div>
                    <Link to="/role-selection" className="auth-back-link">
                        ← Back to Role Selection
                    </Link>
                </div>
            </div>
        </div>
    );
}