import { useState, useEffect } from "react";
import { fetchAllExecutiveCompletedOrders } from "../../services/executive/order";
import { useNavigate } from "react-router-dom";
import OrderCard from "../../component/executive/OrderCard";
import OrderFilters from "../../component/executive/OrderFilters";
import PipelineStepper from "../../component/layout/PipelineStepper";
import SettlementModal from "../../component/executive/SettlementModal";
import "../../styles/ordersTable.css";

export default function CompletedOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("breakdown"); // "breakdown" | "table"
    const [selectedMediatorFilter, setSelectedMediatorFilter] = useState("all");
    const [activeSettlementMediator, setActiveSettlementMediator] = useState(null);
    const [successToast, setSuccessToast] = useState("");

    const [appliedFilters, setAppliedFilters] = useState({
        date: "",
        brand: "",
        reviewerName: "",
        orderId: "",
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await fetchAllExecutiveCompletedOrders();
            setOrders(response.data?.orders || []);
        } catch (err) {
            console.error("Error loading completed orders:", err);
        } finally {
            setLoading(false);
        }
    };

    // Mediator-wise breakdown aggregation
    const mediatorBreakdownMap = {};
    let totalCompletedUnits = 0;
    let totalCompletedValue = 0;
    let totalWarehouseCompleted = 0;
    let totalEmptyCompleted = 0;
    let totalUnsettledUnits = 0;
    let totalPendingConfirmationUnits = 0;
    let totalPendingConfirmationAmount = 0;
    let totalSettledUnits = 0;
    let totalSettledAmount = 0;

    orders.forEach((order) => {
        const price = parseFloat(order.price) || 0;
        (order.orderUnits || []).forEach((unit) => {
            if (unit.status === "completed") {
                totalCompletedUnits++;
                totalCompletedValue += price;
                if (unit.unitType === "warehouse") totalWarehouseCompleted++;
                if (unit.unitType === "empty") totalEmptyCompleted++;

                const isSettled = unit.settlementStatus === "settled";
                const isPendingConfirmation = unit.settlementStatus === "pending_confirmation";
                const unitSettlementPayout = parseFloat(unit.settlementAmount) || 0;

                if (isSettled) {
                    totalSettledUnits++;
                    totalSettledAmount += unitSettlementPayout;
                } else if (isPendingConfirmation) {
                    totalPendingConfirmationUnits++;
                    totalPendingConfirmationAmount += unitSettlementPayout;
                } else {
                    totalUnsettledUnits++;
                }

                const mId = unit.mediatorId?._id?.toString() || unit.mediatorId?.toString();
                if (mId) {
                    if (!mediatorBreakdownMap[mId]) {
                        mediatorBreakdownMap[mId] = {
                            id: mId,
                            name: unit.mediatorId?.name || "Mediator",
                            mediatorCode: unit.mediatorId?.mediatorCode || "N/A",
                            teamCode: unit.mediatorId?.teamCode || order.teamCode || "N/A",
                            completedUnits: 0,
                            totalValue: 0,
                            unsettledUnits: [],
                            pendingConfirmationUnits: [],
                            pendingConfirmationValue: 0,
                            settledUnits: [],
                            settledValue: 0,
                            ordersMap: {},
                        };
                    }
                    mediatorBreakdownMap[mId].completedUnits++;
                    mediatorBreakdownMap[mId].totalValue += price;
                    mediatorBreakdownMap[mId].ordersMap[order._id] = order;

                    const unitWithOrderInfo = {
                        ...unit,
                        productName: order.productName,
                        brand: order.brand,
                        orderPlatform: order.orderPlatform,
                        price: unit.purchasePrice || price,
                        orderId: unit.orderId || order.orderId || "N/A",
                    };

                    if (isSettled) {
                        mediatorBreakdownMap[mId].settledUnits.push(unitWithOrderInfo);
                        mediatorBreakdownMap[mId].settledValue += unitSettlementPayout;
                    } else if (isPendingConfirmation) {
                        mediatorBreakdownMap[mId].pendingConfirmationUnits.push(unitWithOrderInfo);
                        mediatorBreakdownMap[mId].pendingConfirmationValue += unitSettlementPayout;
                    } else {
                        mediatorBreakdownMap[mId].unsettledUnits.push(unitWithOrderInfo);
                    }
                }
            }
        });
    });

    const mediatorBreakdownList = Object.values(mediatorBreakdownMap)
        .map((m) => ({
            ...m,
            ordersCount: Object.keys(m.ordersMap).length,
            orderList: Object.values(m.ordersMap),
        }))
        .sort((a, b) => b.unsettledUnits.length - a.unsettledUnits.length || b.pendingConfirmationUnits.length - a.pendingConfirmationUnits.length || b.completedUnits - a.completedUnits);

    const displayedMediatorBreakdown = mediatorBreakdownList.filter((m) => {
        if (selectedMediatorFilter !== "all" && m.id !== selectedMediatorFilter) {
            return false;
        }
        return true;
    });

    const filteredOrders = orders.filter((order) => {
        // Exclude orders with no unsettled completed units (fully settled orders belong in Stage 8: Settled Orders)
        const hasUnsettledUnit = (order.orderUnits || []).some(
            (u) => u.status === "completed" && u.settlementStatus !== "settled"
        );
        if (!hasUnsettledUnit) return false;

        // Filter by mediator if selected
        if (selectedMediatorFilter !== "all") {
            const hasMediatorUnit = (order.orderUnits || []).some((u) => {
                if (u.status !== "completed") return false;
                const mId = u.mediatorId?._id?.toString() || u.mediatorId?.toString();
                return mId === selectedMediatorFilter;
            });
            if (!hasMediatorUnit) return false;
        }

        const orderIdMatch =
            !appliedFilters.orderId ||
            order.orderId?.toLowerCase().includes(appliedFilters.orderId.toLowerCase());

        const brandMatch =
            !appliedFilters.brand ||
            order.brand?.toLowerCase().includes(appliedFilters.brand.toLowerCase());

        const reviewerNameMatch =
            !appliedFilters.reviewerName ||
            order.reviewerName?.toLowerCase().includes(appliedFilters.reviewerName.toLowerCase());

        const dateMatch =
            !appliedFilters.date ||
            new Date(order.createdAt).toISOString().split("T")[0] === appliedFilters.date;

        return orderIdMatch && brandMatch && reviewerNameMatch && dateMatch;
    });

    return (
        <div className="table-page-container">
            {/* Visual Pipeline Stepper */}
            <PipelineStepper role="executive" />

            {/* Header */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge">
                        Stage 7 of Executive Pipeline
                    </span>
                    <h1 className="table-page-title">Completed Orders</h1>
                    <p className="table-page-subtitle">
                        Settle mediator payouts for verified completed deliveries.
                    </p>
                </div>
                <div className="table-header-actions">
                    <button
                        type="button"
                        className="nav-btn nav-btn-default"
                        onClick={() => navigate("/dashboard-executive")}
                    >
                        ← Dashboard
                    </button>
                    <button
                        type="button"
                        className="nav-btn nav-btn-default"
                        onClick={() => navigate("/executive-verify-orders")}
                    >
                        Verify Deliveries →
                    </button>
                    <button
                        type="button"
                        className="nav-btn nav-btn-primary"
                        onClick={() => navigate("/executive-settled-orders")}
                        style={{
                            backgroundColor: "#059669",
                            borderColor: "#059669",
                            color: "#ffffff",
                            fontWeight: 700,
                        }}
                    >
                        💰 Settled Orders ({totalSettledUnits}) →
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="table-metrics-bar">
                <div className="metric-card">
                    <span className="metric-label">Orders to Settle</span>
                    <span className="metric-value metric-value-primary">{filteredOrders.length}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Completed Units</span>
                    <span className="metric-value" style={{ color: "#15803d" }}>
                        {totalCompletedUnits} Units
                    </span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Awaiting Settlement</span>
                    <span className="metric-value metric-value-amber">
                        {totalUnsettledUnits} Units
                    </span>
                    <span style={{ fontSize: "10.5px", color: "var(--slate-500)", marginTop: "2px" }}>
                        Executive payout needed
                    </span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Awaiting Confirmation</span>
                    <span className="metric-value" style={{ color: "#d97706" }}>
                        {totalPendingConfirmationUnits} Units
                    </span>
                    <span style={{ fontSize: "10.5px", color: "var(--slate-500)", marginTop: "2px" }}>
                        ₹{totalPendingConfirmationAmount.toLocaleString()} pending mediator
                    </span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Settled Payouts</span>
                    <span className="metric-value metric-value-green">
                        ₹{totalSettledAmount.toLocaleString()} ({totalSettledUnits} u)
                    </span>
                    <span style={{ fontSize: "10.5px", color: "var(--slate-500)", marginTop: "2px" }}>
                        Confirmed by mediators
                    </span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Active Mediators</span>
                    <span className="metric-value">{mediatorBreakdownList.length}</span>
                </div>
            </div>

            {/* View Mode Switcher and Mediator Filter Toolbar */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginBottom: "16px",
                    padding: "12px 16px",
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                }}
            >
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                        type="button"
                        onClick={() => setViewMode("breakdown")}
                        className={`status-pill-btn ${viewMode === "breakdown" ? "active active-completed" : ""}`}
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}
                    >
                        <span>👥</span> Mediator Breakdown ({displayedMediatorBreakdown.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("table")}
                        className={`status-pill-btn ${viewMode === "table" ? "active active-assigned" : ""}`}
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}
                    >
                        <span>📋</span> Orders List Table ({filteredOrders.length})
                    </button>
                </div>

                {/* Mediator Filter Dropdown */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#475569" }}>
                        Filter by Mediator:
                    </label>
                    <select
                        value={selectedMediatorFilter}
                        onChange={(e) => setSelectedMediatorFilter(e.target.value)}
                        style={{
                            padding: "6px 12px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            fontSize: "12.5px",
                            fontWeight: 600,
                            color: "#0f172a",
                            backgroundColor: "#f8fafc",
                            cursor: "pointer",
                        }}
                    >
                        <option value="all">All Mediators ({mediatorBreakdownList.length})</option>
                        {mediatorBreakdownList.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name} ({m.mediatorCode}) — {m.unsettledUnits.length} to settle{m.pendingConfirmationUnits.length > 0 ? `, ${m.pendingConfirmationUnits.length} awaiting confirmation` : ""}
                            </option>
                        ))}
                    </select>

                    {selectedMediatorFilter !== "all" && (
                        <button
                            type="button"
                            onClick={() => setSelectedMediatorFilter("all")}
                            style={{
                                border: "none",
                                background: "#fee2e2",
                                color: "#b91c1c",
                                padding: "4px 10px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "11.5px",
                                fontWeight: 700,
                            }}
                        >
                            Clear Filter ✕
                        </button>
                    )}
                </div>
            </div>

            {/* MEDIATOR-WISE BREAKDOWN VIEW */}
            {viewMode === "breakdown" && (
                <div>
                    {displayedMediatorBreakdown.length === 0 ? (
                        <div className="empty-state-card">
                            <div className="empty-state-icon">👥</div>
                            <h3 className="empty-state-title">No Mediator Deliveries Matching Filter</h3>
                            <p className="empty-state-text">
                                No completed deliveries found for the selected mediator filter.
                            </p>
                            {selectedMediatorFilter !== "all" && (
                                <button
                                    type="button"
                                    className="nav-btn nav-btn-default"
                                    onClick={() => setSelectedMediatorFilter("all")}
                                    style={{ marginTop: "12px" }}
                                >
                                    Reset Mediator Filter
                                </button>
                            )}
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                                gap: "16px",
                            }}
                        >
                            {displayedMediatorBreakdown.map((m) => (
                                <div
                                    key={m.id}
                                    style={{
                                        background: "#ffffff",
                                        borderRadius: "12px",
                                        border: "1px solid #e2e8f0",
                                        padding: "16px",
                                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <div>
                                        {/* Mediator Header */}
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                marginBottom: "12px",
                                            }}
                                        >
                                            <div>
                                                <h3
                                                    style={{
                                                        margin: 0,
                                                        fontSize: "15px",
                                                        fontWeight: 700,
                                                        color: "#0f172a",
                                                    }}
                                                >
                                                    {m.name}
                                                </h3>
                                                <div
                                                    style={{
                                                        fontSize: "11.5px",
                                                        color: "#64748b",
                                                        marginTop: "2px",
                                                    }}
                                                >
                                                    Code: <b style={{ color: "#334155" }}>{m.mediatorCode}</b> |
                                                    Team: <b style={{ color: "#334155" }}>{m.teamCode}</b>
                                                </div>
                                            </div>
                                            <span
                                                className="status-badge"
                                                style={{
                                                    background: "#f0fdf4",
                                                    color: "#166534",
                                                    borderColor: "#bbf7d0",
                                                }}
                                            >
                                                ✓ Completed
                                            </span>
                                        </div>

                                        {/* Mediator Stats Box */}
                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: "10px",
                                                padding: "12px",
                                                background: "#f8fafc",
                                                borderRadius: "8px",
                                                marginBottom: "14px",
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                                                    Completed Units
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "20px",
                                                        fontWeight: 800,
                                                        color: "#15803d",
                                                    }}
                                                >
                                                    {m.completedUnits}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                                                    Total Value Fulfilled
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "18px",
                                                        fontWeight: 800,
                                                        color: "#0f172a",
                                                    }}
                                                >
                                                    ₹{m.totalValue.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Products Preview */}
                                        <div style={{ fontSize: "11.5px", color: "#475569", marginBottom: "12px" }}>
                                            <span style={{ fontWeight: 600 }}>Orders Handled ({m.ordersCount}): </span>
                                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                                                {m.orderList.slice(0, 3).map((o) => (
                                                    <span
                                                        key={o._id}
                                                        style={{
                                                            padding: "2px 8px",
                                                            borderRadius: "4px",
                                                            background: "#f1f5f9",
                                                            border: "1px solid #e2e8f0",
                                                            fontSize: "11px",
                                                        }}
                                                    >
                                                        {o.productName?.substring(0, 18)}...
                                                    </span>
                                                ))}
                                                {m.orderList.length > 3 && (
                                                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                                                        +{m.orderList.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {m.unsettledUnits.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setActiveSettlementMediator({
                                                        mediator: m,
                                                        units: m.unsettledUnits,
                                                    })
                                                }
                                                className="table-btn table-btn-primary"
                                                style={{
                                                    width: "100%",
                                                    justifyContent: "center",
                                                    padding: "8px",
                                                    fontWeight: 700,
                                                    backgroundColor: "#059669",
                                                    borderColor: "#059669",
                                                    color: "#ffffff",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                }}
                                            >
                                                💳 Settle Payout ({m.unsettledUnits.length} Units)
                                            </button>
                                        )}

                                        {m.pendingConfirmationUnits.length > 0 && (
                                            <div
                                                style={{
                                                    padding: "8px 10px",
                                                    backgroundColor: "#fffbeb",
                                                    border: "1px solid #fde68a",
                                                    borderRadius: "6px",
                                                    color: "#92400e",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    textAlign: "center",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "2px",
                                                }}
                                            >
                                                <span>⏳ {m.pendingConfirmationUnits.length} Units Awaiting Mediator Confirmation</span>
                                                <span style={{ fontSize: "11px", color: "#b45309" }}>
                                                    Paid: ₹{m.pendingConfirmationValue.toLocaleString()} (Pending Acceptance)
                                                </span>
                                            </div>
                                        )}

                                        {m.unsettledUnits.length === 0 && m.pendingConfirmationUnits.length === 0 && (
                                            <div
                                                style={{
                                                    padding: "6px 10px",
                                                    backgroundColor: "#ecfdf5",
                                                    border: "1px solid #a7f3d0",
                                                    borderRadius: "6px",
                                                    color: "#047857",
                                                    fontSize: "12px",
                                                    fontWeight: 700,
                                                    textAlign: "center",
                                                }}
                                            >
                                                ✓ All Units Settled & Confirmed
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedMediatorFilter(m.id);
                                                setViewMode("table");
                                            }}
                                            className="table-btn table-btn-outline"
                                            style={{ width: "100%", justifyContent: "center", padding: "6px 8px", fontSize: "12px", fontWeight: 600 }}
                                        >
                                            Inspect {m.name}'s Completed Orders &rarr;
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ORDERS TABLE VIEW */}
            {viewMode === "table" && (
                <div>
                    {/* Filters */}
                    <OrderFilters setAppliedFilters={setAppliedFilters} status="completed" />

                    {/* Data Table or Empty */}
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "50px 0" }}>
                            <h3>Loading completed orders...</h3>
                        </div>
                    ) : filteredOrders.length > 0 ? (
                        <div className="data-table-container">
                            <div className="data-table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Brand</th>
                                            <th>Platform</th>
                                            <th>Price</th>
                                            <th>Executive</th>
                                            <th>Created On</th>
                                            <th>Status</th>
                                            <th>Team Code</th>
                                            <th>Assigned To</th>
                                            <th>Mediator Code</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.map((order) => (
                                            <OrderCard
                                                key={order._id}
                                                order={order}
                                                status="completed"
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state-card">
                            <div className="empty-state-icon">🎉</div>
                            <h3 className="empty-state-title">No Completed Orders Found</h3>
                            <p className="empty-state-text">
                                No completed orders matched your selected filters.
                            </p>
                            <button
                                type="button"
                                className="nav-btn nav-btn-default"
                                onClick={() => setSelectedMediatorFilter("all")}
                            >
                                Reset Mediator Filter
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Settlement Payout Modal */}
            {activeSettlementMediator && (
                <SettlementModal
                    mediator={activeSettlementMediator.mediator}
                    units={activeSettlementMediator.units}
                    onClose={() => setActiveSettlementMediator(null)}
                    onSuccess={(res) => {
                        fetchOrders();
                        setSuccessToast(res.message || "Payout settled successfully!");
                        setTimeout(() => setSuccessToast(""), 4000);
                    }}
                />
            )}

            {/* Success Toast */}
            {successToast && (
                <div
                    style={{
                        position: "fixed",
                        bottom: "24px",
                        right: "24px",
                        backgroundColor: "#059669",
                        color: "#ffffff",
                        padding: "12px 20px",
                        borderRadius: "8px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
                        fontWeight: 600,
                        fontSize: "13.5px",
                        zIndex: 99999,
                        animation: "fadeIn 0.2s ease-out",
                    }}
                >
                    ✓ {successToast}
                </div>
            )}
        </div>
    );
}