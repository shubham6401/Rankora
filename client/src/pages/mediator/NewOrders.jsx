import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    fetchMediatorNewOrders,
    AcceptOrderByMediator,
    RejectOrderByMediator,
} from "../../services/mediator/orders";
import PipelineStepper from "../../component/layout/PipelineStepper";
import "../../styles/ordersTable.css";
import "../../styles/appLayout.css";

export default function NewOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Details modal state
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [actionQuantity, setActionQuantity] = useState(1);

    // Image zoom modal state
    const [modalImage, setModalImage] = useState(null);

    useEffect(() => {
        loadNewOrders();
    }, []);

    const loadNewOrders = async () => {
        try {
            setLoading(true);
            const response = await fetchMediatorNewOrders();
            setOrders(response.data.orders || []);
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

    const handleOpenDetails = (order) => {
        const assignedUnits = (order.orderUnits || []).filter((u) => u.status === "assigned");
        const availableQty = assignedUnits.length || 1;
        setSelectedOrder(order);
        setActionQuantity(availableQty);
    };

    const handleCloseDetails = () => {
        setSelectedOrder(null);
        setActionQuantity(1);
    };

    const handleAccept = async () => {
        if (!selectedOrder) return;
        const assignedUnits = (selectedOrder.orderUnits || []).filter((u) => u.status === "assigned");
        const maxQty = assignedUnits.length || 1;
        const qty = Math.min(Math.max(1, Number(actionQuantity) || 1), maxQty);
        const priceNum = Number(selectedOrder.price) || 0;
        const totalAmount = priceNum * qty;

        const confirmMsg = `Accept ${qty} unit(s) of "${selectedOrder.productName}"?\nTotal Amount: ₹${totalAmount.toLocaleString()}\n\nThese units will move directly to your In-Progress Orders.`;
        if (!window.confirm(confirmMsg)) return;

        try {
            setActionLoading(true);
            await AcceptOrderByMediator(selectedOrder._id, qty);
            handleCloseDetails();
            alert(`✓ Order Accepted! ${qty} unit(s) moved to In-Progress Orders.`);
            await loadNewOrders();
        } catch (err) {
            console.error("Error accepting order:", err);
            alert(err?.response?.data?.message || "Failed to accept order");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedOrder) return;
        const assignedUnits = (selectedOrder.orderUnits || []).filter((u) => u.status === "assigned");
        const maxQty = assignedUnits.length || 1;
        const qty = Math.min(Math.max(1, Number(actionQuantity) || 1), maxQty);
        const hasPayment = assignedUnits.some((u) => u.paymentScreenshot);
        const priceNum = Number(selectedOrder.price) || 0;
        const totalAmount = priceNum * qty;

        const confirmMsg = hasPayment
            ? `Reject ${qty} unit(s) of "${selectedOrder.productName}"?\nTotal Refund Due to Executive: ₹${totalAmount.toLocaleString()}\n\nThese units will move to your Payment Pending section to submit refund payment proof.`
            : `Reject offer of ${qty} unit(s) of "${selectedOrder.productName}"?\n\nUnits will be returned to the Executive's Unassigned pool for reassignment.`;
        if (!window.confirm(confirmMsg)) return;

        try {
            setActionLoading(true);
            const res = await RejectOrderByMediator(selectedOrder._id, qty);
            handleCloseDetails();
            if (res.data?.refundRequired) {
                if (window.confirm("Order rejected with advance payment attached. Go to Payment Pending section now to upload refund payment proof?")) {
                    navigate("/mediator-pending-payment");
                } else {
                    await loadNewOrders();
                }
            } else {
                alert(`✓ Order offer rejected (${qty} units). Units returned to Executive pool.`);
                await loadNewOrders();
            }
        } catch (err) {
            console.error("Error rejecting order:", err);
            alert(err?.response?.data?.message || "Failed to reject order");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRowAccept = async (order) => {
        const assignedUnits = (order.orderUnits || []).filter((u) => u.status === "assigned");
        const qty = assignedUnits.length || 1;
        const totalAmount = (Number(order.price) || 0) * qty;

        const confirmMsg = `Accept ${qty} unit(s) of "${order.productName}"?\nTotal Value: ₹${totalAmount.toLocaleString()}\n\nThese units will move directly to your In-Progress Orders.`;
        if (!window.confirm(confirmMsg)) return;

        try {
            setActionLoading(true);
            await AcceptOrderByMediator(order._id, qty);
            alert(`✓ Order Accepted! ${qty} unit(s) moved to In-Progress Orders.`);
            await loadNewOrders();
        } catch (err) {
            console.error("Error accepting order:", err);
            alert(err?.response?.data?.message || "Failed to accept order");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRowReject = async (order) => {
        const assignedUnits = (order.orderUnits || []).filter((u) => u.status === "assigned");
        const qty = assignedUnits.length || 1;
        const hasPayment = assignedUnits.some((u) => u.paymentScreenshot);

        const confirmMsg = hasPayment
            ? `Reject ${qty} unit(s) of "${order.productName}"?\nAdvance payment proof is attached, so you will need to submit refund proof in Payment Pending.`
            : `Reject offer of ${qty} unit(s) of "${order.productName}"?\n\nUnits will be returned to the Executive's Unassigned pool.`;
        if (!window.confirm(confirmMsg)) return;

        try {
            setActionLoading(true);
            const res = await RejectOrderByMediator(order._id, qty);
            if (res.data?.refundRequired) {
                if (window.confirm("Order rejected with advance payment. Go to Payment Pending now to upload refund payment proof?")) {
                    navigate("/mediator-pending-payment");
                } else {
                    await loadNewOrders();
                }
            } else {
                alert("✓ Order offer rejected. Units returned to Executive's unassigned pool.");
                await loadNewOrders();
            }
        } catch (err) {
            console.error("Error rejecting order:", err);
            alert(err?.response?.data?.message || "Failed to reject order");
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

    const totalOrdersCount = executiveGroups.reduce((acc, g) => acc + g.orders.length, 0);
    const totalUnitsCount = executiveGroups.reduce((acc, g) => acc + g.totalUnits, 0);

    return (
        <div className="table-page-container">
            {/* Visual Pipeline Stepper */}
            <PipelineStepper role="mediator" />

            {/* TOP HEADER */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge">Stage 1 of Mediator Pipeline</span>
                    <h1 className="table-page-title">
                        📥 Stage 1: New Assigned Offers
                    </h1>
                    <p className="table-page-subtitle">
                        Orders assigned to you grouped executive-wise. Review specifications, attached advance proofs, and accept or reject units.
                    </p>
                </div>
                <div className="table-header-actions">
                    <button
                        onClick={() => navigate("/panel-mediator")}
                        className="nav-btn nav-btn-default"
                    >
                        ← Dashboard
                    </button>
                    <button
                        onClick={() => navigate("/mediator-pending-payment")}
                        className="nav-btn nav-btn-amber"
                    >
                        💳 Payment Pending (Refunds)
                    </button>
                    <button
                        onClick={() => navigate("/mediator-pending-orders")}
                        className="nav-btn nav-btn-primary"
                    >
                        In-Progress Orders →
                    </button>
                </div>
            </div>

            {/* METRICS BANNER */}
            <div className="table-metrics-bar">
                <div className="metric-card">
                    <span className="metric-label">Executives Offering</span>
                    <span className="metric-value metric-value-primary">{executiveGroups.length}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Total Orders Offered</span>
                    <span className="metric-value">{totalOrdersCount}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Total Assigned Units</span>
                    <span className="metric-value metric-value-amber">{totalUnitsCount}</span>
                </div>
            </div>

            {/* EMPTY STATE */}
            {executiveGroups.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">📭</div>
                    <h2 className="empty-state-title">No New Assigned Orders</h2>
                    <p className="empty-state-text">
                        When an executive assigns new products to you, they will appear here grouped executive-wise for your review.
                    </p>
                    <button
                        onClick={() => navigate("/panel-mediator")}
                        className="table-btn table-btn-primary"
                    >
                        Back to Dashboard
                    </button>
                </div>
            ) : (
                /* EXECUTIVE-WISE ORDER GROUPS */
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {executiveGroups.map((group, groupIdx) => (
                        <div key={groupIdx} className="group-card">
                            {/* EXECUTIVE HEADER CARD */}
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
                                    <div className="metric-label">Total Order Value</div>
                                    <div className="group-total-amount">
                                        ₹{group.totalValue.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* ORDERS TABLE */}
                            <div className="data-table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Brand</th>
                                            <th>Platform</th>
                                            <th>Price / Unit</th>
                                            <th>Assigned Qty</th>
                                            <th>Total Amount</th>
                                            <th>Executive Payment</th>
                                            <th style={{ textAlign: "center" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.orders.map((order) => {
                                            const assignedUnits = (order.orderUnits || []).filter((u) => u.status === "assigned");
                                            const count = assignedUnits.length;
                                            const priceNum = Number(order.price) || 0;
                                            const totalAmount = priceNum * count;
                                            const execPaymentSS = assignedUnits.find((u) => u.paymentScreenshot)?.paymentScreenshot;

                                            return (
                                                <tr key={order._id}>
                                                    <td className="product-name-cell">
                                                        {order.productName}
                                                    </td>
                                                    <td>{order.brand}</td>
                                                    <td>{order.orderPlatform}</td>
                                                    <td className="price-pill">₹{order.price}</td>
                                                    <td>
                                                        <span className="qty-pill qty-pill-warning">
                                                            {count} {count === 1 ? "Unit" : "Units"}
                                                        </span>
                                                    </td>
                                                    <td className="price-pill" style={{ color: "var(--primary-600)" }}>
                                                        ₹{totalAmount.toLocaleString()}
                                                    </td>
                                                    <td>
                                                        {execPaymentSS ? (
                                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                <img
                                                                    src={execPaymentSS}
                                                                    alt="Exec Payment Proof"
                                                                    onClick={() => setModalImage(execPaymentSS)}
                                                                    className="proof-thumb"
                                                                    title="Click to zoom"
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
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flexWrap: "wrap" }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRowAccept(order)}
                                                                disabled={actionLoading}
                                                                className="table-btn table-btn-success"
                                                                title="Accept offer into In-Progress Orders"
                                                                style={{ padding: "5px 10px", fontSize: "12px", fontWeight: "700" }}
                                                            >
                                                                ✓ Accept
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRowReject(order)}
                                                                disabled={actionLoading}
                                                                className="table-btn table-btn-outline"
                                                                title="Reject offer and return units to Executive"
                                                                style={{ padding: "5px 9px", fontSize: "12px", color: "#dc2626", borderColor: "#fecaca" }}
                                                            >
                                                                ✕ Reject
                                                            </button>
                                                            {order.productLink ? (
                                                                <a
                                                                    href={order.productLink.startsWith("http") ? order.productLink : `https://${order.productLink}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="table-btn table-btn-outline"
                                                                    style={{ padding: "5px 9px", fontSize: "12px" }}
                                                                    title="Open product link in new tab"
                                                                >
                                                                    🛍️ View Product ↗
                                                                </a>
                                                            ) : null}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenDetails(order)}
                                                                className="table-btn table-btn-primary"
                                                                title="Review offer, select unit quantity, inspect payment proof"
                                                                style={{ padding: "5px 9px", fontSize: "12px" }}
                                                            >
                                                                Review Units ↗
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
                    ))}
                </div>
            )}

            {/* SEE DETAILS MODAL (ACCEPT / REJECT WITH TOTAL AMOUNT & QUANTITY) */}
            {selectedOrder && (() => {
                const assignedUnits = (selectedOrder.orderUnits || []).filter((u) => u.status === "assigned");
                const maxAvailable = assignedUnits.length || 1;
                const priceNum = Number(selectedOrder.price) || 0;
                const currentQty = Math.min(Math.max(1, Number(actionQuantity) || 1), maxAvailable);
                const totalAmount = priceNum * currentQty;
                const execSS = assignedUnits.find((u) => u.paymentScreenshot)?.paymentScreenshot;
                const execMsg = assignedUnits.find((u) => u.paymentMessage)?.paymentMessage;
                const hasPayment = assignedUnits.some((u) => u.paymentScreenshot);

                return (
                    <div
                        onClick={handleCloseDetails}
                        className="detail-modal-overlay"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="detail-modal-card"
                        >
                            {/* MODAL HEADER */}
                            <div className="detail-modal-header">
                                <div>
                                    <h2 className="detail-modal-title">
                                        {selectedOrder.productName}
                                    </h2>
                                    <p className="detail-modal-subtitle">
                                        Offered by Executive: <b>{selectedOrder.executiveName || selectedOrder.createdBy?.name || "Executive"}</b> (Team: {selectedOrder.teamCode || "N/A"})
                                    </p>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    {selectedOrder.productLink && (
                                        <a
                                            href={selectedOrder.productLink.startsWith("http") ? selectedOrder.productLink : `https://${selectedOrder.productLink}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="table-btn table-btn-outline"
                                            style={{ fontSize: "12px", padding: "6px 10px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                            title="Open product link in new tab"
                                        >
                                            🛍️ View Product ↗
                                        </a>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleCloseDetails}
                                        className="table-btn table-btn-outline"
                                        style={{ fontSize: "14px", padding: "6px 10px" }}
                                        title="Close details"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* ORDER SPECS */}
                            <div className="detail-modal-specs">
                                <div className="detail-modal-grid">
                                    <div className="detail-modal-item">
                                        <span className="detail-modal-label">Brand</span>
                                        <span className="detail-modal-val">{selectedOrder.brand}</span>
                                    </div>
                                    <div className="detail-modal-item">
                                        <span className="detail-modal-label">Platform</span>
                                        <span className="detail-modal-val">{selectedOrder.orderPlatform}</span>
                                    </div>
                                    <div className="detail-modal-item">
                                        <span className="detail-modal-label">Price Per Unit</span>
                                        <span className="detail-modal-val">₹{selectedOrder.price}</span>
                                    </div>
                                    <div className="detail-modal-item">
                                        <span className="detail-modal-label">Available Assigned Units</span>
                                        <span className="detail-modal-val">
                                            {maxAvailable}
                                        </span>
                                    </div>
                                    {selectedOrder.orderId && (
                                        <div className="detail-modal-item">
                                            <span className="detail-modal-label">Order Ref / ID</span>
                                            <span className="detail-modal-val">{selectedOrder.orderId}</span>
                                        </div>
                                    )}
                                    {selectedOrder.category && (
                                        <div className="detail-modal-item">
                                            <span className="detail-modal-label">Category</span>
                                            <span className="detail-modal-val">{selectedOrder.category}</span>
                                        </div>
                                    )}
                                </div>
                                {selectedOrder.productLink && (
                                    <div style={{ marginTop: "12px", borderTop: "1px solid var(--slate-200)", paddingTop: "8px" }}>
                                        <a
                                            href={selectedOrder.productLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ color: "var(--primary-600)", fontWeight: "700", textDecoration: "none", fontSize: "13px" }}
                                        >
                                            🔗 View Product Link ↗
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* PAYMENT PROOF (IF EXECUTIVE ATTACHED) */}
                            {execSS && (
                                <div className="detail-modal-payment-proof">
                                    <div className="detail-proof-header">
                                        💳 Executive Payment Proof Attached:
                                    </div>
                                    <div className="detail-proof-body">
                                        <img
                                            src={execSS}
                                            alt="Exec Proof"
                                            onClick={() => setModalImage(execSS)}
                                            className="proof-thumb"
                                            style={{ width: "52px", height: "52px" }}
                                            title="Click to zoom"
                                        />
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => setModalImage(execSS)}
                                                className="table-btn table-btn-outline"
                                                style={{ fontSize: "12px", padding: "4px 8px" }}
                                            >
                                                🔍 View Proof Image
                                            </button>
                                            {execMsg && (
                                                <div style={{ fontSize: "12px", color: "var(--slate-600)", marginTop: "4px" }}>
                                                    <b>Note:</b> {execMsg}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* QUANTITY SELECTOR & DYNAMIC TOTAL AMOUNT */}
                            <div className="qty-stepper-container">
                                <label className="qty-stepper-label">
                                    Select Number of Units (Amount to Accept or Reject):
                                </label>
                                <div className="qty-stepper">
                                    <button
                                        type="button"
                                        onClick={() => setActionQuantity(Math.max(1, currentQty - 1))}
                                        disabled={currentQty <= 1 || actionLoading}
                                        className="qty-stepper-btn"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min={1}
                                        max={maxAvailable}
                                        value={actionQuantity}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            if (!isNaN(val)) {
                                                setActionQuantity(Math.min(Math.max(1, val), maxAvailable));
                                            }
                                        }}
                                        className="qty-stepper-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setActionQuantity(Math.min(maxAvailable, currentQty + 1))}
                                        disabled={currentQty >= maxAvailable || actionLoading}
                                        className="qty-stepper-btn"
                                    >
                                        +
                                    </button>
                                    <span style={{ color: "var(--slate-500)", fontSize: "13px", fontWeight: "600" }}>
                                        out of <b>{maxAvailable}</b> available
                                    </span>
                                </div>

                                {/* PROMINENT TOTAL AMOUNT */}
                                <div className="amount-highlight-box">
                                    <div>
                                        <div className="amount-highlight-label">
                                            Total Calculated Amount:
                                        </div>
                                        <div className="amount-highlight-sub">
                                            ₹{priceNum.toLocaleString()} × {currentQty} {currentQty === 1 ? "Unit" : "Units"}
                                        </div>
                                    </div>
                                    <div className="amount-highlight-value">
                                        ₹{totalAmount.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* ACCEPT & REJECT ACTIONS */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "18px" }}>
                                <button
                                    type="button"
                                    onClick={handleAccept}
                                    disabled={actionLoading}
                                    className="app-btn app-btn-success"
                                    style={{ width: "100%", padding: "14px", fontSize: "15px", fontWeight: "700" }}
                                >
                                    {actionLoading ? "Processing..." : `✓ Accept Order (${currentQty} ${currentQty === 1 ? "Unit" : "Units"}) • ₹${totalAmount.toLocaleString()}`}
                                </button>
                                <div style={{ fontSize: "12px", color: "#16a34a", textAlign: "center", fontWeight: "600", marginTop: "-4px" }}>
                                    Moves units to In-Progress Orders so you can place them on the platform.
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "4px 0" }}>
                                    <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                                    <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700" }}>OR IF UNABLE TO FULFILL</span>
                                    <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleReject}
                                    disabled={actionLoading}
                                    className="app-btn app-btn-outline"
                                    style={{ width: "100%", padding: "11px", fontSize: "13.5px", color: "#dc2626", borderColor: "#fecaca" }}
                                >
                                    {actionLoading
                                        ? "Processing..."
                                        : hasPayment
                                            ? `✕ Reject (${currentQty} Units) & Refund ₹${totalAmount.toLocaleString()} to Executive`
                                            : `✕ Reject Offer (${currentQty} Units) & Return to Executive`}
                                </button>
                                <div style={{ fontSize: "11.5px", color: "#64748b", textAlign: "center", marginTop: "-4px" }}>
                                    {hasPayment
                                        ? "You will be directed to submit the refund payment proof back to the executive."
                                        : "Units will immediately return to the Executive pool for reassignment without refund."}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* FULL IMAGE MODAL PREVIEW */}
            {modalImage && (
                <div
                    onClick={() => setModalImage(null)}
                    className="image-modal-overlay"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="image-modal-content"
                    >
                        <div className="image-modal-header">
                            <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--slate-700)" }}>
                                Payment Proof
                            </span>
                            <button
                                onClick={() => setModalImage(null)}
                                className="image-modal-close-btn"
                            >
                                Close ✕
                            </button>
                        </div>
                        <img
                            src={modalImage}
                            alt="Full Payment Proof"
                            className="image-modal-img"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}