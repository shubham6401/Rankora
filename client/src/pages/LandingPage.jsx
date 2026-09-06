import { useNavigate, Link } from "react-router-dom";
import "../styles/landingPage.css";

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="landing-page">
            {/* STICKY NAVIGATION BAR */}
            <header className="landing-nav-wrap">
                <nav className="landing-nav">
                    <Link to="/" className="landing-brand">
                        <div className="landing-logo-icon">✦</div>
                        <span className="landing-brand-name">Rankora</span>
                    </Link>

                    <div className="landing-nav-links">
                        <a href="#workspaces" className="landing-nav-link">Role Workspaces</a>
                        <a href="#workflow" className="landing-nav-link">How It Works</a>
                        <a href="#security" className="landing-nav-link">Settlement & Security</a>
                    </div>

                    <button
                        onClick={() => navigate("/role-selection")}
                        className="landing-nav-cta"
                    >
                        <span>Try Demo / Launch</span>
                        <span>→</span>
                    </button>
                </nav>
            </header>

            <div className="landing-content">
                {/* HERO SECTION */}
                <section className="landing-hero">
                    <div className="hero-pill-badge">
                        <span className="pulse-point"></span>
                        <span>Interactive Demo Accounts Available • 3 Roles</span>
                    </div>

                    <h1 className="hero-main-title">
                        Empower Your Entire <br />
                        <span className="hero-gradient-text">Order Lifecycle & Settlement</span>
                    </h1>

                    <p className="hero-description">
                        The unified operations network connecting Brand Partners, Operations Executives, 
                        and Fulfillment Mediators with automated screenshot verification, multi-unit pipeline 
                        tracking, and two-way financial reconciliation.
                    </p>

                    <div className="hero-cta-group">
                        <button
                            id="hero-launch-btn"
                            onClick={() => navigate("/role-selection")}
                            className="hero-btn-primary"
                        >
                            <span>Enter Operational Portals</span>
                            <span>→</span>
                        </button>
                        <button 
                            onClick={() => navigate("/role-selection")} 
                            className="hero-btn-secondary"
                        >
                            <span>⚡ Try 1-Click Demo</span>
                        </button>
                    </div>

                    {/* HERO STATS BANNER */}
                    <div className="hero-stats-banner">
                        <div className="hero-stat-item">
                            <span className="hero-stat-number">100%</span>
                            <span className="hero-stat-label">Verified Proofs</span>
                        </div>
                        <div className="hero-stat-item">
                            <span className="hero-stat-number">3 Roles</span>
                            <span className="hero-stat-label">Unified Workspaces</span>
                        </div>
                        <div className="hero-stat-item">
                            <span className="hero-stat-number">0%</span>
                            <span className="hero-stat-label">Payment Leakage</span>
                        </div>
                        <div className="hero-stat-item">
                            <span className="hero-stat-number">Real-Time</span>
                            <span className="hero-stat-label">Ledger Clearance</span>
                        </div>
                    </div>
                </section>

                {/* THE 3 WORKSPACES SECTION */}
                <section id="workspaces" className="landing-section">
                    <div className="section-header-wrap">
                        <span className="section-tag-badge">Unified Architecture</span>
                        <h2 className="section-title">Designed for Every Participant</h2>
                        <p className="section-subtitle">
                            Tailor-made dashboards engineered specifically for high-velocity operations, 
                            strict financial accountability, and transparent execution.
                        </p>
                    </div>

                    <div className="pillars-grid">
                        {/* 1. EXECUTIVE OPERATIONS */}
                        <div className="pillar-card pillar-executive">
                            <div>
                                <div className="pillar-icon-box">👔</div>
                                <h3 className="pillar-title">Executive Operations</h3>
                                <p className="pillar-description">
                                    Full orchestration center. Distribute master orders across mediators, dispatch advance payments with proof screenshots, and verify incoming refunds.
                                </p>
                                <ul className="pillar-checklist">
                                    <li>
                                        <span className="check-symbol">✓</span>
                                        <span>Master campaign creation & multi-unit assigning</span>
                                    </li>
                                    <li>
                                        <span className="check-symbol">✓</span>
                                        <span>Advance payment screenshot uploads & note logs</span>
                                    </li>
                                    <li>
                                        <span className="check-symbol">✓</span>
                                        <span>Mediator refund verification & unit recovery</span>
                                    </li>
                                    <li>
                                        <span className="check-symbol">✓</span>
                                        <span>Two-way balance ledger settlement</span>
                                    </li>
                                </ul>
                            </div>
                            <button
                                onClick={() => navigate("/login-executive")}
                                className="pillar-action-btn"
                            >
                                <span>Access Executive Portal</span>
                                <span>→</span>
                            </button>
                        </div>

                        {/* 2. MEDIATOR NETWORK */}
                        <div className="pillar-card pillar-mediator">
                            <div>
                                <div className="pillar-icon-box">🤝</div>
                                <h3 className="pillar-title">Mediator Fulfillment</h3>
                                <p className="pillar-description">
                                    The execution frontline. Review assigned orders executive-wise, verify payment proofs, submit placed order details, and track dynamic earnings.
                                </p>
                                <ul className="pillar-checklist">
                                    <li>
                                        <span className="check-symbol">✓</span>
                                        <span>Executive-wise grouped order review & quantity steppers</span>
                                    </li>
                                    <li>
                                        <span className="check-symbol">✓</span>
                                        <span>Order placement & expected delivery submissions</span>
                                    </li>
                                    <li>
                                        <span className="check-symbol">✓</span>
                                        <span>Delivery, review & invoice screenshot uploads</span>
                                    </li>
                                    <li>
                                        <span className="check-symbol">✓</span>
                                        <span>Interactive financial breakdown & net earnings sheet</span>
                                    </li>
                                </ul>
                            </div>
                            <button
                                onClick={() => navigate("/login-mediator")}
                                className="pillar-action-btn"
                            >
                                <span>Access Mediator Portal</span>
                                <span>→</span>
                            </button>
                        </div>

                        {/* 3. BRAND PARTNER */}
                        <div className="pillar-card pillar-brand">
                            <div>
                                <div className="pillar-icon-box">🏷️</div>
                                <h3 className="pillar-title">Brand Command</h3>
                                <p className="pillar-description">
                                    Complete campaign visibility. Inspect real-time order completion rates, track active batches, and verify delivery proof documents.
                                </p>
                                <ul className="pillar-checklist">
                                    <li>
                                        <span className="check-symbol">✓</span>
                                        <span>Real-time campaign KPIs & completion rate bars</span>
                                    </li>
                                    <li>
                                        <span className="check-symbol">✓</span>
                                        <span>Product storefront links & platform badges</span>
                                    </li>
                                    <li>
                                        <span className="check-symbol">✓</span>
                                        <span>Multi-segment unit progress distribution</span>
                                    </li>
                                    <li>
                                        <span className="check-symbol">✓</span>
                                        <span>Dedicated Executive POC contact channels</span>
                                    </li>
                                </ul>
                            </div>
                            <button
                                onClick={() => navigate("/login-brand")}
                                className="pillar-action-btn"
                            >
                                <span>Access Brand Portal</span>
                                <span>→</span>
                            </button>
                        </div>
                    </div>
                </section>

                {/* HOW IT WORKS (WORKFLOW TIMELINE) */}
                <section id="workflow" className="landing-section" style={{ paddingTop: "20px" }}>
                    <div className="section-header-wrap">
                        <span className="section-tag-badge">End-to-End Pipeline</span>
                        <h2 className="section-title">How Rankora Works</h2>
                        <p className="section-subtitle">
                            A friction-free lifecycle from brand creation to delivery verification and net balance clearance.
                        </p>
                    </div>

                    <div className="timeline-grid">
                        <div className="timeline-step-card">
                            <span className="timeline-step-num">Step 01</span>
                            <h3 className="timeline-step-title">Batch Inception</h3>
                            <p className="timeline-step-desc">
                                Executives initialize brand campaigns with unit pricing, product URLs, platforms (Amazon, Flipkart, Myntra), and total quantities.
                            </p>
                        </div>

                        <div className="timeline-step-card">
                            <span className="timeline-step-num">Step 02</span>
                            <h3 className="timeline-step-title">Unit Dispatch</h3>
                            <p className="timeline-step-desc">
                                Orders are split into discrete units and assigned to mediators alongside advance payment screenshots and instructions.
                            </p>
                        </div>

                        <div className="timeline-step-card">
                            <span className="timeline-step-num">Step 03</span>
                            <h3 className="timeline-step-title">Proof Verification</h3>
                            <p className="timeline-step-desc">
                                Mediators review, accept, or reject units with refund proof. Placed orders capture Order IDs, reviewer names, and invoice screenshots.
                            </p>
                        </div>

                        <div className="timeline-step-card">
                            <span className="timeline-step-num">Step 04</span>
                            <h3 className="timeline-step-title">Balance Settlement</h3>
                            <p className="timeline-step-desc">
                                Price fluctuations and commissions trigger directional balance transfers with instant verification and permanent audit logs.
                            </p>
                        </div>
                    </div>
                </section>

                {/* SECURITY & ARCHITECTURE */}
                <section id="security" className="landing-section" style={{ paddingTop: "20px" }}>
                    <div className="section-header-wrap">
                        <span className="section-tag-badge">Enterprise Reliability</span>
                        <h2 className="section-title">Built For Zero-Leakage Integrity</h2>
                        <p className="section-subtitle">
                            Every financial transaction and proof upload is safeguarded by cryptographic authentication and verified media pipelines.
                        </p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-box">
                            <div className="feature-icon-wrapper">🔒</div>
                            <h3 className="feature-heading">Role-Based Access Control</h3>
                            <p className="feature-text">
                                Strict JWT tokenization and server-side authorization guarantee executives, mediators, and brands access only their authorized pipelines.
                            </p>
                        </div>

                        <div className="feature-box">
                            <div className="feature-icon-wrapper">☁️</div>
                            <h3 className="feature-heading">Cloudinary CDN Storage</h3>
                            <p className="feature-text">
                                Payment screenshots, review invoices, and delivery receipts are persisted in high-availability encrypted cloud storage with click-to-zoom lightboxes.
                            </p>
                        </div>

                        <div className="feature-box">
                            <div className="feature-icon-wrapper">⚖️</div>
                            <h3 className="feature-heading">Two-Way Balance Ledger</h3>
                            <p className="feature-text">
                                Resolves price differences between executives and mediators dynamically with mutual verification and balance transparency.
                            </p>
                        </div>
                    </div>
                </section>

                {/* BOTTOM CALL TO ACTION BANNER */}
                <section className="landing-cta-banner">
                    <h2 className="cta-title">
                        Ready to Transform Your Order Operations?
                    </h2>
                    <p className="cta-subtitle">
                        Join the unified network and gain complete operational clarity across brand campaigns, mediator fulfillment, and verified settlements.
                    </p>
                    <button
                        onClick={() => navigate("/role-selection")}
                        className="cta-button"
                    >
                        <span>Choose Your Operational Role</span>
                        <span>→</span>
                    </button>
                </section>

                {/* FOOTER */}
                <footer className="landing-footer">
                    <div className="footer-left">
                        <div className="landing-logo-icon" style={{ width: "32px", height: "32px", fontSize: "16px" }}>✦</div>
                        <span style={{ fontWeight: 800, color: "#ffffff", fontSize: "16px" }}>Rankora Platform</span>
                        <span className="footer-credits">© {new Date().getFullYear()} All rights reserved.</span>
                    </div>

                    <div className="footer-links">
                        <Link to="/role-selection" className="footer-link">Role Selection</Link>
                        <Link to="/login-executive" className="footer-link">Executive Login</Link>
                        <Link to="/login-mediator" className="footer-link">Mediator Login</Link>
                        <Link to="/login-brand" className="footer-link">Brand Login</Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
