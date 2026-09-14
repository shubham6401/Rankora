import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { fetchExecutiveBrandDetails } from "../../services/executive/order";
import BrandProductBreakdownModal from "../../component/brand/BrandProductBreakdownModal";
import "../../styles/brandDashboard.css";

export default function ExecutiveBrandDetails() {
    const { brandUserId } = useParams();
    const [brand, setBrand] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPlatform, setFilterPlatform] = useState("all");
    const [selectedOrderForBreakdown, setSelectedOrderForBreakdown] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadBrandOrders();
    }, [brandUserId]);

    const loadBrandOrders = async () => {
        try {
            setLoading(true);
            const res = await fetchExecutiveBrandDetails(brandUserId);
            if (res.data.success) {
                setBrand(res.data.brand);
                setOrders(res.data.orders || []);
            }
        } catch (err) {
            console.error("Failed to load brand details:", err);
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

    // Filtered orders
    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const name = (order.productName || "").toLowerCase();
                const platform = (order.orderPlatform || "").toLowerCase();
                if (!name.includes(q) && !platform.includes(q)) return false;
            }
            if (filterPlatform !== "all") {
                const p = (order.orderPlatform || "").toLowerCase();
                if (!p.includes(filterPlatform.toLowerCase())) return false;
            }
            if (filterStatus !== "all") {
                const s = order.summary || {};
                if (filterStatus === "completed" && !(s.completed > 0)) return false;
                if (filterStatus === "in_progress" && !(s.inProgress > 0)) return false;
                if (filterStatus === "pending_refund" && !(s.pendingRefund > 0)) return false;
            }
            return true;
        });
    }, [orders, searchQuery, filterPlatform, filterStatus]);

    const exportToExcel = () => {
        if (!orders.length) return;

        const data = orders.map((o) => ({
            "Order ID": o._id,
            "Product Name": o.productName,
            "Platform": o.orderPlatform,
            "Price (₹)": o.price,
            "Total Units": o.quantity,
            "Completed": o.summary?.completed || 0,
            "In Progress": o.summary?.inProgress || 0,
            "Pending Refund": o.summary?.pendingRefund || 0,
            "Pending Payment": o.summary?.pendingPayment || 0,
            "Unassigned": o.summary?.unassigned || 0,
            "Created Date": new Date(o.createdAt).toLocaleDateString(),
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Orders");
        XLSX.writeFile(wb, `${brand?.brand || brand?.name || "Brand"}_Orders_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    return (
        <div className="brand-dashboard-container" style={{ padding: "24px 28px 60px", maxWidth: "1440px", margin: "0 auto" }}>
            {/* Header with Back Navigation */}
            <div className="saas-card" style={{ padding: "20px 24px", marginBottom: "24px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #2563eb, #38bdf8)" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                        <button
                            type="button"
                            onClick={() => navigate("/executive-brands")}
                            style={{
                                background: "none",
                                border: "none",
                                color: "var(--primary-600)",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "700",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: 0,
                                marginBottom: "8px"
                            }}
                        >
                            ← Back to Brands Overview
                        </button>
                        <h1 style={{ fontSize: "24px", fontWeight: "800", color: "var(--slate-900)", margin: 0 }}>
                            🏢 {brand?.brand || brand?.name || "Brand"} Campaign Details
                        </h1>
                        <span style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px", display: "inline-block" }}>
                            Executive View • Real-time unit lifecycle & order progress
                        </span>
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <button
                            type="button"
                            onClick={exportToExcel}
                            className="saas-btn saas-btn-emerald"
                            disabled={!orders.length}
                        >
                            <span>📥</span>
                            <span>Download Excel Sheet</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics Overview Bar */}
            <div className="brand-metrics-grid" style={{ marginBottom: "2rem" }}>
                <div className="metric-card metric-orders">
                    <div className="metric-icon">📦</div>
                    <div className="metric-info">
                        <span className="metric-label">Total Campaigns</span>
                        <h3 className="metric-value">{orders.length}</h3>
                        <span className="metric-sub">{totalUnits} units configured</span>
                    </div>
                </div>

                <div className="metric-card metric-units">
                    <div className="metric-icon">🚀</div>
                    <div className="metric-info">
                        <span className="metric-label">In Progress</span>
                        <h3 className="metric-value">{totalInProgress}</h3>
                        <span className="metric-sub">Under mediator processing</span>
                    </div>
                </div>

                <div className="metric-card metric-refunds">
                    <div className="metric-icon">⏳</div>
                    <div className="metric-info">
                        <span className="metric-label">Pending Refund</span>
                        <h3 className="metric-value">{totalPendingRefund}</h3>
                        <span className="metric-sub">Awaiting verification</span>
                    </div>
                </div>

                <div className="metric-card metric-completed">
                    <div className="metric-icon">✅</div>
                    <div className="metric-info">
                        <span className="metric-label">Completed Units</span>
                        <h3 className="metric-value">{totalCompleted}</h3>
                        <span className="metric-sub">{completionRate}% total completion</span>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="filters-control-bar" style={{ marginBottom: "1.5rem" }}>
                <div className="search-box-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search product or platform..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="brand-search-input"
                    />
                </div>

                <div className="dropdowns-group">
                    <select
                        value={filterPlatform}
                        onChange={(e) => setFilterPlatform(e.target.value)}
                        className="brand-filter-select"
                    >
                        <option value="all">All Platforms</option>
                        <option value="amazon">Amazon</option>
                        <option value="flipkart">Flipkart</option>
                        <option value="myntra">Myntra</option>
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="brand-filter-select"
                    >
                        <option value="all">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="pending_refund">Pending Refund</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="saas-card" style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ fontSize: "32px", marginBottom: "12px" }}>📦</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--slate-700)" }}>No Matching Campaigns Found</div>
                    <div style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Adjust your search keyword or platform filter.</div>
                </div>
            ) : (
                <div className="orders-table-wrapper">
                    <table className="brand-orders-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Platform</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Progress</th>
                                <th>Status Breakdown</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => {
                                const q = order.quantity || (order.orderUnits || []).length || 0;
                                const comp = order.summary?.completed || 0;
                                const pct = q > 0 ? Math.round((comp / q) * 100) : 0;
                                return (
                                    <tr key={order._id}>
                                        <td>
                                            <div className="product-cell">
                                                <span className="product-name">{order.productName}</span>
                                                {order.productLink && (
                                                    <a
                                                        href={order.productLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="product-link-btn"
                                                    >
                                                        View Product ↗
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="platform-tag">{order.orderPlatform}</span>
                                        </td>
                                        <td>
                                            <span className="price-tag">₹{order.price}</span>
                                        </td>
                                        <td>
                                            <span className="quantity-badge">{q} units</span>
                                        </td>
                                        <td>
                                            <div className="progress-cell">
                                                <div className="progress-bar-bg">
                                                    <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                                                </div>
                                                <span className="progress-text">{pct}% ({comp}/{q})</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", fontSize: "0.75rem" }}>
                                                {order.summary?.completed > 0 && (
                                                    <span style={{ backgroundColor: "#065f46", color: "#34d399", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                                                        {order.summary.completed} Done
                                                    </span>
                                                )}
                                                {order.summary?.inProgress > 0 && (
                                                    <span style={{ backgroundColor: "#78350f", color: "#fbbf24", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                                                        {order.summary.inProgress} Prog
                                                    </span>
                                                )}
                                                {order.summary?.pendingRefund > 0 && (
                                                    <span style={{ backgroundColor: "#831843", color: "#f472b6", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                                                        {order.summary.pendingRefund} Ref
                                                    </span>
                                                )}
                                                {order.summary?.unassigned > 0 && (
                                                    <span style={{ backgroundColor: "#1f2937", color: "#9ca3af", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                                                        {order.summary.unassigned} Unassigned
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => setSelectedOrderForBreakdown(order)}
                                                className="breakdown-btn"
                                            >
                                                Inspect Units 🔍
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal for Order Units Breakdown */}
            {selectedOrderForBreakdown && (
                <BrandProductBreakdownModal
                    order={selectedOrderForBreakdown}
                    onClose={() => setSelectedOrderForBreakdown(null)}
                />
            )}
        </div>
    );
}
