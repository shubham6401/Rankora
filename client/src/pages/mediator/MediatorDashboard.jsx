import { useNavigate } from "react-router-dom";
import Logout from "../../component/Logout";
import EarningTable from "../../component/mediator/EarningTable";
import MediatorOrderSummary from "../../component/mediator/MediatorOrderSummary";
import "../../styles/dashboard.css";

export default function MediatorDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user")) || {};

    return (
        <div className="dashboard-container">
            {/* HEADER CARD */}
            <div className="dashboard-header-card">
                <div>
                    <h1 className="dashboard-header-title">Mediator Dashboard</h1>
                    <div className="dashboard-meta-bar">
                        <span>Welcome: <b>{user.name || "Mediator"}</b></span> &nbsp;|&nbsp;
                        <span>Team Code: <b>{user.teamCode || "N/A"}</b></span> &nbsp;|&nbsp;
                        <span>Mediator Code: <b className="dashboard-meta-pill">{user.mediatorCode || "N/A"}</b></span>
                    </div>
                </div>

                <div>
                    <Logout />
                </div>
            </div>

            {/* ORDER & QUANTITY SUMMARY */}
            <MediatorOrderSummary />

            {/* QUICK NAVIGATION ACTION CARDS */}
            <div className="dashboard-actions-card" style={{ marginTop: 0, marginBottom: "24px" }}>
                <div className="dashboard-section-header">
                    <h2 className="dashboard-section-title">⚡ Navigation & Order Stages</h2>
                </div>

                <div className="dashboard-action-grid">
                    <button
                        type="button"
                        onClick={() => navigate("/mediator-neworders")}
                        className="dash-btn dash-btn-primary"
                        style={{ background: "#ebf8ff", color: "#2b6cb0", borderColor: "#bee3f8" }}
                    >
                        📥 New Assigned Orders
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/mediator-pending-payment")}
                        className="dash-btn dash-btn-amber"
                        style={{ background: "#fffaf0", color: "#c05621", borderColor: "#feebc8" }}
                    >
                        💳 Payment Pending (Refunds)
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/mediator-pending-orders")}
                        className="dash-btn dash-btn-orange"
                        style={{ background: "#feebc8", color: "#c05621", borderColor: "#fbd38d" }}
                    >
                        ⏳ In-Progress Orders
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/mediator-refund_pending-orders")}
                        className="dash-btn dash-btn-purple"
                    >
                        🔄 Pending Refund Orders
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/mediator-completed-orders")}
                        className="dash-btn dash-btn-emerald"
                    >
                        ✅ Completed Orders
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/mediator-earnings")}
                        className="dash-btn"
                        style={{ background: "#fefcbf", color: "#744210", borderColor: "#faf089" }}
                    >
                        💰 View Earning Table
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/mediator-balance")}
                        className="dash-btn dash-btn-teal"
                        style={{ background: "#f0fdfa", color: "#0f766e", borderColor: "#99f6e4" }}
                    >
                        ⚖️ Balance Settlement
                    </button>
                </div>
            </div>

            {/* EMBEDDED EARNING TABLE SECTION */}
            <div className="dashboard-actions-card" style={{ marginTop: 0 }}>
                <div className="dashboard-section-header">
                    <h2 className="dashboard-section-title">📊 Financial Breakdown & Earnings</h2>
                    <button
                        type="button"
                        onClick={() => navigate("/mediator-earnings")}
                        className="btn-quick-preview"
                        style={{ backgroundColor: "var(--primary-600)", color: "#ffffff", border: "none", fontWeight: "700" }}
                    >
                        Open Full Earning Page ↗
                    </button>
                </div>

                <EarningTable />
            </div>
        </div>
    );
}