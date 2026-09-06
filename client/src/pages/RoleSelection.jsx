import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginExecutiveUser, loginUser, loginBrandUser } from "../services/authService";
import "../styles/roleSelection.css";

export default function RoleSelection() {
    const navigate = useNavigate();
    const [loggingInRole, setLoggingInRole] = useState(null);

    const handleInstantDemo = async (role) => {
        try {
            setLoggingInRole(role);
            if (role === "executive") {
                const res = await loginExecutiveUser({ teamCode: "DEMO_EXEC", password: "demo1234" });
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("user", JSON.stringify(res.data.user));
                navigate("/dashboard-executive");
            } else if (role === "mediator") {
                const res = await loginUser({ mediatorCode: "DEMO_MED", password: "demo1234" });
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("user", JSON.stringify(res.data.user));
                navigate("/panel-mediator");
            } else if (role === "brand") {
                const res = await loginBrandUser({ brand: "DEMO_BRAND", password: "demo1234" });
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("user", JSON.stringify(res.data.user));
                navigate("/dashboard-brand");
            }
        } catch (err) {
            console.error("Instant demo login error:", err);
            if (role === "executive") navigate("/login-executive");
            else if (role === "mediator") navigate("/login-mediator");
            else if (role === "brand") navigate("/login-brand");
        } finally {
            setLoggingInRole(null);
        }
    };

    return (
        <div className="role-page-container">
            <div className="role-selection-wrapper">
                {/* BRAND BADGE */}
                <div className="role-hero-badge">
                    <span className="badge-dot"></span>
                    <span>Rankora Operations Platform</span>
                </div>

                {/* DEMO SHOWCASE BANNER */}
                <div className="role-demo-banner">
                    <span className="demo-banner-badge">💡 Live Demo Mode</span>
                    <span className="demo-banner-text">
                        Explore with pre-loaded campaigns and orders. Click <b>Instant Demo Preview</b> on any role below!
                    </span>
                </div>

                {/* HERO TITLE & SUBTITLE */}
                <h1 className="role-hero-title">
                    Select Your Operational Role
                </h1>
                <p className="role-hero-subtitle">
                    Access specialized command dashboards, real-time mediator order dispatching, instant verification proofs, and automated balance settlement.
                </p>

                {/* ROLE CARDS GRID */}
                <div className="role-cards-grid">
                    {/* EXECUTIVE CARD (Electric Indigo / Royal Cyan) */}
                    <div className="role-card role-card-executive">
                        <div>
                            <div className="role-card-top">
                                <div className="role-icon-box">👔</div>
                                <span className="role-pill-badge">Operations Lead</span>
                            </div>
                            <h2 className="role-title">Executive Portal</h2>
                            <p className="role-description">
                                Oversee master campaigns, assign units to mediators, approve advance payments, and verify refund reconciliations.
                            </p>
                            <ul className="role-features-list">
                                <li>
                                    <span className="check-icon">✓</span>
                                    <span>Master Order Creation & Assignment</span>
                                </li>
                                <li>
                                    <span className="check-icon">✓</span>
                                    <span>Advance Payment & Proof Dispatch</span>
                                </li>
                                <li>
                                    <span className="check-icon">✓</span>
                                    <span>Mediator Refund Verification</span>
                                </li>
                                <li>
                                    <span className="check-icon">✓</span>
                                    <span>Two-Way Balance Settlement</span>
                                </li>
                            </ul>
                        </div>
                        <div className="role-card-actions">
                            <button 
                                id="role-btn-executive"
                                className="role-action-btn"
                                onClick={() => navigate("/login-executive")}
                            >
                                <span>Enter Executive Workspace</span>
                                <span className="arrow-symbol">→</span>
                            </button>
                            <button
                                type="button"
                                className="role-demo-action-btn"
                                disabled={loggingInRole === "executive"}
                                onClick={() => handleInstantDemo("executive")}
                            >
                                {loggingInRole === "executive" ? "Launching Demo..." : "✨ Instant Demo Preview (1-Click)"}
                            </button>
                        </div>
                    </div>

                    {/* MEDIATOR CARD (Vibrant Teal / Emerald Mint) */}
                    <div className="role-card role-card-mediator">
                        <div>
                            <div className="role-card-top">
                                <div className="role-icon-box">🤝</div>
                                <span className="role-pill-badge">Fulfillment Network</span>
                            </div>
                            <h2 className="role-title">Mediator Portal</h2>
                            <p className="role-description">
                                Review assigned orders, accept or reject quantities, upload proof screenshots, and monitor live earnings.
                            </p>
                            <ul className="role-features-list">
                                <li>
                                    <span className="check-icon">✓</span>
                                    <span>Executive-Wise Order Acceptance</span>
                                </li>
                                <li>
                                    <span className="check-icon">✓</span>
                                    <span>Order Placement & Review Submission</span>
                                </li>
                                <li>
                                    <span className="check-icon">✓</span>
                                    <span>Financial Breakdown & Earnings</span>
                                </li>
                                <li>
                                    <span className="check-icon">✓</span>
                                    <span>Instant Balance Clearance</span>
                                </li>
                            </ul>
                        </div>
                        <div className="role-card-actions">
                            <button 
                                id="role-btn-mediator"
                                className="role-action-btn"
                                onClick={() => navigate("/login-mediator")}
                            >
                                <span>Enter Mediator Workspace</span>
                                <span className="arrow-symbol">→</span>
                            </button>
                            <button
                                type="button"
                                className="role-demo-action-btn"
                                disabled={loggingInRole === "mediator"}
                                onClick={() => handleInstantDemo("mediator")}
                            >
                                {loggingInRole === "mediator" ? "Launching Demo..." : "✨ Instant Demo Preview (1-Click)"}
                            </button>
                        </div>
                    </div>

                    {/* BRAND CARD (Sunset Amber / Crimson Rose) */}
                    <div className="role-card role-card-brand">
                        <div>
                            <div className="role-card-top">
                                <div className="role-icon-box">🏷️</div>
                                <span className="role-pill-badge">Enterprise Partner</span>
                            </div>
                            <h2 className="role-title">Brand Portal</h2>
                            <p className="role-description">
                                Monitor live progress across product lines, inspect verified deliveries, and track campaign completion metrics.
                            </p>
                            <ul className="role-features-list">
                                <li>
                                    <span className="check-icon">✓</span>
                                    <span>Real-time Campaign Progress</span>
                                </li>
                                <li>
                                    <span className="check-icon">✓</span>
                                    <span>Batch Delivery & Invoice Visibility</span>
                                </li>
                                <li>
                                    <span className="check-icon">✓</span>
                                    <span>Executive Team Communications</span>
                                </li>
                                <li>
                                    <span className="check-icon">✓</span>
                                    <span>Detailed Lifecycle Reports</span>
                                </li>
                            </ul>
                        </div>
                        <div className="role-card-actions">
                            <button 
                                id="role-btn-brand"
                                className="role-action-btn"
                                onClick={() => navigate("/login-brand")}
                            >
                                <span>Enter Brand Workspace</span>
                                <span className="arrow-symbol">→</span>
                            </button>
                            <button
                                type="button"
                                className="role-demo-action-btn"
                                disabled={loggingInRole === "brand"}
                                onClick={() => handleInstantDemo("brand")}
                            >
                                {loggingInRole === "brand" ? "Launching Demo..." : "✨ Instant Demo Preview (1-Click)"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="role-portal-footer">
                    <span>Rankora Enterprise Architecture</span>
                    <span>•</span>
                    <span>Secure Encrypted Sessions</span>
                    <span>•</span>
                    <span>Multi-Role Pipeline</span>
                </div>
            </div>
        </div>
    );
}