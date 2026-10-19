import React, { useState, useEffect } from "react";
import { fetchSettledOrders } from "../../services/executive/order";
import { useNavigate } from "react-router-dom";
import PipelineStepper from "../../component/layout/PipelineStepper";
import ProofThumbnail from "../../component/common/ProofThumbnail";
import ProofPreviewModal from "../../component/common/ProofPreviewModal";
import "../../styles/ordersTable.css";

export default function SettledOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewProof, setPreviewProof] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [brandFilter, setBrandFilter] = useState("all");
    const [mediatorFilter, setMediatorFilter] = useState("all");
    const [viewMode, setViewMode] = useState("batches"); // "batches" | "table"

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await fetchSettledOrders();
            setOrders(response.data?.orders || []);
        } catch (err) {
            console.error("Error loading settled orders:", err);
        } finally {
            setLoading(false);
        }
    };

    // Flatten settled units from orders
    const settledUnits = [];
    orders.forEach((order) => {
        (order.orderUnits || []).forEach((unit) => {
            if (unit.settlementStatus === "settled") {
                settledUnits.push({
                    ...unit,
                    orderId: unit.orderId || order.orderId || "N/A",
                    productName: order.productName,
                    brand: order.brand,
                    orderPlatform: order.orderPlatform,
                    masterPrice: order.price,
                    teamCode: order.teamCode,
                    orderCreatedAt: order.createdAt,
                    parentOrder: order,
                });
            }
        });
    });

    // Group units into payout batches (orders paid together in one transaction)
    const payoutBatchesMap = {};
    settledUnits.forEach((u) => {
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
                mediatorName: u.mediatorId?.name || "Mediator",
                mediatorCode: u.mediatorId?.mediatorCode || "",
                teamCode: u.teamCode || "",
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

    const totalSettledCount = settledUnits.length;
    const totalSettledAmount = settledUnits.reduce((acc, u) => {
        return acc + (parseFloat(u.settlementAmount) || 0);
    }, 0);

    const warehouseSettled = settledUnits.filter((u) => u.unitType === "warehouse").length;
    const emptySettled = settledUnits.filter((u) => u.unitType === "empty").length;

    // Extract unique mediators
    const uniqueMediatorsMap = {};
    settledUnits.forEach((u) => {
        const mId = u.mediatorId?._id?.toString() || u.mediatorId?.toString();
        if (mId && !uniqueMediatorsMap[mId]) {
            uniqueMediatorsMap[mId] = {
                id: mId,
                name: u.mediatorId?.name || "Mediator",
                mediatorCode: u.mediatorId?.mediatorCode || "",
            };
        }
    });
    const uniqueMediators = Object.values(uniqueMediatorsMap);
    const uniqueBrands = Array.from(new Set(settledUnits.map((u) => u.brand).filter(Boolean)));

    // Filter units
    const filteredUnits = settledUnits.filter((u) => {
        if (brandFilter !== "all" && u.brand?.toLowerCase() !== brandFilter.toLowerCase()) {
            return false;
        }
        if (mediatorFilter !== "all") {
            const mId = u.mediatorId?._id?.toString() || u.mediatorId?.toString();
            if (mId !== mediatorFilter) return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const orderIdMatch = u.orderId?.toLowerCase().includes(q);
            const productMatch = u.productName?.toLowerCase().includes(q);
            const mediatorNameMatch = u.mediatorId?.name?.toLowerCase().includes(q);
            const mediatorCodeMatch = u.mediatorId?.mediatorCode?.toLowerCase().includes(q);
            const utrMatch = u.settlementMessage?.toLowerCase().includes(q);
            return orderIdMatch || productMatch || mediatorNameMatch || mediatorCodeMatch || utrMatch;
        }
        return true;
    });

    // Filter batches
    const filteredBatches = payoutBatches.filter((b) => {
        if (mediatorFilter !== "all") {
            const matchesMed = b.units.some(
                (u) => (u.mediatorId?._id?.toString() || u.mediatorId?.toString()) === mediatorFilter
            );
            if (!matchesMed) return false;
        }
        if (brandFilter !== "all") {
            const matchesBrand = b.units.some(
                (u) => u.brand?.toLowerCase() === brandFilter.toLowerCase()
            );
            if (!matchesBrand) return false;
        }
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (b.utr && b.utr.toLowerCase().includes(q)) ||
            (b.mediatorName && b.mediatorName.toLowerCase().includes(q)) ||
            (b.mediatorCode && b.mediatorCode.toLowerCase().includes(q)) ||
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
            {/* Visual Pipeline Stepper */}
            <PipelineStepper role="executive" />

            {/* Header */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span
                        className="table-page-badge"
                        style={{
                            background: "#ecfdf5",
                            color: "#059669",
                            borderColor: "#a7f3d0",
                        }}
                    >
                        Stage 8 of Executive Pipeline
                    </span>
                    <h1 className="table-page-title">Settled Orders</h1>
                    <p className="table-page-subtitle">
                        Archived payouts settled and confirmed by mediators.
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
                        onClick={() => navigate("/executive-completed-order")}
                    >
                        Completed Orders →
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="table-metrics-bar">
                <div className="metric-card">
                    <span className="metric-label">Settled Units</span>
                    <span className="metric-value metric-value-emerald">
                        {totalSettledCount} Units
                    </span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Total Payout Settled</span>
                    <span className="metric-value metric-value-green">
                        ₹{totalSettledAmount.toLocaleString()}
                    </span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Payout Batches</span>
                    <span className="metric-value metric-value-primary">
                        {payoutBatches.length} Batches
                    </span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Classification</span>
                    <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                        <span className="unit-spec-chip warehouse">🏢 {warehouseSettled} WH</span>
                        <span className="unit-spec-chip empty">📦 {emptySettled} Empty</span>
                    </div>
                </div>
            </div>

            {/* Filters Toolbar */}
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
                        style={{ fontSize: "12px", padding: "6px 14px", fontWeight: 700 }}
                    >
                        📦 Payout Batches ({filteredBatches.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("table")}
                        className={`status-pill-btn ${viewMode === "table" ? "active active-completed" : ""}`}
                        style={{ fontSize: "12px", padding: "6px 14px", fontWeight: 700 }}
                    >
                        📋 All Units ({filteredUnits.length})
                    </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            placeholder="Search orders, UTR, mediator..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: "230px",
                                padding: "6px 10px 6px 28px",
                                border: "1px solid #cbd5e1",
                                borderRadius: "6px",
                                fontSize: "12.5px",
                            }}
                        />
                        <span style={{ position: "absolute", left: "8px", top: "7px", fontSize: "12px" }}>🔍</span>
                    </div>

                    <select
                        value={mediatorFilter}
                        onChange={(e) => setMediatorFilter(e.target.value)}
                        style={{
                            padding: "6px 10px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            fontSize: "12px",
                            backgroundColor: "#f8fafc",
                        }}
                    >
                        <option value="all">All Mediators ({uniqueMediators.length})</option>
                        {uniqueMediators.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name} {m.mediatorCode ? `(${m.mediatorCode})` : ""}
                            </option>
                        ))}
                    </select>

                    <select
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                        style={{
                            padding: "6px 10px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            fontSize: "12px",
                            backgroundColor: "#f8fafc",
                        }}
                    >
                        <option value="all">All Brands ({uniqueBrands.length})</option>
                        {uniqueBrands.map((b) => (
                            <option key={b} value={b}>
                                {b}
                            </option>
                        ))}
                    </select>

                    {(brandFilter !== "all" || mediatorFilter !== "all" || searchQuery.trim()) && (
                        <button
                            type="button"
                            onClick={() => {
                                setBrandFilter("all");
                                setMediatorFilter("all");
                                setSearchQuery("");
                            }}
                            style={{
                                border: "none",
                                background: "#fee2e2",
                                color: "#b91c1c",
                                padding: "5px 10px",
                                borderRadius: "5px",
                                cursor: "pointer",
                                fontSize: "11.5px",
                                fontWeight: 700,
                            }}
                        >
                            Reset ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Content Rendering */}
            {loading ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">⏳</div>
                    <h2 className="empty-state-title">Loading Settled Orders...</h2>
                </div>
            ) : viewMode === "batches" ? (
                filteredBatches.length === 0 ? (
                    <div className="empty-state-card">
                        <div className="empty-state-icon">💰</div>
                        <h3 className="empty-state-title">No Settled Payouts Found</h3>
                        <p className="empty-state-text">No settled payouts matched your search/filter.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {filteredBatches.map((batch, idx) => (
                            <div
                                key={batch.batchKey || idx}
                                style={{
                                    background: "#ffffff",
                                    borderRadius: "12px",
                                    border: "1.5px solid #a7f3d0",
                                    padding: "16px 20px",
                                    boxShadow: "0 2px 6px rgba(16, 185, 129, 0.06)",
                                }}
                            >
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
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                                        <div
                                            style={{
                                                background: "#ecfdf5",
                                                color: "#059669",
                                                fontWeight: 800,
                                                fontSize: "16px",
                                                padding: "6px 14px",
                                                borderRadius: "8px",
                                                border: "1px solid #a7f3d0",
                                            }}
                                        >
                                            ₹{batch.totalPayout.toLocaleString()}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                                                Payout to {batch.mediatorName} ({batch.mediatorCode || "Code"}) • {batch.units.length} Order(s) Paid Together
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                                {batch.settledAt && (
                                                    <span>Settled on: <b>{new Date(batch.settledAt).toLocaleDateString()}</b></span>
                                                )}
                                                {batch.mediatorConfirmedAt && (
                                                    <span style={{ marginLeft: "10px", color: "#059669", fontWeight: 600 }}>
                                                        • ✓ Confirmed: {new Date(batch.mediatorConfirmedAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {batch.utr && (
                                                    <span style={{ marginLeft: "10px" }}>
                                                        • UTR: <b style={{ color: "#334155" }}>{batch.utr}</b>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {batch.screenshot && (
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <ProofThumbnail
                                                url={batch.screenshot}
                                                alt="Payout Receipt"
                                                size={36}
                                                onClick={() =>
                                                    setPreviewProof({
                                                        url: batch.screenshot,
                                                        title: `Payout Proof: ₹${batch.totalPayout.toLocaleString()}`,
                                                    })
                                                }
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPreviewProof({
                                                        url: batch.screenshot,
                                                        title: `Payout Proof: ₹${batch.totalPayout.toLocaleString()}`,
                                                    })
                                                }
                                                className="table-btn table-btn-outline"
                                                style={{ fontSize: "11px", padding: "4px 8px" }}
                                            >
                                                🔍 View Proof
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="data-table-responsive" style={{ border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                                    <table className="data-table" style={{ fontSize: "12px" }}>
                                        <thead>
                                            <tr style={{ background: "#f8fafc" }}>
                                                <th style={{ padding: "6px 10px" }}>Product</th>
                                                <th style={{ padding: "6px 10px" }}>Brand</th>
                                                <th style={{ padding: "6px 10px" }}>Platform</th>
                                                <th style={{ padding: "6px 10px" }}>Order ID</th>
                                                <th style={{ padding: "6px 10px" }}>Reviewer</th>
                                                <th style={{ padding: "6px 10px", textAlign: "right" }}>Payout</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {batch.units.map((unit) => (
                                                <tr key={unit._id}>
                                                    <td style={{ padding: "6px 10px", fontWeight: 600 }}>{unit.productName}</td>
                                                    <td style={{ padding: "6px 10px" }}>{unit.brand}</td>
                                                    <td style={{ padding: "6px 10px" }}>{unit.orderPlatform}</td>
                                                    <td style={{ padding: "6px 10px", color: "var(--primary-600)", fontWeight: 700 }}>
                                                        {unit.orderId}
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
                )
            ) : filteredUnits.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">💰</div>
                    <h3 className="empty-state-title">No Settled Orders Found</h3>
                    <p className="empty-state-text">No settled orders matched your criteria.</p>
                </div>
            ) : (
                <div className="data-table-container">
                    <div className="data-table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Brand / Platform</th>
                                    <th>Mediator</th>
                                    <th>Order ID</th>
                                    <th>Reviewer</th>
                                    <th>Payout</th>
                                    <th>Payment Proof</th>
                                    <th>UTR</th>
                                    <th>Settled On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUnits.map((unit) => {
                                    const proofUrl = unit.settlementScreenshot;
                                    return (
                                        <tr key={unit._id}>
                                            <td className="product-name-cell">
                                                <div style={{ fontWeight: 600 }}>{unit.productName}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{unit.brand}</div>
                                                <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                                                    {unit.orderPlatform}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>
                                                    {unit.mediatorId?.name || "Mediator"}
                                                </div>
                                                <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                                                    {unit.mediatorId?.mediatorCode || "N/A"}
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 700, color: "var(--primary-600)" }}>
                                                {unit.orderId}
                                            </td>
                                            <td>{unit.reviewerName || "N/A"}</td>
                                            <td style={{ color: "#059669", fontWeight: 800, fontSize: "14px" }}>
                                                ₹{unit.settlementAmount !== undefined ? unit.settlementAmount : 0}
                                            </td>
                                            <td>
                                                {proofUrl ? (
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <ProofThumbnail
                                                            url={proofUrl}
                                                            alt="Proof"
                                                            size={32}
                                                            onClick={() =>
                                                                setPreviewProof({
                                                                    url: proofUrl,
                                                                    title: `Payout Proof: Order ${unit.orderId}`,
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: "11px", color: "var(--slate-400)" }}>-</span>
                                                )}
                                            </td>
                                            <td>
                                                {unit.settlementMessage ? (
                                                    <span style={{ fontSize: "11.5px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                                                        {unit.settlementMessage}
                                                    </span>
                                                ) : "-"}
                                            </td>
                                            <td style={{ fontSize: "12px" }}>
                                                {unit.settledAt ? new Date(unit.settledAt).toLocaleDateString() : "-"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Proof Preview Modal */}
            {previewProof && (
                <ProofPreviewModal
                    url={previewProof.url}
                    title={previewProof.title}
                    onClose={() => setPreviewProof(null)}
                />
            )}
        </div>
    );
}
