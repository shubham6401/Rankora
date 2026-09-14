import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
    fetchExecutiveAnalytics,
    fetchAllBrands,
    fetchAllMediators,
} from "../../services/executive/order";

export default function ExecutiveAnalytics() {
    const [analytics, setAnalytics] = useState(null);
    const [brandsList, setBrandsList] = useState([]);
    const [mediatorsList, setMediatorsList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("all");
    const [selectedMediator, setSelectedMediator] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");

    useEffect(() => {
        loadDropdownOptions();
    }, []);

    useEffect(() => {
        loadAnalytics();
    }, [startDate, endDate, selectedBrand, selectedMediator, selectedStatus]);

    const loadDropdownOptions = async () => {
        try {
            const [bRes, mRes] = await Promise.all([
                fetchAllBrands().catch(() => ({ data: { users: [] } })),
                fetchAllMediators().catch(() => ({ data: { mediators: [] } })),
            ]);
            setBrandsList(bRes.data?.users || []);
            setMediatorsList(mRes.data?.mediators || []);
        } catch (err) {
            console.error("Failed to load options:", err);
        }
    };

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (selectedBrand !== "all") params.brandUserId = selectedBrand;
            if (selectedMediator !== "all") params.mediatorId = selectedMediator;
            if (selectedStatus !== "all") params.status = selectedStatus;

            const res = await fetchExecutiveAnalytics(params);
            if (res.data.success) {
                setAnalytics(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch analytics:", err);
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setStartDate("");
        setEndDate("");
        setSelectedBrand("all");
        setSelectedMediator("all");
        setSelectedStatus("all");
    };

    const exportToExcel = () => {
        if (!analytics) return;

        const wb = XLSX.utils.book_new();

        // 1. Orders Sheet
        const ordersData = (analytics.orders || []).map((o) => ({
            "Order ID": o._id,
            "Product": o.productName,
            "Platform": o.orderPlatform,
            "Price (₹)": o.price,
            "Total Units": o.quantity || (o.orderUnits || []).length,
            "Completed": o.summary?.completed || 0,
            "In Progress": o.summary?.inProgress || 0,
            "Pending Refund": o.summary?.pendingRefund || 0,
            "Pending Payment": o.summary?.pendingPayment || 0,
            "Unassigned": o.summary?.unassigned || 0,
            "Brand": o.brand || o.brandUserId?.brand || o.brandUserId?.name,
            "Created Date": new Date(o.createdAt).toLocaleDateString(),
        }));
        const wsOrders = XLSX.utils.json_to_sheet(ordersData);
        XLSX.utils.book_append_sheet(wb, wsOrders, "Orders Data");

        // 2. Brand Breakdown Sheet
        const brandData = (analytics.brandBreakdown || []).map((b) => ({
            "Brand": b.name,
            "Total Orders": b.totalOrders,
            "Total Units": b.totalUnits,
            "Completed": b.completed,
            "In Progress": b.inProgress,
            "Pending Refund": b.pendingRefund,
            "Pending Payment": b.pendingPayment,
            "Unassigned": b.unassigned,
        }));
        const wsBrands = XLSX.utils.json_to_sheet(brandData);
        XLSX.utils.book_append_sheet(wb, wsBrands, "Brand Breakdown");

        // 3. Mediator Breakdown Sheet
        const mediatorData = (analytics.mediatorBreakdown || []).map((m) => ({
            "Mediator Name": m.name,
            "Mediator Code": m.mediatorCode || "—",
            "Total Units": m.totalUnits,
            "Completed": m.completed,
            "In Progress": m.inProgress,
            "Pending Refund": m.pendingRefund,
            "Pending Payment": m.pendingPayment,
            "Unassigned": m.unassigned,
        }));
        const wsMediators = XLSX.utils.json_to_sheet(mediatorData);
        XLSX.utils.book_append_sheet(wb, wsMediators, "Mediator Breakdown");

        XLSX.writeFile(wb, `Master_Operations_Analytics_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    const totals = analytics?.totals || {};
    const brandBreakdown = analytics?.brandBreakdown || [];
    const mediatorBreakdown = analytics?.mediatorBreakdown || [];
    const orders = analytics?.orders || [];

    return (
        <div style={{ padding: "1.5rem", maxWidth: "1440px", margin: "0 auto", color: "#f8fafc" }}>
            {/* Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
                marginBottom: "1.5rem"
            }}>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>📊</span>
                        <span>Master Operations Analytics</span>
                    </h1>
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "0.3rem" }}>
                        Side-by-side Brand vs. Mediator fulfillment tracking with multi-criteria filters & master export
                    </p>
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
                        <span>Download Master Excel</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{
                backgroundColor: "#111827",
                border: "1px solid #1f2937",
                borderRadius: "12px",
                padding: "1.25rem",
                marginBottom: "2rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: "1rem",
                alignItems: "end"
            }}>
                <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.3rem" }}>FROM DATE</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "0.55rem",
                            borderRadius: "6px",
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            color: "#f3f4f6",
                            fontSize: "0.85rem",
                            boxSizing: "border-box"
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.3rem" }}>TO DATE</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "0.55rem",
                            borderRadius: "6px",
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            color: "#f3f4f6",
                            fontSize: "0.85rem",
                            boxSizing: "border-box"
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.3rem" }}>FILTER BRAND</label>
                    <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "0.55rem",
                            borderRadius: "6px",
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            color: "#f3f4f6",
                            fontSize: "0.85rem",
                            boxSizing: "border-box"
                        }}
                    >
                        <option value="all">All Brands</option>
                        {brandsList.map((b) => (
                            <option key={b._id} value={b._id}>{b.brand || b.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.3rem" }}>FILTER MEDIATOR</label>
                    <select
                        value={selectedMediator}
                        onChange={(e) => setSelectedMediator(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "0.55rem",
                            borderRadius: "6px",
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            color: "#f3f4f6",
                            fontSize: "0.85rem",
                            boxSizing: "border-box"
                        }}
                    >
                        <option value="all">All Mediators</option>
                        {mediatorsList.map((m) => (
                            <option key={m._id} value={m._id}>{m.name} ({m.mediatorCode || m.teamCode})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.3rem" }}>STATUS</label>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "0.55rem",
                            borderRadius: "6px",
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            color: "#f3f4f6",
                            fontSize: "0.85rem",
                            boxSizing: "border-box"
                        }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="pending_refund">Pending Refund</option>
                        <option value="pending_payment">Advance / Return Payment</option>
                        <option value="unassigned">Unassigned</option>
                    </select>
                </div>

                <div>
                    <button
                        onClick={resetFilters}
                        style={{
                            width: "100%",
                            padding: "0.55rem",
                            backgroundColor: "#374151",
                            color: "#e5e7eb",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: "600"
                        }}
                    >
                        ↺ Reset Filters
                    </button>
                </div>
            </div>

            {/* Aggregated Totals Cards */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1rem",
                marginBottom: "2rem"
            }}>
                <div style={{ backgroundColor: "#111827", padding: "1.25rem", borderRadius: "10px", border: "1px solid #1f2937" }}>
                    <div style={{ color: "#9ca3af", fontSize: "0.75rem", fontWeight: "600" }}>FILTERED ORDERS</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#f8fafc", marginTop: "0.25rem" }}>
                        {loading ? "..." : (totals.totalOrders || 0)}
                    </div>
                </div>

                <div style={{ backgroundColor: "#111827", padding: "1.25rem", borderRadius: "10px", border: "1px solid #1f2937" }}>
                    <div style={{ color: "#9ca3af", fontSize: "0.75rem", fontWeight: "600" }}>TOTAL UNITS</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#60a5fa", marginTop: "0.25rem" }}>
                        {loading ? "..." : (totals.totalUnits || 0)}
                    </div>
                </div>

                <div style={{ backgroundColor: "#111827", padding: "1.25rem", borderRadius: "10px", border: "1px solid #065f46" }}>
                    <div style={{ color: "#34d399", fontSize: "0.75rem", fontWeight: "600" }}>COMPLETED UNITS</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#10b981", marginTop: "0.25rem" }}>
                        {loading ? "..." : (totals.totalCompleted || 0)}
                    </div>
                    <div style={{ color: "#059669", fontSize: "0.75rem", marginTop: "0.2rem" }}>
                        {totals.completionRate || 0}% completion
                    </div>
                </div>

                <div style={{ backgroundColor: "#111827", padding: "1.25rem", borderRadius: "10px", border: "1px solid #1f2937" }}>
                    <div style={{ color: "#fbbf24", fontSize: "0.75rem", fontWeight: "600" }}>IN PROGRESS</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#f59e0b", marginTop: "0.25rem" }}>
                        {loading ? "..." : (totals.totalInProgress || 0)}
                    </div>
                </div>

                <div style={{ backgroundColor: "#111827", padding: "1.25rem", borderRadius: "10px", border: "1px solid #1f2937" }}>
                    <div style={{ color: "#f472b6", fontSize: "0.75rem", fontWeight: "600" }}>PENDING REFUND</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#ec4899", marginTop: "0.25rem" }}>
                        {loading ? "..." : (totals.totalPendingRefund || 0)}
                    </div>
                </div>

                <div style={{ backgroundColor: "#111827", padding: "1.25rem", borderRadius: "10px", border: "1px solid #1f2937" }}>
                    <div style={{ color: "#a78bfa", fontSize: "0.75rem", fontWeight: "600" }}>PENDING PAYMENT</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#8b5cf6", marginTop: "0.25rem" }}>
                        {loading ? "..." : (totals.totalPendingPayment || 0)}
                    </div>
                </div>
            </div>

            {/* Side-by-Side Breakdown Section */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
                marginBottom: "2rem"
            }}>
                {/* Brand-Wise Breakdown */}
                <div style={{ backgroundColor: "#111827", borderRadius: "12px", border: "1px solid #1f2937", padding: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>🏢</span>
                        <span>Brand-Wise Breakdown ({brandBreakdown.length})</span>
                    </h2>
                    <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                        {brandBreakdown.length === 0 ? (
                            <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem 0" }}>No brand data</p>
                        ) : (
                            brandBreakdown.map((b) => {
                                const rate = b.totalUnits > 0 ? Math.round((b.completed / b.totalUnits) * 100) : 0;
                                return (
                                    <div key={b.id || b.name} style={{
                                        backgroundColor: "#1f2937",
                                        borderRadius: "8px",
                                        padding: "1rem",
                                        marginBottom: "0.75rem",
                                        border: "1px solid #374151"
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                            <span style={{ fontWeight: "700", color: "#f3f4f6" }}>{b.name}</span>
                                            <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{b.totalOrders} orders • {b.totalUnits} units</span>
                                        </div>
                                        {/* Progress bar */}
                                        <div style={{ height: "6px", backgroundColor: "#111827", borderRadius: "3px", overflow: "hidden", marginBottom: "0.5rem" }}>
                                            <div style={{ width: `${rate}%`, backgroundColor: "#10b981", height: "100%" }}></div>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                                            <span style={{ color: "#34d399" }}>Completed: {b.completed} ({rate}%)</span>
                                            <span style={{ color: "#fbbf24" }}>Prog: {b.inProgress}</span>
                                            <span style={{ color: "#f472b6" }}>Ref: {b.pendingRefund}</span>
                                            <span style={{ color: "#9ca3af" }}>Unassigned: {b.unassigned}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Mediator-Wise Breakdown */}
                <div style={{ backgroundColor: "#111827", borderRadius: "12px", border: "1px solid #1f2937", padding: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>🤝</span>
                        <span>Mediator-Wise Breakdown ({mediatorBreakdown.length})</span>
                    </h2>
                    <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                        {mediatorBreakdown.length === 0 ? (
                            <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem 0" }}>No mediator data</p>
                        ) : (
                            mediatorBreakdown.map((m) => {
                                const rate = m.totalUnits > 0 ? Math.round((m.completed / m.totalUnits) * 100) : 0;
                                return (
                                    <div key={m.id} style={{
                                        backgroundColor: "#1f2937",
                                        borderRadius: "8px",
                                        padding: "1rem",
                                        marginBottom: "0.75rem",
                                        border: "1px solid #374151"
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                            <div>
                                                <span style={{ fontWeight: "700", color: "#f3f4f6" }}>{m.name}</span>
                                                {m.mediatorCode && <span style={{ fontSize: "0.75rem", color: "#818cf8", marginLeft: "0.5rem" }}>({m.mediatorCode})</span>}
                                            </div>
                                            <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{m.totalUnits} units</span>
                                        </div>
                                        {/* Progress bar */}
                                        <div style={{ height: "6px", backgroundColor: "#111827", borderRadius: "3px", overflow: "hidden", marginBottom: "0.5rem" }}>
                                            <div style={{ width: `${rate}%`, backgroundColor: "#10b981", height: "100%" }}></div>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                                            <span style={{ color: "#34d399" }}>Completed: {m.completed} ({rate}%)</span>
                                            <span style={{ color: "#fbbf24" }}>Prog: {m.inProgress}</span>
                                            <span style={{ color: "#f472b6" }}>Ref: {m.pendingRefund}</span>
                                            <span style={{ color: "#a78bfa" }}>Payment: {m.pendingPayment}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div style={{ backgroundColor: "#111827", borderRadius: "12px", border: "1px solid #1f2937", overflowX: "auto" }}>
                <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #1f2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>
                        Filtered Orders ({orders.length})
                    </h2>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#1f2937", color: "#9ca3af", textTransform: "uppercase", fontSize: "0.75rem" }}>
                            <th style={{ padding: "1rem" }}>Product & Brand</th>
                            <th style={{ padding: "1rem" }}>Platform</th>
                            <th style={{ padding: "1rem" }}>Price</th>
                            <th style={{ padding: "1rem" }}>Units</th>
                            <th style={{ padding: "1rem" }}>Completed</th>
                            <th style={{ padding: "1rem" }}>In Progress</th>
                            <th style={{ padding: "1rem" }}>Pending Refund</th>
                            <th style={{ padding: "1rem" }}>Created Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                                    No orders match the current criteria
                                </td>
                            </tr>
                        ) : (
                            orders.map((ord) => (
                                <tr key={ord._id} style={{ borderBottom: "1px solid #1f2937" }}>
                                    <td style={{ padding: "1rem" }}>
                                        <div style={{ fontWeight: "700", color: "#f3f4f6" }}>{ord.productName}</div>
                                        <div style={{ fontSize: "0.75rem", color: "#818cf8" }}>{ord.brand || ord.brandUserId?.brand || ord.brandUserId?.name}</div>
                                    </td>
                                    <td style={{ padding: "1rem" }}>{ord.orderPlatform}</td>
                                    <td style={{ padding: "1rem", fontWeight: "600" }}>₹{ord.price}</td>
                                    <td style={{ padding: "1rem", fontWeight: "700", color: "#60a5fa" }}>{ord.quantity}</td>
                                    <td style={{ padding: "1rem", color: "#10b981", fontWeight: "600" }}>{ord.summary?.completed || 0}</td>
                                    <td style={{ padding: "1rem", color: "#f59e0b" }}>{ord.summary?.inProgress || 0}</td>
                                    <td style={{ padding: "1rem", color: "#ec4899" }}>{ord.summary?.pendingRefund || 0}</td>
                                    <td style={{ padding: "1rem", color: "#9ca3af", fontSize: "0.8rem" }}>
                                        {new Date(ord.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
