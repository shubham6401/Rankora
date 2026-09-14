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
        <div className="brand-dashboard-container" style={{ padding: "1.5rem", maxWidth: "1400px", margin: "0 auto" }}>
            {/* Header with Back Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <button
                        onClick={() => navigate("/executive-brands")}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#818cf8",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            padding: 0,
                            marginBottom: "0.5rem"
                        }}
                    >
                        ← Back to Brands Overview
                    </button>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#f8fafc", margin: 0 }}>
                        🏢 {brand?.brand || brand?.name || "Brand"} Campaign Details
                    </h1>
                    <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                        Executive View • Real-time unit lifecycle & order progress
                    </span>
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                        onClick={exportToExcel}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            backgroundColor: "#065f46",
                            color: "#34d399",
                            border: "1px solid #059669",
                            padding: "0.6rem 1.25rem",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "0.875rem"
                        }}
                    >
                        <span>📥</span>
                        <span>Download Excel Sheet</span>
                    </button>
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
                <div style={{ textAlign: "center", padding: "3rem", backgroundColor: "#111827", borderRadius: "12px", border: "1px solid #1f2937", color: "#6b7280" }}>
                    No orders match your filter criteria.
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
