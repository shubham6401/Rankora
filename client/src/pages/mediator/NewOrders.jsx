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

    useEffect(() => {
        loadNewOrders();
    }, []);

    const loadNewOrders = async () => {
        try {
            setLoading(true);
            const response = await fetchMediatorNewOrders();
            const fetchedOrders = response.data.orders || [];
            setOrders(fetchedOrders);

            // Initialize row quantities with maximum assigned available
            const initialQty = {};
            fetchedOrders.forEach((o) => {
                const assignedUnits = (o.orderUnits || []).filter((u) => u.status === "assigned");
                initialQty[o._id] = assignedUnits.length || 1;
            });
            setRowQuantities(initialQty);
        } catch (err) {
            console.error("Failed to fetch new orders:", err);
        } finally {
            setLoading(false);
        }
    };

    // Group orders by Executive
    const executiveMap = {};
    orders.forEach((order) => {
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
    const totalOrdersCount = executiveGroups.reduce((acc, g) => acc + g.orders.length, 0);
    const totalUnitsCount = executiveGroups.reduce((acc, g) => acc + g.totalUnits, 0);

    const getSelectedQty = (orderId, maxQty) => {
        return rowQuantities[orderId] !== undefined ? rowQuantities[orderId] : maxQty;
    };

    const handleQtyChange = (orderId, delta, maxQty) => {
        const current = getSelectedQty(orderId, maxQty);
        const next = Math.min(Math.max(1, current + delta), maxQty);
        setRowQuantities((prev) => ({
            ...prev,
            [orderId]: next,
        }));
    };

    const handleManualQtyInput = (orderId, valStr, maxQty) => {
        const parsed = parseInt(valStr, 10);
        if (isNaN(parsed)) {
            setRowQuantities((prev) => ({ ...prev, [orderId]: 1 }));
        } else {
            const clamped = Math.min(Math.max(1, parsed), maxQty);
            setRowQuantities((prev) => ({ ...prev, [orderId]: clamped }));
        }
    };

    // Accept single row selected qty
    const handleRowAccept = async (order) => {
        const assignedUnits = (order.orderUnits || []).filter((u) => u.status === "assigned");
        const maxQty = assignedUnits.length || 1;
        const qty = getSelectedQty(order._id, maxQty);
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

    // Batch Accept All Orders
    const handleAcceptAll = async () => {
        if (totalUnitsCount === 0) return;

        const confirmMsg = `Are you sure you want to Accept ALL ${totalUnitsCount} units across ${totalOrdersCount} orders?\n\nAll units will move immediately to your In-Progress Orders.`;
        if (!window.confirm(confirmMsg)) return;

        try {
            setActionLoading(true);
            // Collect selected quantities for all orders
            const items = orders.map((o) => {
                const assignedUnits = (o.orderUnits || []).filter((u) => u.status === "assigned");
                const maxQty = assignedUnits.length || 1;
                return {
                    orderId: o._id,
                    quantity: getSelectedQty(o._id, maxQty),
                };
            }).filter((i) => i.quantity > 0);

            const res = await batchAcceptOrdersByMediator(items);
            alert(`✓ Success! ${res.data?.totalAccepted || totalUnitsCount} unit(s) accepted and moved to In-Progress Orders.`);
            await loadNewOrders();
        } catch (err) {
            console.error("Batch accept failed:", err);
            alert(err?.response?.data?.message || "Failed to accept all orders");
        } finally {
            setActionLoading(false);
        }
    };

    // Batch Reject All Orders
    const handleRejectAll = async () => {
        if (totalUnitsCount === 0) return;

        const confirmMsg = `Are you sure you want to Reject ALL ${totalUnitsCount} units across ${totalOrdersCount} orders?\n\nAny units with advance payment will require refund proof upload; remaining units will revert to unassigned.`;
        if (!window.confirm(confirmMsg)) return;

        try {
            setActionLoading(true);
            const items = orders.map((o) => {
                const assignedUnits = (o.orderUnits || []).filter((u) => u.status === "assigned");
                const maxQty = assignedUnits.length || 1;
                return {
                    orderId: o._id,
                    quantity: getSelectedQty(o._id, maxQty),
                };
            }).filter((i) => i.quantity > 0);

            const res = await batchRejectOrdersByMediator(items);
            alert(`✓ Processed rejection for ${res.data?.totalRejected || totalUnitsCount} unit(s).`);
            await loadNewOrders();
        } catch (err) {
            console.error("Batch reject failed:", err);
            alert(err?.response?.data?.message || "Failed to reject all orders");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="table-page-container">
                <div className="empty-state-card">
                    <div className="empty-state-icon">⏳</div>
                    <h2 className="empty-state-title">Loading New Assigned Orders...</h2>
                    <p className="empty-state-text">Fetching latest orders assigned to your mediator account.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="table-page-container">
            {/* Global Pipeline Stepper */}
            <PipelineStepper currentStage={2} role="mediator" />

            {/* HERO SECTION WITH TOP BATCH ACTIONS */}
            <div className="table-header-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span className="hero-status-pill pill-warning">
                                Stage 2 • Order Acceptance
                            </span>
                            <span style={{ fontSize: "13px", color: "var(--slate-500)" }}>
                                Review & Confirm Assigned Campaigns
                            </span>
                        </div>
                        <h1 className="hero-main-title">
                            New Assigned Orders
                        </h1>
                        <p className="hero-description">
                            Review units assigned by your Executive. Adjust unit quantity directly in each row, or use top batch buttons to Accept All or Reject All.
                        </p>
                    </div>

                    {/* TOP BATCH ACTIONS */}
                    {totalUnitsCount > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            <button
                                type="button"
                                onClick={handleAcceptAll}
                                disabled={actionLoading}
                                className="app-btn"
                                style={{
                                    backgroundColor: "#10b981",
                                    color: "#ffffff",
                                    padding: "10px 18px",
                                    fontWeight: "700",
                                    fontSize: "14px",
                                    borderRadius: "8px",
                                    border: "none",
                                    cursor: "pointer",
                                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                <span>✓</span>
                                <span>Accept All ({totalUnitsCount} Units)</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleRejectAll}
                                disabled={actionLoading}
                                className="app-btn"
                                style={{
                                    backgroundColor: "#ef4444",
                                    color: "#ffffff",
                                    padding: "10px 18px",
                                    fontWeight: "700",
                                    fontSize: "14px",
                                    borderRadius: "8px",
                                    border: "none",
                                    cursor: "pointer",
                                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.35)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                <span>✕</span>
                                <span>Reject All ({totalUnitsCount} Units)</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* COUNTERS */}
                <div className="stats-row" style={{ marginTop: "18px" }}>
                    <div className="stat-card">
                        <span className="stat-label">Total Assigned Campaigns</span>
                        <span className="stat-value">{totalOrdersCount}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Total Assigned Units</span>
                        <span className="stat-value" style={{ color: "#d97706" }}>{totalUnitsCount}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Supervising Executives</span>
                        <span className="stat-value">{executiveGroups.length}</span>
                    </div>
                </div>
            </div>

            {/* EMPTY STATE */}
            {executiveGroups.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">🎉</div>
                    <h2 className="empty-state-title">No New Orders Pending Review</h2>
                    <p className="empty-state-text">
                        You have no new orders awaiting acceptance. Check your In-Progress Orders or explore other sections.
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
                    {executiveGroups.map((group, groupIdx) => (
                        <div key={groupIdx} className="group-card">
                            {/* EXECUTIVE HEADER */}
                            <div className="group-card-header">
                                <div>
                                    <h2 className="group-title">
                                        👔 Executive: {group.executiveName}
                                    </h2>
                                    <div className="group-meta">
                                        <span>Team Code: <b>{group.teamCode}</b></span>
                                        <span>Orders: <b>{group.orders.length}</b></span>
                                        <span>Units: <b>{group.totalUnits}</b></span>
                                    </div>
                                </div>

                                <div className="group-summary-stats">
                                    <div className="metric-label">Total Value</div>
                                    <div className="group-total-amount">
                                        ₹{group.totalValue.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* ORDERS TABLE WITH INLINE STEPPERS */}
                            <div className="data-table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Brand & Platform</th>
                                            <th>Price / Unit</th>
                                            <th>Assigned Units</th>
                                            <th style={{ minWidth: "150px" }}>Quantity to Process</th>
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
                                            const priceNum = Number(order.price) || 0;
                                            const calculatedRowTotal = priceNum * selectedQty;
                                            const execPaymentSS = assignedUnits.find((u) => u.paymentScreenshot)?.paymentScreenshot;
                                            const execMsg = assignedUnits.find((u) => u.paymentMessage)?.paymentMessage;

                                            return (
                                                <tr key={order._id}>
                                                    {/* Product */}
                                                    <td className="product-name-cell">
                                                        <div style={{ fontWeight: "700", color: "var(--slate-800)" }}>{order.productName}</div>
                                                        {order.season && (
                                                            <span style={{ fontSize: "11px", color: "var(--primary-600)", fontWeight: "600" }}>
                                                                🏷️ {order.season}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Brand & Platform */}
                                                    <td>
                                                        <div style={{ fontWeight: "600" }}>{order.brand}</div>
                                                        <span style={{ fontSize: "11px", color: "var(--slate-500)" }}>{order.orderPlatform}</span>
                                                    </td>

                                                    {/* Price / Unit */}
                                                    <td className="price-pill">₹{order.price}</td>

                                                    {/* Total Assigned Units */}
                                                    <td>
                                                        <span className="qty-pill qty-pill-warning">
                                                            {maxQty} {maxQty === 1 ? "Unit" : "Units"}
                                                        </span>
                                                    </td>

                                                    {/* Inline Quantity Stepper [-] Qty [+] */}
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQtyChange(order._id, -1, maxQty)}
                                                                disabled={selectedQty <= 1 || actionLoading}
                                                                style={{
                                                                    width: "30px",
                                                                    height: "30px",
                                                                    borderRadius: "6px",
                                                                    border: "1px solid #cbd5e1",
                                                                    backgroundColor: "#f1f5f9",
                                                                    color: "#0f172a",
                                                                    fontWeight: "800",
                                                                    fontSize: "14px",
                                                                    cursor: selectedQty <= 1 ? "not-allowed" : "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                }}
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                max={maxQty}
                                                                value={selectedQty}
                                                                onChange={(e) => handleManualQtyInput(order._id, e.target.value, maxQty)}
                                                                style={{
                                                                    width: "50px",
                                                                    height: "30px",
                                                                    textAlign: "center",
                                                                    fontSize: "13px",
                                                                    fontWeight: "800",
                                                                    border: "1px solid #94a3b8",
                                                                    borderRadius: "6px",
                                                                    boxSizing: "border-box",
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQtyChange(order._id, 1, maxQty)}
                                                                disabled={selectedQty >= maxQty || actionLoading}
                                                                style={{
                                                                    width: "30px",
                                                                    height: "30px",
                                                                    borderRadius: "6px",
                                                                    border: "1px solid #cbd5e1",
                                                                    backgroundColor: "#f1f5f9",
                                                                    color: "#0f172a",
                                                                    fontWeight: "800",
                                                                    fontSize: "14px",
                                                                    cursor: selectedQty >= maxQty ? "not-allowed" : "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                }}
                                                            >
                                                                +
                                                            </button>
                                                            <span style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                                                                / {maxQty}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Total Selected Amount */}
                                                    <td className="price-pill" style={{ color: "var(--primary-600)", fontWeight: "800" }}>
                                                        ₹{calculatedRowTotal.toLocaleString()}
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

                                                            {order.productLink ? (
                                                                <a
                                                                    href={order.productLink.startsWith("http") ? order.productLink : `https://${order.productLink}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="table-btn table-btn-outline"
                                                                    style={{ padding: "6px 10px", fontSize: "12px", textDecoration: "none" }}
                                                                    title="Open product link in new tab"
                                                                >
                                                                    🛍️ View Product ↗
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
                    ))}
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