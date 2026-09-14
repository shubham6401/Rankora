import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdminApi } from "../../services/admin";
import "../../styles/auth.css";

export default function AdminLogin() {
    const [username, setUsername] = useState("admin");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!password) {
            setError("Please enter the admin password");
            return;
        }

        try {
            setLoading(true);
            const res = await loginAdminApi(username, password);
            if (res.data.success) {
                localStorage.removeItem("adminBackupSession");
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("user", JSON.stringify(res.data.user));
                navigate("/admin/dashboard");
            } else {
                setError(res.data.message || "Failed to log in as admin");
            }
        } catch (err) {
            console.error("Admin login error:", err);
            setError(err.response?.data?.message || "Invalid admin credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-card" style={{ maxWidth: "480px" }}>
                <div className="auth-header">
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "56px",
                        height: "56px",
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                        boxShadow: "0 8px 20px rgba(124, 58, 237, 0.35)",
                        fontSize: "26px",
                        marginBottom: "12px"
                    }}>
                        🛡️
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <span className="auth-role-pill pill-admin">System Administrator</span>
                    </div>
                    <h1 className="auth-title">Admin Control Console</h1>
                    <p className="auth-subtitle">
                        Root operations oversight, executive creation & brand tracking
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: "10px 14px",
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        color: "#dc2626",
                        fontSize: "13px",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}>
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="admin-username" className="form-label">Administrator Username</label>
                        <input
                            id="admin-username"
                            type="text"
                            className="form-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="admin-password" className="form-label">Console Password</label>
                        <input
                            id="admin-password"
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    <button
                        id="admin-login-submit"
                        type="submit"
                        className="auth-submit-btn btn-admin"
                        disabled={loading}
                    >
                        {loading ? "Authenticating Admin..." : "Access Control Center →"}
                    </button>
                </form>

                <div className="auth-footer">
                    <button
                        type="button"
                        onClick={() => navigate("/role-selection")}
                        className="auth-back-link"
                        style={{ background: "none", border: "none", cursor: "pointer" }}
                    >
                        ← Return to Portal Selection
                    </button>
                </div>
            </div>
        </div>
    );
}
