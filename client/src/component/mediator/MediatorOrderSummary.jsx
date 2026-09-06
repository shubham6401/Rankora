import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMediatorSummary } from "../../services/mediator/orders";
import "../../styles/orderSummary.css";

export default function MediatorOrderSummary() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalOrders: 0,
        totalUnits: 0,
        totalValue: 0,
        completedValue: 0,
        newAssignedUnits: 0,
        newAssignedOrders: 0,
        pendingPaymentUnits: 0,
        pendingPaymentOrders: 0,
        inProgressUnits: 0,
        inProgressOrders: 0,
        pendingRefundUnits: 0,
        pendingRefundOrders: 0,
        completedUnits: 0,
        completedOrders: 0,
    });
    const [orders, setOrders] = useState([]);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        loadSummary();
    }, []);

    const loadSummary = async () => {
        try {
            setLoading(true);
            const res = await fetchMediatorSummary();
            if (res.data?.success) {
                setSummary(res.data.summary || {});
                setOrders(res.data.orders || []);
            }
        } catch (err) {
            console.error("Failed to load mediator summary:", err);
        } finally {
            setLoading(false);
        }
    };

    const totalUnits = summary.totalUnits || 0;
    const completedUnits = summary.completedUnits || 0;
    const completionRate = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

    const cards = [
        {
            title: "New Assigned Orders",
            subtitle: "Awaiting Accept/Reject",
            icon: "📥",
            units: summary.newAssignedUnits || 0,
            ordersCount: summary.newAssignedOrders || 0,
            path: "/mediator-neworders",
            actionLabel: "Review & Accept",
            className: "status-card-pending",
            barColor: "var(--status-pending-bar)",
        },
        {
            title: "Payment Pending",
            subtitle: "Refund to Executive",
            icon: "💳",
            units: summary.pendingPaymentUnits || 0,
            ordersCount: summary.pendingPaymentOrders || 0,
            path: "/mediator-pending-payment",
            actionLabel: "Upload Refund SS",
            className: "status-card-pay",
            barColor: "var(--status-pay-bar)",
        },
        {
            title: "In-Progress Orders",
            subtitle: "Active Ordering",
            icon: "⏳",
            units: summary.inProgressUnits || 0,
            ordersCount: summary.inProgressOrders || 0,
            path: "/mediator-pending-orders",
            actionLabel: "Submit Details",
            className: "status-card-inprog",
            barColor: "var(--status-inprog-bar)",
        },
        {
            title: "Pending Refund Orders",
            subtitle: "Awaiting Verification",
            icon: "🔄",
            units: summary.pendingRefundUnits || 0,
            ordersCount: summary.pendingRefundOrders || 0,
            path: "/mediator-refund_pending-orders",
            actionLabel: "Submit Reviews",
            className: "status-card-refund",
            barColor: "var(--status-refund-bar)",
        },
        {
            title: "Completed Orders",
            subtitle: "Fully Executed",
            icon: "✅",
            units: summary.completedUnits || 0,
            ordersCount: summary.completedOrders || 0,
            path: "/mediator-completed-orders",
            actionLabel: "View Completed",
            className: "status-card-completed",
            barColor: "var(--status-completed-bar)",
        },
    ];

    return (
        <div className="summary-wrapper">
            {/* TOP HEADER WITH SUMMARY BADGES */}
            <div className="summary-header">
                <div>
                    <h2 className="summary-title">
                        📊 Mediator Order & Quantity Summary
                    </h2>
                    <p className="summary-subtitle">
                        Your assigned orders pipeline, unit counts, progress stages, and earnings snapshot
                    </p>
                </div>

                <div className="summary-metric-chips">
                    <div className="summary-chip">
                        <div className="summary-chip-label">Assigned Orders</div>
                        <div className="summary-chip-val">{summary.totalOrders || 0}</div>
                    </div>
                    <div className="summary-chip summary-chip-blue">
                        <div className="summary-chip-label">Assigned Units</div>
                        <div className="summary-chip-val">
                            {totalUnits} <span className="summary-chip-val-sub">Units</span>
                        </div>
                    </div>
                    <div className="summary-chip summary-chip-green">
                        <div className="summary-chip-label">Total Handled</div>
                        <div className="summary-chip-val">₹{(summary.totalValue || 0).toLocaleString()}</div>
                    </div>
                    <div className="summary-chip">
                        <div className="summary-chip-label">Completed</div>
                        <div className="summary-chip-val" style={{ color: "#4ade80" }}>{completionRate}%</div>
                    </div>
                    <button
                        type="button"
                        onClick={loadSummary}
                        disabled={loading}
                        style={{
                            padding: "8px 14px",
                            backgroundColor: "rgba(255,255,255,0.15)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            borderRadius: "var(--radius-sm)",
                            color: "#ffffff",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "700",
                        }}
                    >
                        {loading ? "..." : "↻ Refresh"}
                    </button>
                </div>
            </div>

            {/* STACKED UNIT PIPELINE PROGRESS BAR */}
            {totalUnits > 0 && (
                <div className="summary-pipeline-bar-wrapper">
                    <div className="summary-pipeline-header">
                        <span>Pipeline Progress ({totalUnits} Assigned Units)</span>
                        <span>Completed Value: <b>₹{(summary.completedValue || 0).toLocaleString()}</b> / ₹{(summary.totalValue || 0).toLocaleString()}</span>
                    </div>
                    <div className="summary-pipeline-progress">
                        {cards.map((card, idx) => {
                            const pct = totalUnits > 0 ? (card.units / totalUnits) * 100 : 0;
                            if (pct === 0) return null;
                            return (
                                <div
                                    key={idx}
                                    className="summary-pipeline-segment"
                                    style={{
                                        width: `${pct}%`,
                                        backgroundColor: card.barColor,
                                    }}
                                    title={`${card.title}: ${card.units} Units (${Math.round(pct)}%)`}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* STATUS BREAKDOWN CARDS */}
            <div className="summary-body">
                <div className="summary-cards-grid">
                    {cards.map((card, index) => {
                        const unitPercentage = totalUnits > 0 ? Math.round((card.units / totalUnits) * 100) : 0;
                        return (
                            <div
                                key={index}
                                onClick={() => navigate(card.path)}
                                className={`summary-status-card ${card.className}`}
                            >
                                <div className="summary-card-top">
                                    <span className="summary-card-icon">{card.icon}</span>
                                    <span className="summary-card-badge">{unitPercentage}%</span>
                                </div>

                                <div className="summary-card-title">{card.title}</div>
                                {card.subtitle && <div className="summary-card-subtitle">{card.subtitle}</div>}

                                <div className="summary-card-units">
                                    <span className="summary-card-unit-num">{card.units}</span>
                                    <span className="summary-card-unit-label">Units</span>
                                </div>

                                <div className="summary-card-orders">
                                    in <b>{card.ordersCount}</b> {card.ordersCount === 1 ? "order" : "orders"}
                                </div>

                                <div className="summary-card-action">
                                    <span>{card.actionLabel}</span>
                                    <span>→</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* VIEW DETAILED ASSIGNED ORDERS BREAKDOWN IN NEW PAGE */}
                <div className="summary-footer-bar">
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <button
                            type="button"
                            onClick={() => navigate("/mediator-assigned-orders-breakdown")}
                            className="btn-breakdown-page"
                        >
                            <span>📋 View Detailed Assigned Orders Breakdown</span>
                            <span style={{ backgroundColor: "rgba(255,255,255,0.2)", padding: "1px 7px", borderRadius: "10px", fontSize: "11px" }}>
                                {orders.length} Orders
                            </span>
                            <span>↗</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowDetails(!showDetails)}
                            className="btn-quick-preview"
                        >
                            {showDetails ? "▲ Hide Quick Preview" : "▼ Quick Preview Inline"}
                        </button>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                        💡 <i>Tip: Click any status card to jump straight into action and manage those units.</i>
                    </div>
                </div>

                {/* EXPANDABLE INLINE PREVIEW TABLE */}
                {showDetails && (
                    <div className="summary-table-container">
                        <table className="summary-table">
                            <thead>
                                <tr>
                                    <th>Product & Brand</th>
                                    <th>Executive</th>
                                    <th style={{ textAlign: "center" }}>Unit Price</th>
                                    <th style={{ textAlign: "center" }}>My Units</th>
                                    <th>My Units Status</th>
                                    <th style={{ textAlign: "right" }}>My Total Value</th>
                                    <th style={{ textAlign: "center" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                                            No assigned orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((ord, idx) => {
                                        const price = parseFloat(ord.price) || 0;
                                        const myUnits = ord.orderUnits || [];
                                        const myUnitsCount = myUnits.length;
                                        const myVal = price * myUnitsCount;

                                        const newAssigned = myUnits.filter((u) => u.status === "assigned").length;
                                        const inProg = myUnits.filter((u) => u.status === "in_progress").length;
                                        const pendRef = myUnits.filter((u) => u.status === "pending_refund").length;
                                        const completed = myUnits.filter((u) => u.status === "completed").length;
                                        const pendPay = myUnits.filter((u) => u.status === "pending_payment").length;

                                        return (
                                            <tr key={ord._id || idx}>
                                                <td>
                                                    <div style={{ fontWeight: "700", color: "var(--slate-900)" }}>
                                                        {ord.productName || "Unnamed Product"}
                                                    </div>
                                                    <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                                                        Brand: <b>{ord.brand || ord.brandUserId?.brand || "N/A"}</b>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: "600", color: "var(--slate-800)" }}>
                                                        {ord.executiveName || ord.createdBy?.name || "Executive"}
                                                    </div>
                                                    <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                                                        Team: {ord.teamCode || ord.createdBy?.teamCode || "N/A"}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: "center", fontWeight: "600" }}>
                                                    ₹{price}
                                                </td>
                                                <td style={{ textAlign: "center" }}>
                                                    <span style={{ fontSize: "15px", fontWeight: "800", color: "var(--primary-600)" }}>{myUnitsCount}</span>
                                                    <span style={{ fontSize: "11px", color: "var(--slate-500)" }}> pcs</span>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", fontSize: "11px" }}>
                                                        {newAssigned > 0 && (
                                                            <span className="status-pill" style={{ backgroundColor: "#ebf8ff", color: "#2b6cb0", borderColor: "#bee3f8" }}>
                                                                New: <b>{newAssigned}</b>
                                                            </span>
                                                        )}
                                                        {inProg > 0 && (
                                                            <span className="status-pill" style={{ backgroundColor: "#fef3c7", color: "#92400e", borderColor: "#fcd34d" }}>
                                                                In Progress: <b>{inProg}</b>
                                                            </span>
                                                        )}
                                                        {pendRef > 0 && (
                                                            <span className="status-pill" style={{ backgroundColor: "#f3e8ff", color: "#6b21a8", borderColor: "#d8b4fe" }}>
                                                                Refund: <b>{pendRef}</b>
                                                            </span>
                                                        )}
                                                        {completed > 0 && (
                                                            <span className="status-pill" style={{ backgroundColor: "#dcfce7", color: "#166534", borderColor: "#86efac" }}>
                                                                Done: <b>{completed}</b>
                                                            </span>
                                                        )}
                                                        {pendPay > 0 && (
                                                            <span className="status-pill" style={{ backgroundColor: "#fff7ed", color: "#c2410c", borderColor: "#fdba74" }}>
                                                                Pay Pending: <b>{pendPay}</b>
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: "right", fontWeight: "700", color: "#0f766e" }}>
                                                    ₹{myVal.toLocaleString()}
                                                </td>
                                                <td style={{ textAlign: "center" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/order/${ord._id}`)}
                                                        style={{
                                                            padding: "4px 10px",
                                                            backgroundColor: "#f1f5f9",
                                                            border: "1px solid #cbd5e1",
                                                            borderRadius: "4px",
                                                            cursor: "pointer",
                                                            fontSize: "12px",
                                                            fontWeight: "600",
                                                            color: "var(--primary-600)",
                                                        }}
                                                    >
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
