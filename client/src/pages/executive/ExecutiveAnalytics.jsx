import { useState, useEffect, useMemo, Fragment } from "react";
import * as XLSX from "xlsx";
import {
    fetchExecutiveAnalytics,
    fetchAllBrands,
    fetchAllMediators,
} from "../../services/executive/order";
import "../../styles/theme.css";

export default function ExecutiveAnalytics() {
    const [analytics, setAnalytics] = useState(null);
    const [brandsList, setBrandsList] = useState([]);
    const [mediatorsList, setMediatorsList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [createdDate, setCreatedDate] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("all");
    const [selectedMediator, setSelectedMediator] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");

    // Breakdown-specific filters for Date Breakdown (date, brand, mediator)
    const [dateBreakdownDate, setDateBreakdownDate] = useState("");
    const [dateBreakdownBrand, setDateBreakdownBrand] = useState("all");
    const [dateBreakdownMediator, setDateBreakdownMediator] = useState("all");

    // Modal state for View Details
    const [detailsModalDateData, setDetailsModalDateData] = useState(null);
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    // Close modal on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && detailsModalDateData) {
                setDetailsModalDateData(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [detailsModalDateData]);

    useEffect(() => {
        loadDropdownOptions();
    }, []);

    useEffect(() => {
        loadAnalytics();
    }, [createdDate, selectedBrand, selectedMediator, selectedStatus]);

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
            if (createdDate) params.createdDate = createdDate;
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
        setCreatedDate("");
        setSelectedBrand("all");
        setSelectedMediator("all");
        setSelectedStatus("all");
        setDateBreakdownDate("");
        setDateBreakdownBrand("all");
        setDateBreakdownMediator("all");
    };

    const resetDateFilters = () => {
        setDateBreakdownDate("");
        setDateBreakdownBrand("all");
        setDateBreakdownMediator("all");
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
            "Completed (Done)": b.completed,
            "Not Done": b.notDone !== undefined ? b.notDone : Math.max(0, (b.totalUnits || 0) - (b.completed || 0)),
            "In Progress": b.inProgress,
            "Pending Refund": b.pendingRefund,
            "Pending Payment": b.pendingPayment,
            "Unassigned": b.unassigned,
            "Completion Rate": `${b.completionRate || 0}%`,
        }));
        const wsBrands = XLSX.utils.json_to_sheet(brandData);
        XLSX.utils.book_append_sheet(wb, wsBrands, "Brand Breakdown");

        // 3. Mediator Breakdown Sheet
        const mediatorData = (analytics.mediatorBreakdown || []).map((m) => ({
            "Mediator Name": m.name,
            "Mediator Code": m.mediatorCode || "—",
            "Total Units": m.totalUnits,
            "Completed (Done)": m.completed,
            "Not Done": m.notDone !== undefined ? m.notDone : Math.max(0, (m.totalUnits || 0) - (m.completed || 0)),
            "In Progress": m.inProgress,
            "Pending Refund": m.pendingRefund,
            "Pending Payment": m.pendingPayment,
            "Unassigned": m.unassigned,
            "Completion Rate": `${m.completionRate || 0}%`,
        }));
        const wsMediators = XLSX.utils.json_to_sheet(mediatorData);
        XLSX.utils.book_append_sheet(wb, wsMediators, "Mediator Breakdown");

        // 4. Date-Wise Breakdown Sheet
        const dateData = (analytics.dateBreakdown || []).map((d) => ({
            "Batch Date": d.date,
            "Formatted Date": d.formattedDate,
            "Total Orders": d.totalOrders,
            "Total Units": d.totalUnits,
            "Completed (Done)": d.completed,
            "Not Done": d.notDone !== undefined ? d.notDone : Math.max(0, (d.totalUnits || 0) - (d.completed || 0)),
            "Assigned": d.assigned || 0,
            "In Progress": d.inProgress,
            "Pending Refund": d.pendingRefund,
            "Pending Payment": d.pendingPayment,
            "Total Pending": d.pending || 0,
            "Unassigned": d.unassigned,
            "Completion Rate": `${d.completionRate}%`,
        }));
        const wsDates = XLSX.utils.json_to_sheet(dateData);
        XLSX.utils.book_append_sheet(wb, wsDates, "Date-Wise Breakdown");

        XLSX.writeFile(wb, `Master_Operations_Analytics_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    const totals = analytics?.totals || {};
    const brandBreakdown = analytics?.brandBreakdown || [];
    const mediatorBreakdown = analytics?.mediatorBreakdown || [];
    const orders = analytics?.orders || [];

    // Filter & Aggregate Date Breakdown dynamically by date, brand, mediator
    const dateBreakdownList = useMemo(() => {
        if (!orders || orders.length === 0) return [];

        const dateStats = {};

        orders.forEach((ord) => {
            const d = new Date(ord.createdAt);
            const dateKey = !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "Unknown";
            const formattedDate = !isNaN(d.getTime())
                ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                : "Unknown Date";

            // 1. Filter by Date
            if (dateBreakdownDate && dateKey !== dateBreakdownDate) {
                return;
            }

            // 2. Filter by Brand
            const ordBrandId = (ord.brandUserId?._id || ord.brandUserId || "").toString();
            const ordBrandName = ord.brand || ord.brandUserId?.brand || ord.brandUserId?.name || "";
            if (dateBreakdownBrand !== "all") {
                if (ordBrandId !== dateBreakdownBrand && ordBrandName !== dateBreakdownBrand) {
                    return;
                }
            }

            // 3. Filter by Mediator
            let units = ord.orderUnits || [];
            if (dateBreakdownMediator !== "all") {
                const hasMed = units.some((u) => {
                    const uMedId = (u.mediatorId?._id || u.mediatorId || "").toString();
                    return uMedId === dateBreakdownMediator;
                });
                if (!hasMed) return;
                units = units.filter((u) => {
                    const uMedId = (u.mediatorId?._id || u.mediatorId || "").toString();
                    return uMedId === dateBreakdownMediator;
                });
            }

            if (!dateStats[dateKey]) {
                dateStats[dateKey] = {
                    date: dateKey,
                    formattedDate,
                    totalOrders: 0,
                    totalUnits: 0,
                    completed: 0,
                    notCompleted: 0,
                    assigned: 0,
                    inProgress: 0,
                    pendingRefund: 0,
                    pendingPayment: 0,
                    unassigned: 0,
                    orders: [],
                };
            }

            dateStats[dateKey].totalOrders++;
            dateStats[dateKey].orders.push({
                ...ord,
                activeUnits: units,
            });

            if (units.length > 0) {
                units.forEach((u) => {
                    dateStats[dateKey].totalUnits++;
                    if (u.status === "completed") {
                        dateStats[dateKey].completed++;
                    } else if (u.status === "in_progress") {
                        dateStats[dateKey].inProgress++;
                    } else if (u.status === "pending_refund") {
                        dateStats[dateKey].pendingRefund++;
                    } else if (u.status === "pending_payment") {
                        dateStats[dateKey].pendingPayment++;
                    } else if (u.status === "assigned") {
                        dateStats[dateKey].assigned++;
                    } else if (u.status === "unassigned") {
                        dateStats[dateKey].unassigned++;
                    }
                });
            } else {
                const q = ord.quantity || 0;
                const sum = ord.summary || {};
                dateStats[dateKey].totalUnits += q;
                dateStats[dateKey].completed += sum.completed || 0;
                dateStats[dateKey].inProgress += sum.inProgress || 0;
                dateStats[dateKey].pendingRefund += sum.pendingRefund || 0;
                dateStats[dateKey].pendingPayment += sum.pendingPayment || 0;
                dateStats[dateKey].unassigned += sum.unassigned || 0;
                dateStats[dateKey].assigned += sum.assigned || 0;
            }
        });

        const list = Object.values(dateStats).sort((a, b) => b.date.localeCompare(a.date));
        list.forEach((item) => {
            item.notCompleted = Math.max(0, item.totalUnits - item.completed);
            item.completionRate = item.totalUnits > 0 ? Math.round((item.completed / item.totalUnits) * 100) : 0;
            item.pending = item.pendingRefund + item.pendingPayment;
        });

        return list;
    }, [orders, dateBreakdownDate, dateBreakdownBrand, dateBreakdownMediator]);

    return (
        <div style={{ padding: "24px 28px 60px", maxWidth: "1440px", margin: "0 auto", boxSizing: "border-box" }}>
            {/* Header Hero Card */}
            <div className="saas-card" style={{ padding: "24px 28px", marginBottom: "24px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #4f46e5, #06b6d4)" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <span className="saas-badge" style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                                📊 Executive Analytics
                            </span>
                            <span style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: "500" }}>
                                Multi-dimensional Pipeline Reporting
                            </span>
                        </div>
                        <h1 style={{ fontSize: "26px", fontWeight: "800", color: "var(--slate-900)", margin: 0 }}>
                            Master Operations Analytics
                        </h1>
                        <p style={{ color: "var(--slate-500)", fontSize: "13.5px", marginTop: "4px", marginBottom: 0 }}>
                            Side-by-side Brand vs. Mediator fulfillment tracking with multi-criteria filters & master export
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <button
                            type="button"
                            onClick={exportToExcel}
                            className="saas-btn saas-btn-emerald"
                            disabled={!orders.length}
                        >
                            <span>📥</span>
                            <span>Download Master Excel</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="saas-card" style={{
                padding: "20px",
                marginBottom: "24px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: "14px",
                alignItems: "end"
            }}>
                <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--slate-600)", marginBottom: "4px", textTransform: "uppercase" }}>
                        BATCH CREATED DATE
                    </label>
                    <input
                        type="date"
                        value={createdDate}
                        onChange={(e) => setCreatedDate(e.target.value)}
                        className="saas-input"
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--slate-600)", marginBottom: "4px", textTransform: "uppercase" }}>FILTER BRAND</label>
                    <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="saas-select"
                    >
                        <option value="all">All Brands</option>
                        {brandsList.map((b) => (
                            <option key={b._id} value={b._id}>{b.brand || b.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--slate-600)", marginBottom: "4px", textTransform: "uppercase" }}>FILTER MEDIATOR</label>
                    <select
                        value={selectedMediator}
                        onChange={(e) => setSelectedMediator(e.target.value)}
                        className="saas-select"
                    >
                        <option value="all">All Mediators</option>
                        {mediatorsList.map((m) => (
                            <option key={m._id} value={m._id}>{m.name} ({m.mediatorCode || m.teamCode})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--slate-600)", marginBottom: "4px", textTransform: "uppercase" }}>STATUS</label>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="saas-select"
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
                        type="button"
                        onClick={resetFilters}
                        className="saas-btn saas-btn-outline"
                        style={{ width: "100%", padding: "9px 12px" }}
                    >
                        <span>↺</span>
                        <span>Reset Filters</span>
                    </button>
                </div>
            </div>

            {/* Aggregated Totals Cards */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "14px",
                marginBottom: "24px"
            }}>
                <div className="saas-card" style={{ padding: "18px 20px" }}>
                    <div style={{ color: "var(--slate-500)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>FILTERED ORDERS</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--slate-900)", marginTop: "4px" }}>
                        {loading ? "..." : (totals.totalOrders || 0)}
                    </div>
                </div>

                <div className="saas-card" style={{ padding: "18px 20px" }}>
                    <div style={{ color: "var(--slate-500)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>TOTAL UNITS</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--primary-600)", marginTop: "4px" }}>
                        {loading ? "..." : (totals.totalUnits || 0)}
                    </div>
                </div>

                <div className="saas-card" style={{ padding: "18px 20px", borderLeft: "4px solid #059669" }}>
                    <div style={{ color: "#059669", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>COMPLETED UNITS</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#059669", marginTop: "4px" }}>
                        {loading ? "..." : (totals.totalCompleted || 0)}
                    </div>
                    <div style={{ color: "var(--slate-500)", fontSize: "12px", marginTop: "2px", fontWeight: "600" }}>
                        {totals.completionRate || 0}% completion
                    </div>
                </div>

                <div className="saas-card" style={{ padding: "18px 20px", borderLeft: "4px solid #e11d48" }}>
                    <div style={{ color: "#e11d48", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>NOT DONE UNITS</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#e11d48", marginTop: "4px" }}>
                        {loading ? "..." : (totals.totalNotDone !== undefined ? totals.totalNotDone : Math.max(0, (totals.totalUnits || 0) - (totals.totalCompleted || 0)))}
                    </div>
                    <div style={{ color: "var(--slate-500)", fontSize: "12px", marginTop: "2px", fontWeight: "600" }}>
                        {totals.totalUnits > 0 ? Math.round(((totals.totalNotDone !== undefined ? totals.totalNotDone : Math.max(0, (totals.totalUnits || 0) - (totals.totalCompleted || 0))) / totals.totalUnits) * 100) : 0}% unfulfilled
                    </div>
                </div>

                <div className="saas-card" style={{ padding: "18px 20px", borderLeft: "4px solid #0284c7" }}>
                    <div style={{ color: "#0284c7", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>ASSIGNED UNITS</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#0284c7", marginTop: "4px" }}>
                        {loading ? "..." : (totals.totalAssigned || 0)}
                    </div>
                </div>

                <div className="saas-card" style={{ padding: "18px 20px", borderLeft: "4px solid #d97706" }}>
                    <div style={{ color: "#d97706", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>IN PROGRESS</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#d97706", marginTop: "4px" }}>
                        {loading ? "..." : (totals.totalInProgress || 0)}
                    </div>
                </div>

                <div className="saas-card" style={{ padding: "18px 20px" }}>
                    <div style={{ color: "#7c3aed", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>PENDING REFUND</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#7c3aed", marginTop: "4px" }}>
                        {loading ? "..." : (totals.totalPendingRefund || 0)}
                    </div>
                </div>

                <div className="saas-card" style={{ padding: "18px 20px" }}>
                    <div style={{ color: "var(--slate-500)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>PENDING PAYMENT</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--slate-700)", marginTop: "4px" }}>
                        {loading ? "..." : (totals.totalPendingPayment || 0)}
                    </div>
                </div>
            </div>

            {/* Side-by-Side Breakdown Section */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                gap: "20px",
                marginBottom: "24px"
            }}>
                {/* Brand-Wise Breakdown */}
                <div className="saas-card" style={{ padding: "20px" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--slate-900)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>🏢</span>
                        <span>Brand-Wise Breakdown ({brandBreakdown.length})</span>
                    </h2>

                    {brandBreakdown.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--slate-400)", fontSize: "13px" }}>
                            No brand data for selected filters
                        </div>
                    ) : (
                        <div className="table-scroll-touch">
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                    <tr style={{ borderBottom: "2px solid var(--slate-200)", textAlign: "left" }}>
                                        <th style={{ padding: "8px 10px", color: "var(--slate-600)", fontWeight: "700" }}>Brand</th>
                                        <th style={{ padding: "8px 10px", color: "var(--slate-600)", fontWeight: "700" }}>Orders</th>
                                        <th style={{ padding: "8px 10px", color: "var(--slate-600)", fontWeight: "700" }}>Units</th>
                                        <th style={{ padding: "8px 10px", color: "#059669", fontWeight: "700" }}>Done</th>
                                        <th style={{ padding: "8px 10px", color: "#e11d48", fontWeight: "700" }}>Not Done</th>
                                        <th style={{ padding: "8px 10px", color: "var(--slate-600)", fontWeight: "700" }}>Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {brandBreakdown.map((b, idx) => {
                                        const rate = b.completionRate !== undefined ? b.completionRate : (b.totalUnits > 0 ? Math.round((b.completed / b.totalUnits) * 100) : 0);
                                        const notDone = b.notDone !== undefined ? b.notDone : Math.max(0, (b.totalUnits || 0) - (b.completed || 0));
                                        return (
                                            <tr key={idx} style={{ borderBottom: "1px solid var(--slate-100)" }}>
                                                <td style={{ padding: "10px", fontWeight: "700", color: "var(--slate-900)" }}>{b.name}</td>
                                                <td style={{ padding: "10px", color: "var(--slate-700)" }}>{b.totalOrders}</td>
                                                <td style={{ padding: "10px", color: "var(--primary-600)", fontWeight: "600" }}>{b.totalUnits}</td>
                                                <td style={{ padding: "10px", color: "#059669", fontWeight: "700" }}>{b.completed}</td>
                                                <td style={{ padding: "10px" }}>
                                                    <span className="saas-badge" style={{
                                                        background: notDone > 0 ? "#fff1f2" : "#f8fafc",
                                                        color: notDone > 0 ? "#e11d48" : "#94a3b8",
                                                        border: `1px solid ${notDone > 0 ? "#fecdd3" : "#e2e8f0"}`
                                                    }}>
                                                        {notDone}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "10px" }}>
                                                    <span className="saas-badge" style={{
                                                        background: rate >= 80 ? "#ecfdf5" : rate >= 40 ? "#fffbeb" : "#eff6ff",
                                                        color: rate >= 80 ? "#059669" : rate >= 40 ? "#b45309" : "#2563eb",
                                                        border: `1px solid ${rate >= 80 ? "#a7f3d0" : rate >= 40 ? "#fde68a" : "#bfdbfe"}`
                                                    }}>
                                                        {rate}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Mediator-Wise Breakdown */}
                <div className="saas-card" style={{ padding: "20px" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--slate-900)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>🤝</span>
                        <span>Mediator-Wise Breakdown ({mediatorBreakdown.length})</span>
                    </h2>

                    {mediatorBreakdown.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--slate-400)", fontSize: "13px" }}>
                            No mediator data for selected filters
                        </div>
                    ) : (
                        <div className="table-scroll-touch">
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                    <tr style={{ borderBottom: "2px solid var(--slate-200)", textAlign: "left" }}>
                                        <th style={{ padding: "8px 10px", color: "var(--slate-600)", fontWeight: "700" }}>Mediator</th>
                                        <th style={{ padding: "8px 10px", color: "var(--slate-600)", fontWeight: "700" }}>Code</th>
                                        <th style={{ padding: "8px 10px", color: "var(--slate-600)", fontWeight: "700" }}>Units</th>
                                        <th style={{ padding: "8px 10px", color: "#059669", fontWeight: "700" }}>Done</th>
                                        <th style={{ padding: "8px 10px", color: "#e11d48", fontWeight: "700" }}>Not Done</th>
                                        <th style={{ padding: "8px 10px", color: "var(--slate-600)", fontWeight: "700" }}>Active</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mediatorBreakdown.map((m, idx) => {
                                        const notDone = m.notDone !== undefined ? m.notDone : Math.max(0, (m.totalUnits || 0) - (m.completed || 0));
                                        return (
                                            <tr key={idx} style={{ borderBottom: "1px solid var(--slate-100)" }}>
                                                <td style={{ padding: "10px", fontWeight: "700", color: "var(--slate-900)" }}>{m.name}</td>
                                                <td style={{ padding: "10px", color: "var(--slate-500)" }}>{m.mediatorCode || "—"}</td>
                                                <td style={{ padding: "10px", color: "var(--primary-600)", fontWeight: "600" }}>{m.totalUnits}</td>
                                                <td style={{ padding: "10px", color: "#059669", fontWeight: "700" }}>{m.completed}</td>
                                                <td style={{ padding: "10px" }}>
                                                    <span className="saas-badge" style={{
                                                        background: notDone > 0 ? "#fff1f2" : "#f8fafc",
                                                        color: notDone > 0 ? "#e11d48" : "#94a3b8",
                                                        border: `1px solid ${notDone > 0 ? "#fecdd3" : "#e2e8f0"}`
                                                    }}>
                                                        {notDone}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "10px", color: "#d97706", fontWeight: "700" }}>{m.inProgress}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Date-Wise Operations & Status Breakdown */}
            <div className="saas-card" style={{ padding: "20px", marginBottom: "24px" }}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "16px",
                    marginBottom: "16px",
                    borderBottom: "1px solid var(--slate-100)",
                    paddingBottom: "16px"
                }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                            <h2 style={{ fontSize: "17px", fontWeight: "800", color: "var(--slate-900)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                                <span>📅</span>
                                <span>Date-Wise Operations & Status Breakdown</span>
                            </h2>
                            <span className="saas-badge" style={{ background: "#f1f5f9", color: "var(--slate-700)", border: "1px solid #e2e8f0" }}>
                                {dateBreakdownList.length} {dateBreakdownList.length === 1 ? "Date" : "Dates"}
                            </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--slate-500)" }}>
                            Filter breakdown by date, brand, or mediator to review total orders, units, and completion status.
                        </p>
                    </div>

                    {/* Breakdown Filter Controls: Date, Brand, Mediator */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-end" }}>
                        {/* Date Filter */}
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--slate-500)", marginBottom: "4px" }}>
                                📅 Date
                            </label>
                            <input
                                type="date"
                                value={dateBreakdownDate}
                                onChange={(e) => setDateBreakdownDate(e.target.value)}
                                className="saas-input"
                                style={{ padding: "6px 10px", fontSize: "12.5px", height: "36px", minWidth: "150px" }}
                            />
                        </div>

                        {/* Brand Filter */}
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--slate-500)", marginBottom: "4px" }}>
                                🏷️ Brand
                            </label>
                            <select
                                value={dateBreakdownBrand}
                                onChange={(e) => setDateBreakdownBrand(e.target.value)}
                                className="saas-select"
                                style={{ padding: "6px 10px", fontSize: "12.5px", height: "36px", minWidth: "160px" }}
                            >
                                <option value="all">All Brands</option>
                                {brandsList.map((b) => (
                                    <option key={b._id} value={b._id}>
                                        {b.brand || b.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Mediator Filter */}
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--slate-500)", marginBottom: "4px" }}>
                                🤝 Mediator
                            </label>
                            <select
                                value={dateBreakdownMediator}
                                onChange={(e) => setDateBreakdownMediator(e.target.value)}
                                className="saas-select"
                                style={{ padding: "6px 10px", fontSize: "12.5px", height: "36px", minWidth: "160px" }}
                            >
                                <option value="all">All Mediators</option>
                                {mediatorsList.map((m) => (
                                    <option key={m._id} value={m._id}>
                                        {m.name} {m.mediatorCode ? `(${m.mediatorCode})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Reset Breakdown Filters */}
                        {(dateBreakdownDate || dateBreakdownBrand !== "all" || dateBreakdownMediator !== "all") && (
                            <button
                                type="button"
                                onClick={resetDateFilters}
                                className="saas-btn saas-btn-outline"
                                style={{ padding: "6px 12px", fontSize: "12px", height: "36px", display: "flex", alignItems: "center", gap: "5px" }}
                                title="Reset date breakdown filters"
                            >
                                ↺ Reset
                            </button>
                        )}
                    </div>
                </div>

                {dateBreakdownList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "36px 12px", color: "var(--slate-400)", fontSize: "13px" }}>
                        No records match the selected Date, Brand, or Mediator filter.
                        {(dateBreakdownDate || dateBreakdownBrand !== "all" || dateBreakdownMediator !== "all") && (
                            <div style={{ marginTop: "8px" }}>
                                <button
                                    type="button"
                                    onClick={resetDateFilters}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "var(--primary-600)",
                                        textDecoration: "underline",
                                        cursor: "pointer",
                                        fontSize: "12.5px",
                                        fontWeight: "600"
                                    }}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="table-scroll-touch">
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid var(--slate-200)", textAlign: "left" }}>
                                    <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Batch Date</th>
                                    <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Total Orders</th>
                                    <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Total Units</th>
                                    <th style={{ padding: "10px 12px", color: "#059669", fontWeight: "700" }}>Completed</th>
                                    <th style={{ padding: "10px 12px", color: "#e11d48", fontWeight: "700" }}>Not Completed</th>
                                    <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700", textAlign: "right" }}>View Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dateBreakdownList.map((d, idx) => {
                                    return (
                                        <tr
                                            key={d.date || idx}
                                            style={{
                                                borderBottom: "1px solid var(--slate-100)",
                                                transition: "background 0.2s ease"
                                            }}
                                        >
                                            {/* Batch Date */}
                                            <td style={{ padding: "12px" }}>
                                                <div>
                                                    <div style={{ fontWeight: "700", color: "var(--slate-900)" }}>
                                                        {d.formattedDate}
                                                    </div>
                                                    <div style={{ fontSize: "11px", color: "var(--slate-400)", fontFamily: "monospace" }}>
                                                        {d.date}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Total Orders */}
                                            <td style={{ padding: "12px", fontWeight: "700", color: "var(--slate-800)" }}>
                                                {d.totalOrders} {d.totalOrders === 1 ? "order" : "orders"}
                                            </td>

                                            {/* Total Units */}
                                            <td style={{ padding: "12px", color: "var(--primary-600)", fontWeight: "700" }}>
                                                {d.totalUnits}
                                            </td>

                                            {/* Completed */}
                                            <td style={{ padding: "12px" }}>
                                                <span className="saas-badge" style={{
                                                    background: d.completed > 0 ? "#ecfdf5" : "#f8fafc",
                                                    color: d.completed > 0 ? "#059669" : "#94a3b8",
                                                    border: `1px solid ${d.completed > 0 ? "#a7f3d0" : "#e2e8f0"}`,
                                                    fontWeight: "700"
                                                }}>
                                                    ✓ {d.completed}
                                                </span>
                                            </td>

                                            {/* Not Completed */}
                                            <td style={{ padding: "12px" }}>
                                                <span className="saas-badge" style={{
                                                    background: d.notCompleted > 0 ? "#fff1f2" : "#f8fafc",
                                                    color: d.notCompleted > 0 ? "#e11d48" : "#94a3b8",
                                                    border: `1px solid ${d.notCompleted > 0 ? "#fecdd3" : "#e2e8f0"}`,
                                                    fontWeight: "700"
                                                }}>
                                                    ✕ {d.notCompleted}
                                                </span>
                                            </td>

                                            {/* View Details Action */}
                                            <td style={{ padding: "12px", textAlign: "right" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDetailsModalDateData(d);
                                                        setExpandedOrderId(null);
                                                    }}
                                                    className="saas-btn saas-btn-primary"
                                                    style={{
                                                        padding: "6px 14px",
                                                        fontSize: "12px",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        fontWeight: "600",
                                                        borderRadius: "6px"
                                                    }}
                                                    title="View order details and status breakdown for this date"
                                                >
                                                    <span>👁️</span>
                                                    <span>View Details</span>
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

            {/* Granular Orders Table */}
            <div className="saas-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--slate-900)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>📋</span>
                        <span>Filtered Orders Log ({orders.length})</span>
                    </h2>
                    <span style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                        Displaying records matching your active filter criteria
                    </span>
                </div>

                {orders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--slate-400)", fontSize: "13px" }}>
                        No orders match the specified filter combinations.
                    </div>
                ) : (
                    <div className="table-scroll-touch">
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid var(--slate-200)", textAlign: "left" }}>
                                    <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Product</th>
                                    <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Brand</th>
                                    <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Platform</th>
                                    <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Price</th>
                                    <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Units</th>
                                    <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Status Summary</th>
                                    <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o) => {
                                    const sum = o.summary || {};
                                    return (
                                        <tr key={o._id} style={{ borderBottom: "1px solid var(--slate-100)" }}>
                                            <td style={{ padding: "12px", fontWeight: "700", color: "var(--slate-900)" }}>
                                                {o.productName}
                                                {o.season && (
                                                    <span style={{ display: "block", fontSize: "11px", color: "var(--primary-600)", fontWeight: "600" }}>
                                                        🏷️ {o.season}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: "12px", color: "var(--slate-700)" }}>
                                                {o.brand || o.brandUserId?.brand || o.brandUserId?.name || "—"}
                                            </td>
                                            <td style={{ padding: "12px", color: "var(--slate-600)" }}>{o.orderPlatform}</td>
                                            <td style={{ padding: "12px", fontWeight: "700", color: "var(--primary-600)" }}>₹{o.price}</td>
                                            <td style={{ padding: "12px", fontWeight: "600" }}>{o.quantity || (o.orderUnits || []).length}</td>
                                            <td style={{ padding: "12px" }}>
                                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", fontSize: "11.5px" }}>
                                                    {sum.completed > 0 && (
                                                        <span className="saas-badge" style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}>
                                                            ✓ {sum.completed} Done
                                                        </span>
                                                    )}
                                                    {sum.inProgress > 0 && (
                                                        <span className="saas-badge" style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                                                            🚀 {sum.inProgress} In-Prog
                                                        </span>
                                                    )}
                                                    {sum.pendingRefund > 0 && (
                                                        <span className="saas-badge" style={{ background: "#faf5ff", color: "#7c3aed", border: "1px solid #e9d8fd" }}>
                                                            🔄 {sum.pendingRefund} Refund
                                                        </span>
                                                    )}
                                                    {sum.unassigned > 0 && (
                                                        <span className="saas-badge" style={{ background: "#f8fafc", color: "var(--slate-600)", border: "1px solid #cbd5e1" }}>
                                                            📦 {sum.unassigned} Unassigned
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px", color: "var(--slate-500)", fontSize: "12px" }}>
                                                {new Date(o.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* View Details Modal for Date Breakdown */}
            {detailsModalDateData && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.7)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "20px",
                        boxSizing: "border-box"
                    }}
                    onClick={() => setDetailsModalDateData(null)}
                >
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "14px",
                            width: "100%",
                            maxWidth: "1160px",
                            maxHeight: "92vh",
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                            overflow: "hidden",
                            border: "1px solid var(--slate-200)"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{
                            padding: "20px 24px",
                            borderBottom: "1px solid var(--slate-100)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "linear-gradient(to bottom, #f8fafc, #ffffff)"
                        }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--slate-900)" }}>
                                        📅 Operations Breakdown: {detailsModalDateData.formattedDate}
                                    </h2>
                                    <span className="saas-badge" style={{ background: "#e0e7ff", color: "#4338ca", border: "1px solid #c7d2fe", fontFamily: "monospace" }}>
                                        {detailsModalDateData.date}
                                    </span>
                                </div>
                                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--slate-500)" }}>
                                    All orders for this date with unassigned, assigned, in-progress, pending refund/payment, and completed details.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailsModalDateData(null)}
                                style={{
                                    background: "#f1f5f9",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "32px",
                                    height: "32px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: "700",
                                    color: "var(--slate-500)"
                                }}
                                title="Close modal"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
                            {/* High-level Status Counters Strip */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                                gap: "10px",
                                marginBottom: "20px"
                            }}>
                                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
                                    <div style={{ fontSize: "11px", color: "var(--slate-500)", fontWeight: "600", textTransform: "uppercase" }}>Total Orders</div>
                                    <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--slate-900)", marginTop: "2px" }}>{detailsModalDateData.totalOrders}</div>
                                </div>
                                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
                                    <div style={{ fontSize: "11px", color: "var(--primary-600)", fontWeight: "600", textTransform: "uppercase" }}>Total Units</div>
                                    <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--primary-600)", marginTop: "2px" }}>{detailsModalDateData.totalUnits}</div>
                                </div>
                                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
                                    <div style={{ fontSize: "11px", color: "#059669", fontWeight: "600", textTransform: "uppercase" }}>Completed</div>
                                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#059669", marginTop: "2px" }}>✓ {detailsModalDateData.completed}</div>
                                </div>
                                <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
                                    <div style={{ fontSize: "11px", color: "#e11d48", fontWeight: "600", textTransform: "uppercase" }}>Not Completed</div>
                                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#e11d48", marginTop: "2px" }}>✕ {detailsModalDateData.notCompleted}</div>
                                </div>
                                <div style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
                                    <div style={{ fontSize: "11px", color: "var(--slate-600)", fontWeight: "600", textTransform: "uppercase" }}>Unassigned</div>
                                    <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--slate-700)", marginTop: "2px" }}>📦 {detailsModalDateData.unassigned}</div>
                                </div>
                                <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
                                    <div style={{ fontSize: "11px", color: "#0284c7", fontWeight: "600", textTransform: "uppercase" }}>Assigned</div>
                                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#0284c7", marginTop: "2px" }}>📌 {detailsModalDateData.assigned}</div>
                                </div>
                                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
                                    <div style={{ fontSize: "11px", color: "#d97706", fontWeight: "600", textTransform: "uppercase" }}>In Progress</div>
                                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#d97706", marginTop: "2px" }}>⚡ {detailsModalDateData.inProgress}</div>
                                </div>
                                <div style={{ background: "#faf5ff", border: "1px solid #e9d8fd", borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
                                    <div style={{ fontSize: "11px", color: "#7c3aed", fontWeight: "600", textTransform: "uppercase" }}>Refund Pend.</div>
                                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#7c3aed", marginTop: "2px" }}>🔄 {detailsModalDateData.pendingRefund}</div>
                                </div>
                                <div style={{ background: "#fdf4ff", border: "1px solid #f5d0fe", borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
                                    <div style={{ fontSize: "11px", color: "#c026d3", fontWeight: "600", textTransform: "uppercase" }}>Pay Pend.</div>
                                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#c026d3", marginTop: "2px" }}>💳 {detailsModalDateData.pendingPayment}</div>
                                </div>
                            </div>

                            {/* Orders Table inside Modal */}
                            <div style={{ border: "1px solid var(--slate-200)", borderRadius: "8px", overflow: "hidden" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                                    <thead>
                                        <tr style={{ background: "var(--slate-50)", borderBottom: "1px solid var(--slate-200)", textAlign: "left" }}>
                                            <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Product / Platform</th>
                                            <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Brand</th>
                                            <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Price</th>
                                            <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Units</th>
                                            <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Status Breakdown</th>
                                            <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Mediator(s)</th>
                                            <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700", textAlign: "right" }}>Units Drilldown</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(detailsModalDateData.orders || []).map((ord) => {
                                            const units = ord.activeUnits || ord.orderUnits || [];
                                            let uUnassigned = 0, uAssigned = 0, uInProg = 0, uRefPend = 0, uPayPend = 0, uDone = 0;
                                            if (units.length > 0) {
                                                units.forEach((u) => {
                                                    if (u.status === "completed") uDone++;
                                                    else if (u.status === "in_progress") uInProg++;
                                                    else if (u.status === "pending_refund") uRefPend++;
                                                    else if (u.status === "pending_payment") uPayPend++;
                                                    else if (u.status === "assigned") uAssigned++;
                                                    else if (u.status === "unassigned") uUnassigned++;
                                                });
                                            } else {
                                                const s = ord.summary || {};
                                                uDone = s.completed || 0;
                                                uInProg = s.inProgress || 0;
                                                uRefPend = s.pendingRefund || 0;
                                                uPayPend = s.pendingPayment || 0;
                                                uUnassigned = s.unassigned || 0;
                                                uAssigned = s.assigned || 0;
                                            }
                                            const ordTotal = units.length || ord.quantity || (uDone + uInProg + uRefPend + uPayPend + uUnassigned + uAssigned);
                                            const ordNotDone = Math.max(0, ordTotal - uDone);

                                            // Extract distinct mediator names
                                            const mediatorMap = new Map();
                                            units.forEach((u) => {
                                                if (u.mediatorId) {
                                                    const id = u.mediatorId._id || u.mediatorId;
                                                    const name = u.mediatorId.name || "Mediator";
                                                    const code = u.mediatorId.mediatorCode || "";
                                                    mediatorMap.set(id.toString(), { name, code });
                                                }
                                            });
                                            const assignedMeds = Array.from(mediatorMap.values());
                                            const isExpanded = expandedOrderId === ord._id;

                                            return (
                                                <Fragment key={ord._id}>
                                                    <tr style={{ borderBottom: "1px solid var(--slate-100)", background: isExpanded ? "#f8fafc" : "transparent" }}>
                                                        <td style={{ padding: "10px 12px" }}>
                                                            <div style={{ fontWeight: "700", color: "var(--slate-900)" }}>{ord.productName}</div>
                                                            <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                                                                <span className="saas-badge" style={{ background: "#f1f5f9", color: "var(--slate-600)", fontSize: "10.5px" }}>
                                                                    {ord.orderPlatform}
                                                                </span>
                                                                {ord.season && (
                                                                    <span className="saas-badge" style={{ background: "#ede9fe", color: "#6d28d9", fontSize: "10.5px" }}>
                                                                        {ord.season}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "10px 12px", color: "var(--slate-700)", fontWeight: "500" }}>
                                                            {ord.brand || ord.brandUserId?.brand || ord.brandUserId?.name || "—"}
                                                        </td>
                                                        <td style={{ padding: "10px 12px", fontWeight: "700", color: "var(--primary-600)" }}>
                                                            ₹{ord.price}
                                                        </td>
                                                        <td style={{ padding: "10px 12px" }}>
                                                            <div style={{ fontWeight: "700", color: "var(--slate-900)" }}>{ordTotal} units</div>
                                                            <div style={{ fontSize: "11px", color: "#059669" }}>✓ {uDone} done</div>
                                                            {ordNotDone > 0 && (
                                                                <div style={{ fontSize: "11px", color: "#e11d48" }}>✕ {ordNotDone} not done</div>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: "10px 12px" }}>
                                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                                                {uUnassigned > 0 && (
                                                                    <span className="saas-badge" style={{ background: "#f8fafc", color: "var(--slate-600)", border: "1px solid #cbd5e1" }}>
                                                                        📦 {uUnassigned} Unassigned
                                                                    </span>
                                                                )}
                                                                {uAssigned > 0 && (
                                                                    <span className="saas-badge" style={{ background: "#f0f9ff", color: "#0284c7", border: "1px solid #bae6fd" }}>
                                                                        📌 {uAssigned} Assigned
                                                                    </span>
                                                                )}
                                                                {uInProg > 0 && (
                                                                    <span className="saas-badge" style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}>
                                                                        ⚡ {uInProg} In-Progress
                                                                    </span>
                                                                )}
                                                                {uRefPend > 0 && (
                                                                    <span className="saas-badge" style={{ background: "#faf5ff", color: "#7c3aed", border: "1px solid #e9d8fd" }}>
                                                                        🔄 {uRefPend} Refund Pend.
                                                                    </span>
                                                                )}
                                                                {uPayPend > 0 && (
                                                                    <span className="saas-badge" style={{ background: "#fdf4ff", color: "#c026d3", border: "1px solid #f5d0fe" }}>
                                                                        💳 {uPayPend} Pay Pend.
                                                                    </span>
                                                                )}
                                                                {uDone > 0 && (
                                                                    <span className="saas-badge" style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}>
                                                                        ✓ {uDone} Done
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "10px 12px" }}>
                                                            {assignedMeds.length > 0 ? (
                                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                                                    {assignedMeds.map((med, i) => (
                                                                        <span key={i} className="saas-badge" style={{ background: "#f1f5f9", color: "var(--slate-700)", border: "1px solid #e2e8f0" }}>
                                                                            🤝 {med.name} {med.code && `(${med.code})`}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span style={{ color: "var(--slate-400)", fontSize: "11.5px" }}>None assigned</span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: "10px 12px", textAlign: "right" }}>
                                                            {units.length > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setExpandedOrderId(isExpanded ? null : ord._id)}
                                                                    className="saas-btn saas-btn-outline"
                                                                    style={{ padding: "4px 8px", fontSize: "11px", whiteSpace: "nowrap" }}
                                                                >
                                                                    {isExpanded ? "Hide Units ▲" : `Units (${units.length}) ▼`}
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Units details for this Order */}
                                                    {isExpanded && units.length > 0 && (
                                                        <tr>
                                                            <td colSpan={7} style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid var(--slate-200)" }}>
                                                                <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--slate-700)", marginBottom: "8px" }}>
                                                                    Unit-by-Unit Status Breakdown for {ord.productName}:
                                                                </div>
                                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "8px" }}>
                                                                    {units.map((u, uIdx) => {
                                                                        const medName = u.mediatorId?.name || "Unassigned";
                                                                        const medCode = u.mediatorId?.mediatorCode ? `(${u.mediatorId.mediatorCode})` : "";
                                                                        return (
                                                                            <div
                                                                                key={u._id || uIdx}
                                                                                style={{
                                                                                    background: "#ffffff",
                                                                                    border: "1px solid var(--slate-200)",
                                                                                    borderRadius: "6px",
                                                                                    padding: "8px 10px",
                                                                                    fontSize: "11.5px"
                                                                                }}
                                                                            >
                                                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                                                                    <span style={{ fontWeight: "700", color: "var(--slate-800)" }}>Unit #{uIdx + 1}</span>
                                                                                    <span className="saas-badge" style={{
                                                                                        background: u.status === "completed" ? "#ecfdf5" : u.status === "in_progress" ? "#eff6ff" : u.status === "pending_refund" ? "#faf5ff" : u.status === "pending_payment" ? "#fdf4ff" : "#f1f5f9",
                                                                                        color: u.status === "completed" ? "#059669" : u.status === "in_progress" ? "#2563eb" : u.status === "pending_refund" ? "#7c3aed" : u.status === "pending_payment" ? "#c026d3" : "var(--slate-600)",
                                                                                        fontSize: "10.5px"
                                                                                    }}>
                                                                                        {u.status.replace("_", " ")}
                                                                                    </span>
                                                                                </div>
                                                                                <div style={{ color: "var(--slate-500)", display: "flex", justifyContent: "space-between" }}>
                                                                                    <span>Mediator:</span>
                                                                                    <span style={{ fontWeight: "600", color: "var(--slate-700)" }}>{medName} {medCode}</span>
                                                                                </div>
                                                                                {u.orderId && (
                                                                                    <div style={{ color: "var(--slate-500)", display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
                                                                                        <span>Platform Order ID:</span>
                                                                                        <span style={{ fontFamily: "monospace", color: "var(--slate-700)" }}>{u.orderId}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: "14px 24px",
                            borderTop: "1px solid var(--slate-100)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#f8fafc"
                        }}>
                            <span style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                                Total {detailsModalDateData.orders?.length || 0} order batch(es) on this date
                            </span>
                            <button
                                type="button"
                                onClick={() => setDetailsModalDateData(null)}
                                className="saas-btn saas-btn-outline"
                                style={{ padding: "6px 16px", fontSize: "12px" }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
