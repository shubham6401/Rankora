import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllExecutiveOrders } from "../../services/executive/order";
import OrderSummary from "../../component/executive/OrderSummary";
import PipelineStepper from "../../component/layout/PipelineStepper";
import "../../styles/dashboard.css";
import "../../styles/appLayout.css";

export default function ExecutiveDashboard() {
    const [orders, setOrders] = useState([]);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user")) || {};

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetchAllExecutiveOrders();
            setOrders(response.data.orders || []);
        } catch (err) {
            console.error("Failed to fetch executive orders:", err);
        }
    };

    return (
        <div className="dashboard-container" style={{ padding: 0 }}>
            {/* HEADER */}
            <div className="dashboard-header-card" style={{ marginBottom: "20px" }}>
                <div>
                    <h1 className="dashboard-header-title">
                        Executive Dashboard
                    </h1>
                    <div className="dashboard-meta-bar">
                        <span>User: <b>{user.name || "Executive"}</b></span>
                        <span style={{ color: "#cbd5e1" }}>•</span>
                        <span>Team: <b className="dashboard-meta-pill">{user.teamCode || "N/A"}</b></span>
                        <span style={{ color: "#cbd5e1" }}>•</span>
                        <span>Orders: <b>{orders.length}</b></span>
                    </div>
                </div>

                <div>
                    <button
                        type="button"
                        onClick={() => navigate("/executive-add-order")}
                        className="app-btn app-btn-primary app-btn-lg"
                        style={{ fontWeight: "700" }}
                    >
                        ➕ New Order
                    </button>
                </div>
            </div>

            {/* METRICS SUMMARY */}
            <OrderSummary orders={orders} />

            {/* PIPELINE STEPPER */}
            <PipelineStepper role="executive" />

            {/* ACTION HUBS */}
            <div className="action-hubs-container">
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
                            onClick={() => navigate("/executive-pending-order")}
                        >
                            <div className="action-card-top">
                                <div className="action-card-icon">📦</div>
                                <div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Stage 1</span>
                                    <h3 className="action-card-title">Unassigned</h3>
                                </div>
                            </div>
                            <div className="action-card-footer">
                                <span>Open</span>
                                <span>→</span>
                            </div>
                        </div>

                        <div
                            className="action-card"
                            onClick={() => navigate("/executive-pending-payment")}
                        >
                            <div className="action-card-top">
                                <div className="action-card-icon">💳</div>
                                <div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Stage 2</span>
                                    <h3 className="action-card-title">Advance Payment</h3>
                                </div>
                            </div>
                            <div className="action-card-footer">
                                <span>Open</span>
                                <span>→</span>
                            </div>
                        </div>

                        <div
                            className="action-card"
                            onClick={() => navigate("/executive-assigned-order")}
                        >
                            <div className="action-card-top">
                                <div className="action-card-icon">📤</div>
                                <div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Stage 3</span>
                                    <h3 className="action-card-title">Assigned</h3>
                                </div>
                            </div>
                            <div className="action-card-footer">
                                <span>Open</span>
                                <span>→</span>
                            </div>
                        </div>

                        <div
                            className="action-card"
                            onClick={() => navigate("/executive-in_progress-order")}
                        >
                            <div className="action-card-top">
                                <div className="action-card-icon">🚀</div>
                                <div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Stage 4</span>
                                    <h3 className="action-card-title">In Progress</h3>
                                </div>
                            </div>
                            <div className="action-card-footer">
                                <span>Open</span>
                                <span>→</span>
                            </div>
                        </div>

                        <div
                            className="action-card"
                            onClick={() => navigate("/executive-pending_refund-order")}
                        >
                            <div className="action-card-top">
                                <div className="action-card-icon">🔄</div>
                                <div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Stage 5</span>
                                    <h3 className="action-card-title">Pending Refund</h3>
                                </div>
                            </div>
                            <div className="action-card-footer">
                                <span>Open</span>
                                <span>→</span>
                            </div>
                        </div>

                        <div
                            className="action-card"
                            onClick={() => navigate("/executive-verify-orders")}
                        >
                            <div className="action-card-top">
                                <div className="action-card-icon">🔍</div>
                                <div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Stage 6</span>
                                    <h3 className="action-card-title">Verify Deliveries</h3>
                                </div>
                            </div>
                            <div className="action-card-footer">
                                <span>Inspect</span>
                                <span>→</span>
                            </div>
                        </div>

                        <div
                            className="action-card"
                            onClick={() => navigate("/executive-completed-order")}
                        >
                            <div className="action-card-top">
                                <div className="action-card-icon">✅</div>
                                <div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Stage 7</span>
                                    <h3 className="action-card-title">Completed</h3>
                                </div>
                            </div>
                            <div className="action-card-footer">
                                <span>Open</span>
                                <span>→</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FINANCE */}
                <div className="action-hub-section">
                    <div className="action-hub-header" style={{ marginBottom: "14px", paddingBottom: "10px" }}>
                        <h2 className="action-hub-title">
                            ⚖️ Finance & Settlement
                        </h2>
                    </div>

                    <div className="action-cards-grid">
                        <div
                            className="action-card"
                            onClick={() => navigate("/executive-mediator-sent-payment")}
                        >
                            <div className="action-card-top">
                                <div className="action-card-icon">📥</div>
                                <div>
                                    <h3 className="action-card-title">Verify Refunds</h3>
                                </div>
                            </div>
                            <div className="action-card-footer">
                                <span>Review</span>
                                <span>→</span>
                            </div>
                        </div>

                        <div
                            className="action-card"
                            onClick={() => navigate("/executive-balance")}
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

                {/* TEAM & MANAGEMENT */}
                <div className="action-hub-section">
                    <div className="action-hub-header" style={{ marginBottom: "14px", paddingBottom: "10px" }}>
                        <h2 className="action-hub-title">
                            👥 Team & Accounts
                        </h2>
                    </div>

                    <div className="action-cards-grid">
                        <div
                            className="action-card"
                            onClick={() => navigate("/executive-mediators")}
                        >
                            <div className="action-card-top">
                                <div className="action-card-icon">👥</div>
                                <div>
                                    <h3 className="action-card-title">Mediators</h3>
                                </div>
                            </div>
                            <div className="action-card-footer">
                                <span>View</span>
                                <span>→</span>
                            </div>
                        </div>

                        <div
                            className="action-card"
                            onClick={() => navigate("/signup-mediator")}
                        >
                            <div className="action-card-top">
                                <div className="action-card-icon">👤</div>
                                <div>
                                    <h3 className="action-card-title">Add Mediator</h3>
                                </div>
                            </div>
                            <div className="action-card-footer">
                                <span>Create</span>
                                <span>→</span>
                            </div>
                        </div>

                        <div
                            className="action-card"
                            onClick={() => navigate("/signup-brand")}
                        >
                            <div className="action-card-top">
                                <div className="action-card-icon">🏷️</div>
                                <div>
                                    <h3 className="action-card-title">Add Brand</h3>
                                </div>
                            </div>
                            <div className="action-card-footer">
                                <span>Create</span>
                                <span>→</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}