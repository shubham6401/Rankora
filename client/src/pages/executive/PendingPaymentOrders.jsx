import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    fetchAllExecutivePendingPaymentOrders,
    unassignExecutiveOrderUnit,
    submitExecutivePaymentProof,
} from "../../services/executive/order";
import PipelineStepper from "../../component/layout/PipelineStepper";
import "../../styles/ordersTable.css";

export default function PendingPaymentOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingMediatorId, setUploadingMediatorId] = useState(null);
    const [revertingKey, setRevertingKey] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState({});
    const [previewUrls, setPreviewUrls] = useState({});
    const [execMessages, setExecMessages] = useState({});
    const [modalImage, setModalImage] = useState(null);

    useEffect(() => {
        loadOrders();
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
            `Confirm payment screenshot submission for ${mediatorName}?\nAll orders for this mediator will be forwarded to Assigned Orders.`
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
            alert(res.data.message || "Payment proof submitted successfully! Orders forwarded to Assigned.");
            handleClearFile(mediatorId);
            setExecMessages((prev) => ({ ...prev, [mediatorId]: "" }));
            await loadOrders();
        } catch (err) {
            console.error("Error submitting payment proof:", err);
            alert(err?.response?.data?.message || "Failed to submit payment proof");
        } finally {
            setUploadingMediatorId(null);
        }
    };

    if (loading) {
        return (
            <div className="table-page-container" style={{ textAlign: "center", padding: "60px 0" }}>
                <h2>Loading Pending Payments...</h2>
            </div>
        );
    }

    const totalDue = mediatorGroups.reduce((acc, g) => acc + g.totalAmount, 0);
    const totalUnitsCount = mediatorGroups.reduce((acc, g) => acc + g.totalUnits, 0);

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
                        Upload advance payment proof for assigned mediators.
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

            {/* Metrics */}
            <div className="table-metrics-bar">
                <div className="metric-card">
                    <span className="metric-label">Mediators</span>
                    <span className="metric-value metric-value-primary">{mediatorGroups.length}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Total Units</span>
                    <span className="metric-value">{totalUnitsCount}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Total Amount Due</span>
                    <span className="metric-value">₹{totalDue.toLocaleString()}</span>
                </div>
            </div>

            {/* Empty State */}
            {mediatorGroups.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">✓</div>
                    <h3 className="empty-state-title">No Pending Advance Payments</h3>
                    <p className="empty-state-text">
                        All assigned orders have payment screenshots uploaded, or no orders are currently pending payment.
                    </p>
                    <button
                        type="button"
                        className="nav-btn nav-btn-primary"
                        onClick={() => navigate("/executive-pending-order")}
                    >
                        Go to Pending Orders to Assign More
                    </button>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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

                                                    return (
                                                        <tr key={ord.orderId}>
                                                            <td className="product-name-cell">{ord.productName}</td>
                                                            <td>{ord.brand}</td>
                                                            <td>{ord.orderPlatform}</td>
                                                            <td className="price-pill">₹{ord.price}</td>
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
                                        Once uploaded, all these units will be forwarded to <b>Assigned Orders</b> and visible to the mediator.
                                    </div>

                                    {/* Message */}
                                    <input
                                        type="text"
                                        className="proof-note-input"
                                        placeholder="Optional payment reference note (e.g. UPI Ref 987654...)"
                                        value={execMessages[med._id] || ""}
                                        onChange={(e) => setExecMessages((prev) => ({ ...prev, [med._id]: e.target.value }))}
                                    />

                                    {/* File Picker & Actions */}
                                    <div className="proof-inputs-row">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            id={`file-${med._id}`}
                                            style={{ display: "none" }}
                                            onChange={(e) => handleFileSelect(med._id, e)}
                                        />
                                        <label htmlFor={`file-${med._id}`} className="nav-btn nav-btn-default">
                                            {hasFile ? `✓ File: ${selectedFiles[med._id].name}` : "📁 Choose Payment Screenshot"}
                                        </label>

                                        {hasFile && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="table-btn table-btn-outline"
                                                    onClick={() => setModalImage(previewUrls[med._id])}
                                                >
                                                    🔍 Preview
                                                </button>
                                                <button
                                                    type="button"
                                                    className="table-btn table-btn-danger"
                                                    onClick={() => handleClearFile(med._id)}
                                                >
                                                    ✕ Remove
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
                                            {isUploading ? "Submitting Proof..." : "Submit Proof & Forward to Assigned →"}
                                        </button>
                                    </div>

                                    {previewUrls[med._id] && (
                                        <div>
                                            <img
                                                src={previewUrls[med._id]}
                                                alt="Preview"
                                                className="proof-thumb"
                                                style={{ width: "80px", height: "80px" }}
                                                onClick={() => setModalImage(previewUrls[med._id])}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Lightbox */}
            {modalImage && (
                <div className="image-modal-overlay" onClick={() => setModalImage(null)}>
                    <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="image-modal-header">
                            <span style={{ fontWeight: "700", fontSize: "14px" }}>
                                Advance Payment Screenshot Preview
                            </span>
                            <button
                                type="button"
                                className="image-modal-close-btn"
                                onClick={() => setModalImage(null)}
                            >
                                Close ✕
                            </button>
                        </div>
                        <img src={modalImage} alt="Enlarged Screenshot" className="image-modal-img" />
                    </div>
                </div>
            )}
        </div>
    );
}
