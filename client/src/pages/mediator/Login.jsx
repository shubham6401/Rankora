import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../../services/authService";
import "../../styles/auth.css";

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        mediatorCode: "",
        password: "",
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            setLoading(true);
            const response = await loginUser(formData);
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            navigate("/panel-mediator");
        } catch (err) {
            console.error("Mediator login error:", err);
            setError(err.response?.data?.message || "Invalid mediator credentials. Please verify your details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="auth-role-pill pill-mediator">Mediator Portal</span>
                    <h1 className="auth-title">Mediator Sign In</h1>
                    <p className="auth-subtitle">Access your assigned orders and financial settlements</p>
                </div>

                {error && <div className="auth-error-alert">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="med-name">Name</label>
                        <input 
                            id="med-name"
                            className="form-input"
                            value={formData.name} 
                            type="text" 
                            placeholder="Enter mediator name"
                            required
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="med-code">Mediator Code</label>
                        <input 
                            id="med-code"
                            className="form-input"
                            value={formData.mediatorCode} 
                            type="text" 
                            placeholder="Enter your mediator code"
                            required
                            onChange={(e) => setFormData({ ...formData, mediatorCode: e.target.value })} 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="med-password">Password</label>
                        <input 
                            id="med-password"
                            className="form-input"
                            value={formData.password} 
                            type="password" 
                            placeholder="Enter account password"
                            required
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                        />
                    </div>

                    <button 
                        id="med-login-btn"
                        className="auth-submit-btn auth-btn-mediator" 
                        type="submit" 
                        disabled={loading}
                    >
                        {loading ? "Authenticating..." : "Sign In as Mediator"}
                    </button>
                </form>

                <div className="auth-footer">
                    <div>
                        New mediator?{" "}
                        <Link to="/signup-mediator" className="auth-link">Register Account</Link>
                    </div>
                    <Link to="/role-selection" className="auth-back-link">
                        ← Back to Role Selection
                    </Link>
                </div>
            </div>
        </div>
    );
}