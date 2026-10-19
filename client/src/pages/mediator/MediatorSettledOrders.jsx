import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FetchAllSettledOrders } from "../../services/mediator/orders";
import PipelineStepper from "../../component/layout/PipelineStepper";
import ProofThumbnail from "../../component/common/ProofThumbnail";
import ProofPreviewModal from "../../component/common/ProofPreviewModal";
import "../../styles/ordersTable.css";

export default function MediatorSettledOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProof, setSelectedProof] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState("batches"); // "batches" | "table"

    useEffect(() => {
        loadSettledOrders();
    }, []);

    const loadSettledOrders = async () => {
        try {
            setLoading(true);
            const res = await FetchAllSettledOrders();
            setOrders(res.data?.orders || []);
        } catch (err) {
            console.error("Failed to fetch settled orders:", err);
        } finally {
            setLoading(false);
        }
    };

    // Flatten all settled units
    const allSettledUnits = [];
    orders.forEach((order) => {
        (order.orderUnits || []).forEach((unit) => {
            if (unit.status === "completed" && unit.settlementStatus === "settled") {
                allSettledUnits.push({
                    ...unit,
                    orderDocId: order._id,
                    productName: order.productName,
                    brand: order.brand,
                    orderPlatform: order.orderPlatform,
                    productLink: order.productLink,
                    orderPrice: order.price,
                    teamCode: order.teamCode,
                });
            }
        });
    });

    // Group units by payout batch (using settlementBatchId or fallback to settlementScreenshot + settledAt)
    const payoutBatchesMap = {};
    allSettledUnits.forEach((u) => {
        const batchKey =
            u.settlementBatchId ||
            (u.settlementScreenshot ? `${u.settlementScreenshot}_${u.settledAt}` : `single_${u._id}`);

        if (!payoutBatchesMap[batchKey]) {
            payoutBatchesMap[batchKey] = {
                batchKey,
                screenshot: u.settlementScreenshot,
                utr: u.settlementMessage,
                settledAt: u.settledAt,
                mediatorConfirmedAt: u.mediatorConfirmedAt,
                settledBy: u.settledBy?.name || "Executive",
                totalPayout: 0,
                units: [],
            };
        }
        payoutBatchesMap[batchKey].units.push(u);
        payoutBatchesMap[batchKey].totalPayout += parseFloat(u.settlementAmount || 0);
    });

    const payoutBatches = Object.values(payoutBatchesMap).sort(
        (a, b) => new Date(b.mediatorConfirmedAt || b.settledAt || 0) - new Date(a.mediatorConfirmedAt || a.settledAt || 0)
    );

    const totalSettledCount = allSettledUnits.length;
    const totalSettledPayout = allSettledUnits.reduce(
        (sum, u) => sum + parseFloat(u.settlementAmount || 0),
        0
    );

    // Filter units and batches
    const filteredUnits = allSettledUnits.filter((u) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (u.productName && u.productName.toLowerCase().includes(q)) ||
            (u.brand && u.brand.toLowerCase().includes(q)) ||
            (u.orderId && u.orderId.toLowerCase().includes(q)) ||
            (u.reviewerName && u.reviewerName.toLowerCase().includes(q)) ||
            (u.settlementMessage && u.settlementMessage.toLowerCase().includes(q))
        );
    });

    const filteredBatches = payoutBatches.filter((b) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (b.utr && b.utr.toLowerCase().includes(q)) ||
            b.units.some(
                (u) =>
                    (u.productName && u.productName.toLowerCase().includes(q)) ||
                    (u.orderId && u.orderId.toLowerCase().includes(q)) ||
                    (u.reviewerName && u.reviewerName.toLowerCase().includes(q))
            )
        );
    });

    return (
        <div className="table-page-container">
            <PipelineStepper role="mediator" />

            {/* Header */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge" style={{ background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0" }}>
                        Stage 6 of Mediator Pipeline
                    </span>
                    <h1 className="table-page-title">Settled Orders</h1>
                    <p className="table-page-subtitle">
                        Archived orders with payouts confirmed by you.
                    </p>
                </div>
                <div className="table-header-actions">
                    <button
                        type="button"
                        onClick={() => navigate("/mediator-completed-orders")}
                        className="nav-btn nav-btn-default"
                    >
                        ← Completed Orders
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/mediator-earnings")}
                        className="nav-btn nav-btn-primary"
                    >
                        Earnings Overview →
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="table-metrics-bar">
                <div className="metric-card">
                    <span className="metric-label">Settled Units</span>
                    <span className="metric-value metric-value-green">{totalSettledCount} Units</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Total Payout Received</span>
                    <span className="metric-value metric-value-green">₹{totalSettledPayout.toLocaleString()}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Payout Batches</span>
                    <span className="metric-value">{payoutBatches.length}</span>
                </div>
            </div>

            {/* Controls */}
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
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        type="button"
                        onClick={() => setViewMode("batches")}
                        className={`status-pill-btn ${viewMode === "batches" ? "active active-completed" : ""}`}
                    >
                        💳 Payout Batches ({filteredBatches.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("table")}
                        className={`status-pill-btn ${viewMode === "table" ? "active active-assigned" : ""}`}
                    >
                        📋 Order List ({filteredUnits.length})
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Search by Order ID, Brand, Product, or UTR..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        padding: "6px 12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        width: "280px",
                        maxWidth: "100%",
                    }}
                />
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <h3>Loading settled orders...</h3>
                </div>
            ) : allSettledUnits.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">💰</div>
                    <h2 className="empty-state-title">No Settled Orders Yet</h2>
                    <p className="empty-state-text">
                        When you confirm receipt of payments in Completed Orders, they will be archived here.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/mediator-completed-orders")}
                        className="table-btn table-btn-primary"
                        style={{ marginTop: "12px" }}
                    >
                        Go to Completed Orders
                    </button>
                </div>
            ) : viewMode === "batches" ? (
                /* Payout Batches View (Selected orders paid together) */
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {filteredBatches.map((batch, bIdx) => (
                        <div
                            key={batch.batchKey || bIdx}
                            style={{
                                background: "#ffffff",
                                borderRadius: "12px",
                                border: "1px solid #e2e8f0",
                                padding: "16px 20px",
                                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                            }}
                        >
                            {/* Batch Header */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "12px",
                                    paddingBottom: "12px",
                                    borderBottom: "1px solid #f1f5f9",
                                    marginBottom: "12px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div
                                        style={{
                                            background: "#ecfdf5",
                                            color: "#059669",
                                            fontWeight: 800,
                                            fontSize: "16px",
                                            padding: "6px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #a7f3d0",
                                        }}
                                    >
                                        ₹{batch.totalPayout.toLocaleString()}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a" }}>
                                            Settlement for {batch.units.length} Unit(s)
                                        </div>
                                        <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                                            Paid by: <b>{batch.settledBy}</b>
                                            {batch.utr && (
                                                <span style={{ marginLeft: "8px" }}>
                                                    • Ref/UTR: <b style={{ color: "#334155" }}>{batch.utr}</b>
                                                </span>
                                            )}
                                            {batch.mediatorConfirmedAt && (
                                                <span style={{ marginLeft: "8px" }}>
                                                    • Confirmed: {new Date(batch.mediatorConfirmedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {batch.screenshot && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <ProofThumbnail
                                            url={batch.screenshot}
                                            alt="Payout Proof"
                                            size={36}
                                            onClick={() =>
                                                setSelectedProof({
                                                    url: batch.screenshot,
                                                    title: `Settlement Proof (₹${batch.totalPayout.toLocaleString()})`,
                                                })
                                            }
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedProof({
                                                    url: batch.screenshot,
                                                    title: `Settlement Proof (₹${batch.totalPayout.toLocaleString()})`,
                                                })
                                            }
                                            className="table-btn table-btn-outline"
                                            style={{ fontSize: "11.5px", padding: "4px 8px" }}
                                        >
                                            🔍 View Proof
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Batch Orders Table */}
                            <div className="data-table-responsive" style={{ border: "none" }}>
                                <table className="data-table" style={{ fontSize: "12.5px" }}>
                                    <thead>
                                        <tr style={{ background: "#f8fafc" }}>
                                            <th style={{ padding: "8px 12px" }}>Product</th>
                                            <th style={{ padding: "8px 12px" }}>Brand</th>
                                            <th style={{ padding: "8px 12px" }}>Platform</th>
                                            <th style={{ padding: "8px 12px" }}>Order ID</th>
                                            <th style={{ padding: "8px 12px" }}>Reviewer</th>
                                            <th style={{ padding: "8px 12px", textAlign: "right" }}>Payout</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {batch.units.map((unit) => (
                                            <tr key={unit._id}>
                                                <td style={{ padding: "8px 12px", fontWeight: 600 }}>
                                                    {unit.productName}
                                                </td>
                                                <td style={{ padding: "8px 12px" }}>{unit.brand}</td>
                                                <td style={{ padding: "8px 12px" }}>{unit.orderPlatform}</td>
                                                <td style={{ padding: "8px 12px", color: "var(--primary-600)", fontWeight: 700 }}>
                                                    {unit.orderId || "N/A"}
                                                </td>
                                                <td style={{ padding: "8px 12px" }}>{unit.reviewerName || "N/A"}</td>
                                                <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#059669" }}>
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
            ) : (
                /* Flat Order List View */
                <div className="data-table-container">
                    <div className="data-table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Brand</th>
                                    <th>Platform</th>
                                    <th>Order ID</th>
                                    <th>Reviewer</th>
                                    <th>Payout Amount</th>
                                    <th>Ref / UTR</th>
                                    <th>Proof</th>
                                    <th>Confirmed On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUnits.map((unit) => (
                                    <tr key={unit._id}>
                                        <td className="product-name-cell">{unit.productName}</td>
                                        <td>{unit.brand}</td>
                                        <td>{unit.orderPlatform}</td>
                                        <td style={{ fontWeight: 700, color: "var(--primary-600)" }}>
                                            {unit.orderId || "N/A"}
                                        </td>
                                        <td>{unit.reviewerName || "N/A"}</td>
                                        <td style={{ fontWeight: 800, color: "#059669" }}>
                                            ₹{unit.settlementAmount || 0}
                                        </td>
                                        <td>{unit.settlementMessage || "-"}</td>
                                        <td>
                                            {unit.settlementScreenshot ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <ProofThumbnail
                                                        url={unit.settlementScreenshot}
                                                        alt="Proof"
                                                        size={28}
                                                        onClick={() =>
                                                            setSelectedProof({
                                                                url: unit.settlementScreenshot,
                                                                title: `Proof: Order ${unit.orderId || ""}`,
                                                            })
                                                        }
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedProof({
                                                                url: unit.settlementScreenshot,
                                                                title: `Proof: Order ${unit.orderId || ""}`,
                                                            })
                                                        }
                                                        className="table-btn table-btn-outline"
                                                        style={{ fontSize: "10.5px", padding: "2px 6px" }}
                                                    >
                                                        🔍 View
                                                    </button>
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td>
                                            {unit.mediatorConfirmedAt
                                                ? new Date(unit.mediatorConfirmedAt).toLocaleDateString()
                                                : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Proof Lightbox (Supports Image & PDF) */}
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
