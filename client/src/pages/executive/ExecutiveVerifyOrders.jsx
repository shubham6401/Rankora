import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    fetchAllExecutivePendingVerificationOrders,
    verifyExecutiveOrderUnit,
    rejectExecutiveOrderUnitVerification,
} from "../../services/executive/order";
import PipelineStepper from "../../component/layout/PipelineStepper";
import "../../styles/ordersTable.css";

export default function ExecutiveVerifyOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verifyingId, setVerifyingId] = useState(null);
    const [selectedProof, setSelectedProof] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMediator, setSelectedMediator] = useState("all");

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

    const handleVerify = async (orderId, unitId) => {
        if (!window.confirm("Verify submitted proof and mark this unit as Completed?")) return;
        try {
            setVerifyingId(unitId);
            const res = await verifyExecutiveOrderUnit({ orderId, unitId });
            if (res.data?.success) {
                alert("Delivery verified and marked as Completed!");
                await loadVerificationOrders();
            }
        } catch (err) {
            console.error("Error verifying order unit:", err);
            alert(err?.response?.data?.message || "Failed to verify unit");
        } finally {
            setVerifyingId(null);
        }
    };

    const handleReject = async (orderId, unitId) => {
        const reason = window.prompt("Enter revision reason / feedback for the mediator:");
        if (reason === null) return;
        try {
            setVerifyingId(unitId);
            const res = await rejectExecutiveOrderUnitVerification({ orderId, unitId, reason });
            if (res.data?.success) {
                alert("Revision requested! Unit returned to Pending Refund for mediator.");
                await loadVerificationOrders();
            }
        } catch (err) {
            console.error("Error rejecting verification:", err);
            alert(err?.response?.data?.message || "Failed to request revision");
        } finally {
            setVerifyingId(null);
        }
    };

    // Extract unique mediators for filter
    const mediatorMap = {};
    orders.forEach((order) => {
        (order.orderUnits || []).forEach((u) => {
            if (u.status === "pending_verification" && u.mediatorId) {
                const id = u.mediatorId._id || u.mediatorId;
                if (!mediatorMap[id]) {
                    mediatorMap[id] = {
                        id,
                        name: u.mediatorId.name || "Mediator",
                        code: u.mediatorId.mediatorCode || "N/A",
                    };
                }
            }
        });
    });
    const mediatorList = Object.values(mediatorMap);

    // Calculate all pending verification units across orders
    const pendingUnitsAll = [];
    orders.forEach((order) => {
        (order.orderUnits || []).forEach((unit) => {
            if (unit.status === "pending_verification") {
                pendingUnitsAll.push({
                    order,
                    unit,
                });
            }
        });
    });

    const filteredItems = pendingUnitsAll.filter(({ order, unit }) => {
        if (selectedMediator !== "all") {
            const mId = unit.mediatorId?._id?.toString() || unit.mediatorId?.toString();
            if (mId !== selectedMediator) return false;
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const pName = (order.productName || "").toLowerCase();
            const brand = (order.brand || "").toLowerCase();
            const oId = (unit.orderId || "").toLowerCase();
            const rev = (unit.reviewerName || "").toLowerCase();
            const mName = (unit.mediatorId?.name || "").toLowerCase();
            const mCode = (unit.mediatorId?.mediatorCode || "").toLowerCase();
            return (
                pName.includes(q) ||
                brand.includes(q) ||
                oId.includes(q) ||
                rev.includes(q) ||
                mName.includes(q) ||
                mCode.includes(q)
            );
        }

        return true;
    });

    const totalValue = pendingUnitsAll.reduce(
        (sum, item) => sum + (parseFloat(item.order.price) || 0),
        0
    );

    if (loading) {
        return (
            <div className="table-page-container">
                <div className="empty-state-card">
                    <div className="empty-state-icon">⏳</div>
                    <h2 className="empty-state-title">Loading Verification Queue...</h2>
                    <p className="empty-state-text">Fetching submissions awaiting executive review.</p>
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
                        🔍 Verify Deliveries & Mediator Submissions
                    </h1>
                    <p className="table-page-subtitle">
                        Inspect review screenshots, invoices, and seller feedback submitted by mediators. Verify and mark as Completed, or request corrections.
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
                    <span className="metric-label">Orders Under Review</span>
                    <span className="metric-value metric-value-primary">{orders.length}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Units Awaiting Approval</span>
                    <span className="metric-value" style={{ color: "#4f46e5" }}>
                        {pendingUnitsAll.length} Units
                    </span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Pending Value</span>
                    <span className="metric-value metric-value-green">₹{totalValue.toLocaleString()}</span>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="order-filters-card" style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ flex: "1 1 240px" }}>
                        <input
                            type="text"
                            placeholder="🔍 Search product, brand, reviewer, mediator code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="filter-input"
                            style={{ width: "100%", boxSizing: "border-box" }}
                        />
                    </div>

                    <div style={{ minWidth: "180px" }}>
                        <select
                            value={selectedMediator}
                            onChange={(e) => setSelectedMediator(e.target.value)}
                            className="filter-select"
                            style={{ width: "100%" }}
                        >
                            <option value="all">All Mediators ({mediatorList.length})</option>
                            {mediatorList.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name} ({m.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {(searchQuery || selectedMediator !== "all") && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedMediator("all");
                            }}
                            className="nav-btn nav-btn-default"
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                        >
                            Reset Filters ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Empty State */}
            {filteredItems.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">✅</div>
                    <h2 className="empty-state-title">Verification Queue Empty</h2>
                    <p className="empty-state-text">
                        There are currently no deliveries awaiting executive verification. When mediators submit review proofs, they will appear here.
                    </p>
                    <button
                        onClick={() => navigate("/executive-completed-order")}
                        className="nav-btn nav-btn-primary"
                        style={{ marginTop: "12px" }}
                    >
                        View Completed Orders →
                    </button>
                </div>
            ) : (
                /* Submissions Table */
                <div className="table-card">
                    <div className="table-wrapper">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Order Info</th>
                                    <th>Product Details</th>
                                    <th>Mediator</th>
                                    <th>Reviewer & Price</th>
                                    <th>Submitted Proofs</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(({ order, unit }) => {
                                    const postDetails = unit.postDeliveryDetails || {};
                                    const isActing = verifyingId === unit._id;

                                    return (
                                        <tr key={unit._id}>
                                            {/* Order Info */}
                                            <td>
                                                <div className="order-id-cell">
                                                    <span className="order-id-text">
                                                        #{order._id.substring(0, 8)}...
                                                    </span>
                                                    <span className="order-date-text">
                                                        {unit.submittedForVerificationAt
                                                            ? `Submitted ${new Date(unit.submittedForVerificationAt).toLocaleDateString()}`
                                                            : new Date(order.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                                                        Unit #{unit._id.substring(0, 6)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Product Details */}
                                            <td>
                                                <div className="product-info-cell">
                                                    <a
                                                        href={order.productLink}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="product-name-link"
                                                        title="Open product link"
                                                    >
                                                        {order.productName} ↗
                                                    </a>
                                                    <div className="product-meta">
                                                        <span className="brand-tag">{order.brand}</span>
                                                        <span className="platform-badge" style={{ marginLeft: "4px" }}>
                                                            {order.orderPlatform}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Mediator */}
                                            <td>
                                                <div style={{ fontSize: "12.5px" }}>
                                                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                                                        {unit.mediatorId?.name || "Mediator"}
                                                    </div>
                                                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                                                        Code: <b>{unit.mediatorId?.mediatorCode || "N/A"}</b>
                                                    </div>
                                                    {unit.mediatorId?.phone && (
                                                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                                                            📞 {unit.mediatorId.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Reviewer & Price */}
                                            <td>
                                                <div className="units-cell">
                                                    <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#16a34a" }}>
                                                        ₹{order.price}
                                                    </span>
                                                    {unit.reviewerName && (
                                                        <span style={{ fontSize: "11.5px", color: "#334155" }}>
                                                            Reviewer: <b>{unit.reviewerName}</b>
                                                        </span>
                                                    )}
                                                    {unit.orderId && (
                                                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                                                            Ext ID: {unit.orderId}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Submitted Proofs Thumbnails */}
                                            <td>
                                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                                                    {postDetails.productReviewScreenshot && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedProof({
                                                                    title: "Product Review Screenshot",
                                                                    url: postDetails.productReviewScreenshot,
                                                                    info: `${order.productName} (${unit.reviewerName || "Reviewer"})`,
                                                                })
                                                            }
                                                            style={{
                                                                padding: "4px 8px",
                                                                fontSize: "11px",
                                                                borderRadius: "6px",
                                                                border: "1px solid #c7d2fe",
                                                                background: "#eef2ff",
                                                                color: "#4338ca",
                                                                cursor: "pointer",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            ⭐ Review SS
                                                        </button>
                                                    )}
                                                    {postDetails.invoiceScreenshot && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedProof({
                                                                    title: "Invoice Screenshot",
                                                                    url: postDetails.invoiceScreenshot,
                                                                    info: `${order.productName} - Invoice`,
                                                                })
                                                            }
                                                            style={{
                                                                padding: "4px 8px",
                                                                fontSize: "11px",
                                                                borderRadius: "6px",
                                                                border: "1px solid #bfdbfe",
                                                                background: "#eff6ff",
                                                                color: "#1d4ed8",
                                                                cursor: "pointer",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            🧾 Invoice SS
                                                        </button>
                                                    )}
                                                    {postDetails.sellerFeedbackScreenShot && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedProof({
                                                                    title: "Seller Feedback Screenshot",
                                                                    url: postDetails.sellerFeedbackScreenShot,
                                                                    info: `${order.productName} - Seller Feedback`,
                                                                })
                                                            }
                                                            style={{
                                                                padding: "4px 8px",
                                                                fontSize: "11px",
                                                                borderRadius: "6px",
                                                                border: "1px solid #e2e8f0",
                                                                background: "#f8fafc",
                                                                color: "#334155",
                                                                cursor: "pointer",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            💬 Feedback SS
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td>
                                                <div className="action-btn-group">
                                                    <button
                                                        type="button"
                                                        disabled={isActing}
                                                        onClick={() => handleVerify(order._id, unit._id)}
                                                        className="table-btn table-btn-success"
                                                        style={{ padding: "6px 12px", fontSize: "12px", fontWeight: 700 }}
                                                        title="Approve proof and transition to Completed"
                                                    >
                                                        {isActing ? "..." : "✓ Verify"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isActing}
                                                        onClick={() => handleReject(order._id, unit._id)}
                                                        className="table-btn table-btn-danger"
                                                        style={{ padding: "6px 10px", fontSize: "11.5px" }}
                                                        title="Reject proof and ask mediator for revision"
                                                    >
                                                        ✕ Revise
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/order/${order._id}`)}
                                                        className="table-btn table-btn-detail"
                                                        style={{ padding: "6px 10px", fontSize: "11.5px" }}
                                                    >
                                                        Details
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

            {/* PROOF ZOOM MODAL */}
            {selectedProof && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.75)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "16px",
                    }}
                    onClick={() => setSelectedProof(null)}
                >
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "12px",
                            maxWidth: "700px",
                            width: "100%",
                            maxHeight: "90vh",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                padding: "14px 18px",
                                borderBottom: "1px solid #e2e8f0",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                                    {selectedProof.title}
                                </h3>
                                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                                    {selectedProof.info}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedProof(null)}
                                style={{
                                    border: "none",
                                    background: "#f1f5f9",
                                    borderRadius: "6px",
                                    padding: "4px 8px",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    color: "#475569",
                                }}
                            >
                                ✕ Close
                            </button>
                        </div>
                        <div
                            style={{
                                padding: "16px",
                                overflowY: "auto",
                                textAlign: "center",
                                backgroundColor: "#0b132b",
                            }}
                        >
                            <img
                                src={selectedProof.url}
                                alt={selectedProof.title}
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "75vh",
                                    objectFit: "contain",
                                    borderRadius: "6px",
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
