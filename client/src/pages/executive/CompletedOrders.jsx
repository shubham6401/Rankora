import { useState, useEffect } from "react";
import { fetchAllExecutiveCompletedOrders } from "../../services/executive/order";
import { useNavigate } from "react-router-dom";
import OrderCard from "../../component/executive/OrderCard";
import OrderFilters from "../../component/executive/OrderFilters";
import PipelineStepper from "../../component/layout/PipelineStepper";
import "../../styles/ordersTable.css";

export default function CompletedOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("breakdown"); // "breakdown" | "table"
    const [selectedMediatorFilter, setSelectedMediatorFilter] = useState("all");

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

    orders.forEach((order) => {
        const price = parseFloat(order.price) || 0;
        (order.orderUnits || []).forEach((unit) => {
            if (unit.status === "completed") {
                totalCompletedUnits++;
                totalCompletedValue += price;

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
                            ordersMap: {},
                        };
                    }
                    mediatorBreakdownMap[mId].completedUnits++;
                    mediatorBreakdownMap[mId].totalValue += price;
                    mediatorBreakdownMap[mId].ordersMap[order._id] = order;
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
        .sort((a, b) => b.completedUnits - a.completedUnits);

    const filteredOrders = orders.filter((order) => {
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
                    <span className="table-page-badge" style={{ background: "#f0fdf4", color: "#166534", borderColor: "#bbf7d0" }}>
                        Stage 7 of Executive Pipeline
                    </span>
                    <h1 className="table-page-title">Completed Orders</h1>
                    <p className="table-page-subtitle">
                        Archived orders with verified deliveries, review submissions, and settled refunds. View overall orders or mediator-wise breakdown.
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
                        onClick={() => navigate("/executive-pending-order")}
                    >
                        Pending Orders →
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="table-metrics-bar">
                <div className="metric-card">
                    <span className="metric-label">Completed Orders</span>
                    <span className="metric-value metric-value-primary">{orders.length}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Completed Units</span>
                    <span className="metric-value" style={{ color: "#15803d" }}>
                        {totalCompletedUnits} Units
                    </span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Completed Value</span>
                    <span className="metric-value metric-value-green">
                        ₹{totalCompletedValue.toLocaleString()}
                    </span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Active Mediators</span>
                    <span className="metric-value">{mediatorBreakdownList.length}</span>
                </div>
            </div>

            {/* View Mode Switcher */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginBottom: "16px",
                    padding: "10px 14px",
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                }}
            >
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        type="button"
                        onClick={() => setViewMode("breakdown")}
                        className={`status-pill-btn ${viewMode === "breakdown" ? "active active-completed" : ""}`}
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}
                    >
                        <span>👥</span> Mediator-Wise Breakdown ({mediatorBreakdownList.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("table")}
                        className={`status-pill-btn ${viewMode === "table" ? "active active-assigned" : ""}`}
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}
                    >
                        <span>📋</span> Orders List Table ({orders.length})
                    </button>
                </div>

                {selectedMediatorFilter !== "all" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px" }}>
                        <span>
                            Filtered to Mediator:{" "}
                            <b>
                                {mediatorBreakdownMap[selectedMediatorFilter]?.name} (
                                {mediatorBreakdownMap[selectedMediatorFilter]?.mediatorCode})
                            </b>
                        </span>
                        <button
                            type="button"
                            onClick={() => setSelectedMediatorFilter("all")}
                            style={{
                                border: "none",
                                background: "#fee2e2",
                                color: "#b91c1c",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "11px",
                                fontWeight: 700,
                            }}
                        >
                            Clear ✕
                        </button>
                    </div>
                )}
            </div>

            {/* MEDIATOR-WISE BREAKDOWN VIEW */}
            {viewMode === "breakdown" && (
                <div>
                    {mediatorBreakdownList.length === 0 ? (
                        <div className="empty-state-card">
                            <div className="empty-state-icon">👥</div>
                            <h3 className="empty-state-title">No Mediator Completed Deliveries</h3>
                            <p className="empty-state-text">
                                When mediators complete deliveries and the executive verifies them, the mediator-wise breakdown will appear here.
                            </p>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                                gap: "16px",
                            }}
                        >
                            {mediatorBreakdownList.map((m) => (
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

                                    {/* Action button to filter */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedMediatorFilter(m.id);
                                            setViewMode("table");
                                        }}
                                        className="table-btn table-btn-outline"
                                        style={{ width: "100%", justifyContent: "center", padding: "8px", fontWeight: 600 }}
                                    >
                                        Inspect {m.name}'s Completed Orders &rarr;
                                    </button>
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
        </div>
    );
}