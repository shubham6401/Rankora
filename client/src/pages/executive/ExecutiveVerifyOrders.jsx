import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllExecutivePendingVerificationOrders } from "../../services/executive/order";
import PipelineStepper from "../../component/layout/PipelineStepper";
import "../../styles/ordersTable.css";

export default function ExecutiveVerifyOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMediator, setSelectedMediator] = useState("all");
    const [selectedBrand, setSelectedBrand] = useState("all");

    useEffect(() => {
        loadVerificationOrders();
    }, []);

    const loadVerificationOrders = async () => {
        try {
            setLoading(true);
            const res = await fetchAllExecutivePendingVerificationOrders();
            setOrders(res.data?.orders || []);
        } catch (err) {
            console.error("Error loading verification orders:", err);
        } finally {
            setLoading(false);
        }
    };

    // Extract unique mediators for filter dropdown
    const mediatorMap = {};
    const brandSet = new Set();

    orders.forEach((order) => {
        if (order.brand) brandSet.add(order.brand.trim());
        (order.orderUnits || []).forEach((u) => {
            if (u.status === "pending_verification" && u.mediatorId) {
                const id = u.mediatorId._id || u.mediatorId;
                if (!mediatorMap[id]) {
                    mediatorMap[id] = {
                        id: id.toString(),
                        name: u.mediatorId.name || "Mediator",
                        code: u.mediatorId.mediatorCode || "N/A",
                    };
                }
            }
        });
    });

    const mediatorList = Object.values(mediatorMap);
    const brandList = Array.from(brandSet).sort();

    // Filter orders order-wise
    const filteredOrders = orders.filter((order) => {
        const pendingUnits = (order.orderUnits || []).filter(
            (u) => u.status === "pending_verification"
        );
        if (pendingUnits.length === 0) return false;

        // Mediator filter
        if (selectedMediator !== "all") {
            const hasMed = pendingUnits.some((u) => {
                const mId = u.mediatorId?._id?.toString() || u.mediatorId?.toString();
                return mId === selectedMediator;
            });
            if (!hasMed) return false;
        }

        // Brand filter
        if (selectedBrand !== "all") {
            if ((order.brand || "").toLowerCase() !== selectedBrand.toLowerCase()) {
                return false;
            }
        }

        // Search query filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const pName = (order.productName || "").toLowerCase();
            const brand = (order.brand || "").toLowerCase();
            const platform = (order.orderPlatform || "").toLowerCase();
            const hasUnitMatch = pendingUnits.some((u) => {
                const oId = (u.orderId || "").toLowerCase();
                const rev = (u.reviewerName || "").toLowerCase();
                const mName = (u.mediatorId?.name || "").toLowerCase();
                const mCode = (u.mediatorId?.mediatorCode || "").toLowerCase();
                return oId.includes(q) || rev.includes(q) || mName.includes(q) || mCode.includes(q);
            });
            return pName.includes(q) || brand.includes(q) || platform.includes(q) || hasUnitMatch;
        }

        return true;
    });

    // Aggregate statistics
    const totalPendingOrders = filteredOrders.length;
    const totalPendingUnits = filteredOrders.reduce((sum, order) => {
        return sum + (order.orderUnits || []).filter((u) => u.status === "pending_verification").length;
    }, 0);
    const totalPendingValue = filteredOrders.reduce((sum, order) => {
        const count = (order.orderUnits || []).filter((u) => u.status === "pending_verification").length;
        return sum + (parseFloat(order.price) || 0) * count;
    }, 0);

    const isFiltered = searchQuery.trim() !== "" || selectedMediator !== "all" || selectedBrand !== "all";

    if (loading) {
        return (
            <div className="table-page-container">
                <div className="empty-state-card">
                    <div className="empty-state-icon">⏳</div>
                    <h2 className="empty-state-title">Loading Verification Queue...</h2>
                    <p className="empty-state-text">Fetching order submissions awaiting executive review.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="table-page-container">
            {/* Visual Pipeline Stepper */}
            <PipelineStepper role="executive" />

            {/* Header */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge" style={{ background: "#eef2ff", color: "#4338ca", borderColor: "#c7d2fe" }}>
                        Stage 6 of Executive Pipeline
                    </span>
                    <h1 className="table-page-title">
                        🔍 Verify Deliveries Queue
                    </h1>
                    <p className="table-page-subtitle">
                        Order-wise delivery verification queue. Click <b>Inspect & Verify Details</b> on any order to inspect submitted review screenshots, invoices, and seller feedback proofs without clutter.
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
                        onClick={() => navigate("/executive-pending_refund-order")}
                    >
                        Pending Refund →
                    </button>
                    <button
                        type="button"
                        className="nav-btn nav-btn-primary"
                        onClick={() => navigate("/executive-completed-order")}
                    >
                        Completed Orders →
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="table-metrics-bar">
                <div className="metric-card">
                    <span className="metric-label">Orders to Verify</span>
                    <span className="metric-value metric-value-primary">{totalPendingOrders}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Units Awaiting Review</span>
                    <span className="metric-value" style={{ color: "#4f46e5" }}>
                        {totalPendingUnits} {totalPendingUnits === 1 ? "Unit" : "Units"}
                    </span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Total Verification Value</span>
                    <span className="metric-value metric-value-green">₹{totalPendingValue.toLocaleString()}</span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar-card" style={{ marginBottom: "20px" }}>
                <input
                    type="text"
                    placeholder="🔍 Search product, brand, reviewer, order ID, mediator..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="filter-input-text"
                    style={{ flex: "2 1 240px", minWidth: "180px" }}
                />

                <select
                    value={selectedMediator}
                    onChange={(e) => setSelectedMediator(e.target.value)}
                    className="filter-input-text"
                    style={{ flex: "1 1 170px" }}
                >
                    <option value="all">👥 All Mediators ({mediatorList.length})</option>
                    {mediatorList.map((med) => (
                        <option key={med.id} value={med.id}>
                            {med.name} (Code: {med.code})
                        </option>
                    ))}
                </select>

                <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="filter-input-text"
                    style={{ flex: "1 1 150px" }}
                >
                    <option value="all">🏷️ All Brands ({brandList.length})</option>
                    {brandList.map((b) => (
                        <option key={b} value={b}>
                            {b}
                        </option>
                    ))}
                </select>

                {isFiltered && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearchQuery("");
                            setSelectedMediator("all");
                            setSelectedBrand("all");
                        }}
                        className="filter-btn-clear"
                    >
                        ✕ Clear Filters
                    </button>
                )}
            </div>

            {/* ORDER-WISE DATA TABLE */}
            {filteredOrders.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">✓</div>
                    <h2 className="empty-state-title">No Deliveries Awaiting Verification</h2>
                    <p className="empty-state-text">
                        {isFiltered
                            ? "No verification orders match your selected filters."
                            : "All mediator delivery proof submissions have been verified and processed."}
                    </p>
                    {isFiltered ? (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedMediator("all");
                                setSelectedBrand("all");
                            }}
                            className="table-btn table-btn-primary"
                            style={{ marginTop: "10px" }}
                        >
                            Reset Filters
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => navigate("/executive-completed-order")}
                            className="table-btn table-btn-primary"
                            style={{ marginTop: "10px" }}
                        >
                            View Completed Orders Archive →
                        </button>
                    )}
                </div>
            ) : (
                <div className="data-table-container">
                    <div className="data-table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Brand</th>
                                    <th>Platform</th>
                                    <th>Price</th>
                                    <th>Assigned Mediator</th>
                                    <th>Units to Verify</th>
                                    <th>Order ID / Reviewer</th>
                                    <th>Submitted On</th>
                                    <th style={{ textAlign: "center" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => {
                                    const pendingUnits = (order.orderUnits || []).filter(
                                        (u) => u.status === "pending_verification"
                                    );
                                    const count = pendingUnits.length;
                                    const primaryUnit = pendingUnits[0] || {};
                                    const med = primaryUnit.mediatorId || {};
                                    const hasRevision = pendingUnits.some((u) => !!u.verificationRejectionReason);
                                    const revisionUnit = pendingUnits.find((u) => !!u.verificationRejectionReason);
                                    const submittedDate = primaryUnit.submittedForVerificationAt || order.updatedAt || order.createdAt;

                                    return (
                                        <tr key={order._id} className={hasRevision ? "row-revision-alert" : ""}>
                                            <td className="product-name-cell">
                                                <div style={{ fontWeight: 700, color: "var(--slate-900)" }}>
                                                    {order.productName}
                                                </div>
                                                {hasRevision && revisionUnit && (
                                                    <div className="revision-feedback-callout" style={{ marginTop: "4px", maxWidth: "280px" }}>
                                                        <span>⚠️ Revision: "{revisionUnit.verificationRejectionReason}"</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: "var(--slate-700)" }}>
                                                    {order.brand || "Unbranded"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="qty-pill" style={{ background: "#f8fafc", color: "#334155", borderColor: "#cbd5e1" }}>
                                                    {order.orderPlatform || "Online"}
                                                </span>
                                            </td>
                                            <td className="price-pill">
                                                ₹{order.price}
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                    <span style={{ fontWeight: 600, color: "var(--slate-800)" }}>
                                                        {med.name || "Mediator"}
                                                    </span>
                                                    {med.mediatorCode && (
                                                        <span style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                                                            Code: <b>{med.mediatorCode}</b>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                                    <span className="qty-pill qty-pill-warning" style={{ background: "#eef2ff", color: "#4338ca", borderColor: "#c7d2fe" }}>
                                                        {count} {count === 1 ? "Unit" : "Units"}
                                                    </span>
                                                    {hasRevision && (
                                                        <span className="status-badge-revision" style={{ fontSize: "10.5px" }}>
                                                            ⚠️ Revision
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: "12.5px" }}>
                                                    <div style={{ fontWeight: 700, color: "var(--primary-600)" }}>
                                                        {primaryUnit.orderId || order.orderId || "N/A"}
                                                    </div>
                                                    {primaryUnit.reviewerName && (
                                                        <div style={{ color: "var(--slate-500)", fontSize: "11.5px" }}>
                                                            Rev: {primaryUnit.reviewerName}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                                                {new Date(submittedDate).toLocaleDateString()}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                <div className="action-btn-group" style={{ justifyContent: "center", gap: "6px", flexWrap: "wrap" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/order/${order._id}`)}
                                                        className="table-btn table-btn-primary"
                                                        style={{ background: "#4f46e5", fontWeight: 700, whiteSpace: "nowrap" }}
                                                        title="Inspect all 4 proof screenshots in detail and verify or request revision"
                                                    >
                                                        🔍 Inspect & Verify Details →
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
