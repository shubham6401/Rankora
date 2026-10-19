import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EarningTable from "../../component/mediator/EarningTable";
import { fetchExecutiveMediatorEarnings } from "../../services/executive/order";
import ProofThumbnail from "../../component/common/ProofThumbnail";
import ProofPreviewModal from "../../component/common/ProofPreviewModal";
import "../../styles/ordersTable.css";

export default function ExecutiveMediatorEarnings() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [activeViewTab, setActiveViewTab] = useState("table"); // "table" | "list"
    const [selectedMediatorId, setSelectedMediatorId] = useState("all");
    const [mediatorSearch, setMediatorSearch] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("all"); // "all" | "pending_payout" | "has_balance"
    const [selectedProof, setSelectedProof] = useState(null);
    const [unitsModalMediator, setUnitsModalMediator] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await fetchExecutiveMediatorEarnings();
            if (res.data?.success) {
                setData(res.data);
                const meds = res.data.mediators || [];
                // If current selectedMediatorId is "all" and there are mediators, default to first mediator or keep "all"
                if (meds.length > 0 && selectedMediatorId === "all") {
                    setSelectedMediatorId(meds[0].mediator?._id?.toString() || "all");
                }
            }
        } catch (err) {
            console.error("Error loading executive mediator earnings:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="table-page-container">
                <div className="empty-state-card">
                    <div className="empty-state-icon">⏳</div>
                    <h2 className="empty-state-title">Loading Mediators Earnings & Balances...</h2>
                    <p className="empty-state-text">Aggregating mediator completed units, commissions, settled payouts, and remaining balances.</p>
                </div>
            </div>
        );
    }

    const teamSummary = data?.teamSummary || {
        totalMediators: 0,
        totalCompletedUnits: 0,
        totalSettledPayouts: 0,
        totalPendingPayouts: 0,
        totalNetRemainingBalance: 0,
        totalActiveCapital: 0,
    };

    const mediators = data?.mediators || [];

    // Calculate team aggregate financial stats for "All Mediators" option
    const teamAggregateStats = {
        completedUnits: mediators.reduce((acc, m) => acc + (m.financialStats?.completedUnits || 0), 0),
        inProgressUnits: mediators.reduce((acc, m) => acc + (m.financialStats?.inProgressUnits || 0), 0),
        pendingRefundUnits: mediators.reduce((acc, m) => acc + (m.financialStats?.pendingRefundUnits || 0), 0),
        pendingPaymentUnits: mediators.reduce((acc, m) => acc + (m.financialStats?.pendingPaymentUnits || 0), 0),
        totalAssignedUnits: mediators.reduce((acc, m) => acc + (m.financialStats?.totalAssignedUnits || 0), 0),
        totalOrderValue: mediators.reduce((acc, m) => acc + (m.financialStats?.totalOrderValue || 0), 0),
        completedValue: mediators.reduce((acc, m) => acc + (m.financialStats?.completedValue || 0), 0),
        inProgressValue: mediators.reduce((acc, m) => acc + (m.financialStats?.inProgressValue || 0), 0),
        pendingRefundValue: mediators.reduce((acc, m) => acc + (m.financialStats?.pendingRefundValue || 0), 0),
        rejectedValue: mediators.reduce((acc, m) => acc + (m.financialStats?.rejectedValue || 0), 0),
        balanceReceived: mediators.reduce((acc, m) => acc + (m.financialStats?.balanceReceived || 0), 0),
        balanceReturned: mediators.reduce((acc, m) => acc + (m.financialStats?.balanceReturned || 0), 0),
        netBalance: mediators.reduce((acc, m) => acc + (m.financialStats?.netBalance || 0), 0),
        settledPayout: mediators.reduce((acc, m) => acc + (m.financialStats?.settledPayout || 0), 0),
    };

    // Selected mediator item for Earning Table
    const selectedItem = mediators.find(
        (m) => m.mediator?._id?.toString() === selectedMediatorId
    );

    const activeFinancialData = selectedItem ? selectedItem.financialStats : teamAggregateStats;
    const activeTitle = selectedItem
        ? `Financial Breakdown: ${selectedItem.mediator?.name || "Mediator"} (${selectedItem.mediator?.mediatorCode || ""})`
        : "Team Overall Financial Breakdown (All Mediators Combined)";

    // Filter mediators for list view
    const filteredMediators = mediators.filter((item) => {
        const m = item.mediator || {};
        if (filterCategory === "pending_payout" && item.totalPendingPayout <= 0) return false;
        if (filterCategory === "has_balance" && item.netRemainingBalance === 0) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
            (m.name && m.name.toLowerCase().includes(q)) ||
            (m.mediatorCode && m.mediatorCode.toLowerCase().includes(q)) ||
            (m.teamCode && m.teamCode.toLowerCase().includes(q)) ||
            (m.phone && m.phone.toLowerCase().includes(q)) ||
            (m.email && m.email.toLowerCase().includes(q))
        );
    });

    // Quick filter pills search
    const pillFilteredMediators = mediators.filter((item) => {
        if (!mediatorSearch.trim()) return true;
        const q = mediatorSearch.toLowerCase().trim();
        const m = item.mediator || {};
        return (
            (m.name && m.name.toLowerCase().includes(q)) ||
            (m.mediatorCode && m.mediatorCode.toLowerCase().includes(q))
        );
    });

    const handleSelectMediatorForTable = (medId) => {
        setSelectedMediatorId(medId);
        setActiveViewTab("table");
        window.scrollTo({ top: 380, behavior: "smooth" });
    };

    return (
        <div className="table-page-container">
            {/* Header */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge">Executive Oversight</span>
                    <h1 className="table-page-title">📊 Mediators Financial Breakdown & Earnings</h1>
                    <p className="table-page-subtitle">
                        Inspect individual mediator earning tables, order form advances, refund form recoveries, settled payouts, and unspent balances.
                    </p>
                </div>
                <div className="table-header-actions">
                    <button
                        type="button"
                        onClick={() => navigate("/dashboard-executive")}
                        className="nav-btn nav-btn-default"
                    >
                        ← Executive Dashboard
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/executive-completed-order")}
                        className="nav-btn nav-btn-outline"
                    >
                        💰 Settle Payouts
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/executive-balance")}
                        className="nav-btn nav-btn-outline"
                    >
                        ⚖️ Settle Balance
                    </button>
                    <button
                        type="button"
                        onClick={loadData}
                        className="nav-btn nav-btn-primary"
                        style={{ backgroundColor: "#4f46e5", borderColor: "#4f46e5" }}
                    >
                        ↻ Refresh
                    </button>
                </div>
            </div>

            {/* Team Financial Overview Bar */}
            <div className="table-metrics-bar" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "20px" }}>
                <div className="metric-card" style={{ borderLeft: "4px solid #6366f1" }}>
                    <span className="metric-label">Team Mediators</span>
                    <span className="metric-value" style={{ color: "#4f46e5" }}>
                        {teamSummary.totalMediators}
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>
                        Active partners
                    </span>
                </div>

                <div className="metric-card" style={{ borderLeft: "4px solid #3b82f6" }}>
                    <span className="metric-label">Completed Units</span>
                    <span className="metric-value" style={{ color: "#2563eb" }}>
                        {teamSummary.totalCompletedUnits}
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>
                        Delivered & verified
                    </span>
                </div>

                <div className="metric-card" style={{ borderLeft: "4px solid #10b981" }}>
                    <span className="metric-label">Settled Payouts</span>
                    <span className="metric-value metric-value-green">
                        ₹{teamSummary.totalSettledPayouts.toLocaleString()}
                    </span>
                    <span style={{ fontSize: "11px", color: "#059669", fontWeight: 600, marginTop: "3px" }}>
                        ✓ Paid to mediators
                    </span>
                </div>

                <div className="metric-card" style={{ borderLeft: "4px solid #f59e0b" }}>
                    <span className="metric-label">Pending Payouts</span>
                    <span className="metric-value" style={{ color: "#d97706" }}>
                        ₹{teamSummary.totalPendingPayouts.toLocaleString()}
                    </span>
                    <span style={{ fontSize: "11px", color: "#b45309", marginTop: "3px" }}>
                        ⏳ Awaiting payout
                    </span>
                </div>

                <div className="metric-card" style={{ borderLeft: "4px solid #8b5cf6" }}>
                    <span className="metric-label">Net Remaining Balance</span>
                    <span className="metric-value" style={{ color: "#7c3aed" }}>
                        ₹{teamSummary.totalNetRemainingBalance.toLocaleString()}
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>
                        Advance & adjustments
                    </span>
                </div>
            </div>

            {/* MAIN VIEW NAVIGATION TABS */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>
                <button
                    type="button"
                    onClick={() => setActiveViewTab("table")}
                    style={{
                        padding: "8px 18px",
                        fontSize: "14px",
                        fontWeight: 700,
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        backgroundColor: activeViewTab === "table" ? "#4f46e5" : "#f1f5f9",
                        color: activeViewTab === "table" ? "#ffffff" : "#475569",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    📊 Mediator Earning Table (Spreadsheet View)
                </button>
                <button
                    type="button"
                    onClick={() => setActiveViewTab("list")}
                    style={{
                        padding: "8px 18px",
                        fontSize: "14px",
                        fontWeight: 700,
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        backgroundColor: activeViewTab === "list" ? "#4f46e5" : "#f1f5f9",
                        color: activeViewTab === "list" ? "#ffffff" : "#475569",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    👥 All Mediators Summary List ({mediators.length})
                </button>
            </div>

            {/* VIEW 1: SPREADSHEET EARNING TABLE WITH FILTER OPTION */}
            {activeViewTab === "table" && (
                <div style={{ animation: "fadeIn 0.25s ease-out" }}>
                    {/* FILTER & SELECTOR CARD */}
                    <div
                        style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "12px",
                            padding: "16px 20px",
                            marginBottom: "20px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                            <div>
                                <label
                                    htmlFor="mediator-select"
                                    style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}
                                >
                                    🔍 Select Mediator to View Financial Breakdown:
                                </label>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>
                                    Choose an individual mediator or view the aggregate total across all {mediators.length} mediators.
                                </span>
                            </div>

                            {/* Dropdown Selector */}
                            <div style={{ minWidth: "280px" }}>
                                <select
                                    id="mediator-select"
                                    value={selectedMediatorId}
                                    onChange={(e) => setSelectedMediatorId(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "8px 14px",
                                        borderRadius: "8px",
                                        border: "2px solid #6366f1",
                                        backgroundColor: "#f8fafc",
                                        fontWeight: 700,
                                        fontSize: "13.5px",
                                        color: "#0f172a",
                                        cursor: "pointer",
                                    }}
                                >
                                    <option value="all">🏢 All Mediators (Team Aggregate)</option>
                                    <optgroup label="Individual Mediators">
                                        {mediators.map((item) => (
                                            <option key={item.mediator?._id} value={item.mediator?._id}>
                                                {item.mediator?.name} ({item.mediator?.mediatorCode}) — Completed: {item.completedUnits} | Commission: ₹{item.totalCommissionEarned}
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        {/* Quick Mediator Selector Filter Pills */}
                        <div style={{ marginTop: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                                <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                                    Quick Select:
                                </span>
                                <input
                                    type="text"
                                    placeholder="Type to filter buttons..."
                                    value={mediatorSearch}
                                    onChange={(e) => setMediatorSearch(e.target.value)}
                                    style={{
                                        padding: "4px 8px",
                                        fontSize: "11.5px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        width: "160px",
                                    }}
                                />
                                {mediatorSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setMediatorSearch("")}
                                        style={{ fontSize: "11px", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
                                    >
                                        Clear ✕
                                    </button>
                                )}
                            </div>

                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", maxHeight: "110px", overflowY: "auto", paddingRight: "4px" }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedMediatorId("all")}
                                    style={{
                                        padding: "5px 12px",
                                        borderRadius: "20px",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        border: selectedMediatorId === "all" ? "2px solid #4f46e5" : "1px solid #cbd5e1",
                                        backgroundColor: selectedMediatorId === "all" ? "#eff6ff" : "#ffffff",
                                        color: selectedMediatorId === "all" ? "#1d4ed8" : "#334155",
                                        cursor: "pointer",
                                    }}
                                >
                                    🏢 All Team Aggregate
                                </button>
                                {pillFilteredMediators.map((item) => {
                                    const mId = item.mediator?._id?.toString();
                                    const isSelected = selectedMediatorId === mId;
                                    return (
                                        <button
                                            key={mId}
                                            type="button"
                                            onClick={() => setSelectedMediatorId(mId)}
                                            style={{
                                                padding: "5px 12px",
                                                borderRadius: "20px",
                                                fontSize: "12px",
                                                fontWeight: isSelected ? 800 : 600,
                                                border: isSelected ? "2px solid #4f46e5" : "1px solid #cbd5e1",
                                                backgroundColor: isSelected ? "#4f46e5" : "#ffffff",
                                                color: isSelected ? "#ffffff" : "#334155",
                                                cursor: "pointer",
                                                transition: "all 0.15s ease",
                                            }}
                                        >
                                            {item.mediator?.name} ({item.mediator?.mediatorCode})
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Selected Mediator Dossier Banner */}
                        {selectedItem ? (
                            <div
                                style={{
                                    marginTop: "14px",
                                    padding: "10px 14px",
                                    backgroundColor: "#f8fafc",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "10px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                                        👤 {selectedItem.mediator?.name} ({selectedItem.mediator?.mediatorCode})
                                    </div>
                                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                                        Team: <b>{selectedItem.mediator?.teamCode}</b>
                                    </span>
                                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                                        Contact: <b>{selectedItem.mediator?.phone || selectedItem.mediator?.email || "N/A"}</b>
                                    </span>
                                    <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: 700 }}>
                                        Completed: {selectedItem.completedUnits} units
                                    </span>
                                    <span style={{ fontSize: "12px", color: "#059669", fontWeight: 700 }}>
                                        Settled: ₹{selectedItem.totalSettledPayout.toLocaleString()}
                                    </span>
                                    <span style={{ fontSize: "12px", color: selectedItem.totalPendingPayout > 0 ? "#d97706" : "#64748b", fontWeight: 700 }}>
                                        Pending: ₹{selectedItem.totalPendingPayout.toLocaleString()}
                                    </span>
                                </div>

                                {selectedItem.completedUnitsList?.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setUnitsModalMediator(selectedItem)}
                                        className="table-btn table-btn-outline"
                                        style={{ fontSize: "11.5px", padding: "4px 10px" }}
                                    >
                                        📦 View Orders & Receipts ({selectedItem.completedUnitsList.length})
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div
                                style={{
                                    marginTop: "14px",
                                    padding: "10px 14px",
                                    backgroundColor: "#eff6ff",
                                    borderRadius: "8px",
                                    border: "1px solid #bfdbfe",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    color: "#1e40af",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                }}
                            >
                                🏢 Showing Combined Financial Totals for All {mediators.length} Team Mediators. Select an individual mediator above to see their isolated breakdown.
                            </div>
                        )}
                    </div>

                    {/* LIVE EARNING TABLE */}
                    <EarningTable
                        key={selectedMediatorId}
                        mediatorData={activeFinancialData}
                        readOnly={false}
                        title={activeTitle}
                    />
                </div>
            )}

            {/* VIEW 2: ALL MEDIATORS COMPARISON LIST */}
            {activeViewTab === "list" && (
                <div style={{ animation: "fadeIn 0.25s ease-out" }}>
                    {/* Search & Filter Bar */}
                    <div className="filter-bar-card" style={{ marginBottom: "16px" }}>
                        <input
                            type="text"
                            className="filter-input-text"
                            placeholder="Search by mediator name, code, team, phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ minWidth: "300px" }}
                        />

                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {[
                                { key: "all", label: `All Mediators (${mediators.length})` },
                                { key: "pending_payout", label: `Has Pending Payout (${mediators.filter((m) => m.totalPendingPayout > 0).length})` },
                                { key: "has_balance", label: `Has Cash Balance (${mediators.filter((m) => m.netRemainingBalance !== 0).length})` },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setFilterCategory(tab.key)}
                                    className={`filter-btn ${filterCategory === tab.key ? "filter-btn-active" : ""}`}
                                    style={{ fontSize: "12px", padding: "6px 12px" }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mediators Table */}
                    {filteredMediators.length === 0 ? (
                        <div className="empty-state-card">
                            <div className="empty-state-icon">👥</div>
                            <h2 className="empty-state-title">No Mediators Found</h2>
                            <p className="empty-state-text">No mediators match your search or filter criteria.</p>
                        </div>
                    ) : (
                        <div className="data-table-container">
                            <div className="data-table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Mediator</th>
                                            <th>Code / Team</th>
                                            <th style={{ textAlign: "center" }}>Completed Units</th>
                                            <th style={{ textAlign: "right" }}>Total Earned</th>
                                            <th style={{ textAlign: "right" }}>Settled Payout</th>
                                            <th style={{ textAlign: "right" }}>Pending Payout</th>
                                            <th style={{ textAlign: "right" }}>Remaining Balance</th>
                                            <th style={{ textAlign: "center" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMediators.map((item) => {
                                            const m = item.mediator || {};
                                            const hasPending = item.totalPendingPayout > 0;
                                            const holdsAdvance = item.netRemainingBalance > 0;
                                            const owesMediator = item.netRemainingBalance < 0;

                                            return (
                                                <tr key={m._id}>
                                                    <td className="product-name-cell">
                                                        <div style={{ fontWeight: 700, fontSize: "13.5px", color: "#0f172a" }}>
                                                            {m.name || "Mediator"}
                                                        </div>
                                                        <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                                                            {m.phone ? `📞 ${m.phone}` : m.email || "No contact"}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 700, color: "var(--primary-600)" }}>
                                                            {m.mediatorCode || "N/A"}
                                                        </div>
                                                        <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                                                            Team: {m.teamCode || "N/A"}
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        <span style={{ fontWeight: 700, fontSize: "13.5px", color: "#2563eb" }}>
                                                            {item.completedUnits}
                                                        </span>
                                                        <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "4px" }}>
                                                            ({item.activeUnits} active)
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "right", fontWeight: 800, color: "#1d4ed8" }}>
                                                        ₹{item.totalCommissionEarned.toLocaleString()}
                                                    </td>
                                                    <td style={{ textAlign: "right", fontWeight: 700, color: "#059669" }}>
                                                        ₹{item.totalSettledPayout.toLocaleString()}
                                                    </td>
                                                    <td style={{ textAlign: "right" }}>
                                                        <span
                                                            style={{
                                                                fontWeight: 800,
                                                                color: hasPending ? "#b45309" : "#64748b",
                                                                background: hasPending ? "#fef3c7" : "transparent",
                                                                padding: hasPending ? "3px 8px" : "0",
                                                                borderRadius: "6px",
                                                            }}
                                                        >
                                                            ₹{item.totalPendingPayout.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "right" }}>
                                                        <div style={{ fontWeight: 800, color: holdsAdvance ? "#4338ca" : owesMediator ? "#dc2626" : "#64748b" }}>
                                                            ₹{item.netRemainingBalance.toLocaleString()}
                                                        </div>
                                                        <div style={{ fontSize: "10.5px", color: holdsAdvance ? "#6366f1" : owesMediator ? "#ef4444" : "#94a3b8" }}>
                                                            {holdsAdvance ? "Holds Advance" : owesMediator ? "Owed to Mediator" : "Balanced"}
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        <div className="action-btn-group" style={{ justifyContent: "center", gap: "6px" }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSelectMediatorForTable(m._id)}
                                                                className="table-btn table-btn-primary"
                                                                style={{ fontSize: "11.5px", padding: "4px 10px", backgroundColor: "#4f46e5", borderColor: "#4f46e5" }}
                                                                title="View full 15-row earning table for this mediator"
                                                            >
                                                                📊 View Table
                                                            </button>
                                                            {item.completedUnitsList?.length > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setUnitsModalMediator(item)}
                                                                    className="table-btn table-btn-outline"
                                                                    style={{ fontSize: "11.5px", padding: "4px 8px" }}
                                                                    title="View receipts & completed orders"
                                                                >
                                                                    📦 Receipts
                                                                </button>
                                                            )}
                                                            {hasPending && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => navigate("/executive-completed-order")}
                                                                    className="table-btn table-btn-primary"
                                                                    style={{ fontSize: "11px", padding: "4px 8px", backgroundColor: "#059669", borderColor: "#059669" }}
                                                                    title="Settle pending payouts for this mediator"
                                                                >
                                                                    💰 Pay
                                                                </button>
                                                            )}
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
            )}

            {/* COMPLETED UNITS & RECEIPTS MODAL */}
            {unitsModalMediator && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.6)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "20px",
                    }}
                    onClick={() => setUnitsModalMediator(null)}
                >
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "14px",
                            maxWidth: "850px",
                            width: "100%",
                            maxHeight: "88vh",
                            overflowY: "auto",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                            padding: "24px",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "20px" }}>
                            <div>
                                <span className="table-page-badge" style={{ marginBottom: "6px" }}>Receipts & Payout History</span>
                                <h2 style={{ margin: "4px 0 2px 0", fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                                    {unitsModalMediator.mediator?.name} ({unitsModalMediator.mediator?.mediatorCode})
                                </h2>
                                <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
                                    Team: <b>{unitsModalMediator.mediator?.teamCode}</b> • Contact: <b>{unitsModalMediator.mediator?.phone || unitsModalMediator.mediator?.email || "N/A"}</b>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setUnitsModalMediator(null)}
                                style={{
                                    border: "none",
                                    background: "#f1f5f9",
                                    borderRadius: "50%",
                                    width: "32px",
                                    height: "32px",
                                    cursor: "pointer",
                                    fontWeight: 700,
                                    fontSize: "14px",
                                    color: "#64748b",
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Metric Highlights */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                            <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Total Commission</div>
                                <div style={{ fontSize: "16px", fontWeight: 800, color: "#1d4ed8", marginTop: "2px" }}>
                                    ₹{unitsModalMediator.totalCommissionEarned.toLocaleString()}
                                </div>
                            </div>
                            <div style={{ background: "#ecfdf5", padding: "12px 14px", borderRadius: "8px", border: "1px solid #a7f3d0" }}>
                                <div style={{ fontSize: "11px", color: "#059669", fontWeight: 600 }}>Settled Payouts</div>
                                <div style={{ fontSize: "16px", fontWeight: 800, color: "#059669", marginTop: "2px" }}>
                                    ₹{unitsModalMediator.totalSettledPayout.toLocaleString()} ({unitsModalMediator.settledUnits} u)
                                </div>
                            </div>
                            <div style={{ background: "#fffbeb", padding: "12px 14px", borderRadius: "8px", border: "1px solid #fde68a" }}>
                                <div style={{ fontSize: "11px", color: "#b45309", fontWeight: 600 }}>Pending Payout</div>
                                <div style={{ fontSize: "16px", fontWeight: 800, color: "#d97706", marginTop: "2px" }}>
                                    ₹{unitsModalMediator.totalPendingPayout.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Units Table */}
                        {unitsModalMediator.completedUnitsList?.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                                No completed units found for this mediator yet.
                            </div>
                        ) : (
                            <div className="data-table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product / Order</th>
                                            <th>Reviewer</th>
                                            <th style={{ textAlign: "right" }}>Price</th>
                                            <th style={{ textAlign: "center" }}>Status</th>
                                            <th style={{ textAlign: "right" }}>Payout Rate</th>
                                            <th style={{ textAlign: "center" }}>Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {unitsModalMediator.completedUnitsList.map((unit) => (
                                            <tr key={unit._id}>
                                                <td>
                                                    <div style={{ fontWeight: 700, fontSize: "13px" }}>{unit.productName}</div>
                                                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                                                        {unit.brand} • {unit.orderPlatform} • ID: {unit.orderId}
                                                    </div>
                                                </td>
                                                <td>{unit.reviewerName}</td>
                                                <td style={{ textAlign: "right", fontWeight: 700 }}>₹{unit.price}</td>
                                                <td style={{ textAlign: "center" }}>
                                                    <span
                                                        className={`status-pill ${
                                                            unit.settlementStatus === "settled"
                                                                ? "status-pill-success"
                                                                : unit.settlementStatus === "pending_confirmation"
                                                                ? "status-pill-warning"
                                                                : "status-pill-default"
                                                        }`}
                                                    >
                                                        {unit.settlementStatus === "settled"
                                                            ? "Settled ✓"
                                                            : unit.settlementStatus === "pending_confirmation"
                                                            ? "Awaiting Confirm ⏳"
                                                            : "Unsettled"}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: "right", fontWeight: 800, color: "#16a34a" }}>
                                                    ₹{unit.settlementAmount || 20}
                                                </td>
                                                <td style={{ textAlign: "center" }}>
                                                    {unit.settlementScreenshot ? (
                                                        <ProofThumbnail
                                                            fileUrl={unit.settlementScreenshot}
                                                            title={`Settlement receipt for ${unit.productName}`}
                                                            onPreview={(url) => setSelectedProof(url)}
                                                        />
                                                    ) : (
                                                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>None</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PROOF LIGHTBOX */}
            {selectedProof && (
                <ProofPreviewModal
                    fileUrl={selectedProof}
                    onClose={() => setSelectedProof(null)}
                />
            )}
        </div>
    );
}
