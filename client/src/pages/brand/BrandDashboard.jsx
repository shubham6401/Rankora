import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchBrandOrders } from "../../services/brand/orders";
import Logout from "../../component/Logout";
import "../../styles/brandDashboard.css";

export default function BrandDashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user")) || {};

    useEffect(() => {
        loadBrandOrders();
    }, []);

    const loadBrandOrders = async () => {
        try {
            setLoading(true);
            const response = await fetchBrandOrders();
            setOrders(response.data.orders || []);
        } catch (err) {
            console.error("Error loading brand orders:", err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate aggregated totals
    const totalUnits = orders.reduce((acc, o) => acc + (o.quantity || (o.orderUnits || []).length || 0), 0);
    const totalCompleted = orders.reduce((acc, o) => acc + (o.summary?.completed || 0), 0);
    const totalInProgress = orders.reduce((acc, o) => acc + (o.summary?.inProgress || 0), 0);
    const totalPendingRefund = orders.reduce((acc, o) => acc + (o.summary?.pendingRefund || 0), 0);
    const completionRate = totalUnits > 0 ? Math.round((totalCompleted / totalUnits) * 100) : 0;

    // Filter orders based on search & status
    const filteredOrders = orders.filter((order) => {
        const matchesSearch = !searchQuery.trim() || 
            (order.productName || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
            (order.orderPlatform || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
            (order.executiveName || "").toLowerCase().includes(searchQuery.toLowerCase().trim());

        if (!matchesSearch) return false;

        if (filterStatus === "all") return true;
        const summary = order.summary || {};
        if (filterStatus === "in_progress") return (summary.inProgress || 0) > 0;
        if (filterStatus === "pending_refund") return (summary.pendingRefund || 0) > 0;
        if (filterStatus === "completed") return (summary.completed || 0) > 0;
        return true;
    });

    const getPlatformBadgeClass = (platform = "") => {
        const lower = platform.toLowerCase();
        if (lower.includes("amazon")) return "platform-badge platform-amazon";
        if (lower.includes("flipkart")) return "platform-badge platform-flipkart";
        if (lower.includes("myntra")) return "platform-badge platform-myntra";
        return "platform-badge platform-other";
    };

    const brandInitial = (user.brand || user.name || "B").charAt(0).toUpperCase();

    return (
        <div className="brand-dashboard-container">
            {/* HERO PROFILE CARD */}
            <div className="brand-hero-card">
                <div className="brand-hero-left">
                    <div className="brand-avatar-box">
                        {brandInitial}
                    </div>
                    <div>
                        <div className="brand-hero-title-row">
                            <h1 className="brand-hero-title">
                                {user.brand || user.name || "Brand"} Command Center
                            </h1>
                            <span className="brand-verified-chip">
                                ✦ Verified Brand
                            </span>
                        </div>
                        <div className="brand-hero-meta">
                            <span>Representative: <b>{user.name || "Brand Lead"}</b></span>
                            <span className="dot-separator">•</span>
                            <span>Role: <b>{user.role || "Brand"}</b></span>
                            <span className="dot-separator">•</span>
                            <span>Active Campaigns: <b>{orders.length}</b></span>
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="brand-hero-actions">
                    <button
                        onClick={loadBrandOrders}
                        className="brand-refresh-btn"
                        title="Refresh campaign stats"
                    >
                        ↻ Refresh
                    </button>
                    <Logout />
                </div>
            </div>

            {/* METRICS & KPI CARDS */}
            <div className="brand-kpi-grid">
                {/* 1. Total Campaigns */}
                <div className="brand-kpi-card kpi-campaigns">
                    <div className="brand-kpi-top">
                        <span className="brand-kpi-label">Active Campaigns</span>
                        <div className="brand-kpi-icon">📦</div>
                    </div>
                    <div>
                        <div className="brand-kpi-val">{orders.length}</div>
                        <span className="brand-kpi-sub">Product Lines Registered</span>
                    </div>
                </div>

                {/* 2. Total Units Scheduled */}
                <div className="brand-kpi-card kpi-units">
                    <div className="brand-kpi-top">
                        <span className="brand-kpi-label">Total Volume</span>
                        <div className="brand-kpi-icon">📊</div>
                    </div>
                    <div>
                        <div className="brand-kpi-val">{totalUnits}</div>
                        <span className="brand-kpi-sub">Total Units Dispatched</span>
                    </div>
                </div>

                {/* 3. In Progress Pipeline */}
                <div className="brand-kpi-card kpi-inprogress">
                    <div className="brand-kpi-top">
                        <span className="brand-kpi-label">In Progress</span>
                        <div className="brand-kpi-icon">⚡</div>
                    </div>
                    <div>
                        <div className="brand-kpi-val">{totalInProgress}</div>
                        <span className="brand-kpi-sub">Units in Active Placement</span>
                    </div>
                </div>

                {/* 4. Pending Refund & Reviews */}
                <div className="brand-kpi-card kpi-refund">
                    <div className="brand-kpi-top">
                        <span className="brand-kpi-label">Reviews & Refunds</span>
                        <div className="brand-kpi-icon">📝</div>
                    </div>
                    <div>
                        <div className="brand-kpi-val">{totalPendingRefund}</div>
                        <span className="brand-kpi-sub">Delivered & Verifying</span>
                    </div>
                </div>

                {/* 5. Fulfilled & Completed */}
                <div className="brand-kpi-card kpi-completed">
                    <div className="brand-kpi-top">
                        <span className="brand-kpi-label">Completed Orders</span>
                        <div className="brand-kpi-icon">✅</div>
                    </div>
                    <div>
                        <div className="brand-kpi-val">{totalCompleted}</div>
                        <span className="brand-kpi-sub">{completionRate}% Completion Rate</span>
                        <div className="brand-kpi-bar">
                            <div 
                                className="brand-kpi-bar-fill" 
                                style={{ width: `${completionRate}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TOOLBAR: SEARCH & STATUS FILTERS */}
            <div className="brand-toolbar">
                <div className="brand-search-box">
                    <span className="brand-search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search product campaigns, platform, or executive..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="brand-search-input"
                    />
                </div>

                <div className="brand-filter-pills">
                    <button
                        onClick={() => setFilterStatus("all")}
                        className={`brand-filter-pill-btn ${filterStatus === "all" ? "active" : ""}`}
                    >
                        All Campaigns ({orders.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus("in_progress")}
                        className={`brand-filter-pill-btn ${filterStatus === "in_progress" ? "active" : ""}`}
                    >
                        In Progress ({orders.filter(o => (o.summary?.inProgress || 0) > 0).length})
                    </button>
                    <button
                        onClick={() => setFilterStatus("pending_refund")}
                        className={`brand-filter-pill-btn ${filterStatus === "pending_refund" ? "active" : ""}`}
                    >
                        Pending Reviews ({orders.filter(o => (o.summary?.pendingRefund || 0) > 0).length})
                    </button>
                    <button
                        onClick={() => setFilterStatus("completed")}
                        className={`brand-filter-pill-btn ${filterStatus === "completed" ? "active" : ""}`}
                    >
                        Completed ({orders.filter(o => (o.summary?.completed || 0) > 0).length})
                    </button>
                </div>
            </div>

            {/* CAMPAIGN PRODUCTS TABLE */}
            <div className="brand-table-card">
                <div className="brand-table-header">
                    <h2 className="brand-table-title">
                        <span>🏷️</span>
                        <span>Product Campaigns</span>
                    </h2>
                    <span className="brand-table-count">
                        Showing <b>{filteredOrders.length}</b> of <b>{orders.length}</b> Campaigns
                    </span>
                </div>

                {loading ? (
                    <div className="brand-empty-state">
                        <div className="brand-empty-icon">⏳</div>
                        <h3 className="brand-empty-title">Loading Campaigns...</h3>
                        <p className="brand-empty-text">Fetching live product campaign batches for your brand.</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="brand-empty-state">
                        <div className="brand-empty-icon">📦</div>
                        <h3 className="brand-empty-title">
                            {orders.length === 0 ? "No Campaigns Registered" : "No Matching Campaigns Found"}
                        </h3>
                        <p className="brand-empty-text">
                            {orders.length === 0
                                ? "Your enterprise executive has not added any product campaign batches yet."
                                : "Try clearing your search query or selecting a different status filter."}
                        </p>
                    </div>
                ) : (
                    <div className="brand-table-responsive">
                        <table className="brand-data-table">
                            <thead>
                                <tr>
                                    <th>Product Campaign</th>
                                    <th>Platform</th>
                                    <th>Price / Unit</th>
                                    <th>Units Scheduled</th>
                                    <th>Pipeline Distribution</th>
                                    <th>Executive POC</th>
                                    <th>Created Date</th>
                                    <th style={{ textAlign: "center" }}>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredOrders.map((order) => {
                                    const summary = order.summary || {};
                                    const orderUnitsCount = order.quantity || (order.orderUnits || []).length || 1;
                                    
                                    // Calculate progress percentages
                                    const pctUnassigned = ((summary.unassigned || 0) / orderUnitsCount) * 100;
                                    const pctAssigned = ((summary.assigned || 0) / orderUnitsCount) * 100;
                                    const pctInProg = ((summary.inProgress || 0) / orderUnitsCount) * 100;
                                    const pctRefund = ((summary.pendingRefund || 0) / orderUnitsCount) * 100;
                                    const pctDone = ((summary.completed || 0) / orderUnitsCount) * 100;

                                    return (
                                        <tr key={order._id}>
                                            {/* Product Column */}
                                            <td>
                                                <div className="brand-product-title" title={order.productName}>
                                                    {order.productName}
                                                </div>
                                                {order.productLink && (
                                                    <a
                                                        href={order.productLink}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="brand-product-link"
                                                    >
                                                        <span>Product Storefront</span>
                                                        <span>↗</span>
                                                    </a>
                                                )}
                                            </td>

                                            {/* Platform Column */}
                                            <td>
                                                <span className={getPlatformBadgeClass(order.orderPlatform)}>
                                                    {order.orderPlatform}
                                                </span>
                                            </td>

                                            {/* Price Column */}
                                            <td>
                                                <span className="brand-price-tag">
                                                    ₹{order.price}
                                                </span>
                                            </td>

                                            {/* Units Scheduled */}
                                            <td>
                                                <span style={{ fontWeight: 800, color: "var(--slate-800)" }}>
                                                    {orderUnitsCount} Units
                                                </span>
                                            </td>

                                            {/* Pipeline Distribution Visualizer */}
                                            <td>
                                                {/* Mini Segmented Progress Bar */}
                                                <div className="order-multi-bar">
                                                    <div className="bar-segment bar-completed" style={{ width: `${pctDone}%` }} title={`Completed: ${summary.completed || 0}`}></div>
                                                    <div className="bar-segment bar-refund" style={{ width: `${pctRefund}%` }} title={`Pending Refund: ${summary.pendingRefund || 0}`}></div>
                                                    <div className="bar-segment bar-inprogress" style={{ width: `${pctInProg}%` }} title={`In Progress: ${summary.inProgress || 0}`}></div>
                                                    <div className="bar-segment bar-assigned" style={{ width: `${pctAssigned}%` }} title={`Assigned: ${summary.assigned || 0}`}></div>
                                                    <div className="bar-segment bar-unassigned" style={{ width: `${pctUnassigned}%` }} title={`Unassigned: ${summary.unassigned || 0}`}></div>
                                                </div>

                                                {/* Micro Chips */}
                                                <div className="pipeline-chips-wrap">
                                                    {summary.completed > 0 && (
                                                        <span className="pipeline-chip pipeline-chip-completed">
                                                            ✓ Done: {summary.completed}
                                                        </span>
                                                    )}
                                                    {summary.pendingRefund > 0 && (
                                                        <span className="pipeline-chip pipeline-chip-pending_refund">
                                                            Review: {summary.pendingRefund}
                                                        </span>
                                                    )}
                                                    {summary.inProgress > 0 && (
                                                        <span className="pipeline-chip pipeline-chip-in_progress">
                                                            Active: {summary.inProgress}
                                                        </span>
                                                    )}
                                                    {summary.assigned > 0 && (
                                                        <span className="pipeline-chip pipeline-chip-assigned">
                                                            Assigned: {summary.assigned}
                                                        </span>
                                                    )}
                                                    {summary.unassigned > 0 && (
                                                        <span className="pipeline-chip pipeline-chip-unassigned">
                                                            Open: {summary.unassigned}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Executive POC */}
                                            <td>
                                                <div className="poc-name">
                                                    {order.executiveName || "Executive POC"}
                                                </div>
                                                <div className="poc-team-code">
                                                    Team {order.teamCode || "N/A"}
                                                </div>
                                            </td>

                                            {/* Created Date */}
                                            <td style={{ color: "var(--slate-500)", fontSize: "13px" }}>
                                                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </td>

                                            {/* Action Column */}
                                            <td style={{ textAlign: "center" }}>
                                                <button
                                                    onClick={() => navigate(`/order/${order._id}`)}
                                                    className="brand-inspect-btn"
                                                >
                                                    <span>Inspect</span>
                                                    <span>↗</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}