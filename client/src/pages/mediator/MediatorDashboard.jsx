import { useNavigate } from "react-router-dom";
import EarningTable from "../../component/mediator/EarningTable";
import MediatorOrderSummary from "../../component/mediator/MediatorOrderSummary";
import PipelineStepper from "../../component/layout/PipelineStepper";
import "../../styles/dashboard.css";
import "../../styles/appLayout.css";

export default function MediatorDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user")) || {};

    return (
        <div className="dashboard-container" style={{ padding: 0 }}>
            {/* HEADER */}
            <div className="dashboard-header-card" style={{ marginBottom: "20px" }}>
                <div>
                    <h1 className="dashboard-header-title">
                        Mediator Dashboard
                    </h1>
                    <div className="dashboard-meta-bar">
                        <span>User: <b>{user.name || "Mediator"}</b></span>
                        <span style={{ color: "#cbd5e1" }}>•</span>
                        <span>Team: <b>{user.teamCode || "N/A"}</b></span>
                        <span style={{ color: "#cbd5e1" }}>•</span>
                        <span>Code: <b className="dashboard-meta-pill">{user.mediatorCode || "N/A"}</b></span>
                    </div>
                </div>

                <div>
                    <button
                        type="button"
                        onClick={() => navigate("/mediator-neworders")}
                        className="app-btn app-btn-primary app-btn-lg"
                        style={{ fontWeight: "700" }}
                    >
                        📥 New Offers
                    </button>
                </div>
            </div>

            {/* METRICS */}
            <MediatorOrderSummary />

            {/* PIPELINE STEPPER */}
            <PipelineStepper role="mediator" />

            {/* ACTION HUBS */}
            <div className="action-hubs-container" style={{ marginBottom: "24px" }}>
                {/* STAGES */}
                <div className="action-hub-section">
                    <div className="action-hub-header" style={{ marginBottom: "14px", paddingBottom: "10px" }}>
                        <h2 className="action-hub-title">
                            📦 Order Stages
                        </h2>
                    </div>

                    <div className="action-cards-grid">
                        <div
                            className="action-card"
                            onClick={() => navigate("/mediator-neworders")}
                        >
                            <div className="action-card-top">
                                <div className="action-card-icon">📥</div>
                                <div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Stage 1</span>
                                    <h3 className="action-card-title">New Offers</h3>
                                </div>
                            </div>
                            <div className="action-card-footer">
                                <span>Review</span>
                                <span>→</span>
                            </div>
                        </div>

                        <div
                            className="action-card"
                            onClick={() => navigate("/mediator-pending-orders")}
                        >
                            <div className="action-card-top">
                                <div className="action-card-icon">🚀</div>
                                <div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Stage 2</span>
                                    <h3 className="action-card-title">In Progress</h3>
                                </div>
                            </div>
                            <div className="action-card-footer">
                                <span>Manage</span>
                                <span>→</span>
                            </div>
                        </div>

                        <div
                            className="action-card"
                            onClick={() => navigate("/mediator-refund_pending-orders")}
                        >
                            <div className="action-card-top">
                                <div className="action-card-icon">🔄</div>
                                <div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Stage 3</span>
                                    <h3 className="action-card-title">Pending Refund</h3>
                                </div>
                            </div>
                            <div className="action-card-footer">
                                <span>Track</span>
                                <span>→</span>
                            </div>
                        </div>

                        <div
                            className="action-card"
                            onClick={() => navigate("/mediator-completed-orders")}
                        >
                            <div className="action-card-top">
                                <div className="action-card-icon">✅</div>
                                <div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Stage 4</span>
                                    <h3 className="action-card-title">Completed</h3>
                                </div>
                            </div>
                            <div className="action-card-footer">
                                <span>View</span>
                                <span>→</span>
                            </div>
                        </div>

                        <div
                            className="action-card"
                            onClick={() => navigate("/mediator-pending-payment")}
                        >
                            <div className="action-card-top">
                                <div className="action-card-icon">💳</div>
                                <div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Stage 5</span>
                                    <h3 className="action-card-title">Return Refunds</h3>
                                </div>
                            </div>
                            <div className="action-card-footer">
                                <span>Upload</span>
                                <span>→</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FINANCE */}
                <div className="action-hub-section">
                    <div className="action-hub-header" style={{ marginBottom: "14px", paddingBottom: "10px" }}>
                        <h2 className="action-hub-title">
                            💰 Finance & Earnings
                        </h2>
                    </div>

                    <div className="action-cards-grid">
                        <div
                            className="action-card"
                            onClick={() => navigate("/mediator-earnings")}
                        >
                            <div className="action-card-top">
                                <div className="action-card-icon">📊</div>
                                <div>
                                    <h3 className="action-card-title">Earnings</h3>
                                </div>
                            </div>
                            <div className="action-card-footer">
                                <span>Open</span>
                                <span>→</span>
                            </div>
                        </div>

                        <div
                            className="action-card"
                            onClick={() => navigate("/mediator-balance")}
                        >
                            <div className="action-card-top">
                                <div className="action-card-icon">⚖️</div>
                                <div>
                                    <h3 className="action-card-title">Balance Settlement</h3>
                                </div>
                            </div>
                            <div className="action-card-footer">
                                <span>Manage</span>
                                <span>→</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* EARNING TABLE */}
            <div className="action-hub-section">
                <div className="action-hub-header" style={{ marginBottom: "14px" }}>
                    <div>
                        <h2 className="action-hub-title">📊 Earnings Preview</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate("/mediator-earnings")}
                        className="app-btn app-btn-primary app-btn-sm"
                    >
                        Full Page ↗
                    </button>
                </div>

                <EarningTable />
            </div>
        </div>
    );
}