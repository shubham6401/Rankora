import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { fetchExecutiveBrandSummary, fetchExecutiveBrandDetails } from "../../services/executive/order";
import { exportCompleteBrandExcel } from "../../utils/brandExcelExport";
import "../../styles/theme.css";

export default function ExecutiveBrands() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [completionFilter, setCompletionFilter] = useState("all"); // "all" | "completed" | "in_progress"
    const [viewMode, setViewMode] = useState("cards"); // "cards" | "table"
    const [downloadingBrandId, setDownloadingBrandId] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        loadBrandSummary();
    }, []);

    const loadBrandSummary = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await fetchExecutiveBrandSummary();
            if (res.data.success) {
                setBrands(res.data.brandSummaries || []);
            }
        } catch (err) {
            console.error("Failed to load executive brands:", err);
            setError("Unable to load brand summaries");
        } finally {
            setLoading(false);
        }
    };

    // Download complete multi-column granular Excel sheet for an individual brand
    const handleDownloadBrandExcel = async (brand) => {
        const bId = brand.brandId || brand.brandName;
        try {
            setDownloadingBrandId(bId);
            const res = await fetchExecutiveBrandDetails(bId);
            const orders = res.data?.orders || [];
            exportCompleteBrandExcel(brand.brandName, orders);
        } catch (err) {
            console.error("Error exporting brand data:", err);
            alert("Failed to download brand excel: " + (err.response?.data?.message || err.message));
        } finally {
            setDownloadingBrandId(null);
        }
    };

    // Export top-level overview sheet across all brands
    const exportOverviewExcel = () => {
        if (!brands.length) return;

        const data = brands.map((b) => ({
            "Brand Name": b.brandName,
            "Contact Account": b.userName || "—",
            "Total Orders": b.totalOrders,
            "Total Units": b.totalUnits,
            "Completed Units": b.completedUnits,
            "Completion Rate": `${b.completionRate}%`,
            "In Progress": b.inProgressUnits,
            "Pending Refund": b.pendingRefundUnits,
            "Pending Verification": b.pendingVerificationUnits,
            "Unassigned Units": b.unassignedUnits,
            "Total Volume (₹)": b.totalAmount,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Brand Performance Summary");
        XLSX.writeFile(wb, `Executive_All_Brands_Summary_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    const filtered = brands.filter((b) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = !q || b.brandName.toLowerCase().includes(q) || (b.userName && b.userName.toLowerCase().includes(q));
        if (!matchesQuery) return false;

        if (completionFilter === "completed" && b.completionRate < 80) return false;
        if (completionFilter === "in_progress" && b.completionRate >= 80) return false;

        return true;
    });

    const totalBrands = brands.length;
    const totalOrdersCount = brands.reduce((acc, b) => acc + (b.totalOrders || 0), 0);
    const totalUnitsCount = brands.reduce((acc, b) => acc + (b.totalUnits || 0), 0);
    const totalCompletedUnits = brands.reduce((acc, b) => acc + (b.completedUnits || 0), 0);
    const totalVolumeAmount = brands.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    const overallRate = totalUnitsCount > 0 ? Math.round((totalCompletedUnits / totalUnitsCount) * 100) : 0;

    return (
        <div style={{ padding: "24px 28px 60px", maxWidth: "1440px", margin: "0 auto", boxSizing: "border-box" }}>
            {/* Header Hero Card */}
            <div
                className="saas-card"
                style={{
                    padding: "26px 30px",
                    marginBottom: "24px",
                    position: "relative",
                    overflow: "hidden",
                    background: "#ffffff",
                    borderRadius: "14px",
                    boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.06)",
                    border: "1px solid var(--slate-200)",
                }}
            >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #2563eb, #38bdf8, #10b981)" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <span className="saas-badge" style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", fontWeight: 700 }}>
                                🏢 Brand Operations & Analytics
                            </span>
                            <span style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: "500" }}>
                                Brand Level Tracking & Granular Fulfillment Reports
                            </span>
                        </div>
                        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "var(--slate-900)", margin: 0, letterSpacing: "-0.5px" }}>
                            Brand Overview & Intelligence
                        </h1>
                        <p style={{ color: "var(--slate-500)", fontSize: "14px", marginTop: "4px", marginBottom: 0 }}>
                            Monitor completion rates across client brands and download complete data spreadsheets for any brand with one click.
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <button
                            type="button"
                            onClick={exportOverviewExcel}
                            className="saas-btn saas-btn-emerald"
                            disabled={!brands.length}
                            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", fontWeight: 700 }}
                        >
                            <span>📊</span>
                            <span>Export Brands Summary</span>
                        </button>
                    </div>
                </div>

                {/* Aggregate KPI Strip */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "14px",
                        marginTop: "22px",
                        paddingTop: "20px",
                        borderTop: "1px solid var(--slate-100)",
                    }}
                >
                    <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "10px", border: "1px solid var(--slate-200)" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--slate-500)", textTransform: "uppercase" }}>Managed Brands</div>
                        <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--slate-900)", marginTop: "3px" }}>{totalBrands}</div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "10px", border: "1px solid var(--slate-200)" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--slate-500)", textTransform: "uppercase" }}>Total Master Orders</div>
                        <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--primary-600)", marginTop: "3px" }}>{totalOrdersCount}</div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "10px", border: "1px solid var(--slate-200)" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--slate-500)", textTransform: "uppercase" }}>Total Order Units</div>
                        <div style={{ fontSize: "24px", fontWeight: "800", color: "#d97706", marginTop: "3px" }}>{totalUnitsCount}</div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "10px", border: "1px solid var(--slate-200)" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--slate-500)", textTransform: "uppercase" }}>Completed Units</div>
                        <div style={{ fontSize: "24px", fontWeight: "800", color: "#059669", marginTop: "3px" }}>{totalCompletedUnits}</div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "10px", border: "1px solid var(--slate-200)" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--slate-500)", textTransform: "uppercase" }}>Avg Completion</div>
                        <div style={{ fontSize: "24px", fontWeight: "800", color: overallRate >= 80 ? "#059669" : "#2563eb", marginTop: "3px" }}>
                            {overallRate}%
                        </div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "10px", border: "1px solid var(--slate-200)" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--slate-500)", textTransform: "uppercase" }}>Total Volume</div>
                        <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--slate-800)", marginTop: "3px" }}>
                            ₹{totalVolumeAmount.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Bar: Search, Completion Filter Tabs, View Switcher */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                    gap: "14px",
                    flexWrap: "wrap",
                    background: "#ffffff",
                    padding: "12px 18px",
                    borderRadius: "10px",
                    border: "1px solid var(--slate-200)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ position: "relative", minWidth: "280px" }}>
                        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--slate-400)" }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search brand name or account..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="saas-input"
                            style={{ paddingLeft: "36px", width: "100%", fontSize: "13px" }}
                        />
                    </div>

                    {/* Filter Pills */}
                    <div style={{ display: "flex", gap: "6px" }}>
                        <button
                            type="button"
                            onClick={() => setCompletionFilter("all")}
                            style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: completionFilter === "all" ? "1.5px solid #2563eb" : "1px solid var(--slate-200)",
                                background: completionFilter === "all" ? "#eff6ff" : "#ffffff",
                                color: completionFilter === "all" ? "#2563eb" : "var(--slate-600)",
                                fontSize: "12.5px",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            All ({brands.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setCompletionFilter("completed")}
                            style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: completionFilter === "completed" ? "1.5px solid #059669" : "1px solid var(--slate-200)",
                                background: completionFilter === "completed" ? "#ecfdf5" : "#ffffff",
                                color: completionFilter === "completed" ? "#059669" : "var(--slate-600)",
                                fontSize: "12.5px",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            High Completion (≥80%)
                        </button>
                        <button
                            type="button"
                            onClick={() => setCompletionFilter("in_progress")}
                            style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: completionFilter === "in_progress" ? "1.5px solid #d97706" : "1px solid var(--slate-200)",
                                background: completionFilter === "in_progress" ? "#fffbeb" : "#ffffff",
                                color: completionFilter === "in_progress" ? "#d97706" : "var(--slate-600)",
                                fontSize: "12.5px",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            Active (&lt;80%)
                        </button>
                    </div>
                </div>

                {/* View Switcher */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600 }}>View:</span>
                    <button
                        type="button"
                        onClick={() => setViewMode("cards")}
                        style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: viewMode === "cards" ? "1.5px solid #2563eb" : "1px solid var(--slate-200)",
                            background: viewMode === "cards" ? "#eff6ff" : "#ffffff",
                            color: viewMode === "cards" ? "#2563eb" : "var(--slate-600)",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                    >
                        <span>✨ Cards</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("table")}
                        style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: viewMode === "table" ? "1.5px solid #2563eb" : "1px solid var(--slate-200)",
                            background: viewMode === "table" ? "#eff6ff" : "#ffffff",
                            color: viewMode === "table" ? "#2563eb" : "var(--slate-600)",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                    >
                        <span>📋 Table</span>
                    </button>
                </div>
            </div>

            {error && (
                <div
                    style={{
                        padding: "12px 16px",
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "10px",
                        color: "#dc2626",
                        fontSize: "13.5px",
                        marginBottom: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <span>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="saas-card" style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--slate-700)" }}>Loading Brand Analytics...</div>
                    <div style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Fetching latest brand orders and unit fulfillment data.</div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="saas-card" style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ fontSize: "32px", marginBottom: "12px" }}>🏷️</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--slate-700)" }}>No Brands Found</div>
                    <div style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>No brands matched your search keyword or selected filter.</div>
                </div>
            ) : viewMode === "cards" ? (
                /* CARDS GRID VIEW */
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                        gap: "20px",
                    }}
                >
                    {filtered.map((b) => {
                        const bId = b.brandId || b.brandName;
                        const isDownloading = downloadingBrandId === bId;

                        return (
                            <div
                                key={bId}
                                className="saas-card"
                                style={{
                                    padding: "22px",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    position: "relative",
                                    overflow: "hidden",
                                    borderRadius: "12px",
                                    border: "1px solid var(--slate-200)",
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                <div>
                                    {/* Top Line */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div
                                                style={{
                                                    width: "44px",
                                                    height: "44px",
                                                    borderRadius: "10px",
                                                    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                                                    border: "1.5px solid #bfdbfe",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "20px",
                                                    fontWeight: "800",
                                                    color: "#1d4ed8",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {(b.brandName || "B").charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "var(--slate-900)" }}>
                                                    {b.brandName}
                                                </h3>
                                                <span style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                                                    {b.userName ? `Account: ${b.userName}` : "Verified Brand Client"}
                                                </span>
                                            </div>
                                        </div>

                                        <span className="saas-badge" style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", fontWeight: 700 }}>
                                            {b.totalOrders} {b.totalOrders === 1 ? "Campaign" : "Campaigns"}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{ marginBottom: "16px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "6px" }}>
                                            <span style={{ color: "var(--slate-600)", fontWeight: "600" }}>Completion Progress</span>
                                            <span style={{ fontWeight: "800", color: b.completionRate >= 80 ? "#059669" : b.completionRate >= 40 ? "#d97706" : "#2563eb" }}>
                                                {b.completionRate}%
                                            </span>
                                        </div>
                                        <div style={{ height: "8px", backgroundColor: "var(--slate-100)", borderRadius: "9999px", overflow: "hidden", border: "1px solid var(--slate-200)" }}>
                                            <div
                                                style={{
                                                    width: `${Math.min(100, Math.max(0, b.completionRate))}%`,
                                                    height: "100%",
                                                    background:
                                                        b.completionRate >= 80
                                                            ? "linear-gradient(90deg, #059669, #10b981)"
                                                            : b.completionRate >= 40
                                                            ? "linear-gradient(90deg, #d97706, #fbbf24)"
                                                            : "linear-gradient(90deg, #2563eb, #38bdf8)",
                                                    borderRadius: "9999px",
                                                    transition: "width 0.4s ease",
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Metrics Breakdown Grid */}
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(3, 1fr)",
                                            gap: "8px",
                                            backgroundColor: "var(--slate-50)",
                                            padding: "12px",
                                            borderRadius: "10px",
                                            border: "1px solid var(--slate-200)",
                                            marginBottom: "18px",
                                            textAlign: "center",
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--slate-500)", textTransform: "uppercase" }}>TOTAL UNITS</div>
                                            <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--slate-800)", marginTop: "2px" }}>{b.totalUnits}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "10px", fontWeight: "700", color: "#059669", textTransform: "uppercase" }}>DONE</div>
                                            <div style={{ fontSize: "16px", fontWeight: "800", color: "#059669", marginTop: "2px" }}>{b.completedUnits}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "10px", fontWeight: "700", color: "#d97706", textTransform: "uppercase" }}>ACTIVE</div>
                                            <div style={{ fontSize: "16px", fontWeight: "800", color: "#d97706", marginTop: "2px" }}>
                                                {(b.inProgressUnits || 0) + (b.pendingRefundUnits || 0) + (b.pendingVerificationUnits || 0)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions: Download Complete Excel Sheet & View Details */}
                                <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                                    <button
                                        type="button"
                                        onClick={() => handleDownloadBrandExcel(b)}
                                        disabled={isDownloading}
                                        className="saas-btn saas-btn-emerald"
                                        style={{
                                            flex: 1,
                                            padding: "9px 10px",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            justifyContent: "center",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                        title="Download Excel Sheet with Every Single Data Field Available for this Brand"
                                    >
                                        <span>📥</span>
                                        <span>{isDownloading ? "Exporting..." : "Download Excel"}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigate(`/executive-brands/${bId}`)}
                                        className="saas-btn saas-btn-outline"
                                        style={{
                                            padding: "9px 14px",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            borderColor: "#bfdbfe",
                                            color: "#1d4ed8",
                                            background: "#eff6ff",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                        }}
                                    >
                                        <span>Details</span>
                                        <span>→</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* TABLE VIEW */
                <div className="saas-card" style={{ padding: "0", overflow: "hidden", borderRadius: "12px", border: "1px solid var(--slate-200)" }}>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                                <tr style={{ background: "var(--slate-50)", borderBottom: "2px solid var(--slate-200)", textAlign: "left" }}>
                                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "var(--slate-700)" }}>Brand Name</th>
                                    <th style={{ padding: "12px 14px", fontWeight: "700", color: "var(--slate-700)" }}>Account</th>
                                    <th style={{ padding: "12px 14px", fontWeight: "700", color: "var(--slate-700)" }}>Campaigns</th>
                                    <th style={{ padding: "12px 14px", fontWeight: "700", color: "var(--slate-700)" }}>Total Units</th>
                                    <th style={{ padding: "12px 14px", fontWeight: "700", color: "#059669" }}>Completed</th>
                                    <th style={{ padding: "12px 14px", fontWeight: "700", color: "#d97706" }}>Active</th>
                                    <th style={{ padding: "12px 14px", fontWeight: "700", color: "var(--slate-700)" }}>Rate</th>
                                    <th style={{ padding: "12px 14px", fontWeight: "700", color: "var(--slate-700)" }}>Total Value (₹)</th>
                                    <th style={{ padding: "12px 16px", fontWeight: "700", color: "var(--slate-700)", textAlign: "center" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((b, idx) => {
                                    const bId = b.brandId || b.brandName;
                                    const isDownloading = downloadingBrandId === bId;
                                    const activeUnits = (b.inProgressUnits || 0) + (b.pendingRefundUnits || 0) + (b.pendingVerificationUnits || 0);

                                    return (
                                        <tr
                                            key={bId || idx}
                                            style={{
                                                borderBottom: "1px solid var(--slate-100)",
                                                backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fbfcfd",
                                            }}
                                        >
                                            <td style={{ padding: "12px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div
                                                        style={{
                                                            width: "32px",
                                                            height: "32px",
                                                            borderRadius: "8px",
                                                            background: "#eff6ff",
                                                            border: "1px solid #bfdbfe",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: "14px",
                                                            fontWeight: "800",
                                                            color: "#2563eb",
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {(b.brandName || "B").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div style={{ fontWeight: 700, color: "var(--slate-900)" }}>
                                                        {b.brandName}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 14px", color: "var(--slate-600)" }}>
                                                {b.userName || "—"}
                                            </td>
                                            <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--primary-600)" }}>
                                                {b.totalOrders}
                                            </td>
                                            <td style={{ padding: "12px 14px", fontWeight: 700 }}>
                                                {b.totalUnits}
                                            </td>
                                            <td style={{ padding: "12px 14px", fontWeight: 700, color: "#059669" }}>
                                                {b.completedUnits}
                                            </td>
                                            <td style={{ padding: "12px 14px", fontWeight: 600, color: "#d97706" }}>
                                                {activeUnits}
                                            </td>
                                            <td style={{ padding: "12px 14px" }}>
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        padding: "2px 8px",
                                                        borderRadius: "6px",
                                                        fontSize: "12px",
                                                        fontWeight: 800,
                                                        background: b.completionRate >= 80 ? "#ecfdf5" : "#eff6ff",
                                                        color: b.completionRate >= 80 ? "#059669" : "#2563eb",
                                                    }}
                                                >
                                                    {b.completionRate}%
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--slate-800)" }}>
                                                ₹{(b.totalAmount || 0).toLocaleString()}
                                            </td>
                                            <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                                <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownloadBrandExcel(b)}
                                                        disabled={isDownloading}
                                                        className="saas-btn saas-btn-emerald"
                                                        style={{ padding: "6px 10px", fontSize: "11.5px", fontWeight: 700 }}
                                                        title="Download All Data Excel Sheet"
                                                    >
                                                        {isDownloading ? "..." : "📥 Excel"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/executive-brands/${bId}`)}
                                                        className="saas-btn saas-btn-outline"
                                                        style={{ padding: "6px 10px", fontSize: "11.5px", fontWeight: 700 }}
                                                    >
                                                        View →
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
