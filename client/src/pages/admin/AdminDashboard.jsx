import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { fetchAdminOverview, createExecutiveAccountApi } from "../../services/admin";
import Logout from "../../component/Logout";

export default function AdminDashboard() {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("executives"); // "executives" | "brands"
    const [searchQuery, setSearchQuery] = useState("");

    // Modal state for Executive Creation
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [execName, setExecName] = useState("");
    const [execTeamCode, setExecTeamCode] = useState("");
    const [execPassword, setExecPassword] = useState("");
    const [creating, setCreating] = useState(false);
    const [createSuccess, setCreateSuccess] = useState("");
    const [createError, setCreateError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await fetchAdminOverview();
            if (res.data.success) {
                setOverview(res.data);
            }
        } catch (err) {
            console.error("Failed to load admin overview:", err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate("/admin/login");
            } else {
                setError(err.response?.data?.message || "Failed to load dashboard data");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExecutive = async (e) => {
        e.preventDefault();
        setCreateError("");
        setCreateSuccess("");

        if (!execName.trim() || !execTeamCode.trim() || !execPassword) {
            setCreateError("Please fill out all fields");
            return;
        }

        try {
            setCreating(true);
            const res = await createExecutiveAccountApi({
                name: execName.trim(),
                teamCode: execTeamCode.trim().toUpperCase(),
                password: execPassword,
            });

            if (res.data.success) {
                setCreateSuccess(`Executive "${execName}" created successfully with Team Code ${execTeamCode.trim().toUpperCase()}!`);
                setExecName("");
                setExecTeamCode("");
                setExecPassword("");
                loadData();
                setTimeout(() => {
                    setShowCreateModal(false);
                    setCreateSuccess("");
                }, 1500);
            }
        } catch (err) {
            console.error("Create executive error:", err);
            setCreateError(err.response?.data?.message || "Failed to create executive account");
        } finally {
            setCreating(false);
        }
    };

    const exportToExcel = () => {
        if (!overview) return;

        const wb = XLSX.utils.book_new();

        // 1. Executive Summary Sheet
        const execData = (overview.executiveBreakdown || []).map((exec) => ({
            "Executive Name": exec.name,
            "Team Code": exec.teamCode,
            "Mediators Assigned": exec.mediatorCount,
            "Total Orders": exec.totalOrders,
            "Total Units": exec.totalUnits,
            "Completed Units": exec.completedUnits,
            "Completion Rate": `${exec.completionRate}%`,
            "In-Progress Units": exec.inProgressUnits,
            "Pending Refund Units": exec.pendingRefundUnits,
            "Pending Verification Units": exec.pendingVerificationUnits,
            "Unassigned Units": exec.unassignedUnits,
        }));
        const wsExec = XLSX.utils.json_to_sheet(execData);
        XLSX.utils.book_append_sheet(wb, wsExec, "Executive Breakdown");

        // 2. Brand Summary Sheet
        const brandData = (overview.brandBreakdown || []).map((b) => ({
            "Brand Name": b.brandName,
            "Contact Person": b.userName,
            "Total Orders": b.totalOrders,
            "Total Units": b.totalUnits,
            "Completed Units": b.completedUnits,
            "Completion Rate": `${b.completionRate}%`,
            "In-Progress Units": b.inProgressUnits,
            "Pending Refund Units": b.pendingRefundUnits,
            "Pending Verification Units": b.pendingVerificationUnits,
            "Unassigned Units": b.unassignedUnits,
        }));
        const wsBrand = XLSX.utils.json_to_sheet(brandData);
        XLSX.utils.book_append_sheet(wb, wsBrand, "Brand Breakdown");

        XLSX.writeFile(wb, `Rankora_Master_Admin_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    const stats = overview?.globalStats || {};
    const filteredExecutives = (overview?.executiveBreakdown || []).filter((e) => {
        const q = searchQuery.toLowerCase().trim();
        return !q || e.name.toLowerCase().includes(q) || e.teamCode.toLowerCase().includes(q);
    });
    const filteredBrands = (overview?.brandBreakdown || []).filter((b) => {
        const q = searchQuery.toLowerCase().trim();
        return !q || b.brandName.toLowerCase().includes(q) || b.userName.toLowerCase().includes(q);
    });

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#0b0f19", color: "#f8fafc", fontFamily: "sans-serif" }}>
            {/* Top Navigation */}
            <header style={{
                backgroundColor: "#111827",
                borderBottom: "1px solid #1f2937",
                padding: "1rem 2rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "sticky",
                top: 0,
                zIndex: 40
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.25rem",
                        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)"
                    }}>
                        🛡️
                    </div>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "1.25rem", fontWeight: "800", letterSpacing: "-0.025em" }}>Rankora</span>
                            <span style={{
                                backgroundColor: "rgba(99, 102, 241, 0.2)",
                                color: "#818cf8",
                                fontSize: "0.75rem",
                                fontWeight: "700",
                                padding: "0.15rem 0.5rem",
                                borderRadius: "9999px",
                                border: "1px solid rgba(99, 102, 241, 0.4)"
                            }}>
                                ROOT ADMIN
                            </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>Enterprise Operations Control</p>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <button
                        onClick={exportToExcel}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            backgroundColor: "#065f46",
                            color: "#34d399",
                            border: "1px solid #059669",
                            padding: "0.5rem 1rem",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "0.875rem"
                        }}
                    >
                        <span>📊</span>
                        <span>Export Excel</span>
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                            color: "#ffffff",
                            border: "none",
                            padding: "0.5rem 1rem",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "0.875rem",
                            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)"
                        }}
                    >
                        <span>➕</span>
                        <span>Create Executive</span>
                    </button>
                    <Logout />
                </div>
            </header>

            {/* Main Content Area */}
            <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
                {error && (
                    <div style={{
                        padding: "1rem",
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid #ef4444",
                        borderRadius: "8px",
                        color: "#f87171",
                        marginBottom: "1.5rem"
                    }}>
                        {error}
                    </div>
                )}

                {/* Global Metrics Bar */}
                <section style={{ marginBottom: "2rem" }}>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#cbd5e1", marginBottom: "1rem" }}>
                        Global Operations Overview
                    </h2>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "1rem"
                    }}>
                        <div style={{ backgroundColor: "#1f2937", padding: "1.25rem", borderRadius: "12px", border: "1px solid #374151" }}>
                            <div style={{ color: "#9ca3af", fontSize: "0.8rem", fontWeight: "600" }}>TOTAL ORDERS</div>
                            <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#f3f4f6", marginTop: "0.3rem" }}>
                                {loading ? "..." : (stats.totalOrders || 0)}
                            </div>
                            <div style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: "0.2rem" }}>Master campaigns</div>
                        </div>

                        <div style={{ backgroundColor: "#1f2937", padding: "1.25rem", borderRadius: "12px", border: "1px solid #374151" }}>
                            <div style={{ color: "#9ca3af", fontSize: "0.8rem", fontWeight: "600" }}>TOTAL UNITS</div>
                            <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#60a5fa", marginTop: "0.3rem" }}>
                                {loading ? "..." : (stats.totalUnits || 0)}
                            </div>
                            <div style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: "0.2rem" }}>All individual items</div>
                        </div>

                        <div style={{ backgroundColor: "#1f2937", padding: "1.25rem", borderRadius: "12px", border: "1px solid #065f46" }}>
                            <div style={{ color: "#34d399", fontSize: "0.8rem", fontWeight: "600" }}>COMPLETED UNITS</div>
                            <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#10b981", marginTop: "0.3rem" }}>
                                {loading ? "..." : (stats.completedUnits || 0)}
                            </div>
                            <div style={{ color: "#059669", fontSize: "0.75rem", marginTop: "0.2rem" }}>
                                {stats.totalUnits > 0 ? Math.round(((stats.completedUnits || 0) / stats.totalUnits) * 100) : 0}% success rate
                            </div>
                        </div>

                        <div style={{ backgroundColor: "#1f2937", padding: "1.25rem", borderRadius: "12px", border: "1px solid #374151" }}>
                            <div style={{ color: "#fbbf24", fontSize: "0.8rem", fontWeight: "600" }}>IN PROGRESS</div>
                            <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#f59e0b", marginTop: "0.3rem" }}>
                                {loading ? "..." : (stats.inProgressUnits || 0)}
                            </div>
                            <div style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: "0.2rem" }}>Being fulfilled</div>
                        </div>

                        <div style={{ backgroundColor: "#1f2937", padding: "1.25rem", borderRadius: "12px", border: "1px solid #374151" }}>
                            <div style={{ color: "#f472b6", fontSize: "0.8rem", fontWeight: "600" }}>PENDING REFUND</div>
                            <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#ec4899", marginTop: "0.3rem" }}>
                                {loading ? "..." : (stats.pendingRefundUnits || 0)}
                            </div>
                            <div style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: "0.2rem" }}>Awaiting submission</div>
                        </div>

                        <div style={{ backgroundColor: "#1f2937", padding: "1.25rem", borderRadius: "12px", border: "1px solid #374151" }}>
                            <div style={{ color: "#9ca3af", fontSize: "0.8rem", fontWeight: "600" }}>UNASSIGNED</div>
                            <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#9ca3af", marginTop: "0.3rem" }}>
                                {loading ? "..." : (stats.unassignedUnits || 0)}
                            </div>
                            <div style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: "0.2rem" }}>Pool available</div>
                        </div>

                        <div style={{ backgroundColor: "#1f2937", padding: "1.25rem", borderRadius: "12px", border: "1px solid #374151" }}>
                            <div style={{ color: "#c084fc", fontSize: "0.8rem", fontWeight: "600" }}>EXECUTIVES</div>
                            <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#a855f7", marginTop: "0.3rem" }}>
                                {loading ? "..." : (stats.totalExecutives || 0)}
                            </div>
                            <div style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: "0.2rem" }}>Active accounts</div>
                        </div>
                    </div>
                </section>

                {/* Section Controls & Tabs */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #374151",
                    paddingBottom: "1rem",
                    marginBottom: "1.5rem",
                    flexWrap: "wrap",
                    gap: "1rem"
                }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                            onClick={() => setActiveTab("executives")}
                            style={{
                                padding: "0.6rem 1.25rem",
                                borderRadius: "8px",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                                backgroundColor: activeTab === "executives" ? "#4f46e5" : "#1f2937",
                                color: activeTab === "executives" ? "#ffffff" : "#9ca3af",
                                transition: "all 0.2s ease"
                            }}
                        >
                            👔 Executive-Wise Breakdown ({overview?.executiveBreakdown?.length || 0})
                        </button>
                        <button
                            onClick={() => setActiveTab("brands")}
                            style={{
                                padding: "0.6rem 1.25rem",
                                borderRadius: "8px",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                                backgroundColor: activeTab === "brands" ? "#4f46e5" : "#1f2937",
                                color: activeTab === "brands" ? "#ffffff" : "#9ca3af",
                                transition: "all 0.2s ease"
                            }}
                        >
                            🏢 Brand-Wise Breakdown ({overview?.brandBreakdown?.length || 0})
                        </button>
                    </div>

                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            padding: "0.6rem 1rem",
                            borderRadius: "8px",
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            color: "#f3f4f6",
                            fontSize: "0.875rem",
                            minWidth: "260px"
                        }}
                    />
                </div>

                {/* Tab 1: Executive Breakdown Table */}
                {activeTab === "executives" && (
                    <div style={{ backgroundColor: "#111827", borderRadius: "12px", border: "1px solid #1f2937", overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#1f2937", color: "#9ca3af", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                                    <th style={{ padding: "1rem" }}>Executive & Team</th>
                                    <th style={{ padding: "1rem" }}>Mediators</th>
                                    <th style={{ padding: "1rem" }}>Total Orders</th>
                                    <th style={{ padding: "1rem" }}>Total Units</th>
                                    <th style={{ padding: "1rem" }}>Completed</th>
                                    <th style={{ padding: "1rem" }}>Completion %</th>
                                    <th style={{ padding: "1rem" }}>In Progress</th>
                                    <th style={{ padding: "1rem" }}>Pending Refund</th>
                                    <th style={{ padding: "1rem" }}>Unassigned</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExecutives.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                                            No executives found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredExecutives.map((exec) => (
                                        <tr key={exec.id} style={{ borderBottom: "1px solid #1f2937" }}>
                                            <td style={{ padding: "1rem" }}>
                                                <div style={{ fontWeight: "700", color: "#f3f4f6" }}>{exec.name}</div>
                                                <div style={{ fontSize: "0.75rem", color: "#818cf8" }}>Team: {exec.teamCode}</div>
                                            </td>
                                            <td style={{ padding: "1rem" }}>
                                                <span style={{ backgroundColor: "#374151", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.75rem" }}>
                                                    {exec.mediatorCount} mediators
                                                </span>
                                            </td>
                                            <td style={{ padding: "1rem", fontWeight: "600" }}>{exec.totalOrders}</td>
                                            <td style={{ padding: "1rem", fontWeight: "600", color: "#60a5fa" }}>{exec.totalUnits}</td>
                                            <td style={{ padding: "1rem", fontWeight: "600", color: "#10b981" }}>{exec.completedUnits}</td>
                                            <td style={{ padding: "1rem" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    <div style={{ flex: 1, backgroundColor: "#374151", height: "6px", borderRadius: "3px", overflow: "hidden", minWidth: "60px" }}>
                                                        <div style={{ width: `${exec.completionRate}%`, backgroundColor: "#10b981", height: "100%" }}></div>
                                                    </div>
                                                    <span style={{ fontSize: "0.75rem", fontWeight: "700" }}>{exec.completionRate}%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "1rem", color: "#f59e0b" }}>{exec.inProgressUnits}</td>
                                            <td style={{ padding: "1rem", color: "#ec4899" }}>{exec.pendingRefundUnits}</td>
                                            <td style={{ padding: "1rem", color: "#9ca3af" }}>{exec.unassignedUnits}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Tab 2: Brand Breakdown Table */}
                {activeTab === "brands" && (
                    <div style={{ backgroundColor: "#111827", borderRadius: "12px", border: "1px solid #1f2937", overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#1f2937", color: "#9ca3af", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                                    <th style={{ padding: "1rem" }}>Brand</th>
                                    <th style={{ padding: "1rem" }}>Contact</th>
                                    <th style={{ padding: "1rem" }}>Total Orders</th>
                                    <th style={{ padding: "1rem" }}>Total Units</th>
                                    <th style={{ padding: "1rem" }}>Completed</th>
                                    <th style={{ padding: "1rem" }}>Completion %</th>
                                    <th style={{ padding: "1rem" }}>In Progress</th>
                                    <th style={{ padding: "1rem" }}>Pending Refund</th>
                                    <th style={{ padding: "1rem" }}>Unassigned</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBrands.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                                            No brands found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBrands.map((b, idx) => (
                                        <tr key={b.brandId || idx} style={{ borderBottom: "1px solid #1f2937" }}>
                                            <td style={{ padding: "1rem", fontWeight: "700", color: "#f3f4f6" }}>
                                                🏢 {b.brandName}
                                            </td>
                                            <td style={{ padding: "1rem", color: "#9ca3af" }}>{b.userName || "—"}</td>
                                            <td style={{ padding: "1rem", fontWeight: "600" }}>{b.totalOrders}</td>
                                            <td style={{ padding: "1rem", fontWeight: "600", color: "#60a5fa" }}>{b.totalUnits}</td>
                                            <td style={{ padding: "1rem", fontWeight: "600", color: "#10b981" }}>{b.completedUnits}</td>
                                            <td style={{ padding: "1rem" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    <div style={{ flex: 1, backgroundColor: "#374151", height: "6px", borderRadius: "3px", overflow: "hidden", minWidth: "60px" }}>
                                                        <div style={{ width: `${b.completionRate}%`, backgroundColor: "#10b981", height: "100%" }}></div>
                                                    </div>
                                                    <span style={{ fontSize: "0.75rem", fontWeight: "700" }}>{b.completionRate}%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "1rem", color: "#f59e0b" }}>{b.inProgressUnits}</td>
                                            <td style={{ padding: "1rem", color: "#ec4899" }}>{b.pendingRefundUnits}</td>
                                            <td style={{ padding: "1rem", color: "#9ca3af" }}>{b.unassignedUnits}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Modal: Create Executive Account */}
            {showCreateModal && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.75)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 50,
                    padding: "1rem"
                }}>
                    <div style={{
                        backgroundColor: "#111827",
                        border: "1px solid #374151",
                        borderRadius: "16px",
                        maxWidth: "480px",
                        width: "100%",
                        padding: "2rem",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                            <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700" }}>➕ Create Executive Account</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "1.5rem", cursor: "pointer" }}
                            >
                                ✕
                            </button>
                        </div>

                        {createError && (
                            <div style={{
                                padding: "0.75rem",
                                backgroundColor: "rgba(239, 68, 68, 0.15)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                borderRadius: "8px",
                                color: "#f87171",
                                fontSize: "0.85rem",
                                marginBottom: "1rem"
                            }}>
                                ⚠️ {createError}
                            </div>
                        )}

                        {createSuccess && (
                            <div style={{
                                padding: "0.75rem",
                                backgroundColor: "rgba(16, 185, 129, 0.15)",
                                border: "1px solid rgba(16, 185, 129, 0.3)",
                                borderRadius: "8px",
                                color: "#34d399",
                                fontSize: "0.85rem",
                                marginBottom: "1rem"
                            }}>
                                ✓ {createSuccess}
                            </div>
                        )}

                        <form onSubmit={handleCreateExecutive}>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.4rem" }}>
                                    Executive Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. John Doe"
                                    value={execName}
                                    onChange={(e) => setExecName(e.target.value)}
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        borderRadius: "8px",
                                        backgroundColor: "#1f2937",
                                        border: "1px solid #374151",
                                        color: "#ffffff",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.4rem" }}>
                                    Unique Team Code
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. ALPHA_TEAM"
                                    value={execTeamCode}
                                    onChange={(e) => setExecTeamCode(e.target.value)}
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        borderRadius: "8px",
                                        backgroundColor: "#1f2937",
                                        border: "1px solid #374151",
                                        color: "#ffffff",
                                        textTransform: "uppercase",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "1.5rem" }}>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.4rem" }}>
                                    Account Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter secure password"
                                    value={execPassword}
                                    onChange={(e) => setExecPassword(e.target.value)}
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        borderRadius: "8px",
                                        backgroundColor: "#1f2937",
                                        border: "1px solid #374151",
                                        color: "#ffffff",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    style={{
                                        padding: "0.75rem 1.25rem",
                                        borderRadius: "8px",
                                        backgroundColor: "#374151",
                                        color: "#ffffff",
                                        border: "none",
                                        cursor: "pointer",
                                        fontWeight: "600"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    style={{
                                        padding: "0.75rem 1.5rem",
                                        borderRadius: "8px",
                                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                                        color: "#ffffff",
                                        border: "none",
                                        cursor: "pointer",
                                        fontWeight: "600",
                                        opacity: creating ? 0.7 : 1
                                    }}
                                >
                                    {creating ? "Creating..." : "Create Account"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
