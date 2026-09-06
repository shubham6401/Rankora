import { useNavigate } from "react-router-dom";
import "../styles/roleSelection.css";

export default function RoleSelection() {
    const navigate = useNavigate();

    return (
        <div className="role-page-container">
            <div className="role-selection-wrapper">
                {/* BRAND BADGE */}
                <div className="role-hero-badge">
                    <span className="badge-dot"></span>
                    <span>Rankora Operations Platform</span>
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
                        <button 
                            id="role-btn-executive"
                            className="role-action-btn"
                            onClick={() => navigate("/login-executive")}
                        >
                            <span>Enter Executive Workspace</span>
                            <span className="arrow-symbol">→</span>
                        </button>
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
                        <button 
                            id="role-btn-mediator"
                            className="role-action-btn"
                            onClick={() => navigate("/login-mediator")}
                        >
                            <span>Enter Mediator Workspace</span>
                            <span className="arrow-symbol">→</span>
                        </button>
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
                        <button 
                            id="role-btn-brand"
                            className="role-action-btn"
                            onClick={() => navigate("/login-brand")}
                        >
                            <span>Enter Brand Workspace</span>
                            <span className="arrow-symbol">→</span>
                        </button>
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