import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    fetchMediatorNewOrders,
    AcceptOrderByMediator,
    RejectOrderByMediator,
    batchAcceptOrdersByMediator,
    batchRejectOrdersByMediator,
} from "../../services/mediator/orders";
import PipelineStepper from "../../component/layout/PipelineStepper";
import "../../styles/ordersTable.css";
import "../../styles/appLayout.css";

export default function NewOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Row-level steppers: { [orderId]: selectedQuantity }
    const [rowQuantities, setRowQuantities] = useState({});

    // Image zoom modal state
    const [modalImage, setModalImage] = useState(null);

    // Optional search filter
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadNewOrders();
    }, []);

    const loadNewOrders = async () => {
        try {
            setLoading(true);
            const response = await fetchMediatorNewOrders();
            const fetchedOrders = response.data.orders || [];
            setOrders(fetchedOrders);

            // Initialize row quantities with maximum assigned available for each order
            const initialQty = {};
            fetchedOrders.forEach((o) => {
                const assignedUnits = (o.orderUnits || []).filter((u) => u.status === "assigned");
                initialQty[o._id] = assignedUnits.length;
            });
            setRowQuantities(initialQty);
        } catch (err) {
            console.error("Failed to fetch new orders:", err);
        } finally {
            setLoading(false);
        }
    };

    // Helper to get selected quantity for an order clamped between 0 and maxQty
    const getSelectedQty = (orderId, maxQty) => {
        if (rowQuantities[orderId] !== undefined) {
            return Math.min(Math.max(0, rowQuantities[orderId]), maxQty);
        }
        return maxQty;
    };

    // Stepper change with +/- button (allows 0)
    const handleQtyChange = (orderId, delta, maxQty) => {
        const current = getSelectedQty(orderId, maxQty);
        const next = Math.min(Math.max(0, current + delta), maxQty);
        setRowQuantities((prev) => ({
            ...prev,
            [orderId]: next,
        }));
    };

    // Manual input typing (allows 0)
    const handleManualQtyInput = (orderId, valStr, maxQty) => {
        if (valStr === "" || valStr === null || valStr === undefined) {
            setRowQuantities((prev) => ({ ...prev, [orderId]: 0 }));
            return;
        }
        const parsed = parseInt(valStr, 10);
        if (isNaN(parsed)) {
            setRowQuantities((prev) => ({ ...prev, [orderId]: 0 }));
        } else {
            const clamped = Math.min(Math.max(0, parsed), maxQty);
            setRowQuantities((prev) => ({ ...prev, [orderId]: clamped }));
        }
    };

    // Set individual row to specific quantity (0 or maxQty)
    const handleSetRowQty = (orderId, qty, maxQty) => {
        const clamped = Math.min(Math.max(0, qty), maxQty);
        setRowQuantities((prev) => ({ ...prev, [orderId]: clamped }));
    };

    // Global: Select All to Max available
    const handleSelectAllMax = () => {
        const next = {};
        orders.forEach((o) => {
            const assignedUnits = (o.orderUnits || []).filter((u) => u.status === "assigned");
            next[o._id] = assignedUnits.length;
        });
        setRowQuantities(next);
    };

    // Global: Clear / Set all to 0
    const handleClearAllZero = () => {
        const next = {};
        orders.forEach((o) => {
            next[o._id] = 0;
        });
        setRowQuantities(next);
    };

    // Group-level: Select all in group to max
    const handleGroupSelectAll = (groupOrders) => {
        setRowQuantities((prev) => {
            const next = { ...prev };
            groupOrders.forEach((o) => {
                const assignedUnits = (o.orderUnits || []).filter((u) => u.status === "assigned");
                next[o._id] = assignedUnits.length;
            });
            return next;
        });
    };

    // Group-level: Set all in group to 0
    const handleGroupClearZero = (groupOrders) => {
        setRowQuantities((prev) => {
            const next = { ...prev };
            groupOrders.forEach((o) => {
                next[o._id] = 0;
            });
            return next;
        });
    };

    // =========================================================================
    // DYNAMIC DERIVED TOTALS (Real-time recalculation as user modifies units)
    // =========================================================================

    // Total maximum possible units across all orders
    const totalMaxUnitsCount = orders.reduce((acc, order) => {
        const assignedUnits = (order.orderUnits || []).filter((u) => u.status === "assigned");
        return acc + assignedUnits.length;
    }, 0);

    // Selected units across all orders (reacts immediately to rowQuantities)
    const selectedUnitsCount = orders.reduce((acc, order) => {
        const assignedUnits = (order.orderUnits || []).filter((u) => u.status === "assigned");
        const maxQty = assignedUnits.length;
        return acc + getSelectedQty(order._id, maxQty);
    }, 0);

    // Number of campaigns that have at least 1 unit selected
    const selectedOrdersCount = orders.filter((order) => {
        const assignedUnits = (order.orderUnits || []).filter((u) => u.status === "assigned");
        const maxQty = assignedUnits.length;
        return getSelectedQty(order._id, maxQty) > 0;
    }).length;

    // Total monetary value of selected units
    const selectedTotalValue = orders.reduce((acc, order) => {
        const assignedUnits = (order.orderUnits || []).filter((u) => u.status === "assigned");
        const maxQty = assignedUnits.length;
        const qty = getSelectedQty(order._id, maxQty);
        return acc + (Number(order.price) || 0) * qty;
    }, 0);

    // Filter orders if search query entered
    const filteredOrders = orders.filter((order) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const prod = (order.productName || "").toLowerCase();
        const brand = (order.brand || "").toLowerCase();
        const platform = (order.orderPlatform || "").toLowerCase();
        const exec = (order.executiveName || order.createdBy?.name || "").toLowerCase();
        const team = (order.teamCode || order.createdBy?.teamCode || "").toLowerCase();
        return prod.includes(q) || brand.includes(q) || platform.includes(q) || exec.includes(q) || team.includes(q);
    });

    // Group orders by Executive
    const executiveMap = {};
    filteredOrders.forEach((order) => {
        const execName = order.executiveName || order.createdBy?.name || "Assigned Executive";
        const teamCode = order.teamCode || order.createdBy?.teamCode || "N/A";
        const key = `${execName}_${teamCode}`;

        if (!executiveMap[key]) {
            executiveMap[key] = {
                executiveName: execName,
                teamCode: teamCode,
                orders: [],
                totalUnits: 0,
                totalValue: 0,
            };
        }

        const assignedUnits = (order.orderUnits || []).filter((u) => u.status === "assigned");
        if (assignedUnits.length > 0) {
            executiveMap[key].orders.push(order);
            executiveMap[key].totalUnits += assignedUnits.length;
            executiveMap[key].totalValue += (Number(order.price) || 0) * assignedUnits.length;
        }
    });

    const executiveGroups = Object.values(executiveMap).filter((g) => g.orders.length > 0);

    // =========================================================================
    // ACTION HANDLERS
    // =========================================================================

    // Accept single row selected qty
    const handleRowAccept = async (order) => {
        const assignedUnits = (order.orderUnits || []).filter((u) => u.status === "assigned");
        const maxQty = assignedUnits.length || 1;
        const qty = getSelectedQty(order._id, maxQty);

        if (qty <= 0) {
            alert("Quantity is 0. Please select at least 1 unit to accept this order.");
            return;
        }

        const totalAmount = (Number(order.price) || 0) * qty;
        const confirmMsg = `Accept ${qty} of ${maxQty} unit(s) of "${order.productName}"?\nTotal Order Value: ₹${totalAmount.toLocaleString()}\n\nThese units will move directly to your In-Progress Orders.`;
        if (!window.confirm(confirmMsg)) return;

        try {
            setActionLoading(true);
            await AcceptOrderByMediator(order._id, qty);
            alert(`✓ Accepted ${qty} unit(s)! Moved to In-Progress Orders.`);
            await loadNewOrders();
        } catch (err) {
            console.error("Error accepting order:", err);
            alert(err?.response?.data?.message || "Failed to accept order");
        } finally {
            setActionLoading(false);
        }
    };

    // Reject single row selected qty
    const handleRowReject = async (order) => {
        const assignedUnits = (order.orderUnits || []).filter((u) => u.status === "assigned");
        const maxQty = assignedUnits.length || 1;
        const qty = getSelectedQty(order._id, maxQty);

        if (qty <= 0) {
            alert("Quantity is 0. Please select at least 1 unit to reject this offer.");
            return;
        }

        const hasPayment = assignedUnits.slice(0, qty).some((u) => u.paymentScreenshot);
        const totalAmount = (Number(order.price) || 0) * qty;

        const confirmMsg = hasPayment
            ? `Reject ${qty} unit(s) of "${order.productName}"?\nTotal Refund Due to Executive: ₹${totalAmount.toLocaleString()}\n\nBecause advance payment proof is attached, you will be able to upload refund payment proof in the Return Refunds section.`
            : `Reject offer of ${qty} unit(s) of "${order.productName}"?\n\nUnits will be returned to the Executive's Unassigned pool.`;
        if (!window.confirm(confirmMsg)) return;

        try {
            setActionLoading(true);
            const res = await RejectOrderByMediator(order._id, qty);
            if (res.data?.refundRequired) {
                alert(`✓ Order offer rejected (${qty} unit(s)). Advance payment was attached, so you can upload the refund proof anytime in Return Refunds.`);
            } else {
                alert(`✓ Order offer rejected (${qty} unit(s)). Units returned to Executive pool.`);
            }
            await loadNewOrders();
        } catch (err) {
            console.error("Error rejecting order:", err);
            alert(err?.response?.data?.message || "Failed to reject order");
        } finally {
            setActionLoading(false);
        }
    };

    // Batch Accept Selected Orders (dynamically processes selected quantities > 0)
    const handleAcceptAll = async () => {
        if (selectedUnitsCount === 0) {
            alert("No units are currently selected. Please select at least 1 unit to accept.");
            return;
        }

        const isFullAccept = selectedUnitsCount === totalMaxUnitsCount;
        const confirmMsg = isFullAccept
            ? `Are you sure you want to Accept ALL ${selectedUnitsCount} unit(s) across ${selectedOrdersCount} campaign(s)?\nTotal Value: ₹${selectedTotalValue.toLocaleString()}\n\nAll units will move immediately to your In-Progress Orders.`
            : `Are you sure you want to Accept ${selectedUnitsCount} SELECTED unit(s) across ${selectedOrdersCount} campaign(s) (leaving ${totalMaxUnitsCount - selectedUnitsCount} unit(s) unselected)?\nTotal Selected Value: ₹${selectedTotalValue.toLocaleString()}\n\nSelected units will move immediately to your In-Progress Orders.`;

        if (!window.confirm(confirmMsg)) return;

        try {
            setActionLoading(true);
            // Collect selected quantities for orders where selected quantity > 0
            const items = orders.map((o) => {
                const assignedUnits = (o.orderUnits || []).filter((u) => u.status === "assigned");
                const maxQty = assignedUnits.length;
                return {
                    orderId: o._id,
                    quantity: getSelectedQty(o._id, maxQty),
                };
            }).filter((i) => i.quantity > 0);

            const res = await batchAcceptOrdersByMediator(items);
            alert(`✓ Success! ${res.data?.totalAccepted || selectedUnitsCount} unit(s) accepted and moved to In-Progress Orders.`);
            await loadNewOrders();
        } catch (err) {
            console.error("Batch accept failed:", err);
            alert(err?.response?.data?.message || "Failed to accept orders");
        } finally {
            setActionLoading(false);
        }
    };

    // Batch Reject Selected Orders
    const handleRejectAll = async () => {
        if (selectedUnitsCount === 0) {
            alert("No units are currently selected. Please select at least 1 unit to reject.");
            return;
        }

        const isFullReject = selectedUnitsCount === totalMaxUnitsCount;
        const confirmMsg = isFullReject
            ? `Are you sure you want to Reject ALL ${selectedUnitsCount} unit(s) across ${selectedOrdersCount} campaign(s)?\n\nAny units with advance payment will require refund proof upload; remaining units will revert to unassigned.`
            : `Are you sure you want to Reject ${selectedUnitsCount} SELECTED unit(s) across ${selectedOrdersCount} campaign(s)?\n\nAny units with advance payment will require refund proof upload; remaining units will revert to unassigned.`;

        if (!window.confirm(confirmMsg)) return;

        try {
            setActionLoading(true);
            const items = orders.map((o) => {
                const assignedUnits = (o.orderUnits || []).filter((u) => u.status === "assigned");
                const maxQty = assignedUnits.length;
                return {
                    orderId: o._id,
                    quantity: getSelectedQty(o._id, maxQty),
                };
            }).filter((i) => i.quantity > 0);

            const res = await batchRejectOrdersByMediator(items);
            alert(`✓ Processed rejection for ${res.data?.totalRejected || selectedUnitsCount} unit(s).`);
            await loadNewOrders();
        } catch (err) {
            console.error("Batch reject failed:", err);
            alert(err?.response?.data?.message || "Failed to reject orders");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="table-page-container">
                <div className="empty-state-card">
                    <div className="empty-state-icon">⏳</div>
                    <h2 className="empty-state-title">Loading New Assigned Campaigns...</h2>
                    <p className="empty-state-text">Fetching live campaign allocations from your executive team.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="table-page-container">
            {/* Global Pipeline Stepper */}
            <PipelineStepper role="mediator" />

            {/* HERO SECTION WITH DYNAMIC BATCH ACTIONS */}
            <div className="new-orders-batch-hero">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
                    <div style={{ maxWidth: "600px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span className="hero-status-pill pill-warning" style={{ fontWeight: "700" }}>
                                Stage 1 • New Offers
                            </span>
                            <span style={{ fontSize: "13px", color: "var(--slate-500)", fontWeight: "500" }}>
                                Review & Allocate Units
                            </span>
                        </div>
                        <h1 className="hero-main-title" style={{ fontSize: "24px", fontWeight: "800", margin: "0 0 6px 0" }}>
                            Campaign Assignment Review
                        </h1>
                        <p className="hero-description" style={{ fontSize: "13.5px", color: "var(--slate-600)", margin: 0, lineHeight: 1.5 }}>
                            Fine-tune unit quantities for each campaign row. You can select any quantity from <b>0 up to max assigned</b>. Row counts automatically synchronize with the batch action buttons below.
                        </p>
                    </div>

                    {/* TOP BATCH & SELECTION TOOLBAR */}
                    {totalMaxUnitsCount > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                            {/* Quick Select Buttons */}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--slate-500)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                    Quick Select:
                                </span>
                                <button
                                    type="button"
                                    onClick={handleSelectAllMax}
                                    className="btn-quick-toggle"
                                    title="Set all campaign units to maximum assigned"
                                >
                                    ⚡ All ({totalMaxUnitsCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearAllZero}
                                    className="btn-quick-toggle"
                                    title="Set all campaign units to 0 (exclude all)"
                                >
                                    ⭕ Clear All (0)
                                </button>
                            </div>

                            {/* Batch Action Buttons */}
                            <div className="batch-actions-cluster">
                                <button
                                    type="button"
                                    onClick={handleAcceptAll}
                                    disabled={actionLoading || selectedUnitsCount === 0}
                                    className="btn-batch-accept"
                                    title={selectedUnitsCount === 0 ? "Select at least 1 unit to accept" : `Accept ${selectedUnitsCount} selected unit(s)`}
                                >
                                    <span>✓</span>
                                    <span>
                                        {selectedUnitsCount === 0
                                            ? "Accept (0 Selected)"
                                            : selectedUnitsCount === totalMaxUnitsCount
                                                ? `Accept All (${selectedUnitsCount} Units)`
                                                : `Accept Selected (${selectedUnitsCount} of ${totalMaxUnitsCount} Units)`
                                        }
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleRejectAll}
                                    disabled={actionLoading || selectedUnitsCount === 0}
                                    className="btn-batch-reject"
                                    title={selectedUnitsCount === 0 ? "Select at least 1 unit to reject" : `Reject ${selectedUnitsCount} selected unit(s)`}
                                >
                                    <span>✕</span>
                                    <span>
                                        {selectedUnitsCount === 0
                                            ? "Reject (0 Selected)"
                                            : selectedUnitsCount === totalMaxUnitsCount
                                                ? `Reject All (${selectedUnitsCount} Units)`
                                                : `Reject Selected (${selectedUnitsCount} of ${totalMaxUnitsCount} Units)`
                                        }
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* DYNAMIC METRICS CARDS */}
                <div className="table-metrics-bar" style={{ marginTop: "20px", marginBottom: "0" }}>
                    <div className="metric-card" style={{ borderColor: "#cbd5e1" }}>
                        <span className="metric-label">Total Assigned Units</span>
                        <span className="metric-value" style={{ color: "var(--slate-800)" }}>
                            {totalMaxUnitsCount} <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--slate-500)" }}>units</span>
                        </span>
                    </div>

                    <div className="metric-card" style={{
                        borderColor: selectedUnitsCount > 0 ? "#86efac" : "#e2e8f0",
                        background: selectedUnitsCount > 0 ? "#f0fdf4" : "#ffffff"
                    }}>
                        <span className="metric-label" style={{ color: selectedUnitsCount > 0 ? "#15803d" : "var(--slate-500)" }}>
                            Selected to Accept
                        </span>
                        <span className="metric-value" style={{ color: selectedUnitsCount > 0 ? "#16a34a" : "#94a3b8" }}>
                            {selectedUnitsCount} <span style={{ fontSize: "14px", fontWeight: "600" }}>/ {totalMaxUnitsCount}</span>
                        </span>
                    </div>

                    <div className="metric-card" style={{ borderColor: "#cbd5e1" }}>
                        <span className="metric-label">Campaigns Selected</span>
                        <span className="metric-value" style={{ color: "#2563eb" }}>
                            {selectedOrdersCount} <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--slate-500)" }}>/ {orders.length}</span>
                        </span>
                    </div>

                    <div className="metric-card" style={{ borderColor: "#cbd5e1" }}>
                        <span className="metric-label">Selected Total Value</span>
                        <span className="metric-value" style={{ color: "#0f172a" }}>
                            ₹{selectedTotalValue.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* SEARCH & FILTER BAR */}
                {orders.length > 3 && (
                    <div style={{ marginTop: "16px", display: "flex", gap: "10px", alignItems: "center" }}>
                        <div style={{ position: "relative", flex: "1", maxWidth: "360px" }}>
                            <input
                                type="text"
                                placeholder="🔍 Filter by product, brand, platform or executive..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px 12px 8px 32px",
                                    fontSize: "13px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--slate-300)",
                                    outline: "none",
                                    background: "#ffffff",
                                    boxSizing: "border-box",
                                }}
                            />
                            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: "var(--slate-400)", pointerEvents: "none" }}>
                                🔎
                            </span>
                        </div>
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="btn-quick-toggle"
                                style={{ padding: "7px 12px" }}
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* EMPTY STATE */}
            {executiveGroups.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">🎉</div>
                    <h2 className="empty-state-title">No New Orders Pending Review</h2>
                    <p className="empty-state-text">
                        {orders.length > 0 && searchQuery
                            ? "No campaigns matched your search filter. Try clearing the filter above."
                            : "You have no new campaign offers awaiting review. Check your In-Progress Orders to manage ongoing work."
                        }
                    </p>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "16px" }}>
                        <button
                            type="button"
                            className="table-btn table-btn-primary"
                            onClick={() => navigate("/mediator-pending-orders")}
                        >
                            View In-Progress Orders →
                        </button>
                    </div>
                </div>
            ) : (
                /* EXECUTIVE-WISE ORDER GROUPS */
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {executiveGroups.map((group, groupIdx) => {
                        // Calculate group-level real-time selected metrics
                        const groupMaxUnits = group.orders.reduce((acc, o) => {
                            return acc + (o.orderUnits || []).filter((u) => u.status === "assigned").length;
                        }, 0);

                        const groupSelectedUnits = group.orders.reduce((acc, o) => {
                            const maxQty = (o.orderUnits || []).filter((u) => u.status === "assigned").length;
                            return acc + getSelectedQty(o._id, maxQty);
                        }, 0);

                        const groupSelectedValue = group.orders.reduce((acc, o) => {
                            const maxQty = (o.orderUnits || []).filter((u) => u.status === "assigned").length;
                            return acc + (Number(o.price) || 0) * getSelectedQty(o._id, maxQty);
                        }, 0);

                        return (
                            <div key={groupIdx} className="group-card" style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
                                {/* EXECUTIVE HEADER */}
                                <div className="group-card-header" style={{ padding: "16px 20px", background: "#f8fafc" }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                            <h2 className="group-title" style={{ margin: 0, fontSize: "17px", display: "flex", alignItems: "center", gap: "6px" }}>
                                                <span>👔 Executive:</span>
                                                <span style={{ color: "#1e293b" }}>{group.executiveName}</span>
                                            </h2>
                                            <span
                                                style={{
                                                    background: "#f5f3ff",
                                                    color: "#7c3aed",
                                                    border: "1px solid #ddd6fe",
                                                    fontFamily: "monospace",
                                                    fontWeight: "700",
                                                    fontSize: "12px",
                                                    padding: "2px 8px",
                                                    borderRadius: "6px"
                                                }}
                                            >
                                                Team: {group.teamCode}
                                            </span>
                                        </div>

                                        <div className="group-meta" style={{ marginTop: "6px", display: "flex", gap: "14px", fontSize: "12.5px" }}>
                                            <span>Campaigns: <b>{group.orders.length}</b></span>
                                            <span>
                                                Units: <b style={{ color: groupSelectedUnits > 0 ? "#16a34a" : "#64748b" }}>{groupSelectedUnits}</b> / {groupMaxUnits} selected
                                            </span>
                                            <span>
                                                Selected Value: <b style={{ color: "#0f172a" }}>₹{groupSelectedValue.toLocaleString()}</b>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Group Quick Select Buttons */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                        <button
                                            type="button"
                                            onClick={() => handleGroupSelectAll(group.orders)}
                                            className="stepper-shortcut-btn"
                                            style={{ padding: "5px 10px", fontSize: "11.5px" }}
                                            title="Select all units for this executive"
                                        >
                                            ⚡ Select All ({groupMaxUnits})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleGroupClearZero(group.orders)}
                                            className="stepper-shortcut-btn"
                                            style={{ padding: "5px 10px", fontSize: "11.5px" }}
                                            title="Set all units for this executive to 0"
                                        >
                                            ⭕ Clear (0)
                                        </button>
                                    </div>
                                </div>

                                {/* ORDERS TABLE WITH REAL-TIME INTERACTIVE STEPPERS */}
                                <div className="data-table-responsive">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Brand & Platform</th>
                                                <th>Price / Unit</th>
                                                <th>Assigned</th>
                                                <th style={{ minWidth: "210px" }}>Quantity to Process</th>
                                                <th>Total Selected</th>
                                                <th>Payment Proof</th>
                                                <th style={{ textAlign: "center", minWidth: "220px" }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.orders.map((order) => {
                                                const assignedUnits = (order.orderUnits || []).filter((u) => u.status === "assigned");
                                                const maxQty = assignedUnits.length;
                                                const selectedQty = getSelectedQty(order._id, maxQty);
                                                const isZero = selectedQty === 0;
                                                const priceNum = Number(order.price) || 0;
                                                const calculatedRowTotal = priceNum * selectedQty;
                                                const execPaymentSS = assignedUnits.find((u) => u.paymentScreenshot)?.paymentScreenshot;
                                                const execMsg = assignedUnits.find((u) => u.paymentMessage)?.paymentMessage;

                                                return (
                                                    <tr key={order._id} className={isZero ? "row-excluded" : "row-active"}>
                                                        {/* Product */}
                                                        <td className="product-name-cell">
                                                            <div style={{ fontWeight: "700", color: isZero ? "var(--slate-500)" : "var(--slate-900)" }}>
                                                                {order.productName}
                                                            </div>
                                                            <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "3px" }}>
                                                                {order.season && (
                                                                    <span style={{ fontSize: "11px", color: "var(--primary-600)", fontWeight: "600" }}>
                                                                        🏷️ {order.season}
                                                                    </span>
                                                                )}
                                                                {isZero && (
                                                                    <span style={{ fontSize: "10.5px", background: "#f1f5f9", color: "#64748b", padding: "1px 6px", borderRadius: "4px", fontWeight: "600" }}>
                                                                        Excluded
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Brand & Platform */}
                                                        <td>
                                                            <div style={{ fontWeight: "600", color: isZero ? "var(--slate-500)" : "var(--slate-800)" }}>
                                                                {order.brand}
                                                            </div>
                                                            <span style={{ fontSize: "11px", color: "var(--slate-500)" }}>{order.orderPlatform}</span>
                                                        </td>

                                                        {/* Price / Unit */}
                                                        <td className="price-pill" style={{ opacity: isZero ? 0.6 : 1 }}>
                                                            ₹{order.price}
                                                        </td>

                                                        {/* Total Assigned Units */}
                                                        <td>
                                                            <span className="qty-pill qty-pill-warning">
                                                                {maxQty} {maxQty === 1 ? "Unit" : "Units"}
                                                            </span>
                                                        </td>

                                                        {/* Inline Quantity Stepper with [0] and [Max] shortcut buttons */}
                                                        <td>
                                                            <div className="stepper-control-group">
                                                                <div className={`stepper-box ${isZero ? "zero-selected" : ""}`}>
                                                                    {/* Minus Button (allows 0) */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQtyChange(order._id, -1, maxQty)}
                                                                        disabled={selectedQty <= 0 || actionLoading}
                                                                        className="stepper-btn"
                                                                        title="Decrease quantity (can set to 0 to exclude)"
                                                                    >
                                                                        −
                                                                    </button>

                                                                    {/* Number Input (allows 0) */}
                                                                    <input
                                                                        type="number"
                                                                        min={0}
                                                                        max={maxQty}
                                                                        value={selectedQty}
                                                                        onFocus={(e) => e.target.select()}
                                                                        onChange={(e) => handleManualQtyInput(order._id, e.target.value, maxQty)}
                                                                        className="stepper-input"
                                                                        title={`Enter quantity (0 to ${maxQty})`}
                                                                    />

                                                                    {/* Plus Button */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQtyChange(order._id, 1, maxQty)}
                                                                        disabled={selectedQty >= maxQty || actionLoading}
                                                                        className="stepper-btn"
                                                                        title="Increase quantity"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>

                                                                <span style={{ fontSize: "11.5px", color: "var(--slate-500)", fontWeight: "600" }}>
                                                                    / {maxQty}
                                                                </span>

                                                                {/* Quick 0 and Max shortcut pills */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSetRowQty(order._id, 0, maxQty)}
                                                                    className={`stepper-shortcut-btn ${isZero ? "active-val" : ""}`}
                                                                    title="Set to 0 (Exclude this campaign)"
                                                                >
                                                                    0
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSetRowQty(order._id, maxQty, maxQty)}
                                                                    className={`stepper-shortcut-btn ${selectedQty === maxQty ? "active-val" : ""}`}
                                                                    title={`Set to max (${maxQty})`}
                                                                >
                                                                    Max
                                                                </button>
                                                            </div>
                                                        </td>

                                                        {/* Total Selected Amount */}
                                                        <td className="price-pill">
                                                            {isZero ? (
                                                                <span style={{ color: "#94a3b8", fontWeight: "600" }}>
                                                                    ₹0 <span style={{ fontSize: "11px" }}>(Excluded)</span>
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: "#16a34a", fontWeight: "800" }}>
                                                                    ₹{calculatedRowTotal.toLocaleString()}
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Executive Payment Proof */}
                                                        <td>
                                                            {execPaymentSS ? (
                                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                    <img
                                                                        src={execPaymentSS}
                                                                        alt="Exec Payment Proof"
                                                                        onClick={() => setModalImage(execPaymentSS)}
                                                                        className="proof-thumb"
                                                                        title="Click to zoom screenshot"
                                                                        style={{ cursor: "pointer" }}
                                                                    />
                                                                    <span className="status-badge status-badge-completed">
                                                                        ✓ Paid
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span style={{ fontSize: "12px", color: "var(--slate-400)", fontStyle: "italic" }}>
                                                                    No Proof
                                                                </span>
                                                            )}
                                                            {execMsg && (
                                                                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                                                    💬 {execMsg}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Row Actions: Accept, Reject, View Product */}
                                                        <td style={{ textAlign: "center" }}>
                                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flexWrap: "wrap" }}>
                                                                {isZero ? (
                                                                    <button
                                                                        type="button"
                                                                        disabled
                                                                        className="table-btn"
                                                                        style={{
                                                                            padding: "6px 12px",
                                                                            fontSize: "12px",
                                                                            fontWeight: "600",
                                                                            background: "#f1f5f9",
                                                                            color: "#94a3b8",
                                                                            borderColor: "#e2e8f0",
                                                                            cursor: "not-allowed"
                                                                        }}
                                                                        title="Set quantity greater than 0 to accept"
                                                                    >
                                                                        0 Selected
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRowAccept(order)}
                                                                        disabled={actionLoading}
                                                                        className="table-btn table-btn-success"
                                                                        style={{ padding: "6px 12px", fontSize: "12px", fontWeight: "700" }}
                                                                        title={`Accept ${selectedQty} unit(s)`}
                                                                    >
                                                                        ✓ Accept ({selectedQty})
                                                                    </button>
                                                                )}

                                                                {isZero ? (
                                                                    <button
                                                                        type="button"
                                                                        disabled
                                                                        className="table-btn"
                                                                        style={{
                                                                            padding: "6px 10px",
                                                                            fontSize: "12px",
                                                                            background: "#f8fafc",
                                                                            color: "#cbd5e1",
                                                                            borderColor: "#e2e8f0",
                                                                            cursor: "not-allowed"
                                                                        }}
                                                                        title="Set quantity greater than 0 to reject"
                                                                    >
                                                                        ✕ Reject
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRowReject(order)}
                                                                        disabled={actionLoading}
                                                                        className="table-btn table-btn-outline"
                                                                        style={{ padding: "6px 10px", fontSize: "12px", color: "#dc2626", borderColor: "#fecaca" }}
                                                                        title={`Reject ${selectedQty} unit(s)`}
                                                                    >
                                                                        ✕ Reject ({selectedQty})
                                                                    </button>
                                                                )}

                                                                {order.productLink ? (
                                                                    <a
                                                                        href={order.productLink.startsWith("http") ? order.productLink : `https://${order.productLink}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="table-btn table-btn-outline"
                                                                        style={{ padding: "6px 10px", fontSize: "12px", textDecoration: "none" }}
                                                                        title="Open product link in new tab"
                                                                    >
                                                                        🛍️ View ↗
                                                                    </a>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* IMAGE ZOOM MODAL */}
            {modalImage && (
                <div
                    onClick={() => setModalImage(null)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "20px",
                        cursor: "zoom-out",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: "90%",
                            maxHeight: "90%",
                            backgroundColor: "white",
                            borderRadius: "12px",
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
                        }}
                    >
                        <img
                            src={modalImage}
                            alt="Payment Proof Zoomed"
                            style={{
                                maxWidth: "100%",
                                maxHeight: "75vh",
                                objectFit: "contain",
                                borderRadius: "8px",
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setModalImage(null)}
                            className="table-btn table-btn-outline"
                            style={{ marginTop: "12px" }}
                        >
                            Close Image
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}