import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { fetchExecutiveBrandSummary } from "../../services/executive/order";

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

    return (
        <div style={{ padding: "1.5rem", maxWidth: "1400px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
                marginBottom: "2rem"
            }}>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#f8fafc", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>🏢</span>
                        <span>Brand Operations & Completion</span>
                    </h1>
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "0.3rem" }}>
                        View completion rates across partner brands and inspect granular order delivery details
                    </p>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
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
                            fontSize: "0.875rem",
                            boxShadow: "0 4px 12px rgba(6, 95, 70, 0.3)"
                        }}
                    >
                        <span>📥</span>
                        <span>Download Excel Sheet</span>
                    </button>
                </div>
            </div>

            {/* Controls Bar */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
                gap: "1rem",
                flexWrap: "wrap"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>Total Brands:</span>
                    <span style={{ fontWeight: "700", color: "#818cf8" }}>{brands.length}</span>
                </div>

                <input
                    type="text"
                    placeholder="Search brand name or contact..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        padding: "0.6rem 1rem",
                        borderRadius: "8px",
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        color: "#f3f4f6",
                        fontSize: "0.875rem",
                        minWidth: "280px"
                    }}
                />
            </div>

            {error && (
                <div style={{
                    padding: "1rem",
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid #ef4444",
                    borderRadius: "8px",
                    color: "#f87171",
                    marginBottom: "1.5rem"
                }}>
                    {error}
                </div>
            )}

            {/* Brands Cards Grid */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
                    Loading brand statistics...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{
                    textAlign: "center",
                    padding: "3rem",
                    backgroundColor: "#111827",
                    borderRadius: "12px",
                    border: "1px solid #1f2937",
                    color: "#6b7280"
                }}>
                    No brands match your search criteria.
                </div>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                    gap: "1.25rem"
                }}>
                    {filtered.map((b) => (
                        <div
                            key={b.brandId || b.brandName}
                            style={{
                                backgroundColor: "#111827",
                                border: "1px solid #1f2937",
                                borderRadius: "14px",
                                padding: "1.5rem",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
                                transition: "transform 0.2s ease, border-color 0.2s ease"
                            }}
                        >
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#f8fafc" }}>
                                            {b.brandName}
                                        </h3>
                                        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                                            {b.userName ? `Account: ${b.userName}` : "Partner"}
                                        </span>
                                    </div>
                                    <span style={{
                                        backgroundColor: "rgba(99, 102, 241, 0.15)",
                                        color: "#818cf8",
                                        fontWeight: "700",
                                        fontSize: "0.8rem",
                                        padding: "0.25rem 0.6rem",
                                        borderRadius: "6px"
                                    }}>
                                        {b.totalOrders} {b.totalOrders === 1 ? "Order" : "Orders"}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div style={{ marginBottom: "1.25rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.4rem" }}>
                                        <span style={{ color: "#94a3b8" }}>Completion Rate</span>
                                        <span style={{ fontWeight: "700", color: b.completionRate >= 80 ? "#34d399" : b.completionRate >= 40 ? "#fbbf24" : "#f87171" }}>
                                            {b.completionRate}%
                                        </span>
                                    </div>
                                    <div style={{ height: "8px", backgroundColor: "#1f2937", borderRadius: "4px", overflow: "hidden" }}>
                                        <div style={{
                                            width: `${b.completionRate}%`,
                                            height: "100%",
                                            background: "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
                                            borderRadius: "4px"
                                        }}></div>
                                    </div>
                                </div>

                                {/* Metrics Breakdown Grid */}
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr 1fr",
                                    gap: "0.5rem",
                                    backgroundColor: "#1f2937",
                                    padding: "0.75rem",
                                    borderRadius: "8px",
                                    marginBottom: "1.25rem",
                                    textAlign: "center"
                                }}>
                                    <div>
                                        <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>TOTAL</div>
                                        <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#60a5fa" }}>{b.totalUnits}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.7rem", color: "#34d399" }}>COMPLETED</div>
                                        <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#10b981" }}>{b.completedUnits}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.7rem", color: "#fbbf24" }}>IN PROGRESS</div>
                                        <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#f59e0b" }}>{b.inProgressUnits}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <button
                                onClick={() => navigate(`/executive-brands/${b.brandId || b.brandName}`)}
                                style={{
                                    width: "100%",
                                    padding: "0.65rem",
                                    backgroundColor: "rgba(99, 102, 241, 0.15)",
                                    border: "1px solid rgba(99, 102, 241, 0.4)",
                                    color: "#a5b4fc",
                                    borderRadius: "8px",
                                    fontWeight: "600",
                                    fontSize: "0.875rem",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.5rem",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                <span>👁️</span>
                                <span>View Brand Details & Orders →</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
