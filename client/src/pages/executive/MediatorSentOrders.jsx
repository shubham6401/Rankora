import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    fetchExecutiveMediatorSentOrders,
    acceptExecutiveMediatorPayment,
} from "../../services/executive/order";
import "../../styles/ordersTable.css";

export default function MediatorSentOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acceptingKey, setAcceptingKey] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const res = await fetchExecutiveMediatorSentOrders();
            setOrders(res.data.orders || []);
        } catch (err) {
            console.error("Error fetching mediator-sent orders:", err);
        } finally {
            setLoading(false);
        }
    };

    // Group mediator sent units by mediator
    const mediatorMap = {};

    orders.forEach((order) => {
        const units = order.orderUnits || [];
        units.forEach((unit) => {
            if (unit.mediatorId) {
                const med = unit.mediatorId;
                const medId = med._id ? med._id.toString() : med.toString();

                if (!mediatorMap[medId]) {
                    mediatorMap[medId] = {
                        mediator: {
                            _id: medId,
                            name: med.name || "Mediator",
                            mediatorCode: med.mediatorCode || "N/A",
                            teamCode: med.teamCode || order.teamCode,
                        },
                        orders: {},
                        totalUnits: 0,
                        totalRefundAmount: 0,
                    };
                }

                if (!mediatorMap[medId].orders[order._id]) {
                    mediatorMap[medId].orders[order._id] = {
                        orderId: order._id,
                        productName: order.productName,
                        brand: order.brand,
                        orderPlatform: order.orderPlatform,
                        price: Number(order.price) || 0,
                        productLink: order.productLink,
                        createdAt: order.createdAt,
                        units: [],
                    };
                }

                mediatorMap[medId].orders[order._id].units.push(unit);
                mediatorMap[medId].totalUnits += 1;
                mediatorMap[medId].totalRefundAmount += Number(order.price) || 0;
            }
        });
    });

    const mediatorGroups = Object.values(mediatorMap).map((group) => ({
        ...group,
        orders: Object.values(group.orders),
    }));

    // Executive Verifying & Accepting Mediator Refund Payment
    const handleAcceptRefund = async (orderId, mediatorId, count, subtotal) => {
        const confirmMsg = `Verify refund payment proof of ₹${subtotal.toLocaleString()} and accept ${count} unit(s)?\n\nThese units will be returned to your Executive Pending Orders (unassigned) for reassignment.`;
        if (!window.confirm(confirmMsg)) return;

        try {
            setAcceptingKey(`${orderId}-${mediatorId}`);
            const res = await acceptExecutiveMediatorPayment(orderId, {
                mediatorId,
                quantity: count,
            });
            alert(res.data.message || "Refund payment verified! Orders returned to Executive Pending Orders.");
            await loadOrders();
        } catch (err) {
            console.error("Error accepting mediator payment:", err);
            alert(err?.response?.data?.message || "Failed to verify and accept refund payment");
        } finally {
            setAcceptingKey(null);
        }
    };

    if (loading) {
        return (
            <div className="table-page-container" style={{ textAlign: "center", padding: "60px 0" }}>
                <h2>Loading Orders Sent by Mediator...</h2>
            </div>
        );
    }

    const totalRefundSum = mediatorGroups.reduce((acc, g) => acc + g.totalRefundAmount, 0);
    const totalReturnedUnits = mediatorGroups.reduce((acc, g) => acc + g.totalUnits, 0);

    return (
        <div className="table-page-container">
            {/* Header */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge">Refund Verification</span>
                    <h1 className="table-page-title">📥 Orders Sent by Mediator</h1>
                    <p className="table-page-subtitle">
                        Review refund payment proofs & notes submitted by mediators for rejected units, then accept to restore units back to Pending Orders.
                    </p>
                </div>
                <div className="table-header-actions">
                    <button
                        type="button"
                        className="nav-btn nav-btn-default"
                        onClick={() => navigate("/dashboard-executive")}
                    >
                        ← Executive Dashboard
                    </button>
                    <button
                        type="button"
                        className="nav-btn nav-btn-primary"
                        onClick={() => navigate("/executive-pending-payment")}
                    >
                        Advance Payments Queue →
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="table-metrics-bar">
                <div className="metric-card">
                    <span className="metric-label">Submitting Mediators</span>
                    <span className="metric-value metric-value-primary">{mediatorGroups.length}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Units Pending Acceptance</span>
                    <span className="metric-value metric-value-amber">{totalReturnedUnits} Units</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Total Refund Remittance</span>
                    <span className="metric-value metric-value-emerald">₹{totalRefundSum.toLocaleString()}</span>
                </div>
            </div>

            {/* Empty State */}
            {mediatorGroups.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">🎉</div>
                    <h3 className="empty-state-title">No Mediator Refund Submissions</h3>
                    <p className="empty-state-text">
                        No orders have been sent back by mediators with refund payment proofs at this moment.
                    </p>
                    <button
                        type="button"
                        className="nav-btn nav-btn-primary"
                        onClick={() => navigate("/executive-pending-order")}
                    >
                        View Pending Orders
                    </button>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {mediatorGroups.map((group) => (
                        <div key={group.mediator._id} className="group-card">
                            {/* Mediator Header */}
                            <div className="group-card-header">
                                <div>
                                    <h2 className="group-title">Mediator: {group.mediator.name}</h2>
                                    <div className="group-meta">
                                        <span>Code: <b>{group.mediator.mediatorCode}</b></span>
                                        <span>Team: <b>{group.mediator.teamCode}</b></span>
                                    </div>
                                </div>
                                <div className="group-summary-stats">
                                    <div style={{ fontSize: "13px", color: "var(--slate-500)" }}>
                                        Total Units Returned: <b>{group.totalUnits}</b>
                                    </div>
                                    <div className="group-total-amount" style={{ color: "#ea580c" }}>
                                        Total Refund Due: ₹{group.totalRefundAmount.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Orders List */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {group.orders.map((ord) => {
                                    const unitCount = ord.units.length;
                                    const subtotal = ord.price * unitCount;
                                    const firstUnitWithProof = ord.units.find((u) => u.mediatorPaymentScreenshot) || ord.units[0];
                                    const refundProofUrl = firstUnitWithProof?.mediatorPaymentScreenshot;
                                    const mediatorMsg = firstUnitWithProof?.mediatorMessage;
                                    const refundSentAt = firstUnitWithProof?.mediatorPaymentSentAt;
                                    const rejectedAt = firstUnitWithProof?.rejectedAt;
                                    const isAccepting = acceptingKey === `${ord.orderId}-${group.mediator._id}`;

                                    return (
                                        <div
                                            key={ord.orderId}
                                            style={{
                                                border: "1px solid #fed7aa",
                                                borderRadius: "8px",
                                                padding: "16px",
                                                backgroundColor: "#fffaf0",
                                            }}
                                        >
                                            {/* Product Info */}
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                                                <div>
                                                    <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "var(--slate-900)" }}>
                                                        {ord.productName}
                                                    </h3>
                                                    <div style={{ fontSize: "13px", color: "var(--slate-500)" }}>
                                                        Brand: <b>{ord.brand}</b> | Platform: <b>{ord.orderPlatform}</b> | Price: <b>₹{ord.price}</b>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <span className="qty-pill qty-pill-warning">
                                                            Rejected: {unitCount} Unit(s)
                                                        </span>
                                                        <span className="status-badge" style={{ background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }}>
                                                            ⏳ Pending Verification
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: "16px", fontWeight: "bold", color: "#c2410c" }}>
                                                        Refund Amount: ₹{subtotal.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Proof and Message Box */}
                                            <div className="proof-upload-box" style={{ background: "#ffffff" }}>
                                                <div className="proof-upload-title" style={{ color: "#9a3412", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <span>💳 Mediator Refund Payment Proof & Message</span>
                                                    <span className="status-badge" style={{ background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe", fontSize: "11px" }}>
                                                        ⏳ Pending Verification
                                                    </span>
                                                </div>

                                                <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", alignItems: "flex-start" }}>
                                                    {refundProofUrl ? (
                                                        <div style={{ cursor: "pointer", display: "inline-block" }} onClick={() => setPreviewImage(refundProofUrl)}>
                                                            <img
                                                                src={refundProofUrl}
                                                                alt="Mediator Refund Proof"
                                                                className="proof-thumb"
                                                                style={{ width: "120px", height: "100px" }}
                                                            />
                                                            <div style={{ fontSize: "11px", color: "var(--primary-600)", marginTop: "4px" }}>
                                                                🔍 Click to zoom
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ color: "var(--slate-400)", fontSize: "13px", fontStyle: "italic" }}>
                                                            No payment screenshot attached yet.
                                                        </div>
                                                    )}

                                                    <div style={{ flex: 1, minWidth: "220px" }}>
                                                        {mediatorMsg ? (
                                                            <div
                                                                style={{
                                                                    backgroundColor: "#fff7ed",
                                                                    padding: "10px 14px",
                                                                    borderRadius: "6px",
                                                                    border: "1px solid #ffedd5",
                                                                    marginBottom: "8px",
                                                                }}
                                                            >
                                                                <b style={{ color: "#9a3412", fontSize: "13px" }}>Mediator Note:</b>
                                                                <div style={{ color: "var(--slate-700)", fontSize: "13px", marginTop: "4px" }}>
                                                                    {mediatorMsg}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div style={{ color: "var(--slate-400)", fontSize: "13px", fontStyle: "italic", marginBottom: "8px" }}>
                                                                No note provided by mediator.
                                                            </div>
                                                        )}

                                                        <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                                                            {refundSentAt && (
                                                                <div>Refund Proof Sent: <b>{new Date(refundSentAt).toLocaleString()}</b></div>
                                                            )}
                                                            {rejectedAt && (
                                                                <div>Rejected On: <b>{new Date(rejectedAt).toLocaleString()}</b></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                                                <button
                                                    type="button"
                                                    className="form-btn-submit"
                                                    style={{ backgroundColor: "#16a34a", padding: "9px 20px", fontSize: "13px" }}
                                                    disabled={isAccepting}
                                                    onClick={() => handleAcceptRefund(ord.orderId, group.mediator._id, unitCount, subtotal)}
                                                >
                                                    {isAccepting ? "Verifying..." : `✓ Verify & Accept Refund (${unitCount} Units → Pending)`}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Lightbox */}
            {previewImage && (
                <div className="image-modal-overlay" onClick={() => setPreviewImage(null)}>
                    <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="image-modal-header">
                            <span style={{ fontWeight: "700", fontSize: "14px" }}>
                                Mediator Refund Payment Proof
                            </span>
                            <button
                                type="button"
                                className="image-modal-close-btn"
                                onClick={() => setPreviewImage(null)}
                            >
                                Close ✕
                            </button>
                        </div>
                        <img src={previewImage} alt="Mediator Refund Proof Enlarged" className="image-modal-img" />
                    </div>
                </div>
            )}
        </div>
    );
}
