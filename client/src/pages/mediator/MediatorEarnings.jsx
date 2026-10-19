import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EarningTable from "../../component/mediator/EarningTable";
import { fetchMediatorEarnings } from "../../services/mediator/orders";
import ProofThumbnail from "../../component/common/ProofThumbnail";
import ProofPreviewModal from "../../component/common/ProofPreviewModal";
import "../../styles/ordersTable.css";

export default function MediatorEarnings() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState("table"); // "table" | "orders" | "balance"
    const [statusFilter, setStatusFilter] = useState("all"); // "all" | "settled" | "pending_confirmation" | "unsettled"
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProof, setSelectedProof] = useState(null);

    useEffect(() => {
        loadEarnings();
    }, []);

    const loadEarnings = async () => {
        try {
            setLoading(true);
            const res = await fetchMediatorEarnings();
            if (res.data?.success) {
                setData(res.data);
            }
        } catch (err) {
            console.error("Error loading mediator earnings:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="table-page-container">
                <div className="empty-state-card">
                    <div className="empty-state-icon">⏳</div>
                    <h2 className="empty-state-title">Loading Financial Ledger...</h2>
                    <p className="empty-state-text">Aggregating live completed orders, settled payouts, and balance reconciliations.</p>
                </div>
            </div>
        );
    }

    const summary = data?.summary || {
        completedUnitsCount: 0,
        settledUnitsCount: 0,
        pendingConfirmationUnitsCount: 0,
        unsettledUnitsCount: 0,
        totalCommissionEarned: 0,
        settledPayoutAmount: 0,
        pendingPayoutAmount: 0,
        totalBalanceReceived: 0,
        totalBalanceReturned: 0,
        netRemainingBalance: 0,
        activeCapital: 0,
    };

    const mediator = data?.mediator || {};
    const payoutUnits = data?.payoutUnits || [];
    const recentTransactions = data?.recentBalanceTransactions || [];

    // Filter payout units
    const filteredUnits = payoutUnits.filter((u) => {
        if (statusFilter !== "all" && u.settlementStatus !== statusFilter) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
            (u.productName && u.productName.toLowerCase().includes(q)) ||
            (u.brand && u.brand.toLowerCase().includes(q)) ||
            (u.orderId && u.orderId.toLowerCase().includes(q)) ||
            (u.reviewerName && u.reviewerName.toLowerCase().includes(q)) ||
            (u.orderPlatform && u.orderPlatform.toLowerCase().includes(q))
        );
    });

    return (
        <div className="table-page-container">
            {/* Header */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge">Financial Command</span>
                    <h1 className="table-page-title">💰 Mediator Earnings & Financial Overview</h1>
                    <p className="table-page-subtitle">
                        Mediator: <b>{mediator.name || "N/A"}</b> • Code: <b>{mediator.mediatorCode || "N/A"}</b> • Team: <b>{mediator.teamCode || "N/A"}</b>
                    </p>
                </div>
                <div className="table-header-actions">
                    <button
                        type="button"
                        onClick={() => navigate("/panel-mediator")}
                        className="nav-btn nav-btn-default"
                    >
                        ← Dashboard
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/mediator-balance")}
                        className="nav-btn nav-btn-outline"
                    >
                        ⚖️ Balance Overview
                    </button>
                    <button
                        type="button"
                        onClick={loadEarnings}
                        className="nav-btn nav-btn-primary"
                        style={{ backgroundColor: "#059669", borderColor: "#059669" }}
                    >
                        ↻ Refresh Ledger
                    </button>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ display: "flex", borderBottom: "2px solid #e2e8f0", marginBottom: "20px", gap: "10px", flexWrap: "wrap" }}>
                <button
                    type="button"
                    onClick={() => setActiveTab("table")}
                    style={{
                        padding: "10px 18px",
                        fontWeight: 700,
                        fontSize: "14px",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        borderBottom: activeTab === "table" ? "3px solid #059669" : "3px solid transparent",
                        color: activeTab === "table" ? "#059669" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    📊 14-Row Earning Breakdown Table
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("orders")}
                    style={{
                        padding: "10px 18px",
                        fontWeight: 700,
                        fontSize: "14px",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        borderBottom: activeTab === "orders" ? "3px solid #059669" : "3px solid transparent",
                        color: activeTab === "orders" ? "#059669" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    📦 Completed Orders Payout Status ({payoutUnits.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("balance")}
                    style={{
                        padding: "10px 18px",
                        fontWeight: 700,
                        fontSize: "14px",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        borderBottom: activeTab === "balance" ? "3px solid #059669" : "3px solid transparent",
                        color: activeTab === "balance" ? "#059669" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    ⚖️ Balance Adjustments History ({recentTransactions.length})
                </button>
            </div>

            {/* TAB 1: 14-ROW SPREADSHEET TABLE */}
            {activeTab === "table" && (
                <div style={{ marginTop: "10px" }}>
                    <EarningTable />
                </div>
            )}

            {/* Core Financial Metric Cards (for Orders & Balance tabs) */}
            {activeTab !== "table" && (
                <>
                    <div className="table-metrics-bar" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                        <div className="metric-card" style={{ borderLeft: "4px solid #3b82f6" }}>
                            <span className="metric-label">Total Commission Earned</span>
                            <span className="metric-value" style={{ color: "#1d4ed8" }}>
                                ₹{summary.totalCommissionEarned.toLocaleString()}
                            </span>
                            <span style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>
                                From {summary.completedUnitsCount} completed orders
                            </span>
                        </div>

                        <div className="metric-card" style={{ borderLeft: "4px solid #10b981" }}>
                            <span className="metric-label">Settled Payouts</span>
                            <span className="metric-value metric-value-green">
                                ₹{summary.settledPayoutAmount.toLocaleString()}
                            </span>
                            <span style={{ fontSize: "11.5px", color: "#059669", fontWeight: 600, marginTop: "4px" }}>
                                ✓ Confirmed ({summary.settledUnitsCount} units)
                            </span>
                        </div>

                        <div className="metric-card" style={{ borderLeft: "4px solid #f59e0b" }}>
                            <span className="metric-label">Awaiting Payout</span>
                            <span className="metric-value" style={{ color: "#d97706" }}>
                                ₹{summary.pendingPayoutAmount.toLocaleString()}
                            </span>
                            <span style={{ fontSize: "11.5px", color: "#b45309", marginTop: "4px" }}>
                                ⏳ {summary.unsettledUnitsCount + summary.pendingConfirmationUnitsCount} units pending settlement
                            </span>
                        </div>

                        <div className="metric-card" style={{ borderLeft: `4px solid ${summary.netRemainingBalance > 0 ? "#6366f1" : "#64748b"}` }}>
                            <span className="metric-label">Remaining Balance</span>
                            <span className="metric-value" style={{ color: summary.netRemainingBalance > 0 ? "#4338ca" : "#0f172a" }}>
                                ₹{summary.netRemainingBalance.toLocaleString()}
                            </span>
                            <span style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>
                                {summary.netRemainingBalance > 0
                                    ? "Cash balance with mediator"
                                    : summary.netRemainingBalance < 0
                                    ? "Executive owes reimbursement"
                                    : "Balanced (₹0)"}
                            </span>
                        </div>
                    </div>

                    {/* Compact Capital Reconciliation Banner */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "12px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            padding: "12px 18px",
                            marginBottom: "24px",
                            fontSize: "12.5px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                            <div>
                                <span style={{ color: "#64748b" }}>Active Order Capital: </span>
                                <b style={{ color: "#0f172a" }}>₹{summary.activeCapital.toLocaleString()}</b>
                                <span style={{ color: "#94a3b8", marginLeft: "4px" }}>({summary.inProgressCount + summary.pendingRefundCount} in-flight)</span>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>Advance Received: </span>
                                <b style={{ color: "#059669" }}>₹{summary.totalBalanceReceived.toLocaleString()}</b>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>Refunds Returned: </span>
                                <b style={{ color: "#dc2626" }}>₹{summary.totalBalanceReturned.toLocaleString()}</b>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>Cancelled / Return Orders: </span>
                                <b style={{ color: "#e11d48" }}>₹{(summary.cancelledValue || 0).toLocaleString()}</b>
                                <span style={{ color: "#94a3b8", marginLeft: "4px" }}>({summary.cancelledCount || 0} units)</span>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                type="button"
                                onClick={() => navigate("/mediator-completed-orders")}
                                className="table-btn table-btn-outline"
                                style={{ fontSize: "11.5px", padding: "4px 10px" }}
                            >
                                View Completed Orders →
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/mediator-settled-orders")}
                                className="table-btn table-btn-outline"
                                style={{ fontSize: "11.5px", padding: "4px 10px" }}
                            >
                                View Settled Orders →
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* TAB 1: COMPLETED ORDERS PAYOUT LEDGER */}
            {activeTab === "orders" && (
                <div>
                    {/* Filters & Search */}
                    <div className="filter-bar-card" style={{ marginBottom: "16px" }}>
                        <input
                            type="text"
                            className="filter-input-text"
                            placeholder="Search orders by product, brand, reviewer, order ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ minWidth: "280px" }}
                        />

                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {[
                                { key: "all", label: `All (${payoutUnits.length})` },
                                { key: "settled", label: `Settled (${summary.settledUnitsCount})` },
                                { key: "pending_confirmation", label: `To Confirm (${summary.pendingConfirmationUnitsCount})` },
                                { key: "unsettled", label: `Awaiting Payout (${summary.unsettledUnitsCount})` },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setStatusFilter(tab.key)}
                                    className={`filter-btn ${statusFilter === tab.key ? "filter-btn-active" : ""}`}
                                    style={{ fontSize: "12px", padding: "6px 12px" }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredUnits.length === 0 ? (
                        <div className="empty-state-card">
                            <div className="empty-state-icon">📋</div>
                            <h2 className="empty-state-title">No Orders Match Filter</h2>
                            <p className="empty-state-text">No completed orders found for the selected filter criteria.</p>
                        </div>
                    ) : (
                        <div className="data-table-container">
                            <div className="data-table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product & Brand</th>
                                            <th>Platform</th>
                                            <th>Order ID</th>
                                            <th>Reviewer</th>
                                            <th>Completed On</th>
                                            <th style={{ textAlign: "right" }}>Payout Rate</th>
                                            <th>Settlement Status</th>
                                            <th style={{ textAlign: "center" }}>Receipt Proof</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUnits.map((u) => {
                                            const isSettled = u.settlementStatus === "settled";
                                            const isToConfirm = u.settlementStatus === "pending_confirmation";
                                            return (
                                                <tr key={u._id}>
                                                    <td className="product-name-cell">
                                                        <div style={{ fontWeight: 600 }}>{u.productName}</div>
                                                        <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>{u.brand}</div>
                                                    </td>
                                                    <td>{u.orderPlatform}</td>
                                                    <td style={{ fontWeight: 700, color: "var(--primary-600)" }}>
                                                        {u.orderId || "N/A"}
                                                    </td>
                                                    <td>{u.reviewerName || "N/A"}</td>
                                                    <td style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                                                        {u.completedAt ? new Date(u.completedAt).toLocaleDateString() : "N/A"}
                                                    </td>
                                                    <td style={{ textAlign: "right", fontWeight: 800, color: isSettled ? "#059669" : "#d97706" }}>
                                                        ₹{u.settlementAmount || 20}
                                                    </td>
                                                    <td>
                                                        {isSettled ? (
                                                            <span className="status-badge status-badge-completed" style={{ background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0" }}>
                                                                ● Settled
                                                            </span>
                                                        ) : isToConfirm ? (
                                                            <span className="status-badge" style={{ background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }}>
                                                                💳 Paid (Awaiting Your Confirmation)
                                                            </span>
                                                        ) : (
                                                            <span className="status-badge" style={{ background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }}>
                                                                ⏳ Awaiting Executive Payout
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        {u.settlementScreenshot ? (
                                                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                                                <ProofThumbnail
                                                                    url={u.settlementScreenshot}
                                                                    size={34}
                                                                    onClick={() => setSelectedProof({
                                                                        url: u.settlementScreenshot,
                                                                        title: `Payout Receipt - ${u.productName} (₹${u.settlementAmount})`,
                                                                    })}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>—</span>
                                                        )}
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

            {/* TAB 2: BALANCE ADJUSTMENTS HISTORY */}
            {activeTab === "balance" && (
                <div>
                    {recentTransactions.length === 0 ? (
                        <div className="empty-state-card">
                            <div className="empty-state-icon">⚖️</div>
                            <h2 className="empty-state-title">No Balance Adjustments Yet</h2>
                            <p className="empty-state-text">Price differences and balance reimbursements between you and your executive will appear here.</p>
                            <button
                                type="button"
                                onClick={() => navigate("/mediator-balance")}
                                className="table-btn table-btn-primary"
                                style={{ marginTop: "12px" }}
                            >
                                Open Balance Center →
                            </button>
                        </div>
                    ) : (
                        <div className="data-table-container">
                            <div className="data-table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Direction</th>
                                            <th>Amount</th>
                                            <th>Reason</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: "center" }}>Screenshot</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentTransactions.map((tx) => {
                                            const isIncoming = tx.direction === "executive_to_mediator";
                                            return (
                                                <tr key={tx._id}>
                                                    <td>
                                                        <span
                                                            className="status-badge"
                                                            style={{
                                                                backgroundColor: isIncoming ? "#ecfdf5" : "#fef2f2",
                                                                color: isIncoming ? "#059669" : "#dc2626",
                                                                borderColor: isIncoming ? "#a7f3d0" : "#fecaca",
                                                            }}
                                                        >
                                                            {isIncoming ? "📥 Executive → You (Advance)" : "📤 You → Executive (Refund)"}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontWeight: 800, color: isIncoming ? "#059669" : "#dc2626" }}>
                                                        {isIncoming ? "+" : "-"}₹{tx.amount.toLocaleString()}
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{tx.reason}</div>
                                                        {tx.message && <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>{tx.message}</div>}
                                                    </td>
                                                    <td style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                                                        {new Date(tx.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`status-badge ${
                                                                tx.status === "verified"
                                                                    ? "status-badge-completed"
                                                                    : tx.status === "pending"
                                                                    ? "status-badge-unsettled"
                                                                    : "status-badge-danger"
                                                            }`}
                                                        >
                                                            {tx.status === "verified" ? "✓ Verified" : tx.status === "pending" ? "⏳ Pending" : "✕ Rejected"}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        {tx.paymentScreenshot ? (
                                                            <ProofThumbnail
                                                                url={tx.paymentScreenshot}
                                                                size={34}
                                                                onClick={() => setSelectedProof({
                                                                    url: tx.paymentScreenshot,
                                                                    title: `Balance Payment Proof - ₹${tx.amount}`,
                                                                })}
                                                            />
                                                        ) : (
                                                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>—</span>
                                                        )}
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

            {/* Lightbox Modal */}
            {selectedProof && (
                <ProofPreviewModal
                    url={selectedProof.url}
                    title={selectedProof.title}
                    onClose={() => setSelectedProof(null)}
                />
            )}
        </div>
    );
}
