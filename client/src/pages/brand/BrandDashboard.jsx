import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchBrandOrders } from "../../services/brand/orders";
import Logout from "../../component/Logout";
import BrandProductBreakdownModal from "../../component/brand/BrandProductBreakdownModal";
import "../../styles/brandDashboard.css";

export default function BrandDashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPlatform, setFilterPlatform] = useState("all");
    const [filterDate, setFilterDate] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [selectedOrderForBreakdown, setSelectedOrderForBreakdown] = useState(null);
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

    // Extract unique platforms from active orders
    const platformList = useMemo(() => {
        const set = new Set();
        orders.forEach((o) => {
            if (o.orderPlatform && typeof o.orderPlatform === "string") {
                set.add(o.orderPlatform.trim());
            }
        });
        return Array.from(set);
    }, [orders]);

    // Multi-attribute filtering and sorting
    const filteredOrders = useMemo(() => {
        return orders
            .filter((order) => {
                // Search query
                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase().trim();
                    const name = (order.productName || "").toLowerCase();
                    const platform = (order.orderPlatform || "").toLowerCase();
                    const exec = (order.executiveName || "").toLowerCase();
                    if (!name.includes(q) && !platform.includes(q) && !exec.includes(q)) {
                        return false;
                    }
                }

                // Platform filter
                if (filterPlatform !== "all") {
                    const p = (order.orderPlatform || "").toLowerCase();
                    if (filterPlatform.toLowerCase() === "other") {
                        if (p.includes("amazon") || p.includes("flipkart") || p.includes("myntra")) {
                            return false;
                        }
                    } else if (!p.includes(filterPlatform.toLowerCase())) {
                        return false;
                    }
                }

                // Status filter
                if (filterStatus !== "all") {
                    const summary = order.summary || {};
                    if (filterStatus === "in_progress" && !(summary.inProgress > 0)) return false;
                    if (filterStatus === "pending_refund" && !(summary.pendingRefund > 0)) return false;
                    if (filterStatus === "completed" && !(summary.completed > 0)) return false;
                    if (filterStatus === "unassigned" && !(summary.unassigned > 0)) return false;
                }

                // Date filter
                if (filterDate) {
                    const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
                    if (orderDate !== filterDate) return false;
                }

                return true;
            })
            .sort((a, b) => {
                if (sortBy === "oldest") {
                    return new Date(a.createdAt) - new Date(b.createdAt);
                }
                if (sortBy === "quantity") {
                    const aQty = a.quantity || (a.orderUnits || []).length || 0;
                    const bQty = b.quantity || (b.orderUnits || []).length || 0;
                    return bQty - aQty;
                }
                if (sortBy === "price") {
                    return (b.price || 0) - (a.price || 0);
                }
                if (sortBy === "completion") {
                    const aDone = a.summary?.completed || 0;
                    const aTot = a.quantity || (a.orderUnits || []).length || 1;
                    const bDone = b.summary?.completed || 0;
                    const bTot = b.quantity || (b.orderUnits || []).length || 1;
                    return (bDone / bTot) - (aDone / aTot);
                }
                // default "newest"
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
    }, [orders, searchQuery, filterPlatform, filterStatus, filterDate, sortBy]);

    const isAnyFilterActive =
        searchQuery.trim() !== "" ||
        filterStatus !== "all" ||
        filterPlatform !== "all" ||
        filterDate !== "" ||
        sortBy !== "newest";

    const clearAllFilters = () => {
        setSearchQuery("");
        setFilterStatus("all");
        setFilterPlatform("all");
        setFilterDate("");
        setSortBy("newest");
    };

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

            {/* TOOLBAR: MULTI-ATTRIBUTE FILTERING & CONTROLS */}
            <div className="brand-toolbar">
                {/* Top Row: Search + Platform + Date + Sort + Reset */}
                <div className="brand-toolbar-top">
                    <div className="brand-search-box">
                        <span className="brand-search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search campaign, platform, or executive..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="brand-search-input"
                        />
                    </div>

                    <div className="brand-toolbar-controls">
                        {/* Platform Selector */}
                        <select
                            value={filterPlatform}
                            onChange={(e) => setFilterPlatform(e.target.value)}
                            className="brand-select"
                            title="Filter by storefront platform"
                        >
                            <option value="all">🏷️ All Platforms</option>
                            <option value="amazon">Amazon</option>
                            <option value="flipkart">Flipkart</option>
                            <option value="myntra">Myntra</option>
                            {platformList
                                .filter(p => !["amazon", "flipkart", "myntra"].includes(p.toLowerCase()))
                                .map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))
                            }
                        </select>

                        {/* Date Picker Filter */}
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="brand-date-input"
                            title="Filter by campaign creation date"
                        />

                        {/* Sort Order Selector */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="brand-select"
                            title="Sort campaigns"
                        >
                            <option value="newest">⇅ Newest First</option>
                            <option value="oldest">⇅ Oldest First</option>
                            <option value="quantity">⇅ Highest Units</option>
                            <option value="price">⇅ Highest Price</option>
                            <option value="completion">⇅ Highest Completion %</option>
                        </select>

                        {/* Reset All Filters Button */}
                        {isAnyFilterActive && (
                            <button
                                type="button"
                                onClick={clearAllFilters}
                                className="brand-reset-filters-btn"
                                title="Reset all applied search and filters"
                            >
                                <span>↺</span>
                                <span>Reset Filters</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Bottom Row: Status Filter Pills + Stats */}
                <div className="brand-toolbar-bottom">
                    <div className="brand-filter-pills">
                        <button
                            type="button"
                            onClick={() => setFilterStatus("all")}
                            className={`brand-filter-pill-btn ${filterStatus === "all" ? "active" : ""}`}
                        >
                            All Campaigns ({orders.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus("in_progress")}
                            className={`brand-filter-pill-btn ${filterStatus === "in_progress" ? "active" : ""}`}
                        >
                            In Progress ({orders.filter(o => (o.summary?.inProgress || 0) > 0).length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus("pending_refund")}
                            className={`brand-filter-pill-btn ${filterStatus === "pending_refund" ? "active" : ""}`}
                        >
                            Pending Reviews ({orders.filter(o => (o.summary?.pendingRefund || 0) > 0).length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus("completed")}
                            className={`brand-filter-pill-btn ${filterStatus === "completed" ? "active" : ""}`}
                        >
                            Completed ({orders.filter(o => (o.summary?.completed || 0) > 0).length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus("unassigned")}
                            className={`brand-filter-pill-btn ${filterStatus === "unassigned" ? "active" : ""}`}
                        >
                            Open / Unassigned ({orders.filter(o => (o.summary?.unassigned || 0) > 0).length})
                        </button>
                    </div>

                    <div className="brand-filter-stats-text">
                        Showing <b>{filteredOrders.length}</b> of <b>{orders.length}</b> Campaigns
                    </div>
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
                                                    type="button"
                                                    onClick={() => setSelectedOrderForBreakdown(order)}
                                                    className="brand-breakdown-btn"
                                                    title="View product units and fulfillment verification breakdown"
                                                >
                                                    <span>📊</span>
                                                    <span>View Breakdown</span>
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

            {/* PRODUCT BREAKDOWN & EXCEL EXPORT MODAL */}
            {selectedOrderForBreakdown && (
                <BrandProductBreakdownModal
                    order={selectedOrderForBreakdown}
                    onClose={() => setSelectedOrderForBreakdown(null)}
                />
            )}
        </div>
    );
}