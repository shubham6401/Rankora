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
        <div className="login-container">
            <div className="login-card">
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "60px",
                        height: "60px",
                        borderRadius: "16px",
                        background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                        boxShadow: "0 8px 24px rgba(99, 102, 241, 0.4)",
                        fontSize: "2rem",
                        marginBottom: "1rem"
                    }}>
                        🛡️
                    </div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#f8fafc", margin: 0 }}>
                        Admin Control Console
                    </h1>
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "0.4rem" }}>
                        Master executive creation, global brand tracking & order oversight
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: "0.75rem 1rem",
                        backgroundColor: "rgba(239, 68, 68, 0.15)",
                        border: "1px solid rgba(239, 68, 68, 0.4)",
                        borderRadius: "8px",
                        color: "#f87171",
                        fontSize: "0.875rem",
                        marginBottom: "1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                    }}>
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="admin-username" style={{ color: "#cbd5e1" }}>Admin Username</label>
                        <input
                            id="admin-username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="admin"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="admin-password" style={{ color: "#cbd5e1" }}>Password</label>
                        <input
                            id="admin-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    <div style={{
                        background: "rgba(99, 102, 241, 0.1)",
                        border: "1px dashed rgba(99, 102, 241, 0.3)",
                        padding: "0.6rem 0.8rem",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        color: "#a5b4fc",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <span>Default Password: <code>@Admin!@#</code></span>
                        <button
                            type="button"
                            onClick={() => setPassword("@Admin!@#")}
                            style={{
                                background: "none",
                                border: "none",
                                color: "#818cf8",
                                cursor: "pointer",
                                textDecoration: "underline",
                                fontSize: "0.75rem"
                            }}
                        >
                            Auto-fill
                        </button>
                    </div>

                    <button
                        id="admin-login-submit"
                        type="submit"
                        className="login-btn"
                        disabled={loading}
                        style={{ marginTop: "1rem" }}
                    >
                        {loading ? "Authenticating Master Admin..." : "Access Control Center →"}
                    </button>
                </form>

                <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#64748b",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            textDecoration: "underline"
                        }}
                    >
                        ← Back to Role Selection
                    </button>
                </div>
            </div>
        </div>
    );
}
