import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMediatorTrackedOrders } from "../../services/mediator/orders";
import ProofThumbnail from "../../component/common/ProofThumbnail";
import ProofPreviewModal from "../../component/common/ProofPreviewModal";
import "../../styles/ordersTable.css";

const DATE_CHIPS = [
    { label: "All Time", value: "all" },
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "7days" },
    { label: "This Month", value: "30days" },
];

const STATUS_OPTIONS = [
    { label: "All Stages", value: "all" },
    { label: "In Progress (Fulfillment)", value: "in_progress" },
    { label: "Pending Refund (Review)", value: "pending_refund" },
    { label: "Pending Verification", value: "pending_verification" },
    { label: "Completed", value: "completed" },
    { label: "Settled Payout", value: "settled" },
    { label: "Pending Advance", value: "pending_payment" },
];

export default function MediatorOrderTracker() {
    const navigate = useNavigate();

    const [activeView, setActiveView] = useState("table"); // "table" | "brand_intel"
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [summary, setSummary] = useState({
        totalUnits: 0,
        completedUnits: 0,
        pendingUnits: 0,
        totalEarnings: 0,
        activeCapital: 0,
    });
    const [brandsList, setBrandsList] = useState([]);
    const [brandStats, setBrandStats] = useState({});

    // Filter states
    const [dateFilter, setDateFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedBrand, setSelectedBrand] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [previewModalUrl, setPreviewModalUrl] = useState(null);

    // Memory of last submitted order ID
    const lastOrderId = localStorage.getItem("lastSubmittedOrderId") || "";

    useEffect(() => {
        loadData();
    }, [dateFilter, statusFilter, selectedBrand, startDate, endDate]);

    const loadData = async (extraParams = {}) => {
        try {
            setLoading(true);
            const params = {
                dateFilter,
                status: statusFilter,
                brand: selectedBrand,
                search: searchQuery.trim() || undefined,
                startDate: dateFilter === "custom" ? startDate : undefined,
                endDate: dateFilter === "custom" ? endDate : undefined,
                ...extraParams,
            };

            const res = await fetchMediatorTrackedOrders(params);
            if (res.data?.success) {
                setOrders(res.data.orders || []);
                setSummary(res.data.summary || {});
                setBrandsList(res.data.brandsList || []);
                setBrandStats(res.data.brandStats || {});
            }
        } catch (err) {
            console.error("Failed to load mediator tracked orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        loadData({ search: searchQuery.trim() || undefined });
    };

    const handleQuickLastOrderFilter = () => {
        if (!lastOrderId) return;
        setSearchQuery(lastOrderId);
        loadData({ search: lastOrderId });
    };

    const handleResetFilters = () => {
        setDateFilter("all");
        setStatusFilter("all");
        setSelectedBrand("all");
        setSearchQuery("");
        setStartDate("");
        setEndDate("");
        loadData({
            dateFilter: "all",
            status: "all",
            brand: "all",
            search: undefined,
            startDate: undefined,
            endDate: undefined,
        });
    };

    const handleBrandSelectFromIntel = (brandName) => {
        setSelectedBrand(brandName);
        setActiveView("table");
        loadData({ brand: brandName });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "in_progress":
                return { label: "In Progress", color: "#d97706", bg: "#fef3c7", border: "#fde68a" };
            case "pending_refund":
                return { label: "Pending Refund", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };
            case "pending_verification":
                return { label: "Pending Verification", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" };
            case "completed":
                return { label: "Completed", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" };
            case "settled":
                return { label: "Settled Payout", color: "#047857", bg: "#d1fae5", border: "#6ee7b7" };
            default:
                return { label: status?.replace("_", " ") || "Pending", color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" };
        }
    };

    return (
        <div className="table-page-container">
            {/* Top Workspace Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "16px",
                marginBottom: "24px"
            }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "28px" }}>🎯</span>
                        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                            Order Command Center & Tracker
                        </h1>
                        <span style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: "12px",
                            backgroundColor: "#ecfdf5",
                            color: "#059669",
                            border: "1px solid #a7f3d0"
                        }}>
                            Unified Workspace
                        </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b", maxWidth: "720px" }}>
                        Monitor, filter by date or brand, search by e-commerce Order ID, and take direct action across all your assigned orders.
                    </p>
                </div>

                {/* View Switcher Tabs */}
                <div style={{
                    display: "flex",
                    background: "#e2e8f0",
                    padding: "4px",
                    borderRadius: "10px",
                    gap: "4px"
                }}>
                    <button
                        type="button"
                        onClick={() => setActiveView("table")}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "7px",
                            fontSize: "13px",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                            background: activeView === "table" ? "#ffffff" : "transparent",
                            color: activeView === "table" ? "#0f172a" : "#64748b",
                            boxShadow: activeView === "table" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                        }}
                    >
                        <span>📋</span>
                        <span>Orders Workspace ({orders.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveView("brand_intel")}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "7px",
                            fontSize: "13px",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                            background: activeView === "brand_intel" ? "#ffffff" : "transparent",
                            color: activeView === "brand_intel" ? "#0f172a" : "#64748b",
                            boxShadow: activeView === "brand_intel" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                        }}
                    >
                        <span>🏢</span>
                        <span>Brand Intelligence ({Object.keys(brandStats).length})</span>
                    </button>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "24px"
            }}>
                <div style={{
                    background: "#ffffff",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                        Total Tracked Units
                    </div>
                    <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
                        {summary.totalUnits || 0}
                    </div>
                </div>

                <div style={{
                    background: "#ffffff",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    border: "1px solid #fde68a",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>
                        Pending Action Units
                    </div>
                    <div style={{ fontSize: "26px", fontWeight: 800, color: "#d97706", marginTop: "4px" }}>
                        {summary.pendingUnits || 0}
                    </div>
                </div>

                <div style={{
                    background: "#ffffff",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    border: "1px solid #bbf7d0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#15803d", textTransform: "uppercase" }}>
                        Completed Units
                    </div>
                    <div style={{ fontSize: "26px", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>
                        {summary.completedUnits || 0}
                    </div>
                </div>

                <div style={{
                    background: "#ffffff",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    border: "1px solid #bfdbfe",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>
                        Earned Commission
                    </div>
                    <div style={{ fontSize: "26px", fontWeight: 800, color: "#2563eb", marginTop: "4px" }}>
                        ₹{(summary.totalEarnings || 0).toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Filter and Control Bar */}
            <div style={{
                background: "#ffffff",
                padding: "18px 20px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                marginBottom: "24px"
            }}>
                {/* Row 1: Date Chips & Quick Memory Filter */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginBottom: "16px",
                    paddingBottom: "14px",
                    borderBottom: "1px solid #f1f5f9"
                }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#475569" }}>Time Window:</span>
                        {DATE_CHIPS.map((chip) => (
                            <button
                                key={chip.value}
                                type="button"
                                onClick={() => setDateFilter(chip.value)}
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    fontSize: "12.5px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    border: dateFilter === chip.value ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                                    backgroundColor: dateFilter === chip.value ? "#eff6ff" : "#ffffff",
                                    color: dateFilter === chip.value ? "#1d4ed8" : "#475569",
                                    transition: "all 0.15s"
                                }}
                            >
                                {chip.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setDateFilter("custom")}
                            style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                fontSize: "12.5px",
                                fontWeight: 600,
                                cursor: "pointer",
                                border: dateFilter === "custom" ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                                backgroundColor: dateFilter === "custom" ? "#eff6ff" : "#ffffff",
                                color: dateFilter === "custom" ? "#1d4ed8" : "#475569",
                            }}
                        >
                            📅 Custom
                        </button>
                    </div>

                    {/* Quick Memory Chip: Last Input Order ID */}
                    {lastOrderId && (
                        <button
                            type="button"
                            onClick={handleQuickLastOrderFilter}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "1.5px solid #fbbf24",
                                backgroundColor: "#fffbeb",
                                color: "#b45309",
                                fontSize: "12.5px",
                                fontWeight: 700,
                                cursor: "pointer"
                            }}
                            title="Filter orders by the last Order ID you submitted"
                        >
                            <span>⚡</span>
                            <span>Filter by Last Input ID: <b>{lastOrderId}</b></span>
                        </button>
                    )}
                </div>

                {/* Custom Date Pickers (if Custom Selected) */}
                {dateFilter === "custom" && (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "16px",
                        padding: "10px 14px",
                        background: "#f8fafc",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0"
                    }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Date Range:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{ padding: "6px 10px", fontSize: "12.5px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                        />
                        <span style={{ fontSize: "12px", color: "#64748b" }}>to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{ padding: "6px 10px", fontSize: "12.5px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                        />
                    </div>
                )}

                {/* Row 2: Search, Brand, and Status Dropdowns */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "14px",
                    alignItems: "center"
                }}>
                    {/* Search Input */}
                    <form onSubmit={handleSearchSubmit} style={{ position: "relative", gridColumn: "span 2" }}>
                        <input
                            type="text"
                            placeholder="Search by Order ID, Product Name, Reviewer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 12px 9px 34px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "13.5px",
                                outline: "none",
                                boxSizing: "border-box"
                            }}
                        />
                        <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                            🔍
                        </span>
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery("");
                                    loadData({ search: undefined });
                                }}
                                style={{
                                    position: "absolute",
                                    right: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    border: "none",
                                    background: "transparent",
                                    color: "#94a3b8",
                                    cursor: "pointer",
                                    fontSize: "14px"
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </form>

                    {/* Brand Filter Dropdown */}
                    <div>
                        <select
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 12px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "13px",
                                outline: "none",
                                background: "#ffffff"
                            }}
                        >
                            <option value="all">🏢 All Brands ({brandsList.length})</option>
                            {brandsList.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter Dropdown */}
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 12px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "13px",
                                outline: "none",
                                background: "#ffffff"
                            }}
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Reset Button */}
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            style={{
                                padding: "9px 16px",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#475569",
                                background: "#f8fafc",
                                border: "1px solid #cbd5e1",
                                borderRadius: "8px",
                                cursor: "pointer",
                                width: "100%"
                            }}
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* TAB VIEW 1: UNIT ORDERS TABLE */}
            {activeView === "table" && (
                <>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
                            <div style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</div>
                            <div style={{ fontWeight: 700 }}>Filtering & Tracking Orders...</div>
                        </div>
                    ) : orders.length === 0 ? (
                        <div style={{
                            background: "#ffffff",
                            borderRadius: "12px",
                            border: "1px dashed #cbd5e1",
                            padding: "48px 24px",
                            textAlign: "center"
                        }}>
                            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
                            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 6px 0" }}>
                                No Matching Orders Found
                            </h3>
                            <p style={{ fontSize: "13.5px", color: "#64748b", margin: "0 0 16px 0" }}>
                                No orders match your selected time window, brand, or search filters.
                            </p>
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    backgroundColor: "#2563eb",
                                    color: "#ffffff",
                                    fontWeight: 700,
                                    border: "none",
                                    cursor: "pointer"
                                }}
                            >
                                Clear All Filters
                            </button>
                        </div>
                    ) : (
                        <div className="data-table-container">
                            <div className="data-table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Product &amp; Brand</th>
                                            <th>Platform</th>
                                            <th>Order ID</th>
                                            <th>Reviewer</th>
                                            <th>Price</th>
                                            <th>Stage &amp; Status</th>
                                            <th>Dates</th>
                                            <th>Proofs</th>
                                            <th>Direct Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((item, idx) => {
                                            const badge = getStatusBadge(item.status);
                                            const isRevision = !!item.verificationRejectionReason;

                                            return (
                                                <tr key={item.unitId || idx} style={isRevision ? { background: "#fffdfd" } : {}}>
                                                    <td>{idx + 1}</td>

                                                    {/* Product & Brand */}
                                                    <td className="product-name-cell">
                                                        <div style={{ fontWeight: 700, color: "#0f172a" }}>
                                                            {item.productName}
                                                        </div>
                                                        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px" }}>
                                                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569", background: "#f1f5f9", padding: "1px 6px", borderRadius: "4px" }}>
                                                                🏢 {item.brand}
                                                            </span>
                                                            {item.unitType && (
                                                                <span style={{ fontSize: "10.5px", color: "#64748b" }}>
                                                                    {item.unitType === "warehouse" ? "🏢 WH" : "📦 Empty"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Platform */}
                                                    <td>
                                                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                                                            {item.orderPlatform}
                                                        </span>
                                                    </td>

                                                    {/* External Order ID */}
                                                    <td>
                                                        {item.orderId ? (
                                                            <span style={{
                                                                fontFamily: "monospace",
                                                                fontWeight: 700,
                                                                fontSize: "12.5px",
                                                                color: "#1e293b",
                                                                background: "#f8fafc",
                                                                padding: "2px 6px",
                                                                borderRadius: "4px",
                                                                border: "1px solid #e2e8f0"
                                                            }}>
                                                                {item.orderId}
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "12px" }}>
                                                                Not submitted
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Reviewer Name */}
                                                    <td>
                                                        {item.reviewerName ? (
                                                            <span style={{ fontWeight: 600, fontSize: "12.5px", color: "#334155" }}>
                                                                {item.reviewerName}
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: "#94a3b8", fontSize: "12px" }}>-</span>
                                                        )}
                                                    </td>

                                                    {/* Price */}
                                                    <td>
                                                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>
                                                            ₹{item.purchasePrice || item.price}
                                                        </div>
                                                        {item.purchasePrice && item.purchasePrice !== item.price && (
                                                            <span style={{ fontSize: "10.5px", color: "#64748b" }}>
                                                                Target: ₹{item.price}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Stage & Status */}
                                                    <td>
                                                        <span style={{
                                                            fontSize: "11px",
                                                            fontWeight: 700,
                                                            padding: "3px 8px",
                                                            borderRadius: "10px",
                                                            backgroundColor: badge.bg,
                                                            color: badge.color,
                                                            border: `1px solid ${badge.border}`,
                                                            display: "inline-block"
                                                        }}>
                                                            ● {badge.label}
                                                        </span>
                                                        {isRevision && (
                                                            <div style={{ fontSize: "10.5px", color: "#b91c1c", fontWeight: 700, marginTop: "3px" }}>
                                                                ⚠️ Revision Required
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Dates */}
                                                    <td style={{ fontSize: "12px", color: "#64748b" }}>
                                                        <div>Placed: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</div>
                                                        {item.expectedArrivalDate && (
                                                            <div style={{ fontSize: "11px", color: "#334155" }}>
                                                                ETA: {new Date(item.expectedArrivalDate).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Proofs */}
                                                    <td>
                                                        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                                            {item.orderedScreenshot ? (
                                                                <ProofThumbnail
                                                                    url={item.orderedScreenshot}
                                                                    alt="Order Proof"
                                                                    size={32}
                                                                    onClick={() => setPreviewModalUrl(item.orderedScreenshot)}
                                                                />
                                                            ) : null}
                                                            {item.reviewProof ? (
                                                                <ProofThumbnail
                                                                    url={item.reviewProof}
                                                                    alt="Review Proof"
                                                                    size={32}
                                                                    onClick={() => setPreviewModalUrl(item.reviewProof)}
                                                                />
                                                            ) : null}
                                                            {!item.orderedScreenshot && !item.reviewProof && (
                                                                <span style={{ fontSize: "11px", color: "#94a3b8" }}>None</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Direct Actions */}
                                                    <td>
                                                        {item.status === "in_progress" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/order-submission/${item.unitId}`)}
                                                                className="table-btn table-btn-primary"
                                                                style={{ fontSize: "11.5px", padding: "4px 10px" }}
                                                            >
                                                                🛒 Submit Placement
                                                            </button>
                                                        )}
                                                        {item.status === "pending_refund" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/refund-submission/${item.unitId}`)}
                                                                className="table-btn table-btn-primary"
                                                                style={{ fontSize: "11.5px", padding: "4px 10px", backgroundColor: "#0284c7" }}
                                                            >
                                                                ⭐ Upload Review
                                                            </button>
                                                        )}
                                                        {item.status === "pending_verification" && (
                                                            <span style={{ fontSize: "11.5px", color: "#7c3aed", fontWeight: 600 }}>
                                                                ⏳ In Review
                                                            </span>
                                                        )}
                                                        {item.status === "completed" && (
                                                            <span style={{ fontSize: "11.5px", color: "#059669", fontWeight: 700 }}>
                                                                ✓ Verified
                                                            </span>
                                                        )}
                                                        {item.status === "settled" && (
                                                            <span style={{ fontSize: "11.5px", color: "#047857", fontWeight: 700 }}>
                                                                💰 Settled
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* TAB VIEW 2: BRAND INTELLIGENCE & PERFORMANCE AREA */}
            {activeView === "brand_intel" && (
                <div>
                    <div style={{ marginBottom: "16px" }}>
                        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                            🏢 Brand Fulfillment Intelligence
                        </h2>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                            Aggregated brand analytics showing completed units, pending fulfillment rates, and earnings per brand.
                        </p>
                    </div>

                    {Object.keys(brandStats).length === 0 ? (
                        <div style={{
                            background: "#ffffff",
                            borderRadius: "12px",
                            border: "1px dashed #cbd5e1",
                            padding: "48px 24px",
                            textAlign: "center"
                        }}>
                            <div style={{ fontSize: "40px", marginBottom: "8px" }}>🏢</div>
                            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                                No Brand Analytics Available
                            </h3>
                            <p style={{ fontSize: "13.5px", color: "#64748b", marginTop: "6px" }}>
                                As you fulfill campaign orders, brand performance metrics will automatically populate here.
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                            gap: "18px"
                        }}>
                            {Object.entries(brandStats).map(([brandName, stats]) => (
                                <div
                                    key={brandName}
                                    style={{
                                        background: "#ffffff",
                                        borderRadius: "12px",
                                        border: "1px solid #e2e8f0",
                                        padding: "18px",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between"
                                    }}
                                >
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                            <span style={{
                                                fontSize: "13px",
                                                fontWeight: 800,
                                                color: "#0f172a",
                                                backgroundColor: "#f1f5f9",
                                                padding: "4px 10px",
                                                borderRadius: "6px"
                                            }}>
                                                🏢 {stats.brand || brandName}
                                            </span>
                                            <span style={{
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                color: stats.completionRate >= 80 ? "#15803d" : "#b45309",
                                                backgroundColor: stats.completionRate >= 80 ? "#dcfce7" : "#fef3c7",
                                                padding: "2px 8px",
                                                borderRadius: "10px"
                                            }}>
                                                {stats.completionRate}% Done
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div style={{
                                            width: "100%",
                                            height: "6px",
                                            backgroundColor: "#e2e8f0",
                                            borderRadius: "3px",
                                            overflow: "hidden",
                                            marginBottom: "14px"
                                        }}>
                                            <div style={{
                                                width: `${stats.completionRate}%`,
                                                height: "100%",
                                                backgroundColor: stats.completionRate >= 80 ? "#16a34a" : "#eab308",
                                                transition: "width 0.3s ease"
                                            }} />
                                        </div>

                                        {/* Metric Grid */}
                                        <div style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: "10px",
                                            fontSize: "13px",
                                            marginBottom: "14px"
                                        }}>
                                            <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px" }}>
                                                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Total Units</div>
                                                <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>{stats.total}</div>
                                            </div>
                                            <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px" }}>
                                                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Completed</div>
                                                <div style={{ fontSize: "16px", fontWeight: 800, color: "#16a34a" }}>{stats.completed}</div>
                                            </div>
                                            <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px" }}>
                                                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Pending</div>
                                                <div style={{ fontSize: "16px", fontWeight: 800, color: "#d97706" }}>{stats.pending}</div>
                                            </div>
                                            <div style={{ background: "#eff6ff", padding: "8px 10px", borderRadius: "6px" }}>
                                                <div style={{ fontSize: "11px", color: "#1d4ed8", textTransform: "uppercase" }}>Earnings</div>
                                                <div style={{ fontSize: "16px", fontWeight: 800, color: "#2563eb" }}>₹{stats.earnings.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action to filter table by this brand */}
                                    <button
                                        type="button"
                                        onClick={() => handleBrandSelectFromIntel(stats.brand || brandName)}
                                        style={{
                                            width: "100%",
                                            padding: "8px 0",
                                            fontSize: "12.5px",
                                            fontWeight: 700,
                                            borderRadius: "6px",
                                            border: "1px solid #cbd5e1",
                                            backgroundColor: "#ffffff",
                                            color: "#2563eb",
                                            cursor: "pointer",
                                            transition: "background-color 0.15s"
                                        }}
                                    >
                                        Filter Orders by this Brand →
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Fullscreen Proof Preview Modal */}
            {previewModalUrl && (
                <ProofPreviewModal
                    isOpen={!!previewModalUrl}
                    onClose={() => setPreviewModalUrl(null)}
                    fileUrl={previewModalUrl}
                    title="Order / Review Proof Preview"
                />
            )}
        </div>
    );
}

