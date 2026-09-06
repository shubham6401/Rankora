import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllExecutiveOrders } from "../../services/executive/order";
import OrderSummary from "../../component/executive/OrderSummary";
import Logout from "../../component/Logout";
import "../../styles/dashboard.css";

export default function ExecutiveDashboard() {
    let [orders, setOrders] = useState([]);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user")) || {};

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            let response = await fetchAllExecutiveOrders();
            setOrders(response.data.orders || []);
        } catch (err) {
            console.error("Failed to fetch executive orders:", err);
        }
    };

    return (
        <div className="dashboard-container">
            {/* HEADER CARD */}
            <div className="dashboard-header-card">
                <div>
                    <h1 className="dashboard-header-title">Executive Dashboard</h1>
                    <div className="dashboard-meta-bar">
                        <span>Welcome back: <b>Executive {user.name || "User"}</b></span> &nbsp;|&nbsp;
                        <span>Team Code: <b className="dashboard-meta-pill">{user.teamCode || "N/A"}</b></span>
                    </div>
                </div>

                <div>
                    <Logout />
                </div>
            </div>

            {/* ORDER SUMMARY COMPONENT */}
            <OrderSummary orders={orders} />

            {/* QUICK ACTIONS SECTION */}
            <div className="dashboard-actions-card">
                <div className="dashboard-section-header">
                    <h2 className="dashboard-section-title">⚡ Actions & Order Management</h2>
                </div>

                <div className="dashboard-action-grid">
                    <button
                        type="button"
                        onClick={() => navigate("/executive-add-order")}
                        className="dash-btn dash-btn-primary"
                    >
                        ➕ Add New Order
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/executive-pending-payment")}
                        className="dash-btn dash-btn-amber"
                    >
                        💳 Pending Payment (Advance)
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/executive-mediator-sent-payment")}
                        className="dash-btn dash-btn-sky"
                    >
                        📥 Mediator Sent (Verify Refund)
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/executive-balance")}
                        className="dash-btn dash-btn-teal"
                    >
                        ⚖️ Balance Settlement
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/executive-pending-order")}
                        className="dash-btn dash-btn-slate"
                    >
                        ⏳ Pending Orders
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/executive-assigned-order")}
                        className="dash-btn dash-btn-orange"
                    >
                        📤 Assigned Orders
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/executive-in_progress-order")}
                        className="dash-btn dash-btn-teal"
                        style={{ background: "#f0fdfa", color: "#0f766e", borderColor: "#99f6e4" }}
                    >
                        🚀 In Progress Orders
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/executive-pending_refund-order")}
                        className="dash-btn dash-btn-purple"
                    >
                        🔄 Pending Refund
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/executive-completed-order")}
                        className="dash-btn dash-btn-emerald"
                    >
                        ✅ Completed Orders
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/executive-mediators")}
                        className="dash-btn dash-btn-slate"
                    >
                        👥 Your Mediators
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/signup-mediator")}
                        className="dash-btn dash-btn-dashed"
                    >
                        👤 Create Mediator Account
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/signup-brand")}
                        className="dash-btn dash-btn-dashed"
                    >
                        🏷️ Add New Brand
                    </button>
                </div>
            </div>
        </div>
    );
}