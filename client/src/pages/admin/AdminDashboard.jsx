import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
    fetchAdminOverview,
    createExecutiveAccountApi,
    deleteExecutiveApi,
    deleteBrandApi,
    impersonateUserApi,
    fetchExecutiveMediatorsApi
} from "../../services/admin";
import "../../styles/theme.css";

export default function AdminDashboard() {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("executives"); // "executives" | "brands"
    const [searchQuery, setSearchQuery] = useState("");

    // Current logged in admin identification
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const isSuperAdmin = Boolean(
        currentUser.isSuperAdmin ||
        currentUser.name === "AdminShubhamsecreate" ||
        currentUser.username === "AdminShubhamsecreate"
    );

    // Modal state for Executive Creation
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [execName, setExecName] = useState("");
    const [execTeamCode, setExecTeamCode] = useState("");
    const [execPassword, setExecPassword] = useState("");
    const [creating, setCreating] = useState(false);
    const [createSuccess, setCreateSuccess] = useState("");
    const [createError, setCreateError] = useState("");

    // Modal state for Cascading Deletion
    const [deleteModal, setDeleteModal] = useState(null); // { type: 'executive' | 'brand', id: string, name: string, code?: string }
    const [deleting, setDeleting] = useState(false);
    const [actionNotification, setActionNotification] = useState(null); // { type: 'success' | 'error', message: string }

    // Modal state for Executive's Mediators Inspection & Direct Login
    const [mediatorsModal, setMediatorsModal] = useState(null); // { execName, teamCode, mediators: [], loading: boolean }
    const [impersonatingId, setImpersonatingId] = useState(null);

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

        const trimmedCode = execTeamCode.trim();

        try {
            setCreating(true);
            const res = await createExecutiveAccountApi({
                name: execName.trim(),
                teamCode: trimmedCode,
                password: execPassword,
            });

            if (res.data.success) {
                setCreateSuccess(`Executive "${execName.trim()}" created successfully with Team Code "${trimmedCode}"!`);
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

    const handleDeleteExecutive = (exec) => {
        setDeleteModal({
            type: "executive",
            id: exec.id,
            name: exec.name,
            code: exec.teamCode,
            ordersCount: exec.totalOrders,
            unitsCount: exec.totalUnits,
            mediatorsCount: exec.mediatorCount
        });
    };

    const handleDeleteBrand = (b) => {
        setDeleteModal({
            type: "brand",
            id: b.id || b.brandName,
            name: b.brandName,
            ordersCount: b.totalOrders,
            unitsCount: b.totalUnits
        });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModal) return;
        setDeleting(true);
        setActionNotification(null);
        try {
            if (deleteModal.type === "executive") {
                const res = await deleteExecutiveApi(deleteModal.id);
                setActionNotification({
                    type: "success",
                    message: res.data?.message || `Executive "${deleteModal.name}" and all related data were deleted completely.`
                });
            } else if (deleteModal.type === "brand") {
                const res = await deleteBrandApi(deleteModal.id, deleteModal.name);
                setActionNotification({
                    type: "success",
                    message: res.data?.message || `Brand "${deleteModal.name}" and all associated orders were deleted completely.`
                });
            }
            setDeleteModal(null);
            await loadData();
        } catch (err) {
            console.error("Deletion failed:", err);
            setActionNotification({
                type: "error",
                message: err.response?.data?.message || "Failed to delete account and related records"
            });
        } finally {
            setDeleting(false);
        }
    };

    // Direct Login / Impersonate Executive, Mediator, or Brand
    const handleImpersonateUser = async (userId, targetName, targetRole) => {
        const confirmMsg = `Switch session directly to ${targetRole} "${targetName}"?\n\nYou will access their live dashboard and operational details. A sticky super-admin return bar will remain active at the top so you can return anytime.`;
        if (!window.confirm(confirmMsg)) return;

        try {
            setImpersonatingId(userId);
            const res = await impersonateUserApi(userId);
            if (res.data.success) {
                const currentToken = localStorage.getItem("token");
                const currentStoredUser = localStorage.getItem("user");
                localStorage.setItem("adminBackupSession", JSON.stringify({
                    token: currentToken,
                    user: JSON.parse(currentStoredUser || "{}"),
                    returnPath: "/admin/dashboard",
                }));

                localStorage.setItem("token", res.data.token);
                localStorage.setItem("user", JSON.stringify(res.data.user));

                if (res.data.user.role === "executive") {
                    navigate("/dashboard-executive");
                } else if (res.data.user.role === "mediator") {
                    navigate("/mediator-neworders");
                } else if (res.data.user.role === "brand") {
                    navigate("/brand-dashboard");
                } else {
                    navigate("/");
                }
            }
        } catch (err) {
            console.error("Failed to impersonate user:", err);
            alert(err.response?.data?.message || "Failed to switch into target user account");
        } finally {
            setImpersonatingId(null);
        }
    };

    // Fetch and open mediators list for an executive
    const handleOpenMediatorsModal = async (exec) => {
        setMediatorsModal({
            execName: exec.name,
            teamCode: exec.teamCode,
            mediators: [],
            loading: true,
        });

        try {
            const res = await fetchExecutiveMediatorsApi(exec.teamCode);
            if (res.data.success) {
                setMediatorsModal({
                    execName: exec.name,
                    teamCode: exec.teamCode,
                    mediators: res.data.mediators || [],
                    loading: false,
                });
            }
        } catch (err) {
            console.error("Failed to fetch executive mediators:", err);
            setMediatorsModal((prev) => ({
                ...prev,
                loading: false,
                error: "Could not load mediators for this executive.",
            }));
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
        return !q || b.brandName.toLowerCase().includes(q) || (b.userName && b.userName.toLowerCase().includes(q));
    });

    return (
        <div style={{ padding: "24px 28px 60px", maxWidth: "1440px", margin: "0 auto", boxSizing: "border-box" }}>
            {/* Header Hero Card */}
            <div className="saas-card" style={{ padding: "24px 28px", marginBottom: "24px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <span className="saas-badge" style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}>
                                🛡️ Root Control Console
                            </span>
                            <span style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: "500" }}>
                                Global Operations & Executive Authority
                            </span>
                        </div>
                        <h1 style={{ fontSize: "26px", fontWeight: "800", color: "var(--slate-900)", margin: 0 }}>
                            System Administration Center
                        </h1>
                        <p style={{ color: "var(--slate-500)", fontSize: "13.5px", marginTop: "4px", marginBottom: 0 }}>
                            Create executive team leaders, monitor cross-organization order volumes, and audit fulfillment
                        </p>

                        {isSuperAdmin && (
                            <div style={{
                                marginTop: "12px",
                                background: "linear-gradient(90deg, #fdf4ff 0%, #faf5ff 100%)",
                                border: "1px solid #f0abfc",
                                padding: "8px 14px",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                fontSize: "12.5px"
                            }}>
                                <span style={{ fontSize: "16px" }}>👑</span>
                                <div>
                                    <span style={{ color: "#86198f", fontWeight: "800" }}>Super Admin Mode:</span>
                                    <span style={{ color: "#6b21a8", marginLeft: "6px" }}>
                                        Direct Executive &amp; Mediator login access enabled. Executives created in this session are isolated and hidden from other admin accounts.
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <button
                            type="button"
                            onClick={exportToExcel}
                            className="saas-btn saas-btn-emerald"
                            disabled={!overview}
                        >
                            <span>📊</span>
                            <span>Export Master Excel</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className="saas-btn"
                            style={{
                                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                                color: "#ffffff",
                                boxShadow: "0 2px 8px rgba(124, 58, 237, 0.35)"
                            }}
                        >
                            <span>➕</span>
                            <span>Create Executive</span>
                        </button>
                    </div>
                </div>
            </div>

            {actionNotification && (
                <div style={{
                    padding: "12px 18px",
                    backgroundColor: actionNotification.type === "success" ? "#ecfdf5" : "#fef2f2",
                    border: `1px solid ${actionNotification.type === "success" ? "#a7f3d0" : "#fecaca"}`,
                    borderRadius: "10px",
                    color: actionNotification.type === "success" ? "#059669" : "#dc2626",
                    fontSize: "13.5px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "16px" }}>{actionNotification.type === "success" ? "✓" : "⚠️"}</span>
                        <span style={{ fontWeight: "600" }}>{actionNotification.message}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setActionNotification(null)}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "inherit",
                            fontWeight: "800",
                            fontSize: "16px",
                            padding: "0 4px"
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}

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

            {/* Global Operations Overview KPIs */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "14px",
                marginBottom: "24px"
            }}>
                <div className="saas-card" style={{ padding: "18px 20px" }}>
                    <div style={{ color: "var(--slate-500)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>GLOBAL ORDERS</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--slate-900)", marginTop: "4px" }}>
                        {loading ? "..." : (stats.totalOrders || 0)}
                    </div>
                </div>

                <div className="saas-card" style={{ padding: "18px 20px" }}>
                    <div style={{ color: "var(--slate-500)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>TOTAL UNITS</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--primary-600)", marginTop: "4px" }}>
                        {loading ? "..." : (stats.totalUnits || 0)}
                    </div>
                </div>

                <div className="saas-card" style={{ padding: "18px 20px", borderLeft: "4px solid #059669" }}>
                    <div style={{ color: "#059669", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>COMPLETED UNITS</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#059669", marginTop: "4px" }}>
                        {loading ? "..." : (stats.completedUnits || 0)}
                    </div>
                    <div style={{ color: "var(--slate-500)", fontSize: "12px", marginTop: "2px", fontWeight: "600" }}>
                        {stats.completionRate || 0}% overall rate
                    </div>
                </div>

                <div className="saas-card" style={{ padding: "18px 20px", borderLeft: "4px solid #d97706" }}>
                    <div style={{ color: "#d97706", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>IN PROGRESS</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#d97706", marginTop: "4px" }}>
                        {loading ? "..." : (stats.inProgressUnits || 0)}
                    </div>
                </div>

                <div className="saas-card" style={{ padding: "18px 20px" }}>
                    <div style={{ color: "#7c3aed", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>EXECUTIVES</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#7c3aed", marginTop: "4px" }}>
                        {loading ? "..." : (stats.totalExecutives || 0)}
                    </div>
                </div>

                <div className="saas-card" style={{ padding: "18px 20px" }}>
                    <div style={{ color: "var(--slate-500)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>CLIENT BRANDS</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--slate-700)", marginTop: "4px" }}>
                        {loading ? "..." : (stats.totalBrands || 0)}
                    </div>
                </div>
            </div>

            {/* Tab Navigation & Search Bar */}
            <div className="saas-card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            type="button"
                            onClick={() => setActiveTab("executives")}
                            className="saas-btn"
                            style={{
                                background: activeTab === "executives" ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" : "var(--slate-100)",
                                color: activeTab === "executives" ? "#ffffff" : "var(--slate-700)",
                                border: activeTab === "executives" ? "none" : "1px solid var(--slate-200)",
                                fontWeight: "700",
                                fontSize: "13.5px"
                            }}
                        >
                            <span>👔</span>
                            <span>Executive Teams ({(overview?.executiveBreakdown || []).length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("brands")}
                            className="saas-btn"
                            style={{
                                background: activeTab === "brands" ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" : "var(--slate-100)",
                                color: activeTab === "brands" ? "#ffffff" : "var(--slate-700)",
                                border: activeTab === "brands" ? "none" : "1px solid var(--slate-200)",
                                fontWeight: "700",
                                fontSize: "13.5px"
                            }}
                        >
                            <span>🏷️</span>
                            <span>Brand Portals ({(overview?.brandBreakdown || []).length})</span>
                        </button>
                    </div>

                    <div style={{ position: "relative", minWidth: "260px" }}>
                        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--slate-400)" }}>🔍</span>
                        <input
                            type="text"
                            placeholder={activeTab === "executives" ? "Search executive or team code..." : "Search brand name..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="saas-input"
                            style={{ paddingLeft: "36px" }}
                        />
                    </div>
                </div>
            </div>

            {/* TAB CONTENT: EXECUTIVES */}
            {activeTab === "executives" && (
                <div className="saas-card" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--slate-900)", margin: 0 }}>
                            Executive Operations Directory ({filteredExecutives.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--slate-500)" }}>Loading executive teams...</div>
                    ) : filteredExecutives.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--slate-500)" }}>No executives found matching query.</div>
                    ) : (
                        <div className="table-scroll-touch">
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                    <tr style={{ borderBottom: "2px solid var(--slate-200)", textAlign: "left" }}>
                                        <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Executive</th>
                                        <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Team Code</th>
                                        <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Mediators</th>
                                        <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Orders</th>
                                        <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Total Units</th>
                                        <th style={{ padding: "10px 12px", color: "#059669", fontWeight: "700" }}>Completed</th>
                                        <th style={{ padding: "10px 12px", color: "#d97706", fontWeight: "700" }}>In Progress</th>
                                        <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Completion %</th>
                                        <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Created</th>
                                        <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700", textAlign: "center" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExecutives.map((exec) => (
                                        <tr key={exec.id} style={{ borderBottom: "1px solid var(--slate-100)" }}>
                                            <td style={{ padding: "12px", fontWeight: "700", color: "var(--slate-900)" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                                    <span>{exec.name}</span>
                                                    {exec.isSecret && (
                                                        <span
                                                            className="saas-badge"
                                                            style={{
                                                                background: "#fdf4ff",
                                                                color: "#86198f",
                                                                border: "1px solid #f0abfc",
                                                                fontSize: "11px",
                                                                fontWeight: "700",
                                                                textTransform: "none",
                                                                padding: "2px 6px"
                                                            }}
                                                            title="Isolated: Only visible to Super Admin"
                                                        >
                                                            🔒 Private
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px" }}>
                                                <span
                                                    className="saas-badge"
                                                    style={{
                                                        background: "#f5f3ff",
                                                        color: "#7c3aed",
                                                        border: "1px solid #ddd6fe",
                                                        textTransform: "none",
                                                        letterSpacing: "normal",
                                                        fontFamily: "monospace",
                                                        fontWeight: "700",
                                                        fontSize: "12px"
                                                    }}
                                                >
                                                    {exec.teamCode}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px", color: "var(--slate-700)" }}>{exec.mediatorCount} Mediators</td>
                                            <td style={{ padding: "12px", color: "var(--slate-700)" }}>{exec.totalOrders}</td>
                                            <td style={{ padding: "12px", fontWeight: "700", color: "var(--primary-600)" }}>{exec.totalUnits}</td>
                                            <td style={{ padding: "12px", fontWeight: "700", color: "#059669" }}>{exec.completedUnits}</td>
                                            <td style={{ padding: "12px", fontWeight: "700", color: "#d97706" }}>{exec.inProgressUnits}</td>
                                            <td style={{ padding: "12px" }}>
                                                <span className="saas-badge" style={{
                                                    background: exec.completionRate >= 80 ? "#ecfdf5" : exec.completionRate >= 40 ? "#fffbeb" : "#eff6ff",
                                                    color: exec.completionRate >= 80 ? "#059669" : exec.completionRate >= 40 ? "#b45309" : "#2563eb",
                                                    border: `1px solid ${exec.completionRate >= 80 ? "#a7f3d0" : exec.completionRate >= 40 ? "#fde68a" : "#bfdbfe"}`
                                                }}>
                                                    {exec.completionRate}%
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px", color: "var(--slate-500)", fontSize: "12px" }}>
                                                {new Date(exec.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: "12px", textAlign: "center" }}>
                                                <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
                                                    {isSuperAdmin && (
                                                        <>
                                                            {/* Direct Login as Executive (Super Admin Only) */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleImpersonateUser(exec.id, exec.name, "executive")}
                                                                disabled={impersonatingId === exec.id}
                                                                className="saas-btn"
                                                                style={{
                                                                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                                                                    color: "#ffffff",
                                                                    padding: "5px 10px",
                                                                    fontSize: "12px",
                                                                    borderRadius: "6px",
                                                                    cursor: "pointer",
                                                                    fontWeight: "700",
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "4px",
                                                                    boxShadow: "0 1px 3px rgba(79, 70, 229, 0.3)"
                                                                }}
                                                                title={`Directly login as executive "${exec.name}"`}
                                                            >
                                                                <span>⚡</span>
                                                                <span>{impersonatingId === exec.id ? "Connecting..." : "Login as Exec"}</span>
                                                            </button>

                                                            {/* View / Login as Mediators (Super Admin Only) */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenMediatorsModal(exec)}
                                                                className="saas-btn"
                                                                style={{
                                                                    background: "#eff6ff",
                                                                    color: "#2563eb",
                                                                    border: "1px solid #bfdbfe",
                                                                    padding: "5px 10px",
                                                                    fontSize: "12px",
                                                                    borderRadius: "6px",
                                                                    cursor: "pointer",
                                                                    fontWeight: "600",
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "4px"
                                                                }}
                                                                title={`Inspect and directly login as mediators under "${exec.name}"`}
                                                            >
                                                                <span>👥</span>
                                                                <span>Mediators ({exec.mediatorCount})</span>
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Delete Executive */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteExecutive(exec)}
                                                        className="saas-btn"
                                                        style={{
                                                            background: "#fef2f2",
                                                            color: "#dc2626",
                                                            border: "1px solid #fecaca",
                                                            padding: "5px 10px",
                                                            fontSize: "12px",
                                                            borderRadius: "6px",
                                                            cursor: "pointer",
                                                            fontWeight: "600",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "4px"
                                                        }}
                                                        title={`Delete Executive "${exec.name}" and all related data completely`}
                                                    >
                                                        <span>🗑️</span>
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: BRANDS */}
            {activeTab === "brands" && (
                <div className="saas-card" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--slate-900)", margin: 0 }}>
                            Global Brand Operations ({filteredBrands.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--slate-500)" }}>Loading brand portfolios...</div>
                    ) : filteredBrands.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--slate-500)" }}>No brands found matching query.</div>
                    ) : (
                        <div className="table-scroll-touch">
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                    <tr style={{ borderBottom: "2px solid var(--slate-200)", textAlign: "left" }}>
                                        <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Brand</th>
                                        <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Contact</th>
                                        <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Orders</th>
                                        <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Total Units</th>
                                        <th style={{ padding: "10px 12px", color: "#059669", fontWeight: "700" }}>Completed</th>
                                        <th style={{ padding: "10px 12px", color: "#d97706", fontWeight: "700" }}>In Progress</th>
                                        <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Total Volume</th>
                                        <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700" }}>Completion %</th>
                                        <th style={{ padding: "10px 12px", color: "var(--slate-600)", fontWeight: "700", textAlign: "center" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBrands.map((b, idx) => (
                                        <tr key={idx} style={{ borderBottom: "1px solid var(--slate-100)" }}>
                                            <td style={{ padding: "12px", fontWeight: "700", color: "var(--slate-900)" }}>
                                                {b.brandName}
                                            </td>
                                            <td style={{ padding: "12px", color: "var(--slate-500)" }}>{b.userName || "—"}</td>
                                            <td style={{ padding: "12px", color: "var(--slate-700)" }}>{b.totalOrders}</td>
                                            <td style={{ padding: "12px", fontWeight: "700", color: "var(--primary-600)" }}>{b.totalUnits}</td>
                                            <td style={{ padding: "12px", fontWeight: "700", color: "#059669" }}>{b.completedUnits}</td>
                                            <td style={{ padding: "12px", fontWeight: "700", color: "#d97706" }}>{b.inProgressUnits}</td>
                                            <td style={{ padding: "12px", fontWeight: "700", color: "var(--slate-800)" }}>
                                                ₹{(b.totalValue || 0).toLocaleString()}
                                            </td>
                                            <td style={{ padding: "12px" }}>
                                                <span className="saas-badge" style={{
                                                    background: b.completionRate >= 80 ? "#ecfdf5" : b.completionRate >= 40 ? "#fffbeb" : "#eff6ff",
                                                    color: b.completionRate >= 80 ? "#059669" : b.completionRate >= 40 ? "#b45309" : "#2563eb",
                                                    border: `1px solid ${b.completionRate >= 80 ? "#a7f3d0" : b.completionRate >= 40 ? "#fde68a" : "#bfdbfe"}`
                                                }}>
                                                    {b.completionRate}%
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px", textAlign: "center" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteBrand(b)}
                                                    className="saas-btn"
                                                    style={{
                                                        background: "#fef2f2",
                                                        color: "#dc2626",
                                                        border: "1px solid #fecaca",
                                                        padding: "5px 12px",
                                                        fontSize: "12px",
                                                        borderRadius: "6px",
                                                        cursor: "pointer",
                                                        fontWeight: "600",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "4px"
                                                    }}
                                                    title={`Delete Brand "${b.brandName}" and all related orders completely`}
                                                >
                                                    <span>🗑️</span>
                                                    <span>Delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* CREATE EXECUTIVE MODAL */}
            {showCreateModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.65)",
                        backdropFilter: "blur(6px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "16px"
                    }}
                    onClick={() => setShowCreateModal(false)}
                >
                    <div
                        className="saas-card"
                        style={{
                            maxWidth: "460px",
                            width: "100%",
                            padding: "26px",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "20px" }}>👔</span>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--slate-900)" }}>
                                    Create Executive Account
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--slate-400)" }}
                            >
                                ✕
                            </button>
                        </div>

                        <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: 0, marginBottom: "16px" }}>
                            Set up a new operational Executive with a unique Team Code to manage mediators and orders.
                        </p>

                        {isSuperAdmin && (
                            <div style={{
                                padding: "10px 14px",
                                backgroundColor: "#fdf4ff",
                                border: "1px solid #f0abfc",
                                borderRadius: "8px",
                                color: "#86198f",
                                fontSize: "12px",
                                marginBottom: "14px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}>
                                <span>🔒</span>
                                <span>
                                    <strong>Private Executive Isolation:</strong> This executive and their mediators/orders will be completely hidden from regular admin accounts.
                                </span>
                            </div>
                        )}

                        {createError && (
                            <div style={{ padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px", marginBottom: "14px" }}>
                                ⚠️ {createError}
                            </div>
                        )}

                        {createSuccess && (
                            <div style={{ padding: "10px 14px", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", color: "#059669", fontSize: "13px", marginBottom: "14px" }}>
                                ✓ {createSuccess}
                            </div>
                        )}

                        <form onSubmit={handleCreateExecutive} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "var(--slate-700)", marginBottom: "4px", textTransform: "uppercase" }}>
                                    Executive Full Name *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. John Executive"
                                    value={execName}
                                    onChange={(e) => setExecName(e.target.value)}
                                    required
                                    className="saas-input"
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "var(--slate-700)", marginBottom: "4px", textTransform: "uppercase" }}>
                                    Team Code (Unique) *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. exec_north or ExeNorth1"
                                    value={execTeamCode}
                                    onChange={(e) => setExecTeamCode(e.target.value)}
                                    required
                                    className="saas-input"
                                />
                                <span style={{ fontSize: "11px", color: "var(--slate-500)", marginTop: "2px", display: "inline-block" }}>
                                    Exact casing is preserved. Used by mediators to connect to this executive.
                                </span>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "var(--slate-700)", marginBottom: "4px", textTransform: "uppercase" }}>
                                    Initial Password *
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={execPassword}
                                    onChange={(e) => setExecPassword(e.target.value)}
                                    required
                                    className="saas-input"
                                />
                            </div>

                            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="saas-btn saas-btn-outline"
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="saas-btn"
                                    style={{
                                        flex: 2,
                                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                                        color: "#ffffff"
                                    }}
                                >
                                    {creating ? "Creating Executive..." : "✓ Create Executive Account"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CONFIRM CASCADING PERMANENT DELETION MODAL */}
            {deleteModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.72)",
                        backdropFilter: "blur(6px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10000,
                        padding: "16px"
                    }}
                    onClick={() => !deleting && setDeleteModal(null)}
                >
                    <div
                        className="saas-card"
                        style={{
                            maxWidth: "520px",
                            width: "100%",
                            padding: "26px",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
                            border: "1px solid #fecaca"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                            <div style={{
                                width: "44px",
                                height: "44px",
                                borderRadius: "50%",
                                background: "#fee2e2",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "22px",
                                flexShrink: 0
                            }}>
                                🗑️
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#991b1b" }}>
                                    Confirm Permanent Deletion
                                </h3>
                                <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "var(--slate-500)" }}>
                                    Warning: All records and details will be deleted completely.
                                </p>
                            </div>
                        </div>

                        {deleteModal.type === "executive" ? (
                            <div style={{ fontSize: "13.5px", color: "var(--slate-700)", lineHeight: "1.6", marginBottom: "20px" }}>
                                <p style={{ margin: "0 0 12px" }}>
                                    Are you sure you want to completely delete Executive <strong>&quot;{deleteModal.name}&quot;</strong> with Team Code <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontWeight: "700", color: "#7c3aed" }}>{deleteModal.code}</code>?
                                </p>
                                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "14px", fontSize: "12.5px", color: "#b91c1c" }}>
                                    <strong>⚠️ This will delete ALL associated data completely:</strong>
                                    <ul style={{ margin: "8px 0 0", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <li>Executive user account &amp; credentials</li>
                                        <li>All master orders ({deleteModal.ordersCount || 0} orders, {deleteModal.unitsCount || 0} units) created under team code <code>{deleteModal.code}</code></li>
                                        <li>All shipping addresses saved for this executive</li>
                                        <li>All balance, recharge, &amp; escrow transactions involving this executive</li>
                                        <li>All ({deleteModal.mediatorsCount || 0}) mediator user accounts registered under team code <code>{deleteModal.code}</code></li>
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontSize: "13.5px", color: "var(--slate-700)", lineHeight: "1.6", marginBottom: "20px" }}>
                                <p style={{ margin: "0 0 12px" }}>
                                    Are you sure you want to completely delete Brand <strong>&quot;{deleteModal.name}&quot;</strong>?
                                </p>
                                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "14px", fontSize: "12.5px", color: "#b91c1c" }}>
                                    <strong>⚠️ This will delete ALL associated data completely:</strong>
                                    <ul style={{ margin: "8px 0 0", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <li>Brand user account &amp; login profile (if registered)</li>
                                        <li>All ({deleteModal.ordersCount || 0} orders, {deleteModal.unitsCount || 0} units) associated with <strong>{deleteModal.name}</strong></li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                onClick={() => setDeleteModal(null)}
                                disabled={deleting}
                                className="saas-btn saas-btn-outline"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                className="saas-btn"
                                style={{
                                    background: "#dc2626",
                                    color: "#ffffff",
                                    fontWeight: "700"
                                }}
                            >
                                {deleting ? "Deleting Everything..." : "🗑️ Yes, Delete Completely"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MEDIATORS INSPECTION & DIRECT LOGIN MODAL */}
            {mediatorsModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.65)",
                        backdropFilter: "blur(6px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10000,
                        padding: "16px"
                    }}
                    onClick={() => setMediatorsModal(null)}
                >
                    <div
                        className="saas-card"
                        style={{
                            maxWidth: "750px",
                            width: "100%",
                            maxHeight: "85vh",
                            display: "flex",
                            flexDirection: "column",
                            padding: "26px",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "22px" }}>👥</span>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--slate-900)" }}>
                                        Mediators for {mediatorsModal.execName}
                                    </h3>
                                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--slate-500)" }}>
                                        Team Code: <strong style={{ color: "#7c3aed" }}>{mediatorsModal.teamCode}</strong> • Direct login access for audit &amp; inspection
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMediatorsModal(null)}
                                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--slate-400)" }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ overflowY: "auto", flex: 1, margin: "10px 0 20px" }}>
                            {mediatorsModal.loading ? (
                                <div style={{ textAlign: "center", padding: "40px", color: "var(--slate-500)" }}>Loading mediators...</div>
                            ) : mediatorsModal.mediators.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px", color: "var(--slate-500)" }}>
                                    No mediators have registered under team code <strong>{mediatorsModal.teamCode}</strong> yet.
                                </div>
                            ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "2px solid var(--slate-200)", textAlign: "left" }}>
                                            <th style={{ padding: "8px 10px", color: "var(--slate-600)", fontWeight: "700" }}>Mediator</th>
                                            <th style={{ padding: "8px 10px", color: "var(--slate-600)", fontWeight: "700" }}>Code / Phone</th>
                                            <th style={{ padding: "8px 10px", color: "var(--slate-600)", fontWeight: "700" }}>Balance</th>
                                            <th style={{ padding: "8px 10px", color: "var(--slate-600)", fontWeight: "700" }}>Joined</th>
                                            <th style={{ padding: "8px 10px", color: "var(--slate-600)", fontWeight: "700", textAlign: "center" }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mediatorsModal.mediators.map((m) => (
                                            <tr key={m._id} style={{ borderBottom: "1px solid var(--slate-100)" }}>
                                                <td style={{ padding: "10px", fontWeight: "700", color: "var(--slate-900)" }}>
                                                    {m.name}
                                                </td>
                                                <td style={{ padding: "10px", color: "var(--slate-600)" }}>
                                                    <div>{m.mediatorCode || "—"}</div>
                                                    <div style={{ fontSize: "11px", color: "var(--slate-400)" }}>{m.phone || m.email || "—"}</div>
                                                </td>
                                                <td style={{ padding: "10px", fontWeight: "700", color: "#059669" }}>
                                                    ₹{(m.balance || 0).toLocaleString()}
                                                </td>
                                                <td style={{ padding: "10px", color: "var(--slate-500)", fontSize: "12px" }}>
                                                    {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—"}
                                                </td>
                                                <td style={{ padding: "10px", textAlign: "center" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleImpersonateUser(m._id, m.name, "mediator")}
                                                        disabled={impersonatingId === m._id}
                                                        className="saas-btn"
                                                        style={{
                                                            background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                                                            color: "#ffffff",
                                                            padding: "5px 12px",
                                                            fontSize: "12px",
                                                            borderRadius: "6px",
                                                            cursor: "pointer",
                                                            fontWeight: "700",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "4px",
                                                            boxShadow: "0 1px 3px rgba(5, 150, 105, 0.3)"
                                                        }}
                                                        title={`Directly login as mediator "${m.name}"`}
                                                    >
                                                        <span>⚡</span>
                                                        <span>{impersonatingId === m._id ? "Connecting..." : "Login as Mediator"}</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                onClick={() => setMediatorsModal(null)}
                                className="saas-btn saas-btn-outline"
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
