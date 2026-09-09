import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/orderSummary.css";

export default function OrderSummary({ orders = [] }) {
    const navigate = useNavigate();
    const [showDetails, setShowDetails] = useState(false);

    let totalQuantity = 0;
    let totalOrders = orders.length;
    let totalValue = 0;
    let completedValue = 0;

    let unassignedUnits = 0;
    let pendingPaymentUnits = 0;
    let assignedUnits = 0;
    let inProgressUnits = 0;
    let pendingRefundUnits = 0;
    let pendingVerificationUnits = 0;
    let completedUnits = 0;

    let unassignedOrders = 0;
    let pendingPaymentOrders = 0;
    let assignedOrders = 0;
    let inProgressOrders = 0;
    let pendingRefundOrders = 0;
    let pendingVerificationOrders = 0;
    let completedOrders = 0;

    orders.forEach((order) => {
        const price = parseFloat(order.price) || 0;
        const qty = Number(order.quantity) || (Array.isArray(order.orderUnits) ? order.orderUnits.length : 0);
        totalQuantity += qty;
        totalValue += price * qty;

        let u_unassigned = 0;
        let u_pendingPayment = 0;
        let u_assigned = 0;
        let u_inProgress = 0;
        let u_pendingRefund = 0;
        let u_pendingVerification = 0;
        let u_completed = 0;

        if (Array.isArray(order.orderUnits) && order.orderUnits.length > 0) {
            order.orderUnits.forEach((u) => {
                if (u.status === "unassigned") u_unassigned++;
                else if (u.status === "pending_payment") u_pendingPayment++;
                else if (u.status === "assigned") u_assigned++;
                else if (u.status === "in_progress") u_inProgress++;
                else if (u.status === "pending_refund") u_pendingRefund++;
                else if (u.status === "pending_verification") u_pendingVerification++;
                else if (u.status === "completed") u_completed++;
            });
        } else if (order.summary) {
            u_unassigned = Number(order.summary.unassigned) || 0;
            u_pendingPayment = Number(order.summary.pendingPayment) || 0;
            u_assigned = Number(order.summary.assigned) || 0;
            u_inProgress = Number(order.summary.inProgress) || 0;
            u_pendingRefund = Number(order.summary.pendingRefund) || 0;
            u_pendingVerification = Number(order.summary.pendingVerification) || 0;
            u_completed = Number(order.summary.completed) || 0;
        } else {
            if (order.status === "pending" || order.status === "unassigned") u_unassigned = qty;
            else if (order.status === "pending_payment") u_pendingPayment = qty;
            else if (order.status === "assigned") u_assigned = qty;
            else if (order.status === "in_progress") u_inProgress = qty;
            else if (order.status === "pending_refund") u_pendingRefund = qty;
            else if (order.status === "pending_verification") u_pendingVerification = qty;
            else if (order.status === "completed") u_completed = qty;
        }

        unassignedUnits += u_unassigned;
        pendingPaymentUnits += u_pendingPayment;
        assignedUnits += u_assigned;
        inProgressUnits += u_inProgress;
        pendingRefundUnits += u_pendingRefund;
        pendingVerificationUnits += u_pendingVerification;
        completedUnits += u_completed;
        completedValue += price * u_completed;

        if (u_unassigned > 0 || order.status === "pending" || order.status === "unassigned") unassignedOrders++;
        if (u_pendingPayment > 0 || order.status === "pending_payment") pendingPaymentOrders++;
        if (u_assigned > 0 || order.status === "assigned") assignedOrders++;
        if (u_inProgress > 0 || order.status === "in_progress") inProgressOrders++;
        if (u_pendingRefund > 0 || order.status === "pending_refund") pendingRefundOrders++;
        if (u_pendingVerification > 0 || order.status === "pending_verification") pendingVerificationOrders++;
        if (u_completed > 0 || order.status === "completed") completedOrders++;
    });

    const completionRate = totalQuantity > 0 ? Math.round((completedUnits / totalQuantity) * 100) : 0;

    const statusCards = [
        {
            title: "Unassigned",
            subtitle: "Stage 1",
            icon: "📦",
            units: unassignedUnits,
            ordersCount: unassignedOrders,
            path: "/executive-pending-order",
            className: "status-card-pending",
            barColor: "#94a3b8",
        },
        {
            title: "Advance Payment",
            subtitle: "Stage 2",
            icon: "💳",
            units: pendingPaymentUnits,
            ordersCount: pendingPaymentOrders,
            path: "/executive-pending-payment",
            className: "status-card-pay",
            barColor: "#f59e0b",
        },
        {
            title: "Assigned",
            subtitle: "Stage 3",
            icon: "📤",
            units: assignedUnits,
            ordersCount: assignedOrders,
            path: "/executive-assigned-order",
            className: "status-card-assigned",
            barColor: "#3b82f6",
        },
        {
            title: "In Progress",
            subtitle: "Stage 4",
            icon: "🚀",
            units: inProgressUnits,
            ordersCount: inProgressOrders,
            path: "/executive-in_progress-order",
            className: "status-card-inprog",
            barColor: "#2563eb",
        },
        {
            title: "Pending Refund",
            subtitle: "Stage 5",
            icon: "🔄",
            units: pendingRefundUnits,
            ordersCount: pendingRefundOrders,
            path: "/executive-pending_refund-order",
            className: "status-card-refund",
            barColor: "#8b5cf6",
        },
        {
            title: "Verify Deliveries",
            subtitle: "Stage 6",
            icon: "🔍",
            units: pendingVerificationUnits,
            ordersCount: pendingVerificationOrders,
            path: "/executive-verify-orders",
            className: "status-card-verify",
            barColor: "#6366f1",
        },
        {
            title: "Completed",
            subtitle: "Stage 7",
            icon: "✅",
            units: completedUnits,
            ordersCount: completedOrders,
            path: "/executive-completed-order",
            className: "status-card-completed",
            barColor: "#10b981",
        },
    ];

    return (
        <div className="summary-wrapper">
            {/* HEADER & KEY METRICS */}
            <div className="summary-header">
                <div>
                    <h2 className="summary-title">
                        📊 Order Summary
                    </h2>
                    <p className="summary-subtitle">
                        Units, pipeline stages, and total value
                    </p>
                </div>

                <div className="summary-metric-chips">
                    <div className="summary-chip">
                        <div className="summary-chip-label">Total Orders</div>
                        <div className="summary-chip-val">{totalOrders}</div>
                    </div>
                    <div className="summary-chip summary-chip-blue">
                        <div className="summary-chip-label">Total Units</div>
                        <div className="summary-chip-val">
                            {totalQuantity} <span className="summary-chip-val-sub">Units</span>
                        </div>
                    </div>
                    <div className="summary-chip summary-chip-green">
                        <div className="summary-chip-label">Total Value</div>
                        <div className="summary-chip-val">₹{totalValue.toLocaleString()}</div>
                    </div>
                    <div className="summary-chip">
                        <div className="summary-chip-label">Completed</div>
                        <div className="summary-chip-val" style={{ color: "#16a34a" }}>{completionRate}%</div>
                    </div>
                </div>
            </div>

            {/* STACKED PIPELINE PROGRESS BAR */}
            {totalQuantity > 0 && (
                <div className="summary-pipeline-bar-wrapper">
                    <div className="summary-pipeline-header">
                        <span>Unit Pipeline Distribution ({totalQuantity} Total Units)</span>
                        <span>Completed Value: <b>₹{completedValue.toLocaleString()}</b> / ₹{totalValue.toLocaleString()}</span>
                    </div>
                    <div className="summary-pipeline-progress">
                        {statusCards.map((card, idx) => {
                            const pct = totalQuantity > 0 ? (card.units / totalQuantity) * 100 : 0;
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

            {/* STATUS CARDS GRID */}
            <div className="summary-body">
                <div className="summary-cards-grid">
                    {statusCards.map((card, index) => {
                        const unitPercentage = totalQuantity > 0 ? Math.round((card.units / totalQuantity) * 100) : 0;
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
                                    <span>View List</span>
                                    <span>→</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FOOTER & DETAILS ACCORDION TOGGLE */}
                <div className="summary-footer-bar">
                    <button
                        type="button"
                        onClick={() => setShowDetails(!showDetails)}
                        className="btn-quick-preview"
                    >
                        <span>{showDetails ? "▲ Hide Order Breakdown" : "▼ View Detailed Order Breakdown"}</span>
                        <span style={{ color: "#64748b", fontSize: "11px", marginLeft: "4px" }}>({orders.length} Orders)</span>
                    </button>

                    <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                        💡 <i>Tip: Click any status card above to immediately view and manage those orders.</i>
                    </div>
                </div>

                {/* EXPANDABLE DETAILS TABLE */}
                {showDetails && (
                    <div className="summary-table-container">
                        <table className="summary-table">
                            <thead>
                                <tr>
                                    <th>Product & Brand</th>
                                    <th style={{ textAlign: "center" }}>Unit Price</th>
                                    <th style={{ textAlign: "center" }}>Total Qty</th>
                                    <th>Unit Status Breakdown</th>
                                    <th style={{ textAlign: "right" }}>Total Value</th>
                                    <th style={{ textAlign: "center" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                                            No orders found in your team.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((ord, idx) => {
                                        const price = parseFloat(ord.price) || 0;
                                        const qty = Number(ord.quantity) || (ord.orderUnits ? ord.orderUnits.length : 0);
                                        const val = price * qty;
                                        const sum = ord.summary || {};

                                        let unassigned = sum.unassigned || 0;
                                        let pendingPay = sum.pendingPayment || 0;
                                        let assigned = sum.assigned || 0;
                                        let inProg = sum.inProgress || 0;
                                        let pendRef = sum.pendingRefund || 0;
                                        let completed = sum.completed || 0;

                                        if (Array.isArray(ord.orderUnits) && ord.orderUnits.length > 0) {
                                            unassigned = ord.orderUnits.filter((u) => u.status === "unassigned").length;
                                            pendingPay = ord.orderUnits.filter((u) => u.status === "pending_payment").length;
                                            assigned = ord.orderUnits.filter((u) => u.status === "assigned").length;
                                            inProg = ord.orderUnits.filter((u) => u.status === "in_progress").length;
                                            pendRef = ord.orderUnits.filter((u) => u.status === "pending_refund").length;
                                            completed = ord.orderUnits.filter((u) => u.status === "completed").length;
                                        }

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
                                                <td style={{ textAlign: "center", fontWeight: "600" }}>
                                                    ₹{price}
                                                </td>
                                                <td style={{ textAlign: "center" }}>
                                                    <span style={{ fontSize: "15px", fontWeight: "800", color: "var(--primary-600)" }}>{qty}</span>
                                                    <span style={{ fontSize: "11px", color: "var(--slate-500)" }}> pcs</span>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", fontSize: "11px" }}>
                                                        {unassigned > 0 && (
                                                            <span className="status-pill" style={{ backgroundColor: "#f1f5f9", color: "#475569", borderColor: "#cbd5e1" }}>
                                                                Pending: <b>{unassigned}</b>
                                                            </span>
                                                        )}
                                                        {pendingPay > 0 && (
                                                            <span className="status-pill" style={{ backgroundColor: "#fef3c7", color: "#92400e", borderColor: "#fcd34d" }}>
                                                                Pay Advance: <b>{pendingPay}</b>
                                                            </span>
                                                        )}
                                                        {assigned > 0 && (
                                                            <span className="status-pill" style={{ backgroundColor: "#ffedd5", color: "#9a3412", borderColor: "#fdba74" }}>
                                                                Assigned: <b>{assigned}</b>
                                                            </span>
                                                        )}
                                                        {inProg > 0 && (
                                                            <span className="status-pill" style={{ backgroundColor: "#ccfbf1", color: "#115e59", borderColor: "#99f6e4" }}>
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
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: "right", fontWeight: "700", color: "#0f766e" }}>
                                                    ₹{val.toLocaleString()}
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