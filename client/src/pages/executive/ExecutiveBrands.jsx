import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { fetchExecutiveBrandSummary } from "../../services/executive/order";
import "../../styles/theme.css";

export default function ExecutiveBrands() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
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

    const exportToExcel = () => {
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
        XLSX.utils.book_append_sheet(wb, ws, "Brand Performance");
        XLSX.writeFile(wb, `Executive_Brand_Performance_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    const filtered = brands.filter((b) => {
        const q = searchQuery.toLowerCase().trim();
        return !q || b.brandName.toLowerCase().includes(q) || (b.userName && b.userName.toLowerCase().includes(q));
    });

    const totalBrands = brands.length;
    const totalOrdersCount = brands.reduce((acc, b) => acc + (b.totalOrders || 0), 0);
    const totalUnitsCount = brands.reduce((acc, b) => acc + (b.totalUnits || 0), 0);
    const totalCompletedUnits = brands.reduce((acc, b) => acc + (b.completedUnits || 0), 0);
    const overallRate = totalUnitsCount > 0 ? Math.round((totalCompletedUnits / totalUnitsCount) * 100) : 0;

    return (
        <div style={{ padding: "24px 28px 60px", maxWidth: "1440px", margin: "0 auto", boxSizing: "border-box" }}>
            {/* Header Hero Card */}
            <div className="saas-card" style={{ padding: "24px 28px", marginBottom: "24px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #2563eb, #38bdf8)" }} />
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <span className="saas-badge" style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                                🏢 Enterprise Operations
                            </span>
                            <span style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: "500" }}>
                                Brand Level Tracking & Analytics
                            </span>
                        </div>
                        <h1 style={{ fontSize: "26px", fontWeight: "800", color: "var(--slate-900)", margin: 0 }}>
                            Brand Operations & Completion
                        </h1>
                        <p style={{ color: "var(--slate-500)", fontSize: "13.5px", marginTop: "4px", marginBottom: 0 }}>
                            Monitor completion rates across client brands and inspect granular order delivery details
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <button
                            type="button"
                            onClick={exportToExcel}
                            className="saas-btn saas-btn-emerald"
                            disabled={!brands.length}
                        >
                            <span>📥</span>
                            <span>Download Excel Sheet</span>
                        </button>
                    </div>
                </div>

                {/* Aggregate KPI Strip */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "14px",
                    marginTop: "20px",
                    paddingTop: "20px",
                    borderTop: "1px solid var(--slate-200)"
                }}>
                    <div style={{ background: "var(--slate-50)", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--slate-200)" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--slate-500)", textTransform: "uppercase" }}>Managed Brands</div>
                        <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--slate-900)", marginTop: "2px" }}>{totalBrands}</div>
                    </div>
                    <div style={{ background: "var(--slate-50)", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--slate-200)" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--slate-500)", textTransform: "uppercase" }}>Total Master Orders</div>
                        <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--primary-600)", marginTop: "2px" }}>{totalOrdersCount}</div>
                    </div>
                    <div style={{ background: "var(--slate-50)", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--slate-200)" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--slate-500)", textTransform: "uppercase" }}>Total Order Units</div>
                        <div style={{ fontSize: "22px", fontWeight: "800", color: "#d97706", marginTop: "2px" }}>{totalUnitsCount}</div>
                    </div>
                    <div style={{ background: "var(--slate-50)", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--slate-200)" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--slate-500)", textTransform: "uppercase" }}>Completed Units</div>
                        <div style={{ fontSize: "22px", fontWeight: "800", color: "#059669", marginTop: "2px" }}>{totalCompletedUnits}</div>
                    </div>
                    <div style={{ background: "var(--slate-50)", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--slate-200)" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--slate-500)", textTransform: "uppercase" }}>Avg Completion</div>
                        <div style={{ fontSize: "22px", fontWeight: "800", color: overallRate >= 50 ? "#059669" : "#2563eb", marginTop: "2px" }}>
                            {overallRate}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                gap: "14px",
                flexWrap: "wrap"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13.5px", color: "var(--slate-600)", fontWeight: "600" }}>Active Brands:</span>
                    <span className="saas-badge" style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                        {filtered.length} of {brands.length}
                    </span>
                </div>

                <div style={{ position: "relative", minWidth: "280px" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--slate-400)" }}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search brand name or account..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="saas-input"
                        style={{ paddingLeft: "36px" }}
                    />
                </div>
            </div>

            {error && (
                <div style={{
                    padding: "12px 16px",
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "10px",
                    color: "#dc2626",
                    fontSize: "13.5px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                }}>
                    <span>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {/* Brands Cards Grid */}
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
                    <div style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>No brands matched your search keyword.</div>
                </div>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                    gap: "20px"
                }}>
                    {filtered.map((b) => (
                        <div
                            key={b.brandId || b.brandName}
                            className="saas-card"
                            style={{
                                padding: "22px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                position: "relative",
                                overflow: "hidden"
                            }}
                        >
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{
                                            width: "42px",
                                            height: "42px",
                                            borderRadius: "10px",
                                            background: "#eff6ff",
                                            border: "1px solid #bfdbfe",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "18px",
                                            fontWeight: "800",
                                            color: "#2563eb",
                                            flexShrink: 0
                                        }}>
                                            {(b.brandName || "B").charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "var(--slate-900)" }}>
                                                {b.brandName}
                                            </h3>
                                            <span style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                                                {b.userName ? `Account: ${b.userName}` : "Verified Brand Partner"}
                                            </span>
                                        </div>
                                    </div>

                                    <span className="saas-badge" style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                                        {b.totalOrders} {b.totalOrders === 1 ? "Order" : "Orders"}
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
                                        <div style={{
                                            width: `${Math.min(100, Math.max(0, b.completionRate))}%`,
                                            height: "100%",
                                            background: b.completionRate >= 80 ? "linear-gradient(90deg, #059669, #10b981)" : "linear-gradient(90deg, #2563eb, #38bdf8)",
                                            borderRadius: "9999px",
                                            transition: "width 0.4s ease"
                                        }} />
                                    </div>
                                </div>

                                {/* Metrics Breakdown Grid */}
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    gap: "8px",
                                    backgroundColor: "var(--slate-50)",
                                    padding: "12px",
                                    borderRadius: "10px",
                                    border: "1px solid var(--slate-200)",
                                    marginBottom: "18px",
                                    textAlign: "center"
                                }}>
                                    <div>
                                        <div style={{ fontSize: "10.5px", fontWeight: "700", color: "var(--slate-500)", textTransform: "uppercase" }}>TOTAL</div>
                                        <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--slate-800)", marginTop: "2px" }}>{b.totalUnits}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "10.5px", fontWeight: "700", color: "#059669", textTransform: "uppercase" }}>COMPLETED</div>
                                        <div style={{ fontSize: "16px", fontWeight: "800", color: "#059669", marginTop: "2px" }}>{b.completedUnits}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "10.5px", fontWeight: "700", color: "#d97706", textTransform: "uppercase" }}>IN PROGRESS</div>
                                        <div style={{ fontSize: "16px", fontWeight: "800", color: "#d97706", marginTop: "2px" }}>{b.inProgressUnits}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <button
                                type="button"
                                onClick={() => navigate(`/executive-brands/${b.brandId || b.brandName}`)}
                                className="saas-btn saas-btn-outline"
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    fontWeight: "700",
                                    fontSize: "13px",
                                    borderColor: "#bfdbfe",
                                    color: "#1d4ed8",
                                    background: "#eff6ff"
                                }}
                            >
                                <span>👁️</span>
                                <span>View Brand Orders & Details →</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
