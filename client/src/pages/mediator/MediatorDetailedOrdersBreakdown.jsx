import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMediatorSummary } from "../../services/mediator/orders";
import "../../styles/detailedOrders.css";
import "../../styles/dashboard.css";

export default function MediatorDetailedOrdersBreakdown() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user")) || {};

    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({});
    const [orders, setOrders] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await fetchMediatorSummary();
            if (res.data?.success) {
                setSummary(res.data.summary || {});
                setOrders(res.data.orders || []);
            }
        } catch (err) {
            console.error("Error loading mediator detailed orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter((ord) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
            !query ||
            (ord.productName && ord.productName.toLowerCase().includes(query)) ||
            (ord.brand && ord.brand.toLowerCase().includes(query)) ||
            (ord.brandUserId?.brand && ord.brandUserId.brand.toLowerCase().includes(query)) ||
            (ord.executiveName && ord.executiveName.toLowerCase().includes(query)) ||
            (ord.createdBy?.name && ord.createdBy.name.toLowerCase().includes(query)) ||
            (ord._id && ord._id.toLowerCase().includes(query));

        if (!matchesQuery) return false;

        if (statusFilter === "all") return true;

        const myUnits = ord.orderUnits || [];
        if (statusFilter === "assigned") return myUnits.some((u) => u.status === "assigned");
        if (statusFilter === "in_progress") return myUnits.some((u) => u.status === "in_progress");
        if (statusFilter === "pending_refund") return myUnits.some((u) => u.status === "pending_refund");
        if (statusFilter === "completed") return myUnits.some((u) => u.status === "completed");
        if (statusFilter === "pending_payment") return myUnits.some((u) => u.status === "pending_payment");

        return true;
    });

    const totalUnits = summary.totalUnits || 0;
    const completedUnits = summary.completedUnits || 0;
    const completionRate = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

    return (
        <div className="breakdown-page-container">
            {/* HEADER CARD */}
            <div className="breakdown-header-card">
                <div>
                    <h1 className="breakdown-header-title">
                        📋 Detailed Assigned Orders Breakdown
                    </h1>
                    <div className="dashboard-meta-bar">
                        <span>Mediator: <b>{user.name || "Mediator"}</b></span> &nbsp;|&nbsp;
                        <span>Code: <b className="dashboard-meta-pill">{user.mediatorCode || "N/A"}</b></span> &nbsp;|&nbsp;
                        <span>Team Code: <b>{user.teamCode || "N/A"}</b></span>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        type="button"
                        onClick={loadData}
                        disabled={loading}
                        className="earning-btn"
                        style={{ padding: "8px 16px" }}
                    >
                        {loading ? "..." : "↻ Refresh"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/panel-mediator")}
                        className="dash-btn dash-btn-primary"
                        style={{ padding: "8px 18px", fontSize: "13px" }}
                    >
                        ← Mediator Dashboard
                    </button>
                </div>
            </div>

            {/* HIGH-LEVEL METRIC CARDS */}
            <div className="breakdown-metrics-grid">
                <div className="breakdown-metric-box">
                    <div className="bm-title">Total Orders</div>
                    <div className="bm-num">{summary.totalOrders || 0}</div>
                    <div className="bm-sub">Assigned to your account</div>
                </div>

                <div className="breakdown-metric-box bm-box-blue">
                    <div className="bm-title">Total Assigned Units</div>
                    <div className="bm-num">
                        {totalUnits} <span style={{ fontSize: "14px", fontWeight: "600" }}>Units</span>
                    </div>
                    <div className="bm-sub">Across all products</div>
                </div>

                <div className="breakdown-metric-box bm-box-green">
                    <div className="bm-title">Total Handled Value</div>
                    <div className="bm-num">
                        ₹{(summary.totalValue || 0).toLocaleString()}
                    </div>
                    <div className="bm-sub">Completed: ₹{(summary.completedValue || 0).toLocaleString()} ({completionRate}%)</div>
                </div>

                <div className="breakdown-metric-box bm-box-purple">
                    <div className="bm-title">Active In-Flight</div>
                    <div className="bm-num">
                        {(summary.inProgressUnits || 0) + (summary.pendingRefundUnits || 0)} <span style={{ fontSize: "14px", fontWeight: "600" }}>Units</span>
                    </div>
                    <div className="bm-sub">In progress & refund pending</div>
                </div>
            </div>

            {/* FILTER & SEARCH TOOLBAR */}
            <div className="breakdown-toolbar">
                <div style={{ flex: "1 1 300px" }}>
                    <input
                        type="text"
                        placeholder="🔍 Search product, brand, executive name, or order ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="breakdown-search-input"
                    />
                </div>

                <div className="breakdown-filter-group">
                    {[
                        { key: "all", label: `All (${orders.length})` },
                        { key: "assigned", label: `New Assigned (${summary.newAssignedUnits || 0})` },
                        { key: "in_progress", label: `In Progress (${summary.inProgressUnits || 0})` },
                        { key: "pending_refund", label: `Pending Refund (${summary.pendingRefundUnits || 0})` },
                        { key: "completed", label: `Completed (${summary.completedUnits || 0})` },
                        { key: "pending_payment", label: `Payment Pending (${summary.pendingPaymentUnits || 0})` },
                    ].map((filter) => (
                        <button
                            key={filter.key}
                            type="button"
                            onClick={() => setStatusFilter(filter.key)}
                            className={`breakdown-filter-btn ${statusFilter === filter.key ? "filter-btn-active" : ""}`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* DETAILED ORDERS TABLE */}
            <div className="breakdown-table-wrapper">
                <div className="breakdown-table-header">
                    <h3 className="breakdown-table-title">
                        Orders List ({filteredOrders.length} {filteredOrders.length === 1 ? "Order" : "Orders"})
                    </h3>
                    <span style={{ fontSize: "13px", color: "var(--slate-500)" }}>
                        Showing {filteredOrders.length} of {orders.length} total orders
                    </span>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table className="breakdown-table">
                        <thead>
                            <tr>
                                <th>Product & Brand</th>
                                <th>Executive & Team</th>
                                <th style={{ textAlign: "center" }}>Unit Price</th>
                                <th style={{ textAlign: "center" }}>My Units</th>
                                <th>Unit Status Breakdown</th>
                                <th style={{ textAlign: "right" }}>Total Value</th>
                                <th style={{ textAlign: "center" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#718096" }}>
                                        Loading detailed assigned orders...
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#a0aec0" }}>
                                        No assigned orders match your search or filter criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((ord, idx) => {
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
                                                <div className="breakdown-product-title">
                                                    {ord.productName || "Unnamed Product"}
                                                </div>
                                                <div style={{ fontSize: "12px", color: "var(--slate-500)", display: "flex", gap: "8px", alignItems: "center" }}>
                                                    <span>Brand: <b>{ord.brand || ord.brandUserId?.brand || "N/A"}</b></span>
                                                    {ord.orderPlatform && (
                                                        <span style={{ backgroundColor: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>
                                                            {ord.orderPlatform}
                                                        </span>
                                                    )}
                                                </div>
                                                {ord.productLink && (
                                                    <a
                                                        href={ord.productLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="breakdown-link"
                                                    >
                                                        View Product Link ↗
                                                    </a>
                                                )}
                                            </td>

                                            <td style={{ color: "var(--slate-700)" }}>
                                                <div style={{ fontWeight: "600" }}>{ord.executiveName || ord.createdBy?.name || "Executive"}</div>
                                                <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                                                    Team: <b style={{ color: "var(--primary-600)" }}>{ord.teamCode || ord.createdBy?.teamCode || "N/A"}</b>
                                                </div>
                                                {ord.createdAt && (
                                                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                                                        {new Date(ord.createdAt).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>

                                            <td style={{ textAlign: "center", fontWeight: "700", color: "var(--slate-800)", fontSize: "14px" }}>
                                                ₹{price.toLocaleString()}
                                            </td>

                                            <td style={{ textAlign: "center" }}>
                                                <span style={{ fontSize: "16px", fontWeight: "800", color: "var(--primary-600)" }}>{myUnitsCount}</span>
                                                <span style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: "600" }}> pcs</span>
                                            </td>

                                            <td>
                                                <div className="breakdown-status-badges">
                                                    {newAssigned > 0 && (
                                                        <span
                                                            onClick={() => navigate("/mediator-neworders")}
                                                            className="status-badge-interactive badge-new"
                                                            title="Click to review & accept/reject"
                                                        >
                                                            📥 New: <b>{newAssigned}</b>
                                                        </span>
                                                    )}
                                                    {inProg > 0 && (
                                                        <span
                                                            onClick={() => navigate("/mediator-pending-orders")}
                                                            className="status-badge-interactive badge-prog"
                                                            title="Click to submit order details"
                                                        >
                                                            ⏳ In Prog: <b>{inProg}</b>
                                                        </span>
                                                    )}
                                                    {pendRef > 0 && (
                                                        <span
                                                            onClick={() => navigate("/mediator-refund_pending-orders")}
                                                            className="status-badge-interactive badge-refund"
                                                            title="Click to submit refund proofs"
                                                        >
                                                            🔄 Refund: <b>{pendRef}</b>
                                                        </span>
                                                    )}
                                                    {completed > 0 && (
                                                        <span
                                                            onClick={() => navigate("/mediator-completed-orders")}
                                                            className="status-badge-interactive badge-done"
                                                            title="Click to view completed orders"
                                                        >
                                                            ✅ Done: <b>{completed}</b>
                                                        </span>
                                                    )}
                                                    {pendPay > 0 && (
                                                        <span
                                                            onClick={() => navigate("/mediator-pending-payment")}
                                                            className="status-badge-interactive badge-pay"
                                                            title="Click to submit refund screenshot"
                                                        >
                                                            💳 Pay Pending: <b>{pendPay}</b>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td style={{ textAlign: "right", fontWeight: "700", color: "#0f766e", fontSize: "14px" }}>
                                                ₹{myVal.toLocaleString()}
                                            </td>

                                            <td style={{ textAlign: "center" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/order/${ord._id}`)}
                                                    className="btn-view-details"
                                                >
                                                    View Details ↗
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
