import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    fetchAllExecutivePendingPaymentOrders,
    fetchAdvancePaymentHistory,
    unassignExecutiveOrderUnit,
    submitExecutivePaymentProof,
} from "../../services/executive/order";
import PipelineStepper from "../../component/layout/PipelineStepper";
import ProofThumbnail from "../../component/common/ProofThumbnail";
import ProofPreviewModal from "../../component/common/ProofPreviewModal";
import PriceDisplay from "../../component/common/PriceDisplay";
import "../../styles/ordersTable.css";

export default function PendingPaymentOrders() {
    const navigate = useNavigate();

    // Tab view: "pending" | "history"
    const [activeTab, setActiveTab] = useState("pending");

    // Pending Orders state
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingMediatorId, setUploadingMediatorId] = useState(null);
    const [revertingKey, setRevertingKey] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState({});
    const [previewUrls, setPreviewUrls] = useState({});
    const [execMessages, setExecMessages] = useState({});

    // History state
    const [historyOrders, setHistoryOrders] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historySearch, setHistorySearch] = useState("");
    const [historyStatusFilter, setHistoryStatusFilter] = useState("all");

    // Modal preview
    const [modalImage, setModalImage] = useState(null);

    useEffect(() => {
        loadOrders();
        loadHistory();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const res = await fetchAllExecutivePendingPaymentOrders();
            setOrders(res.data.orders || []);
        } catch (err) {
            console.error("Error fetching pending payment orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        try {
            setHistoryLoading(true);
            const res = await fetchAdvancePaymentHistory();
            setHistoryOrders(res.data.orders || []);
        } catch (err) {
            console.error("Error fetching advance payment history:", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Group pending_payment units by mediator
    const mediatorMap = {};

    orders.forEach((order) => {
        const units = order.orderUnits || [];
        units.forEach((unit) => {
            if (unit.status === "pending_payment" && unit.mediatorId) {
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
                        totalAmount: 0,
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
                mediatorMap[medId].totalAmount += Number(order.price) || 0;
            }
        });
    });

    const mediatorGroups = Object.values(mediatorMap).map((group) => ({
        ...group,
        orders: Object.values(group.orders),
    }));

    // Flatten history units for granular historical viewing
    const historyUnitsList = useMemo(() => {
        const list = [];
        (historyOrders || []).forEach((order) => {
            (order.orderUnits || []).forEach((unit) => {
                if (unit.paymentScreenshot || unit.paymentSentAt) {
                    list.push({
                        ...unit,
                        parentOrderId: order._id,
                        productName: order.productName,
                        brand: order.brand,
                        orderPlatform: order.orderPlatform,
                        orderPrice: order.price,
                        orderCreatedAt: order.createdAt,
                    });
                }
            });
        });

        // Sort latest payment first
        list.sort((a, b) => {
            const timeA = new Date(a.paymentSentAt || a.updatedAt || a.orderCreatedAt).getTime();
            const timeB = new Date(b.paymentSentAt || b.updatedAt || b.orderCreatedAt).getTime();
            return timeB - timeA;
        });

        return list;
    }, [historyOrders]);

    // Filter history units
    const filteredHistoryUnits = useMemo(() => {
        return historyUnitsList.filter((item) => {
            if (historyStatusFilter !== "all" && item.status !== historyStatusFilter) {
                return false;
            }

            if (historySearch.trim()) {
                const q = historySearch.toLowerCase().trim();
                const medName = (item.mediatorId?.name || "").toLowerCase();
                const medCode = (item.mediatorId?.mediatorCode || "").toLowerCase();
                const prod = (item.productName || "").toLowerCase();
                const br = (item.brand || "").toLowerCase();
                const oId = (item.orderId || item.parentOrderId || "").toLowerCase();
                const utr = (item.paymentMessage || "").toLowerCase();

                if (
                    !medName.includes(q) &&
                    !medCode.includes(q) &&
                    !prod.includes(q) &&
                    !br.includes(q) &&
                    !oId.includes(q) &&
                    !utr.includes(q)
                ) {
                    return false;
                }
            }

            return true;
        });
    }, [historyUnitsList, historySearch, historyStatusFilter]);

    // Handle Alter / Revert wrongly assigned order
    const handleRevertOrder = async (orderId, mediatorId, count) => {
        const confirmMsg = `Are you sure you want to remove ${count} unit(s) of this order from this mediator?\nThey will be returned back to Pending Orders.`;
        if (!window.confirm(confirmMsg)) return;

        try {
            setRevertingKey(`${orderId}-${mediatorId}`);
            await unassignExecutiveOrderUnit({
                orderId,
                mediatorId,
            });
            alert("Order units successfully reverted back to Pending Orders!");
            await loadOrders();
            await loadHistory();
        } catch (err) {
            console.error("Error reverting order:", err);
            alert(err?.response?.data?.message || "Failed to revert order");
        } finally {
            setRevertingKey(null);
        }
    };

    const handleFileSelect = (mediatorId, e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFiles((prev) => ({ ...prev, [mediatorId]: file }));
        const preview = URL.createObjectURL(file);
        setPreviewUrls((prev) => ({ ...prev, [mediatorId]: preview }));
    };

    const handleClearFile = (mediatorId) => {
        setSelectedFiles((prev) => {
            const next = { ...prev };
            delete next[mediatorId];
            return next;
        });
        setPreviewUrls((prev) => {
            const next = { ...prev };
            if (next[mediatorId]) URL.revokeObjectURL(next[mediatorId]);
            delete next[mediatorId];
            return next;
        });
    };

    const handleSubmitPayment = async (mediatorId, mediatorName) => {
        const file = selectedFiles[mediatorId];
        if (!file) {
            alert("Please select and upload a payment screenshot first!");
            return;
        }

        const confirmSubmit = window.confirm(
            `Confirm payment screenshot submission for ${mediatorName}?\nAll orders for this mediator will be marked as assigned and forwarded to the mediator's New Offers for verification.`
        );
        if (!confirmSubmit) return;

        try {
            setUploadingMediatorId(mediatorId);
            const formData = new FormData();
            formData.append("paymentScreenshot", file);
            if (execMessages[mediatorId]) {
                formData.append("message", execMessages[mediatorId]);
            }

            const res = await submitExecutivePaymentProof(mediatorId, formData);
            alert(res.data.message || "Payment proof submitted successfully! Orders forwarded to mediator for verification.");
            handleClearFile(mediatorId);
            setExecMessages((prev) => ({ ...prev, [mediatorId]: "" }));
            await loadOrders();
            await loadHistory();
        } catch (err) {
            console.error("Error submitting payment proof:", err);
            alert(err?.response?.data?.message || "Failed to submit payment proof");
        } finally {
            setUploadingMediatorId(null);
        }
    };

    const totalDue = mediatorGroups.reduce((acc, g) => acc + g.totalAmount, 0);
    const totalUnitsCount = mediatorGroups.reduce((acc, g) => acc + g.totalUnits, 0);

    // History statistics
    const historyTotalAmount = historyUnitsList.reduce((sum, u) => {
        const price = Number(u.purchasePrice || u.orderPrice) || 0;
        return sum + price;
    }, 0);
    const historyUniqueMediators = new Set(
        historyUnitsList.map((u) => u.mediatorId?._id || u.mediatorId).filter(Boolean)
    ).size;
    const historyCompletedCount = historyUnitsList.filter((u) => u.status === "completed").length;

    return (
        <div className="table-page-container">
            {/* Visual Pipeline Stepper */}
            <PipelineStepper role="executive" />

            {/* Header */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge">Stage 2</span>
                    <h1 className="table-page-title">Advance Payment</h1>
                    <p className="table-page-subtitle">
                        Manage active mediator advance payments and browse complete historical disbursement records.
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
                        className="nav-btn nav-btn-primary"
                        onClick={() => navigate("/executive-mediator-sent-payment")}
                    >
                        Verify Refunds
                    </button>
                    <button
                        type="button"
                        className="nav-btn nav-btn-default"
                        onClick={() => navigate("/executive-assigned-order")}
                    >
                        Assigned Orders →
                    </button>
                </div>
            </div>

            {/* View Switcher Tabs */}
            <div
                style={{
                    display: "flex",
                    gap: "10px",
                    borderBottom: "2px solid var(--slate-200)",
                    marginBottom: "20px",
                    paddingBottom: "2px",
                }}
            >
                <button
                    type="button"
                    onClick={() => setActiveTab("pending")}
                    style={{
                        padding: "10px 18px",
                        fontSize: "14px",
                        fontWeight: 700,
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        borderBottom: activeTab === "pending" ? "3px solid #2563eb" : "3px solid transparent",
                        color: activeTab === "pending" ? "#2563eb" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.15s ease",
                    }}
                >
                    <span>⏳ Pending Advance Payments</span>
                    <span
                        style={{
                            background: activeTab === "pending" ? "#eff6ff" : "#f1f5f9",
                            color: activeTab === "pending" ? "#2563eb" : "#64748b",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 800,
                        }}
                    >
                        {totalUnitsCount} Units
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("history")}
                    style={{
                        padding: "10px 18px",
                        fontSize: "14px",
                        fontWeight: 700,
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        borderBottom: activeTab === "history" ? "3px solid #2563eb" : "3px solid transparent",
                        color: activeTab === "history" ? "#2563eb" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.15s ease",
                    }}
                >
                    <span>📜 All Advance Payment History</span>
                    <span
                        style={{
                            background: activeTab === "history" ? "#eff6ff" : "#f1f5f9",
                            color: activeTab === "history" ? "#2563eb" : "#64748b",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 800,
                        }}
                    >
                        {historyUnitsList.length} Records
                    </span>
                </button>
            </div>

            {/* TAB 1: PENDING ADVANCE PAYMENTS */}
            {activeTab === "pending" && (
                <div>
                    {/* Metrics Bar */}
                    <div className="table-metrics-bar">
                        <div className="metric-card">
                            <span className="metric-label">Mediators Awaiting Advance</span>
                            <span className="metric-value metric-value-primary">{mediatorGroups.length}</span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-label">Pending Units</span>
                            <span className="metric-value">{totalUnitsCount}</span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-label">Total Advance Due</span>
                            <span className="metric-value">₹{totalDue.toLocaleString()}</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="table-page-container" style={{ textAlign: "center", padding: "60px 0" }}>
                            <h2>Loading Pending Payments...</h2>
                        </div>
                    ) : mediatorGroups.length === 0 ? (
                        <div className="empty-state-card">
                            <div className="empty-state-icon">✓</div>
                            <h3 className="empty-state-title">No Pending Advance Payments</h3>
                            <p className="empty-state-text">
                                All assigned orders have payment screenshots uploaded, or no orders are currently pending advance disbursement.
                            </p>
                            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "12px" }}>
                                <button
                                    type="button"
                                    className="nav-btn nav-btn-primary"
                                    onClick={() => navigate("/executive-pending-order")}
                                >
                                    Go to Pending Orders to Assign More
                                </button>
                                <button
                                    type="button"
                                    className="nav-btn nav-btn-default"
                                    onClick={() => setActiveTab("history")}
                                >
                                    View Past Payment History →
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="groups-container">
                            {mediatorGroups.map((group) => {
                                const med = group.mediator;
                                const hasFile = !!selectedFiles[med._id];
                                const isUploading = uploadingMediatorId === med._id;

                                return (
                                    <div key={med._id} className="group-card">
                                        {/* Mediator Header */}
                                        <div className="group-card-header">
                                            <div>
                                                <h2 className="group-title">Mediator: {med.name}</h2>
                                                <div className="group-meta">
                                                    <span>Code: <b>{med.mediatorCode}</b></span>
                                                    <span>Team: <b>{med.teamCode}</b></span>
                                                </div>
                                            </div>
                                            <div className="group-summary-stats">
                                                <span style={{ fontSize: "13px", color: "var(--slate-500)" }}>Total Advance Due: </span>
                                                <span className="group-total-amount">
                                                    ₹{group.totalAmount.toLocaleString()}
                                                </span>
                                                <span className="group-unit-tag">
                                                    {group.totalUnits} {group.totalUnits === 1 ? "Unit" : "Units"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Orders Table */}
                                        <div className="data-table-container" style={{ margin: 0, boxShadow: "none" }}>
                                            <div className="data-table-responsive">
                                                <table className="data-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Product</th>
                                                            <th>Brand</th>
                                                            <th>Platform</th>
                                                            <th>Price/Unit</th>
                                                            <th>Assigned Qty</th>
                                                            <th>Subtotal</th>
                                                            <th style={{ textAlign: "center" }}>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {group.orders.map((ord) => {
                                                            const unitCount = ord.units.length;
                                                            const subtotal = ord.price * unitCount;
                                                            const isReverting = revertingKey === `${ord.orderId}-${med._id}`;
                                                            const whUnits = ord.units.filter((u) => u.unitType === "warehouse").length;
                                                            const emUnits = ord.units.filter((u) => u.unitType === "empty").length;

                                                            return (
                                                                <tr key={ord.orderId}>
                                                                    <td className="product-name-cell">
                                                                        <div>{ord.productName}</div>
                                                                        {(whUnits > 0 || emUnits > 0) && (
                                                                            <div className="unit-spec-group" style={{ marginTop: "4px" }}>
                                                                                {whUnits > 0 && (
                                                                                    <span className="unit-spec-chip warehouse">🏢 {whUnits} WH</span>
                                                                                )}
                                                                                {emUnits > 0 && (
                                                                                    <span className="unit-spec-chip empty">📦 {emUnits} Empty</span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td>{ord.brand}</td>
                                                                    <td>{ord.orderPlatform}</td>
                                                                    <td>
                                                                        <PriceDisplay
                                                                            basePrice={ord.price}
                                                                            actualPrice={
                                                                                ord.units.find((u) => u.purchasePrice && Number(u.purchasePrice) > Number(ord.price))?.purchasePrice
                                                                            }
                                                                            layout="stack"
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <span className="qty-pill qty-pill-warning">
                                                                            {unitCount} {unitCount === 1 ? "Unit" : "Units"}
                                                                        </span>
                                                                    </td>
                                                                    <td className="price-pill" style={{ color: "var(--primary-600)" }}>
                                                                        ₹{subtotal.toLocaleString()}
                                                                    </td>
                                                                    <td style={{ textAlign: "center" }}>
                                                                        <div className="action-btn-group" style={{ justifyContent: "center" }}>
                                                                            <button
                                                                                type="button"
                                                                                className="table-btn table-btn-outline"
                                                                                onClick={() => navigate(`/order/${ord.orderId}`)}
                                                                            >
                                                                                View Details
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className="table-btn table-btn-danger"
                                                                                disabled={isReverting}
                                                                                onClick={() => handleRevertOrder(ord.orderId, med._id, unitCount)}
                                                                            >
                                                                                {isReverting ? "Reverting..." : "✕ Delete / Return"}
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

                                        {/* Proof Upload Section */}
                                        <div className="proof-upload-box">
                                            <div className="proof-upload-title">
                                                📤 Upload Advance Payment Screenshot for {med.name}
                                            </div>
                                            <div className="proof-upload-desc">
                                                Total payment due for {group.totalUnits} unit(s): <b>₹{group.totalAmount.toLocaleString()}</b>.
                                                Once uploaded, all these units will be forwarded to the <b>mediator's New Offers</b> for verification and acceptance.
                                            </div>

                                            {/* Message */}
                                            <input
                                                type="text"
                                                className="proof-note-input"
                                                placeholder="Optional payment reference note (e.g. UPI Ref 987654...)"
                                                value={execMessages[med._id] || ""}
                                                onChange={(e) => setExecMessages((prev) => ({ ...prev, [med._id]: e.target.value }))}
                                            />

                                            {/* File Picker & Submit */}
                                            <div className="proof-upload-actions">
                                                <input
                                                    type="file"
                                                    id={`file-${med._id}`}
                                                    accept="image/*,application/pdf"
                                                    style={{ display: "none" }}
                                                    onChange={(e) => handleFileSelect(med._id, e)}
                                                />

                                                {!hasFile ? (
                                                    <label
                                                        htmlFor={`file-${med._id}`}
                                                        className="form-btn-submit"
                                                        style={{
                                                            cursor: "pointer",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                            margin: 0,
                                                            padding: "10px 16px",
                                                            background: "var(--slate-800)",
                                                            color: "#ffffff",
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        📁 Choose Screenshot or PDF
                                                    </label>
                                                ) : (
                                                    <>
                                                        <label
                                                            htmlFor={`file-${med._id}`}
                                                            className="table-btn table-btn-outline"
                                                            style={{ cursor: "pointer", padding: "8px 12px", fontSize: "12px" }}
                                                        >
                                                            🔄 Change File
                                                        </label>
                                                        <button
                                                            type="button"
                                                            className="table-btn table-btn-danger"
                                                            style={{ padding: "8px 12px", fontSize: "12px" }}
                                                            onClick={() => handleClearFile(med._id)}
                                                        >
                                                            ✕ Clear
                                                        </button>
                                                    </>
                                                )}

                                                <button
                                                    type="button"
                                                    className="form-btn-submit btn-theme-blue"
                                                    style={{ padding: "10px 20px", fontSize: "13px" }}
                                                    disabled={!hasFile || isUploading}
                                                    onClick={() => handleSubmitPayment(med._id, med.name)}
                                                >
                                                    {isUploading ? "Submitting Proof..." : "Submit Proof & Forward to Mediator →"}
                                                </button>
                                            </div>

                                            {previewUrls[med._id] && (
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                                                    <ProofThumbnail
                                                        url={previewUrls[med._id]}
                                                        fileName={selectedFiles[med._id]?.name}
                                                        alt="Payment Proof"
                                                        size={60}
                                                        onClick={() => setModalImage(previewUrls[med._id])}
                                                    />
                                                    <span style={{ fontSize: "12px", color: "var(--slate-600)" }}>
                                                        {selectedFiles[med._id]?.name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: ALL ADVANCE PAYMENT HISTORY */}
            {activeTab === "history" && (
                <div>
                    {/* Metrics Bar */}
                    <div className="table-metrics-bar">
                        <div className="metric-card">
                            <span className="metric-label">Total Advance Payments</span>
                            <span className="metric-value metric-value-primary">{historyUnitsList.length} Units</span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-label">Total Disbursed Volume</span>
                            <span className="metric-value">₹{historyTotalAmount.toLocaleString()}</span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-label">Unique Mediators Funded</span>
                            <span className="metric-value">{historyUniqueMediators}</span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-label">Fully Completed Units</span>
                            <span className="metric-value" style={{ color: "#059669" }}>
                                {historyCompletedCount}
                            </span>
                        </div>
                    </div>

                    {/* Filter & Search Controls */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "12px",
                            flexWrap: "wrap",
                            marginBottom: "16px",
                            background: "#ffffff",
                            padding: "14px 18px",
                            borderRadius: "10px",
                            border: "1px solid var(--slate-200)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
                            <div style={{ position: "relative", width: "100%", maxWidth: "420px" }}>
                                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--slate-400)" }}>
                                    🔍
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search by mediator, product, brand, order ID, or UTR note..."
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px 8px 36px",
                                        borderRadius: "6px",
                                        border: "1px solid var(--slate-300)",
                                        fontSize: "13px",
                                        boxSizing: "border-box",
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--slate-600)" }}>
                                Current Status:
                            </label>
                            <select
                                value={historyStatusFilter}
                                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                                style={{
                                    padding: "7px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--slate-300)",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "var(--slate-800)",
                                }}
                            >
                                <option value="all">All Statuses ({historyUnitsList.length})</option>
                                <option value="assigned">Assigned (Awaiting Order Placement)</option>
                                <option value="in_progress">In Progress</option>
                                <option value="pending_refund">Pending Refund / Details</option>
                                <option value="pending_verification">Pending Verification</option>
                                <option value="completed">Completed</option>
                            </select>

                            <button
                                type="button"
                                onClick={loadHistory}
                                className="table-btn table-btn-outline"
                                style={{ fontSize: "12px", padding: "7px 12px" }}
                            >
                                🔄 Refresh
                            </button>
                        </div>
                    </div>

                    {historyLoading ? (
                        <div className="table-page-container" style={{ textAlign: "center", padding: "60px 0" }}>
                            <h2>Loading Advance Payment History...</h2>
                        </div>
                    ) : filteredHistoryUnits.length === 0 ? (
                        <div className="empty-state-card">
                            <div className="empty-state-icon">📜</div>
                            <h3 className="empty-state-title">No Payment History Found</h3>
                            <p className="empty-state-text">
                                No advance payment records matched your search query or filters.
                            </p>
                            <button
                                type="button"
                                className="nav-btn nav-btn-default"
                                onClick={() => {
                                    setHistorySearch("");
                                    setHistoryStatusFilter("all");
                                }}
                            >
                                Reset Filters
                            </button>
                        </div>
                    ) : (
                        <div className="data-table-container">
                            <div className="data-table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Paid Date & Time</th>
                                            <th>Mediator</th>
                                            <th>Product & Brand</th>
                                            <th>Platform</th>
                                            <th>Advance Amount</th>
                                            <th>Payment Proof</th>
                                            <th>UTR / Note</th>
                                            <th>Current Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistoryUnits.map((item, idx) => {
                                            const paidDateStr = item.paymentSentAt || item.updatedAt || item.orderCreatedAt;
                                            const paidFormatted = paidDateStr
                                                ? new Date(paidDateStr).toLocaleString("en-IN", {
                                                      day: "numeric",
                                                      month: "short",
                                                      year: "numeric",
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                  })
                                                : "—";

                                            const statusClass = `status-badge status-badge-${item.status}`;

                                            return (
                                                <tr key={item._id || idx}>
                                                    {/* Payment Date */}
                                                    <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                                                        <div style={{ fontWeight: 600, color: "var(--slate-800)" }}>
                                                            {paidFormatted}
                                                        </div>
                                                        <div style={{ fontSize: "10.5px", color: "var(--slate-500)" }}>
                                                            Unit ID: {item._id?.slice(-8) || "N/A"}
                                                        </div>
                                                    </td>

                                                    {/* Mediator Info */}
                                                    <td>
                                                        <div style={{ fontWeight: 700, color: "var(--slate-900)" }}>
                                                            {item.mediatorId?.name || "Mediator"}
                                                        </div>
                                                        <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                                                            Code: <b>{item.mediatorId?.mediatorCode || "N/A"}</b> • Team: {item.mediatorId?.teamCode || "N/A"}
                                                        </div>
                                                    </td>

                                                    {/* Product & Brand */}
                                                    <td className="product-name-cell">
                                                        <div style={{ fontWeight: 600 }}>{item.productName}</div>
                                                        <div style={{ fontSize: "11.5px", color: "var(--slate-500)" }}>
                                                            Brand: <b style={{ color: "var(--slate-700)" }}>{item.brand}</b>
                                                            {item.orderId && ` • Market ID: ${item.orderId}`}
                                                        </div>
                                                    </td>

                                                    {/* Platform */}
                                                    <td>{item.orderPlatform}</td>

                                                    {/* Advance Amount with Hike Detection */}
                                                    <td>
                                                        <PriceDisplay
                                                            basePrice={item.orderPrice}
                                                            actualPrice={item.purchasePrice}
                                                            layout="stack"
                                                        />
                                                    </td>

                                                    {/* Payment Proof Thumbnail */}
                                                    <td>
                                                        {item.paymentScreenshot ? (
                                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                                <ProofThumbnail
                                                                    url={item.paymentScreenshot}
                                                                    alt="Advance Proof"
                                                                    size={44}
                                                                    onClick={() => setModalImage(item.paymentScreenshot)}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setModalImage(item.paymentScreenshot)}
                                                                    className="table-btn table-btn-outline"
                                                                    style={{ fontSize: "11px", padding: "4px 8px" }}
                                                                >
                                                                    🔍 Zoom
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: "11px", color: "var(--slate-400)" }}>
                                                                No Proof Uploaded
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* UTR Note */}
                                                    <td style={{ maxWidth: "180px", fontSize: "11.5px" }}>
                                                        {item.paymentMessage ? (
                                                            <span style={{ color: "var(--slate-700)", fontWeight: 500 }}>
                                                                {item.paymentMessage}
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: "var(--slate-400)", fontStyle: "italic" }}>
                                                                None
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Current Status */}
                                                    <td>
                                                        <span className={statusClass}>
                                                            ● {item.status?.replace("_", " ")}
                                                        </span>
                                                        {item.unitType && (
                                                            <div style={{ marginTop: "3px" }}>
                                                                <span className={`unit-spec-chip ${item.unitType}`} style={{ fontSize: "9px", padding: "1px 5px" }}>
                                                                    {item.unitType === "warehouse" ? "🏢 WH" : "📦 Empty"}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Action */}
                                                    <td style={{ textAlign: "center" }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate(`/order/${item.parentOrderId}`)}
                                                            className="table-btn table-btn-outline"
                                                            style={{ fontSize: "11.5px", padding: "5px 10px", whiteSpace: "nowrap" }}
                                                        >
                                                            View Order →
                                                        </button>
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
            )}

            {/* Modal Lightbox (Image & PDF supported) */}
            {modalImage && (
                <ProofPreviewModal
                    url={modalImage}
                    title="Advance Payment Proof Preview"
                    onClose={() => setModalImage(null)}
                />
            )}
        </div>
    );
}
