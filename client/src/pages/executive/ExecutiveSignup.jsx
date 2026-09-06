import { useState } from "react";
import { signUpExecutiveUser } from "../../services/authService";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/auth.css";

export default function ExecutiveSignup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        password: "",
        teamCode: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        setLoading(true);

        try {
            await signUpExecutiveUser(formData);
            setSuccessMsg("Account registered successfully! Redirecting to login...");
            setTimeout(() => {
                navigate("/login-executive");
            }, 1200);
        } catch (err) {
            console.error("Executive signup error:", err);
            setError(err.response?.data?.message || "Failed to register executive account. Please check credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="auth-role-pill pill-executive">Executive Portal</span>
                    <h1 className="auth-title">Create Executive Account</h1>
                    <p className="auth-subtitle">Register to lead campaigns and manage mediator teams</p>
                </div>

                {error && <div className="auth-error-alert">{error}</div>}
                {successMsg && <div className="auth-success-alert">{successMsg}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="exec-reg-name">Full Name</label>
                        <input 
                            id="exec-reg-name"
                            className="form-input"
                            value={formData.name} 
                            type="text" 
                            placeholder="Enter executive name"
                            required
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="exec-reg-teamCode">Team Authorization Code</label>
                        <input 
                            id="exec-reg-teamCode"
                            className="form-input"
                            value={formData.teamCode} 
                            type="text" 
                            placeholder="Assign your team code"
                            required
                            onChange={(e) => setFormData({ ...formData, teamCode: e.target.value })} 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="exec-reg-password">Password</label>
                        <input 
                            id="exec-reg-password"
                            className="form-input"
                            value={formData.password} 
                            type="password" 
                            placeholder="Set account password (min 6 characters)"
                            required
                            minLength={6}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                        />
                    </div>

                    <button 
                        id="exec-reg-submit-btn"
                        className="auth-submit-btn auth-btn-executive" 
                        type="submit" 
                        disabled={loading}
                    >
                        {loading ? "Registering..." : "Create Executive Account"}
                    </button>
                </form>

                <div className="auth-footer">
                    <div>
                        Already registered?{" "}
                        <Link to="/login-executive" className="auth-link">Sign In</Link>
                    </div>
                    <Link to="/role-selection" className="auth-back-link">
                        ← Back to Role Selection
                    </Link>
                </div>
            </div>
        </div>
    );
}