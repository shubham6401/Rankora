import { useEffect, useState } from "react";
import { FetchAllCompletedOrders, confirmMediatorSettlementPayment } from "../../services/mediator/orders";
import { useNavigate } from "react-router-dom";
import PipelineStepper from "../../component/layout/PipelineStepper";
import ProofThumbnail from "../../component/common/ProofThumbnail";
import ProofPreviewModal from "../../component/common/ProofPreviewModal";
import "../../styles/ordersTable.css";

export default function MediatorCompletedOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProof, setSelectedProof] = useState(null);
    const [confirmingBatchKey, setConfirmingBatchKey] = useState(null);
    const [successToast, setSuccessToast] = useState("");

    useEffect(() => {
        handleFetchAllCompletedOrders();
    }, []);

    const handleFetchAllCompletedOrders = async () => {
        try {
            setLoading(true);
            const response = await FetchAllCompletedOrders();
            setOrders(response.data?.orders || []);
        } catch (err) {
            console.error("Failed to fetch completed orders:", err);
        } finally {
            setLoading(false);
        }
    };

    // Flatten completed units
    const pendingConfirmationUnits = [];
    const unsettledUnits = [];
    let settledUnitsCount = 0;
    let settledTotalPayout = 0;

    orders.forEach((order) => {
        (order.orderUnits || []).forEach((u) => {
            if (u.status === "completed") {
                const enrichedUnit = {
                    ...u,
                    orderDocId: order._id,
                    productName: order.productName,
                    brand: order.brand,
                    orderPlatform: order.orderPlatform,
                    productLink: order.productLink,
                    orderPrice: order.price,
                    teamCode: order.teamCode,
                };

                if (u.settlementStatus === "settled") {
                    settledUnitsCount++;
                    settledTotalPayout += parseFloat(u.settlementAmount || 0);
                } else if (u.settlementStatus === "pending_confirmation") {
                    pendingConfirmationUnits.push(enrichedUnit);
                } else {
                    unsettledUnits.push(enrichedUnit);
                }
            }
        });
    });

    // Group pending confirmation units into payout batches (orders paid together by executive)
    const pendingBatchesMap = {};
    pendingConfirmationUnits.forEach((u) => {
        const batchKey =
            u.settlementBatchId ||
            (u.settlementScreenshot ? `${u.settlementScreenshot}_${u.settledAt}` : `unit_${u._id}`);

        if (!pendingBatchesMap[batchKey]) {
            pendingBatchesMap[batchKey] = {
                batchKey,
                settlementBatchId: u.settlementBatchId || null,
                screenshot: u.settlementScreenshot,
                utr: u.settlementMessage,
                settledAt: u.settledAt,
                settledBy: u.settledBy?.name || "Executive",
                totalPayout: 0,
                units: [],
            };
        }
        pendingBatchesMap[batchKey].units.push(u);
        pendingBatchesMap[batchKey].totalPayout += parseFloat(u.settlementAmount || 0);
    });

    const pendingBatches = Object.values(pendingBatchesMap);

    const handleConfirmBatch = async (batch) => {
        const count = batch.units.length;
        const totalAmt = batch.totalPayout;
        if (!window.confirm(`Confirm receipt of ₹${totalAmt.toLocaleString()} for ${count} order(s)? This will finalize settlement.`)) {
            return;
        }

        try {
            setConfirmingBatchKey(batch.batchKey);
            const unitIds = batch.units.map((u) => u._id);
            const payload = {
                unitIds,
                settlementBatchId: batch.settlementBatchId,
            };

            const res = await confirmMediatorSettlementPayment(payload);
            if (res.data?.success) {
                setSuccessToast(res.data.message || `Payment of ₹${totalAmt} confirmed! Moved to Settled Orders.`);
                setTimeout(() => setSuccessToast(""), 4000);
                handleFetchAllCompletedOrders();
            } else {
                alert(res.data?.message || "Failed to confirm payment");
            }
        } catch (err) {
            console.error("Error confirming batch payment:", err);
            alert(err.response?.data?.message || "Error confirming payment");
        } finally {
            setConfirmingBatchKey(null);
        }
    };

    if (loading) {
        return (
            <div className="table-page-container">
                <div className="empty-state-card">
                    <div className="empty-state-icon">⏳</div>
                    <h2 className="empty-state-title">Loading Completed Orders...</h2>
                </div>
            </div>
        );
    }

    const totalAwaitingConfirmationAmount = pendingConfirmationUnits.reduce(
        (sum, u) => sum + parseFloat(u.settlementAmount || 0),
        0
    );

    return (
        <div className="table-page-container">
            <PipelineStepper role="mediator" />

            {/* Header */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge">Stage 5 of Mediator Pipeline</span>
                    <h1 className="table-page-title">Completed Orders</h1>
                    <p className="table-page-subtitle">
                        Review incoming payouts from executive and confirm receipt.
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
                        onClick={() => navigate("/mediator-settled-orders")}
                        className="nav-btn nav-btn-primary"
                        style={{
                            backgroundColor: "#059669",
                            borderColor: "#059669",
                            color: "#ffffff",
                            fontWeight: 700,
                        }}
                    >
                        💰 Settled Orders ({settledUnitsCount}) →
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="table-metrics-bar">
                <div className="metric-card">
                    <span className="metric-label">Awaiting Payout</span>
                    <span className="metric-value metric-value-amber">{unsettledUnits.length} Units</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Awaiting Confirmation</span>
                    <span className="metric-value" style={{ color: "#d97706" }}>
                        {pendingConfirmationUnits.length} Units (₹{totalAwaitingConfirmationAmount.toLocaleString()})
                    </span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Settled Orders</span>
                    <span className="metric-value metric-value-green">
                        ₹{settledTotalPayout.toLocaleString()} ({settledUnitsCount} u)
                    </span>
                </div>
            </div>

            {/* SECTION 1: PAYOUTS AWAITING MEDIATOR CONFIRMATION */}
            {pendingBatches.length > 0 && (
                <div style={{ marginBottom: "28px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                        <span style={{ fontSize: "18px" }}>💳</span>
                        <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#92400e" }}>
                            Payouts to Confirm ({pendingBatches.length})
                        </h2>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {pendingBatches.map((batch, bIdx) => (
                            <div
                                key={batch.batchKey || bIdx}
                                style={{
                                    background: "#fffbeb",
                                    borderRadius: "12px",
                                    border: "1.5px solid #fde68a",
                                    padding: "16px 20px",
                                    boxShadow: "0 2px 6px rgba(180, 83, 9, 0.08)",
                                }}
                            >
                                {/* Payout Transaction Summary */}
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: "12px",
                                        paddingBottom: "12px",
                                        borderBottom: "1px solid #fef3c7",
                                        marginBottom: "12px",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                                        <div
                                            style={{
                                                background: "#fef3c7",
                                                color: "#b45309",
                                                fontWeight: 800,
                                                fontSize: "17px",
                                                padding: "6px 14px",
                                                borderRadius: "8px",
                                                border: "1px solid #fde68a",
                                            }}
                                        >
                                            ₹{batch.totalPayout.toLocaleString()}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "14px", fontWeight: 800, color: "#92400e" }}>
                                                Executive Paid for {batch.units.length} Selected Order(s)
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#78350f", marginTop: "2px" }}>
                                                {batch.settledAt && (
                                                    <span>Paid on: <b>{new Date(batch.settledAt).toLocaleDateString()}</b></span>
                                                )}
                                                {batch.utr && (
                                                    <span style={{ marginLeft: "10px" }}>
                                                        • Ref / UTR: <b style={{ color: "#451a03" }}>{batch.utr}</b>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                        {batch.screenshot && (
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <ProofThumbnail
                                                    url={batch.screenshot}
                                                    alt="Payment Proof"
                                                    size={36}
                                                    onClick={() =>
                                                        setSelectedProof({
                                                            url: batch.screenshot,
                                                            title: `Executive Payout Receipt (₹${batch.totalPayout.toLocaleString()})`,
                                                        })
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedProof({
                                                            url: batch.screenshot,
                                                            title: `Executive Payout Receipt (₹${batch.totalPayout.toLocaleString()})`,
                                                        })
                                                    }
                                                    className="table-btn table-btn-outline"
                                                    style={{ fontSize: "11px", padding: "4px 8px" }}
                                                >
                                                    🔍 View Proof
                                                </button>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => handleConfirmBatch(batch)}
                                            disabled={confirmingBatchKey === batch.batchKey}
                                            className="table-btn table-btn-primary"
                                            style={{
                                                backgroundColor: "#059669",
                                                borderColor: "#059669",
                                                color: "#ffffff",
                                                fontWeight: 800,
                                                fontSize: "12.5px",
                                                padding: "7px 16px",
                                            }}
                                        >
                                            {confirmingBatchKey === batch.batchKey
                                                ? "Confirming..."
                                                : `✓ Confirm Payment (₹${batch.totalPayout.toLocaleString()})`}
                                        </button>
                                    </div>
                                </div>

                                {/* Orders included in this Payout */}
                                <div style={{ fontSize: "12px", fontWeight: 700, color: "#92400e", marginBottom: "6px" }}>
                                    Orders Included in this Payout:
                                </div>
                                <div className="data-table-responsive" style={{ border: "1px solid #fde68a", borderRadius: "8px", background: "#ffffff" }}>
                                    <table className="data-table" style={{ fontSize: "12px" }}>
                                        <thead>
                                            <tr style={{ background: "#fef9c3" }}>
                                                <th style={{ padding: "6px 10px" }}>Product</th>
                                                <th style={{ padding: "6px 10px" }}>Brand</th>
                                                <th style={{ padding: "6px 10px" }}>Platform</th>
                                                <th style={{ padding: "6px 10px" }}>Order ID</th>
                                                <th style={{ padding: "6px 10px" }}>Reviewer</th>
                                                <th style={{ padding: "6px 10px", textAlign: "right" }}>Payout Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {batch.units.map((unit) => (
                                                <tr key={unit._id}>
                                                    <td style={{ padding: "6px 10px", fontWeight: 600 }}>{unit.productName}</td>
                                                    <td style={{ padding: "6px 10px" }}>{unit.brand}</td>
                                                    <td style={{ padding: "6px 10px" }}>{unit.orderPlatform}</td>
                                                    <td style={{ padding: "6px 10px", color: "var(--primary-600)", fontWeight: 700 }}>
                                                        {unit.orderId || "N/A"}
                                                    </td>
                                                    <td style={{ padding: "6px 10px" }}>{unit.reviewerName || "N/A"}</td>
                                                    <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 800, color: "#059669" }}>
                                                        ₹{unit.settlementAmount || 0}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECTION 2: ORDERS AWAITING EXECUTIVE PAYOUT */}
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                        Orders Awaiting Executive Payout ({unsettledUnits.length})
                    </h2>
                </div>

                {unsettledUnits.length === 0 && pendingBatches.length === 0 ? (
                    <div className="empty-state-card">
                        <div className="empty-state-icon">🎉</div>
                        <h2 className="empty-state-title">All Completed Orders Settled</h2>
                        <p className="empty-state-text">
                            No orders waiting for payout or confirmation.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate("/mediator-settled-orders")}
                            className="table-btn table-btn-primary"
                            style={{ marginTop: "12px" }}
                        >
                            View Settled Orders →
                        </button>
                    </div>
                ) : unsettledUnits.length === 0 ? (
                    <div
                        style={{
                            padding: "14px",
                            backgroundColor: "#f8fafc",
                            border: "1px dashed #cbd5e1",
                            borderRadius: "8px",
                            textAlign: "center",
                            fontSize: "12.5px",
                            color: "#64748b",
                        }}
                    >
                        ✓ Payout submitted by executive. Confirm receipt above.
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
                                        <th>Order ID</th>
                                        <th>Reviewer</th>
                                        <th>Created On</th>
                                        <th>Status</th>
                                        <th>Settlement Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unsettledUnits.map((unit) => (
                                        <tr key={unit._id}>
                                            <td className="product-name-cell">{unit.productName}</td>
                                            <td>{unit.brand}</td>
                                            <td>{unit.orderPlatform}</td>
                                            <td className="price-pill">₹{unit.orderPrice}</td>
                                            <td style={{ fontWeight: 700, color: "var(--primary-600)" }}>
                                                {unit.orderId || "Completed"}
                                            </td>
                                            <td>{unit.reviewerName || "N/A"}</td>
                                            <td>{new Date(unit.createdAt || Date.now()).toLocaleDateString()}</td>
                                            <td>
                                                <span className="status-badge status-badge-completed">
                                                    ● Completed
                                                </span>
                                            </td>
                                            <td>
                                                <span className="status-badge status-badge-unsettled">
                                                    ⏳ Awaiting Executive Payout
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            {selectedProof && (
                <ProofPreviewModal
                    url={selectedProof.url}
                    title={selectedProof.title}
                    onClose={() => setSelectedProof(null)}
                />
            )}

            {/* Toast */}
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
                        fontSize: "13px",
                        zIndex: 99999,
                    }}
                >
                    ✓ {successToast}
                </div>
            )}
        </div>
    );
}