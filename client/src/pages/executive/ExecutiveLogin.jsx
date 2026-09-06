import { useState } from "react";
import { loginExecutiveUser } from "../../services/authService";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/auth.css";

export default function ExecutiveLogin() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        password: "",
        teamCode: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const loginResponse = await loginExecutiveUser(formData);
            localStorage.setItem("token", loginResponse.data.token);
            localStorage.setItem("user", JSON.stringify(loginResponse.data.user));
            navigate("/dashboard-executive");
        } catch (err) {
            console.error("Executive login error:", err);
            setError(err.response?.data?.message || "Invalid executive credentials. Please check your details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="auth-role-pill pill-executive">Executive Portal</span>
                    <h1 className="auth-title">Executive Sign In</h1>
                    <p className="auth-subtitle">Access executive operations and campaign pipelines</p>
                </div>

                {error && <div className="auth-error-alert">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="exec-name">Name</label>
                        <input 
                            id="exec-name"
                            className="form-input"
                            value={formData.name} 
                            type="text" 
                            placeholder="Enter executive name"
                            required
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="exec-teamCode">Team Code</label>
                        <input 
                            id="exec-teamCode"
                            className="form-input"
                            value={formData.teamCode} 
                            type="text" 
                            placeholder="Enter team authorization code"
                            required
                            onChange={(e) => setFormData({ ...formData, teamCode: e.target.value })} 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="exec-password">Password</label>
                        <input 
                            id="exec-password"
                            className="form-input"
                            value={formData.password} 
                            type="password" 
                            placeholder="Enter secret password"
                            required
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                        />
                    </div>

                    <button 
                        id="exec-submit-btn"
                        className="auth-submit-btn auth-btn-executive" 
                        type="submit" 
                        disabled={loading}
                    >
                        {loading ? "Authenticating..." : "Sign In as Executive"}
                    </button>
                </form>

                <div className="auth-footer">
                    <div>
                        Don't have an executive account?{" "}
                        <Link to="/signup-executive" className="auth-link">Sign Up</Link>
                    </div>
                    <Link to="/role-selection" className="auth-back-link">
                        ← Back to Role Selection
                    </Link>
                </div>
            </div>
        </div>
    );
}