import { useState } from "react";
import { signUpUser } from "../../services/authService";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/auth.css";

export default function SignUP() {
    const [formData, setFormData] = useState({
        name: "",
        mediatorCode: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");

        if (!formData.name.trim()) {
            setError("Mediator name is required");
            return;
        }
        if (!formData.mediatorCode.trim()) {
            setError("Mediator authorization code is required");
            return;
        }
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        try {
            setLoading(true);
            await signUpUser(formData);
            setSuccessMsg("Mediator registered successfully! Redirecting to login...");
            setTimeout(() => {
                navigate("/login-mediator");
            }, 300);
        } catch (err) {
            console.error("Mediator signup error:", err);
            setError(err.response?.data?.message || "Failed to register mediator. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="auth-role-pill pill-mediator">Mediator Portal</span>
                    <h1 className="auth-title">Mediator Registration</h1>
                    <p className="auth-subtitle">Join the mediator fulfillment network</p>
                </div>

                {error && <div className="auth-error-alert">{error}</div>}
                {successMsg && <div className="auth-success-alert">{successMsg}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="med-reg-name">Mediator Name</label>
                        <input 
                            id="med-reg-name"
                            className="form-input"
                            value={formData.name} 
                            type="text" 
                            placeholder="Enter full name"
                            required
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="med-reg-code">Mediator Code</label>
                        <input 
                            id="med-reg-code"
                            className="form-input"
                            value={formData.mediatorCode} 
                            type="text" 
                            placeholder="Create/Enter your mediator code"
                            required
                            onChange={(e) => setFormData({ ...formData, mediatorCode: e.target.value })} 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="med-reg-password">Password</label>
                        <input 
                            id="med-reg-password"
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
                        id="med-reg-submit-btn"
                        className="auth-submit-btn auth-btn-mediator" 
                        type="submit" 
                        disabled={loading}
                    >
                        {loading ? "Registering..." : "Create Mediator Account"}
                    </button>
                </form>

                <div className="auth-footer">
                    <div>
                        Already registered?{" "}
                        <Link to="/login-mediator" className="auth-link">Sign In</Link>
                    </div>
                    <Link to="/role-selection" className="auth-back-link">
                        ← Back to Role Selection
                    </Link>
                </div>
            </div>
        </div>
    );
}