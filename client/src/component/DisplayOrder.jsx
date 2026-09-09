import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    verifyExecutiveOrderUnit,
    rejectExecutiveOrderUnitVerification,
} from "../services/executive/order";
import "../styles/displayOrder.css";
import "../styles/ordersTable.css";

export default function DisplayOrder({ order }) {
    const navigate = useNavigate();

    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const isExecutive = currentUser.role === "executive" || currentUser.role === "admin";

    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedMediatorFilter, setSelectedMediatorFilter] = useState("all");
    const [searchOrderId, setSearchOrderId] = useState("");
    const [searchReviewer, setSearchReviewer] = useState("");
    const [previewImage, setPreviewImage] = useState(null);
    const [unitsList, setUnitsList] = useState(order?.orderUnits || []);
    const [verifyingUnitId, setVerifyingUnitId] = useState(null);

    useEffect(() => {
        if (order?.orderUnits) {
            setUnitsList(order.orderUnits);
        }
    }, [order]);

    if (!order) {
        return (
            <div className="display-order-page">
                <div className="empty-state-card">
                    <div className="empty-state-icon">⚠️</div>
                    <h2 className="empty-state-title">No Order Details Found</h2>
                    <p className="empty-state-text">The requested order does not exist or could not be loaded.</p>
                </div>
            </div>
        );
    }

    const units = unitsList;
    const summary = {
        unassigned: units.filter((u) => u.status === "unassigned").length,
        pendingPayment: units.filter((u) => u.status === "pending_payment").length,
        assigned: units.filter((u) => u.status === "assigned").length,
        inProgress: units.filter((u) => u.status === "in_progress").length,
        pendingRefund: units.filter((u) => u.status === "pending_refund").length,
        pendingVerification: units.filter((u) => u.status === "pending_verification").length,
        completed: units.filter((u) => u.status === "completed").length,
    };

    const handleVerifyUnit = async (unitId) => {
        if (!window.confirm("Verify submitted review proofs and mark this unit as Completed?")) return;
        try {
            setVerifyingUnitId(unitId);
            const res = await verifyExecutiveOrderUnit({ orderId: order._id, unitId });
            if (res.data?.success) {
                alert("Unit verified successfully and marked as Completed!");
                setUnitsList((prev) =>
                    prev.map((u) =>
                        u._id === unitId ? { ...u, status: "completed", completedAt: new Date() } : u
                    )
                );
            }
        } catch (err) {
            console.error("Error verifying unit:", err);
            alert(err?.response?.data?.message || "Failed to verify unit");
        } finally {
            setVerifyingUnitId(null);
        }
    };

    const handleRejectVerification = async (unitId) => {
        const reason = window.prompt("Enter revision reason / feedback for the mediator (why proofs were not approved):");
        if (reason === null) return;
        try {
            setVerifyingUnitId(unitId);
            const res = await rejectExecutiveOrderUnitVerification({ orderId: order._id, unitId, reason });
            if (res.data?.success) {
                alert("Revision requested! Unit returned to Pending Refund for mediator.");
                setUnitsList((prev) =>
                    prev.map((u) =>
                        u._id === unitId ? { ...u, status: "pending_refund", verificationRejectionReason: reason } : u
                    )
                );
            }
        } catch (err) {
            console.error("Error requesting revision:", err);
            alert(err?.response?.data?.message || "Failed to request revision");
        } finally {
            setVerifyingUnitId(null);
        }
    };

    // Extract all unique mediators assigned to this order
    const assignedMediatorMap = {};
    const mediatorPaymentMap = {};

    units.forEach((unit) => {
        if (unit.mediatorId) {
            const mId = unit.mediatorId._id || unit.mediatorId;
            if (!assignedMediatorMap[mId]) {
                assignedMediatorMap[mId] = {
                    id: mId,
                    name: unit.mediatorId.name || "Mediator",
                    mediatorCode: unit.mediatorId.mediatorCode || "N/A",
                    teamCode: unit.mediatorId.teamCode || order.teamCode,
                    count: 0,
                };
            }
            assignedMediatorMap[mId].count++;

            if (!mediatorPaymentMap[mId]) {
                mediatorPaymentMap[mId] = {
                    id: mId,
                    name: unit.mediatorId.name || "Mediator",
                    mediatorCode: unit.mediatorId.mediatorCode || "N/A",
                    teamCode: unit.mediatorId.teamCode || order.teamCode,
                    unitsCount: 0,
                    statuses: {},
                    executivePayments: [],
                    mediatorRefunds: [],
                };
            }
            mediatorPaymentMap[mId].unitsCount++;
            mediatorPaymentMap[mId].statuses[unit.status] = (mediatorPaymentMap[mId].statuses[unit.status] || 0) + 1;

            if (unit.paymentScreenshot) {
                const alreadyExists = mediatorPaymentMap[mId].executivePayments.some(
                    (p) => p.url === unit.paymentScreenshot && p.message === unit.paymentMessage
                );
                if (!alreadyExists) {
                    mediatorPaymentMap[mId].executivePayments.push({
                        url: unit.paymentScreenshot,
                        message: unit.paymentMessage,
                        sentAt: unit.paymentSentAt,
                    });
                }
            }

            if (unit.mediatorPaymentScreenshot) {
                const alreadyExists = mediatorPaymentMap[mId].mediatorRefunds.some(
                    (p) => p.url === unit.mediatorPaymentScreenshot && p.message === unit.mediatorMessage
                );
                if (!alreadyExists) {
                    mediatorPaymentMap[mId].mediatorRefunds.push({
                        url: unit.mediatorPaymentScreenshot,
                        message: unit.mediatorMessage,
                        sentAt: unit.mediatorPaymentSentAt,
                    });
                }
            }
        }
    });
    const assignedMediators = Object.values(assignedMediatorMap);
    const mediatorPaymentList = Object.values(mediatorPaymentMap);

    // Filter units based on applied filters
    const filteredUnits = units.filter((unit) => {
        if (statusFilter !== "all" && unit.status !== statusFilter) {
            return false;
        }

        if (selectedMediatorFilter !== "all") {
            if (selectedMediatorFilter === "unassigned") {
                if (unit.mediatorId) return false;
            } else {
                const unitMedId = unit.mediatorId?._id || unit.mediatorId;
                if (!unitMedId || unitMedId.toString() !== selectedMediatorFilter) {
                    return false;
                }
            }
        }

        if (searchOrderId.trim()) {
            const query = searchOrderId.toLowerCase().trim();
            const orderIdStr = (unit.orderId || "").toLowerCase();
            if (!orderIdStr.includes(query)) {
                return false;
            }
        }

        if (searchReviewer.trim()) {
            const query = searchReviewer.toLowerCase().trim();
            const reviewerStr = (unit.reviewerName || "").toLowerCase();
            if (!reviewerStr.includes(query)) {
                return false;
            }
        }

        return true;
    });

    const resetFilters = () => {
        setStatusFilter("all");
        setSelectedMediatorFilter("all");
        setSearchOrderId("");
        setSearchReviewer("");
    };

    return (
        <div className="display-order-page">
            <button
                onClick={() => navigate(-1)}
                className="display-order-back-btn"
            >
                ← Go Back
            </button>

            {/* MASTER ORDER HEADER CARD */}
            <div className="master-order-card">
                <div className="master-order-top">
                    <div>
                        <h1 className="master-order-title">{order.productName}</h1>
                        <div className="master-order-meta">
                            <span>Brand: <b>{order.brand}</b></span>
                            <span>•</span>
                            <span>Platform: <b>{order.orderPlatform}</b></span>
                            <span>•</span>
                            <span>Price: <b style={{ color: "var(--primary-600)" }}>₹{order.price}</b></span>
                        </div>
                    </div>
                    {order.productLink && (
                        <a
                            href={order.productLink}
                            target="_blank"
                            rel="noreferrer"
                            className="master-order-link"
                        >
                            View Product Page ↗
                        </a>
                    )}
                </div>

                <hr className="master-order-divider" />

                <div className="master-order-grid">
                    <div>
                        <span className="master-spec-label">Executive</span>
                        <div className="master-spec-val">{order.executiveName || "N/A"}</div>
                    </div>
                    <div>
                        <span className="master-spec-label">Team Code</span>
                        <div className="master-spec-val">{order.teamCode || "N/A"}</div>
                    </div>
                    <div>
                        <span className="master-spec-label">Total Quantity</span>
                        <div className="master-spec-val">{order.quantity || units.length} Units</div>
                    </div>
                    <div>
                        <span className="master-spec-label">Created On</span>
                        <div className="master-spec-val">
                            {order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}
                        </div>
                    </div>
                </div>

                {/* SUMMARY STATUS METRICS (CLICKABLE FILTERS) */}
                <div className="filter-pills-section">
                    <span className="filter-pills-label">
                        Filter Units by Status:
                    </span>
                    <div className="filter-pills-row">
                        <button
                            type="button"
                            onClick={() => setStatusFilter("all")}
                            className={`status-pill-btn ${statusFilter === "all" ? "active" : ""}`}
                        >
                            All ({units.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("unassigned")}
                            className={`status-pill-btn ${statusFilter === "unassigned" ? "active active-unassigned" : ""}`}
                        >
                            Unassigned ({summary.unassigned})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("pending_payment")}
                            className={`status-pill-btn ${statusFilter === "pending_payment" ? "active active-pending_payment" : ""}`}
                        >
                            Pending Payment ({summary.pendingPayment || 0})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("assigned")}
                            className={`status-pill-btn ${statusFilter === "assigned" ? "active active-assigned" : ""}`}
                        >
                            Assigned ({summary.assigned})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("in_progress")}
                            className={`status-pill-btn ${statusFilter === "in_progress" ? "active active-in_progress" : ""}`}
                        >
                            In Progress ({summary.inProgress})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("pending_refund")}
                            className={`status-pill-btn ${statusFilter === "pending_refund" ? "active active-pending_refund" : ""}`}
                        >
                            Pending Refund ({summary.pendingRefund})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("pending_verification")}
                            className={`status-pill-btn ${statusFilter === "pending_verification" ? "active active-pending_verification" : ""}`}
                        >
                            Pending Verification ({summary.pendingVerification})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("completed")}
                            className={`status-pill-btn ${statusFilter === "completed" ? "active active-completed" : ""}`}
                        >
                            Completed ({summary.completed})
                        </button>
                    </div>
                </div>
            </div>

            {/* ASSIGNED MEDIATORS OVERVIEW */}
            <div className="display-section-card">
                <h2 className="display-section-title">
                    👥 Assigned Mediators Overview ({assignedMediators.length})
                </h2>

                {assignedMediators.length === 0 ? (
                    <p style={{ color: "var(--slate-400)", fontStyle: "italic", margin: 0 }}>
                        No mediators have been assigned to this order yet.
                    </p>
                ) : (
                    <div className="mediators-grid">
                        {assignedMediators.map((med) => (
                            <div
                                key={med.id}
                                onClick={() => setSelectedMediatorFilter(med.id.toString())}
                                className={`mediator-filter-card ${selectedMediatorFilter === med.id.toString() ? "selected" : ""}`}
                            >
                                <div className="mediator-name-title">{med.name}</div>
                                <div className="mediator-meta-item">
                                    Code: <b>{med.mediatorCode}</b>
                                </div>
                                <div className="mediator-meta-item">
                                    Assigned Units: <b>{med.count}</b>
                                </div>
                                <div className="mediator-filter-hint">
                                    {selectedMediatorFilter === med.id.toString() ? "✓ Filtering by this mediator" : "Click to filter"}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MEDIATOR-WISE PAYMENT & PROOF DETAILS */}
            <div className="display-section-card">
                <h2 className="display-section-title">
                    💳 Mediator-Wise Payment & Proof Details ({mediatorPaymentList.length})
                </h2>
                <p className="display-section-subtitle">
                    Executive advance payment screenshots sent to mediators and refund payment screenshots sent back by mediators
                </p>

                {mediatorPaymentList.length === 0 ? (
                    <p style={{ color: "var(--slate-400)", fontStyle: "italic", margin: 0 }}>
                        No mediators assigned or no payment transactions recorded yet.
                    </p>
                ) : (
                    <div>
                        {mediatorPaymentList.map((med) => {
                            const totalAmount = (order.price || 0) * med.unitsCount;
                            return (
                                <div key={med.id} className="mediator-payment-box">
                                    {/* Mediator Header */}
                                    <div className="mediator-payment-header">
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <span className="mediator-payment-name">
                                                {med.name}
                                            </span>
                                            <span className="mediator-code-pill">
                                                Code: {med.mediatorCode}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                                            <span style={{ fontSize: "14px", color: "var(--slate-600)" }}>
                                                Assigned Units: <b>{med.unitsCount}</b>
                                            </span>
                                            <span style={{ fontSize: "15px", color: "#059669", fontWeight: "bold" }}>
                                                Total Amount: ₹{totalAmount.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status breakdown for this mediator */}
                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
                                        {Object.entries(med.statuses).map(([st, cnt]) => (
                                            <span
                                                key={st}
                                                className="status-badge status-badge-pending"
                                            >
                                                {st.replace("_", " ")}: {cnt}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Proofs Grid */}
                                    <div className="proofs-columns">
                                        {/* Executive Payment Proof */}
                                        <div className="proof-column-card">
                                            <div className="proof-column-title proof-column-title-advance">
                                                📤 Executive Advance Payment Proof
                                            </div>
                                            {med.executivePayments.length === 0 ? (
                                                <p style={{ color: "var(--slate-400)", fontSize: "13px", fontStyle: "italic", margin: 0 }}>
                                                    No executive payment screenshot recorded.
                                                </p>
                                            ) : (
                                                med.executivePayments.map((execPay, pIdx) => (
                                                    <div key={pIdx} className="proof-card-preview">
                                                        <div
                                                            style={{ cursor: "pointer", display: "inline-block" }}
                                                            onClick={() => setPreviewImage(execPay.url)}
                                                        >
                                                            <img
                                                                src={execPay.url}
                                                                alt="Executive Payment Screenshot"
                                                                className="proof-img-thumb"
                                                            />
                                                            <div style={{ fontSize: "11px", color: "var(--primary-600)", marginTop: "3px", fontWeight: "600" }}>
                                                                🔍 Click to enlarge
                                                            </div>
                                                        </div>
                                                        {execPay.message && (
                                                            <div className="proof-note-bubble">
                                                                <b>Note:</b> {execPay.message}
                                                            </div>
                                                        )}
                                                        {execPay.sentAt && (
                                                            <div className="proof-timestamp">
                                                                Sent on: {new Date(execPay.sentAt).toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Mediator Refund Proof */}
                                        <div className="proof-column-card">
                                            <div className="proof-column-title proof-column-title-refund">
                                                📥 Mediator Refund Proof (On Reject)
                                            </div>
                                            {med.mediatorRefunds.length === 0 ? (
                                                <p style={{ color: "var(--slate-400)", fontSize: "13px", fontStyle: "italic", margin: 0 }}>
                                                    No mediator refund screenshot recorded.
                                                </p>
                                            ) : (
                                                med.mediatorRefunds.map((medRefund, rIdx) => (
                                                    <div key={rIdx} className="proof-card-preview">
                                                        <div
                                                            style={{ cursor: "pointer", display: "inline-block" }}
                                                            onClick={() => setPreviewImage(medRefund.url)}
                                                        >
                                                            <img
                                                                src={medRefund.url}
                                                                alt="Mediator Refund Screenshot"
                                                                className="proof-img-thumb"
                                                            />
                                                            <div style={{ fontSize: "11px", color: "var(--primary-600)", marginTop: "3px", fontWeight: "600" }}>
                                                                🔍 Click to enlarge
                                                            </div>
                                                        </div>
                                                        {medRefund.message && (
                                                            <div className="proof-note-bubble" style={{ background: "#fff7ed", color: "#9a3412" }}>
                                                                <b>Note:</b> {medRefund.message}
                                                            </div>
                                                        )}
                                                        {medRefund.sentAt && (
                                                            <div className="proof-timestamp">
                                                                Sent on: {new Date(medRefund.sentAt).toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FILTER BAR FOR INDIVIDUAL UNITS */}
            <div className="units-filter-bar">
                <div className="units-filter-header">
                    <h3 className="units-filter-title">🔍 Filter Order Units</h3>
                    {(statusFilter !== "all" || selectedMediatorFilter !== "all" || searchOrderId || searchReviewer) && (
                        <button
                            onClick={resetFilters}
                            className="table-btn table-btn-outline"
                        >
                            Reset All Filters ✕
                        </button>
                    )}
                </div>

                <div className="units-filter-grid">
                    {/* Status Dropdown */}
                    <div>
                        <label className="filter-group-label">
                            Filter by Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Statuses ({units.length})</option>
                            <option value="unassigned">Unassigned ({summary.unassigned})</option>
                            <option value="pending_payment">Pending Payment ({summary.pendingPayment || 0})</option>
                            <option value="assigned">Assigned ({summary.assigned})</option>
                            <option value="in_progress">In Progress ({summary.inProgress})</option>
                            <option value="pending_refund">Pending Refund ({summary.pendingRefund})</option>
                            <option value="pending_verification">Pending Verification ({summary.pendingVerification})</option>
                            <option value="completed">Completed ({summary.completed})</option>
                        </select>
                    </div>

                    {/* Mediator Dropdown */}
                    <div>
                        <label className="filter-group-label">
                            Filter by Mediator
                        </label>
                        <select
                            value={selectedMediatorFilter}
                            onChange={(e) => setSelectedMediatorFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Mediators ({units.length})</option>
                            <option value="unassigned">Unassigned Units</option>
                            {assignedMediators.map((med) => (
                                <option key={med.id} value={med.id.toString()}>
                                    {med.name} ({med.mediatorCode}) - {med.count} Units
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Search by Order ID */}
                    <div>
                        <label className="filter-group-label">
                            Search Order ID
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Amazon ID..."
                            value={searchOrderId}
                            onChange={(e) => setSearchOrderId(e.target.value)}
                            className="filter-input"
                        />
                    </div>

                    {/* Search by Reviewer Name */}
                    <div>
                        <label className="filter-group-label">
                            Search Reviewer Name
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Reviewer name..."
                            value={searchReviewer}
                            onChange={(e) => setSearchReviewer(e.target.value)}
                            className="filter-input"
                        />
                    </div>
                </div>

                <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--slate-500)", fontWeight: "600" }}>
                    Showing <b>{filteredUnits.length}</b> of <b>{units.length}</b> units matching criteria.
                </div>
            </div>

            {/* INDIVIDUAL ORDER UNITS LIST */}
            <div className="display-section-card">
                <h2 className="display-section-title">
                    📋 Order Units Breakdown ({filteredUnits.length} Displayed)
                </h2>

                {filteredUnits.length === 0 ? (
                    <div className="empty-state-card">
                        <div className="empty-state-icon">🔍</div>
                        <h2 className="empty-state-title">No Units Found</h2>
                        <p className="empty-state-text">No order units matched your selected filters.</p>
                        <button
                            onClick={resetFilters}
                            className="table-btn table-btn-primary"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {filteredUnits.map((unit, index) => {
                            return (
                                <div
                                    key={unit._id || index}
                                    className="unit-item-card"
                                >
                                    {/* Unit Header */}
                                    <div className="unit-item-header">
                                        <div className="unit-item-title">
                                            Unit #{index + 1}
                                            <span className="unit-item-id">
                                                ID: {unit._id}
                                            </span>
                                        </div>
                                        <span className={`status-badge status-badge-${unit.status}`}>
                                            ● {unit.status.replace("_", " ")}
                                        </span>
                                    </div>

                                    {/* Mediator Info */}
                                    <div className="unit-mediator-box">
                                        <b>Assigned Mediator:</b>{" "}
                                        {unit.mediatorId ? (
                                            <span>
                                                {unit.mediatorId.name || "Mediator"} (Code: <b>{unit.mediatorId.mediatorCode || "N/A"}</b>)
                                            </span>
                                        ) : (
                                            <span style={{ color: "var(--slate-400)", fontStyle: "italic" }}>Not assigned yet</span>
                                        )}
                                        {unit.assignedAt && (
                                            <span style={{ color: "var(--slate-500)", fontSize: "12px", marginLeft: "12px" }}>
                                                Assigned on: {new Date(unit.assignedAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Order Placement Details Grid */}
                                    <div className="unit-details-grid">
                                        <div>
                                            <span className="unit-detail-label">Order ID:</span>
                                            <div className="unit-detail-val">{unit.orderId || "Not submitted"}</div>
                                        </div>
                                        <div>
                                            <span className="unit-detail-label">Reviewer Name:</span>
                                            <div className="unit-detail-val">{unit.reviewerName || "Not submitted"}</div>
                                        </div>
                                        <div>
                                            <span className="unit-detail-label">Expected Arrival:</span>
                                            <div className="unit-detail-val">
                                                {unit.expectedArrivalDate ? new Date(unit.expectedArrivalDate).toLocaleDateString() : "Not submitted"}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="unit-detail-label">Order Received On:</span>
                                            <div className="unit-detail-val">
                                                {unit.orderReceivedOn ? new Date(unit.orderReceivedOn).toLocaleDateString() : "Not submitted"}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="unit-detail-label">Season:</span>
                                            <div className="unit-detail-val">{unit.season || "Not submitted"}</div>
                                        </div>
                                        <div>
                                            <span className="unit-detail-label">Address:</span>
                                            <div className="unit-detail-val">{unit.address || "Not submitted"}</div>
                                        </div>
                                    </div>

                                    {/* Payment Screenshot (Uploaded by Executive) */}
                                    {unit.paymentScreenshot && (
                                        <div className="proof-upload-box" style={{ background: "#f0fdf4", borderColor: "#bbf7d0", marginBottom: "12px" }}>
                                            <b style={{ color: "#166534", fontSize: "13px", display: "block", marginBottom: "6px" }}>
                                                💳 Executive Advance Payment Proof:
                                            </b>
                                            <div style={{ cursor: "pointer", display: "inline-block" }} onClick={() => setPreviewImage(unit.paymentScreenshot)}>
                                                <img
                                                    src={unit.paymentScreenshot}
                                                    alt="Executive Payment Screenshot"
                                                    className="proof-img-thumb"
                                                />
                                                <div style={{ fontSize: "11px", color: "var(--primary-600)", marginTop: "2px", fontWeight: "600" }}>🔍 Click to enlarge</div>
                                            </div>
                                            {unit.paymentMessage && (
                                                <div className="proof-note-bubble" style={{ background: "#ffffff" }}>
                                                    <b>Executive Note:</b> {unit.paymentMessage}
                                                </div>
                                            )}
                                            {unit.paymentSentAt && (
                                                <div className="proof-timestamp">
                                                    Proof sent on: {new Date(unit.paymentSentAt).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Mediator Refund Proof (Uploaded by Mediator on Reject) */}
                                    {unit.mediatorPaymentScreenshot && (
                                        <div className="proof-upload-box" style={{ background: "#fffaf0", borderColor: "#fed7aa", marginBottom: "12px" }}>
                                            <b style={{ color: "#c2410c", fontSize: "13px", display: "block", marginBottom: "6px" }}>
                                                💳 Mediator Refund Payment Proof:
                                            </b>
                                            <div style={{ cursor: "pointer", display: "inline-block" }} onClick={() => setPreviewImage(unit.mediatorPaymentScreenshot)}>
                                                <img
                                                    src={unit.mediatorPaymentScreenshot}
                                                    alt="Mediator Refund Screenshot"
                                                    className="proof-img-thumb"
                                                />
                                                <div style={{ fontSize: "11px", color: "var(--primary-600)", marginTop: "2px", fontWeight: "600" }}>🔍 Click to enlarge</div>
                                            </div>
                                            {unit.mediatorMessage && (
                                                <div className="proof-note-bubble" style={{ background: "#fff7ed", color: "#9a3412" }}>
                                                    <b>Mediator Note:</b> {unit.mediatorMessage}
                                                </div>
                                            )}
                                            {unit.mediatorPaymentSentAt && (
                                                <div className="proof-timestamp">
                                                    Refund sent on: {new Date(unit.mediatorPaymentSentAt).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Ordered Screenshot */}
                                    {unit.orderedScreenshot && (
                                        <div style={{ marginTop: "10px", marginBottom: "12px" }}>
                                            <b style={{ color: "var(--slate-600)", fontSize: "13px", display: "block", marginBottom: "6px" }}>
                                                Ordered Screenshot:
                                            </b>
                                            <a href={unit.orderedScreenshot} target="_blank" rel="noreferrer">
                                                <img
                                                    src={unit.orderedScreenshot}
                                                    alt="Ordered Screenshot"
                                                    className="proof-img-thumb"
                                                />
                                            </a>
                                        </div>
                                    )}

                                    {/* Post Delivery / Refund Proofs / Verification */}
                                    {(unit.postDeliveryDetails?.success || unit.status === "pending_verification" || unit.status === "completed") && (
                                        <div
                                            className="post-delivery-box"
                                            style={{
                                                border: unit.status === "pending_verification" ? "1.5px solid #c7d2fe" : undefined,
                                                background: unit.status === "pending_verification" ? "#f5f7ff" : undefined,
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                                                <div className="post-delivery-title" style={{ margin: 0 }}>
                                                    {unit.status === "pending_verification"
                                                        ? "⏳ Submitted Review & Delivery Proofs"
                                                        : "✓ Post-Delivery & Verification Details"}
                                                </div>
                                                {unit.status === "pending_verification" && (
                                                    <span className="status-badge status-badge-pending_verification">
                                                        ● Awaiting Executive Verification
                                                    </span>
                                                )}
                                            </div>

                                            <div className="post-delivery-grid">
                                                {unit.postDeliveryDetails?.productReviewScreenshot && (
                                                    <div className="post-delivery-item">
                                                        <span>Product Review</span>
                                                        <div style={{ cursor: "pointer" }} onClick={() => setPreviewImage(unit.postDeliveryDetails.productReviewScreenshot)}>
                                                            <img
                                                                src={unit.postDeliveryDetails.productReviewScreenshot}
                                                                alt="Product Review"
                                                                className="proof-img-thumb"
                                                                style={{ maxHeight: "100px" }}
                                                            />
                                                            <div style={{ fontSize: "11px", color: "var(--primary-600)", marginTop: "2px", fontWeight: "600" }}>🔍 Click to enlarge</div>
                                                        </div>
                                                    </div>
                                                )}
                                                {unit.postDeliveryDetails?.invoiceScreenshot && (
                                                    <div className="post-delivery-item">
                                                        <span>Invoice</span>
                                                        <div style={{ cursor: "pointer" }} onClick={() => setPreviewImage(unit.postDeliveryDetails.invoiceScreenshot)}>
                                                            <img
                                                                src={unit.postDeliveryDetails.invoiceScreenshot}
                                                                alt="Invoice Screenshot"
                                                                className="proof-img-thumb"
                                                                style={{ maxHeight: "100px" }}
                                                            />
                                                            <div style={{ fontSize: "11px", color: "var(--primary-600)", marginTop: "2px", fontWeight: "600" }}>🔍 Click to enlarge</div>
                                                        </div>
                                                    </div>
                                                )}
                                                {unit.postDeliveryDetails?.sellerFeedbackScreenShot && (
                                                    <div className="post-delivery-item">
                                                        <span>Seller Feedback</span>
                                                        <div style={{ cursor: "pointer" }} onClick={() => setPreviewImage(unit.postDeliveryDetails.sellerFeedbackScreenShot)}>
                                                            <img
                                                                src={unit.postDeliveryDetails.sellerFeedbackScreenShot}
                                                                alt="Seller Feedback"
                                                                className="proof-img-thumb"
                                                                style={{ maxHeight: "100px" }}
                                                            />
                                                            <div style={{ fontSize: "11px", color: "var(--primary-600)", marginTop: "2px", fontWeight: "600" }}>🔍 Click to enlarge</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {unit.submittedForVerificationAt && (
                                                <div className="proof-timestamp" style={{ marginTop: "10px" }}>
                                                    Submitted for verification on: {new Date(unit.submittedForVerificationAt).toLocaleString()}
                                                </div>
                                            )}

                                            {unit.completedAt && (
                                                <div className="proof-timestamp">
                                                    Completed & Verified on: {new Date(unit.completedAt).toLocaleString()}
                                                </div>
                                            )}

                                            {/* EXECUTIVE ACTION BAR FOR PENDING VERIFICATION */}
                                            {unit.status === "pending_verification" && isExecutive && (
                                                <div
                                                    style={{
                                                        marginTop: "14px",
                                                        paddingTop: "12px",
                                                        borderTop: "1px solid #c7d2fe",
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        flexWrap: "wrap",
                                                        gap: "10px",
                                                    }}
                                                >
                                                    <div style={{ fontSize: "12.5px", color: "#4338ca", fontWeight: 600 }}>
                                                        Inspect submitted proofs above and verify this delivery to mark as Completed.
                                                    </div>
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        <button
                                                            type="button"
                                                            disabled={verifyingUnitId === unit._id}
                                                            onClick={() => handleRejectVerification(unit._id)}
                                                            className="table-btn table-btn-danger"
                                                            style={{ padding: "6px 14px", fontSize: "12px" }}
                                                        >
                                                            ✕ Request Revision
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={verifyingUnitId === unit._id}
                                                            onClick={() => handleVerifyUnit(unit._id)}
                                                            className="table-btn table-btn-success"
                                                            style={{ padding: "6px 18px", fontSize: "12px", fontWeight: 700 }}
                                                        >
                                                            {verifyingUnitId === unit._id ? "Verifying..." : "✓ Verify & Mark Completed"}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* MEDIATOR STATUS HINT */}
                                            {unit.status === "pending_verification" && !isExecutive && (
                                                <div style={{ marginTop: "10px", fontSize: "12px", color: "#6366f1", fontStyle: "italic" }}>
                                                    ⏳ Your review proofs are under review by the Executive. Status will automatically update to Completed once approved.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* REVISION NOTE IF PREVIOUSLY REJECTED */}
                                    {unit.verificationRejectionReason && unit.status === "pending_refund" && (
                                        <div
                                            style={{
                                                marginTop: "10px",
                                                padding: "10px 14px",
                                                background: "#fff1f2",
                                                border: "1px solid #fecdd3",
                                                borderRadius: "8px",
                                                color: "#9f1239",
                                                fontSize: "12.5px",
                                            }}
                                        >
                                            <b>⚠️ Executive Requested Revision:</b> {unit.verificationRejectionReason}
                                            <div style={{ fontSize: "11.5px", color: "#be123c", marginTop: "4px" }}>
                                                Please update the order review proofs with the requested corrections.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FULLSCREEN IMAGE PREVIEW MODAL */}
            {previewImage && (
                <div
                    onClick={() => setPreviewImage(null)}
                    className="image-modal-overlay"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="image-modal-content"
                    >
                        <div className="image-modal-header">
                            <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--slate-700)" }}>
                                Proof Preview
                            </span>
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="image-modal-close-btn"
                            >
                                Close ✕
                            </button>
                        </div>
                        <img
                            src={previewImage}
                            alt="Zoomed Payment Screenshot"
                            className="image-modal-img"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}