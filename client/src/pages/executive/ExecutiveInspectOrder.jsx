import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrder } from "../../services/orders";
import {
    verifyExecutiveOrderUnit,
    rejectExecutiveOrderUnitVerification,
} from "../../services/executive/order";
import "../../styles/ordersTable.css";
import "../../styles/displayOrder.css";

export default function ExecutiveInspectOrder() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeUnitTab, setActiveUnitTab] = useState("all");
    const [previewImage, setPreviewImage] = useState(null);
    const [verifyingUnitId, setVerifyingUnitId] = useState(null);

    const [revisionModal, setRevisionModal] = useState({
        isOpen: false,
        unitId: null,
        targetStatus: "pending_refund",
        reason: "",
        isSubmitting: false,
    });

    useEffect(() => {
        if (id) {
            loadOrder();
        }
    }, [id]);

    const loadOrder = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getOrder(id);
            if (res.data?.order) {
                setOrder(res.data.order);
            } else {
                setError("Order details could not be found.");
            }
        } catch (err) {
            console.error("Error loading order for inspection:", err);
            setError(err?.response?.data?.message || "Failed to load order for verification.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyUnit = async (unitId) => {
        if (!window.confirm("Verify submitted review proofs and mark this unit as Completed?")) return;
        try {
            setVerifyingUnitId(unitId);
            const res = await verifyExecutiveOrderUnit({ orderId: order._id, unitId });
            if (res.data?.success) {
                alert("✓ Unit verified successfully and marked as Completed!");
                setOrder((prev) => {
                    if (!prev) return prev;
                    const updatedUnits = (prev.orderUnits || []).map((u) =>
                        u._id === unitId ? { ...u, status: "completed", completedAt: new Date() } : u
                    );
                    return { ...prev, orderUnits: updatedUnits };
                });
            }
        } catch (err) {
            console.error("Error verifying unit:", err);
            alert(err?.response?.data?.message || "Failed to verify unit");
        } finally {
            setVerifyingUnitId(null);
        }
    };

    const openRevisionModal = (unitId) => {
        setRevisionModal({
            isOpen: true,
            unitId,
            targetStatus: "pending_refund",
            reason: "",
            isSubmitting: false,
        });
    };

    const closeRevisionModal = () => {
        setRevisionModal({
            isOpen: false,
            unitId: null,
            targetStatus: "pending_refund",
            reason: "",
            isSubmitting: false,
        });
    };

    const submitRevisionModal = async () => {
        if (!revisionModal.reason.trim()) {
            alert("Please provide a reason or feedback for requesting revision.");
            return;
        }

        try {
            setRevisionModal((prev) => ({ ...prev, isSubmitting: true }));
            const res = await rejectExecutiveOrderUnitVerification({
                orderId: order._id,
                unitId: revisionModal.unitId,
                reason: revisionModal.reason.trim(),
                targetStatus: revisionModal.targetStatus,
            });

            if (res.data?.success) {
                const destLabel =
                    revisionModal.targetStatus === "in_progress"
                        ? "In Progress (Stage 2)"
                        : "Pending Refund (Stage 3)";
                alert(`Revision requested! Unit returned to ${destLabel} for the mediator.`);
                setOrder((prev) => {
                    if (!prev) return prev;
                    const updatedUnits = (prev.orderUnits || []).map((u) =>
                        u._id === revisionModal.unitId
                            ? {
                                  ...u,
                                  status: revisionModal.targetStatus,
                                  verificationRejectionReason: revisionModal.reason.trim(),
                                  rejectedAt: new Date(),
                              }
                            : u
                    );
                    return { ...prev, orderUnits: updatedUnits };
                });
                closeRevisionModal();
            }
        } catch (err) {
            console.error("Error requesting revision:", err);
            alert(err?.response?.data?.message || "Failed to request revision");
            setRevisionModal((prev) => ({ ...prev, isSubmitting: false }));
        }
    };

    if (loading) {
        return (
            <div className="table-page-container">
                <div className="empty-state-card">
                    <div className="empty-state-icon">⏳</div>
                    <h2 className="empty-state-title">Loading Delivery Verification...</h2>
                    <p className="empty-state-text">Fetching submitted review screenshots and proof dossier.</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="table-page-container">
                <div className="empty-state-card">
                    <div className="empty-state-icon">⚠️</div>
                    <h2 className="empty-state-title">Unable to Load Order</h2>
                    <p className="empty-state-text">{error || "The requested order could not be loaded."}</p>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "16px" }}>
                        <button onClick={loadOrder} className="table-btn table-btn-primary">
                            🔄 Retry
                        </button>
                        <button onClick={() => navigate("/executive-verify-orders")} className="table-btn table-btn-outline">
                            ← Back to Verification Queue
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const allUnits = order.orderUnits || [];
    const pendingUnits = allUnits.filter((u) => u.status === "pending_verification");
    const completedUnits = allUnits.filter((u) => u.status === "completed");

    return (
        <div className="display-order-page" style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 20px" }}>
            {/* Top Navigation & Action Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
                <div>
                    <button
                        type="button"
                        onClick={() => navigate("/executive-verify-orders")}
                        className="table-btn table-btn-outline"
                        style={{ padding: "6px 12px", fontSize: "12.5px", marginBottom: "8px" }}
                    >
                        ← Back to Verification Queue
                    </button>
                    <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--slate-900)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                        🔍 Delivery Proof Inspection & Verification
                    </h1>
                    <p style={{ margin: "4px 0 0", color: "var(--slate-500)", fontSize: "13px" }}>
                        Focused inspection view: showing <b>only units awaiting delivery verification</b>.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => navigate(`/order/${order._id}`)}
                    className="table-btn table-btn-secondary"
                    style={{ padding: "8px 14px", fontSize: "13px", fontWeight: 600 }}
                    title="View complete master order specifications, all units across all stages, and finance history"
                >
                    📄 View Full Order Details →
                </button>
            </div>

            {/* Compact Order Summary Banner */}
            <div className="display-section-card" style={{ marginBottom: "20px", padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary-600)" }}>
                            Order Details
                        </span>
                        <h2 style={{ fontSize: "17px", fontWeight: 800, color: "var(--slate-900)", margin: "2px 0 4px" }}>
                            {order.productName}
                        </h2>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12.5px", color: "var(--slate-600)", flexWrap: "wrap" }}>
                            <span>Brand: <b style={{ color: "var(--slate-800)" }}>{order.brand || "Unbranded"}</b></span>
                            <span>Platform: <b style={{ color: "var(--slate-800)" }}>{order.orderPlatform || "Online"}</b></span>
                            <span>Unit Price: <b style={{ color: "#16a34a" }}>₹{order.price}</b></span>
                            <span>Master ID: <code style={{ fontSize: "11.5px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>{order._id}</code></span>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <div style={{ textAlign: "right", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "8px", padding: "6px 14px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>
                                To Verify
                            </div>
                            <div style={{ fontSize: "18px", fontWeight: 800, color: "#b45309" }}>
                                {pendingUnits.length} {pendingUnits.length === 1 ? "Unit" : "Units"}
                            </div>
                        </div>
                        <div style={{ textAlign: "right", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "6px 14px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>
                                Completed
                            </div>
                            <div style={{ fontSize: "18px", fontWeight: 800, color: "#15803d" }}>
                                {completedUnits.length} / {allUnits.length}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Units Inspection Queue */}
            {pendingUnits.length === 0 ? (
                <div className="empty-state-card" style={{ padding: "40px 20px" }}>
                    <div className="empty-state-icon">🎉</div>
                    <h2 className="empty-state-title">All Pending Deliveries Verified!</h2>
                    <p className="empty-state-text">
                        There are no more units awaiting delivery verification on this order.
                    </p>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "16px" }}>
                        <button
                            onClick={() => navigate("/executive-verify-orders")}
                            className="table-btn table-btn-primary"
                        >
                            ← Return to Verification Queue
                        </button>
                        <button
                            onClick={() => navigate(`/order/${order._id}`)}
                            className="table-btn table-btn-outline"
                        >
                            📄 View Full Order Details
                        </button>
                    </div>
                </div>
            ) : (
                <div className="display-section-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
                        <h2 className="display-section-title" style={{ margin: 0 }}>
                            📋 Units Requiring Verification ({pendingUnits.length})
                        </h2>
                    </div>

                    {/* Unit Selector Tabs if more than 1 unit needs verification */}
                    {pendingUnits.length > 1 && (
                        <div className="unit-tabs-nav" style={{ marginBottom: "16px" }}>
                            <button
                                type="button"
                                className={`unit-tab-btn ${activeUnitTab === "all" ? "active" : ""}`}
                                onClick={() => setActiveUnitTab("all")}
                            >
                                All Pending Units ({pendingUnits.length})
                            </button>
                            {pendingUnits.map((u) => {
                                const originalIndex = allUnits.findIndex((orig) => orig._id === u._id);
                                const displayIndex = originalIndex >= 0 ? originalIndex + 1 : 1;
                                return (
                                    <button
                                        key={u._id}
                                        type="button"
                                        className={`unit-tab-btn ${activeUnitTab === u._id ? "active" : ""}`}
                                        onClick={() => setActiveUnitTab(u._id)}
                                    >
                                        Unit #{displayIndex} ⏳
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {pendingUnits
                            .filter((u) => activeUnitTab === "all" || u._id === activeUnitTab)
                            .map((unit) => {
                                const originalIndex = allUnits.findIndex((orig) => orig._id === unit._id);
                                const unitNumber = originalIndex >= 0 ? originalIndex + 1 : 1;

                                return (
                                    <div
                                        key={unit._id}
                                        className={`unit-item-card ${unit.verificationRejectionReason ? "unit-card-revision" : ""}`}
                                        style={{
                                            border: "1.5px solid #c7d2fe",
                                            background: "#ffffff",
                                        }}
                                    >
                                        {/* Unit Header */}
                                        <div className="unit-item-header">
                                            <div className="unit-item-title">
                                                Unit #{unitNumber}
                                                <span className="unit-item-id">ID: {unit._id}</span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <span className="status-badge status-badge-pending_verification">
                                                    ● Awaiting Verification
                                                </span>
                                                {unit.verificationRejectionReason && (
                                                    <span className="status-badge-revision">
                                                        ⚠️ Revision Resubmitted
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Mediator & Order Context */}
                                        <div className="unit-mediator-box" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                                                <div>
                                                    <b>Assigned Mediator:</b>{" "}
                                                    {unit.mediatorId ? (
                                                        <span>
                                                            {unit.mediatorId.name || "Mediator"} (Code: <b>{unit.mediatorId.mediatorCode || "N/A"}</b>)
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "var(--slate-400)", fontStyle: "italic" }}>Not assigned</span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                                                    {unit.submittedForVerificationAt && (
                                                        <span>Submitted: {new Date(unit.submittedForVerificationAt).toLocaleString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Required Order Placement Specs */}
                                        <div className="unit-details-grid" style={{ marginBottom: "14px" }}>
                                            <div>
                                                <span className="unit-detail-label">Amazon/Platform Order ID:</span>
                                                <div className="unit-detail-val" style={{ fontWeight: 700, color: "var(--primary-600)" }}>
                                                    {unit.orderId || "Not submitted"}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="unit-detail-label">Reviewer Name:</span>
                                                <div className="unit-detail-val">{unit.reviewerName || "Not submitted"}</div>
                                            </div>
                                            <div>
                                                <span className="unit-detail-label">Expected Arrival:</span>
                                                <div className="unit-detail-val">
                                                    {unit.expectedArrivalDate ? new Date(unit.expectedArrivalDate).toLocaleDateString() : "N/A"}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="unit-detail-label">Order Received On:</span>
                                                <div className="unit-detail-val">
                                                    {unit.orderReceivedOn ? new Date(unit.orderReceivedOn).toLocaleDateString() : "N/A"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Previous Revision Feedback Callout if resubmitted */}
                                        {unit.verificationRejectionReason && (
                                            <div className="revision-feedback-callout" style={{ marginBottom: "14px" }}>
                                                <div className="callout-header">
                                                    <span>⚠️ Previous Revision Requested by Executive:</span>
                                                </div>
                                                <p className="callout-reason">"{unit.verificationRejectionReason}"</p>
                                                <div className="callout-hint">
                                                    Mediator has resubmitted the corrected proofs below for your re-inspection.
                                                </div>
                                            </div>
                                        )}

                                        {/* 4-Tile Verification Proof Dossier */}
                                        <div style={{ background: "#f5f7ff", border: "1px solid #c7d2fe", borderRadius: "10px", padding: "14px", marginBottom: "14px" }}>
                                            <div style={{ fontSize: "13.5px", fontWeight: 800, color: "var(--slate-800)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                                                📸 Submitted Verification Proofs (4 Required Tiles)
                                            </div>

                                            <div className="verification-dossier-grid">
                                                {/* Proof 1: Ordered Screenshot */}
                                                <div className="proof-dossier-card">
                                                    <div className="proof-dossier-header">
                                                        <span className="proof-dossier-label">🛒 1. Ordered Screenshot</span>
                                                        {unit.orderedScreenshot ? (
                                                            <span className="proof-tag-ok">Uploaded</span>
                                                        ) : (
                                                            <span className="proof-tag-na">Missing</span>
                                                        )}
                                                    </div>
                                                    <div className="proof-dossier-body">
                                                        {unit.orderedScreenshot ? (
                                                            <div
                                                                style={{ cursor: "pointer", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                                                                onClick={() => setPreviewImage(unit.orderedScreenshot)}
                                                            >
                                                                <img
                                                                    src={unit.orderedScreenshot}
                                                                    alt="Ordered Screenshot"
                                                                    className="proof-dossier-img"
                                                                />
                                                                <div className="proof-dossier-zoom-pill">🔍 Zoom</div>
                                                            </div>
                                                        ) : (
                                                            <div className="proof-dossier-empty">No screenshot provided</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Proof 2: Product Review */}
                                                <div className="proof-dossier-card">
                                                    <div className="proof-dossier-header">
                                                        <span className="proof-dossier-label">⭐ 2. Product Review</span>
                                                        {unit.postDeliveryDetails?.productReviewScreenshot ? (
                                                            <span className="proof-tag-ok">Uploaded</span>
                                                        ) : (
                                                            <span className="proof-tag-na">Missing</span>
                                                        )}
                                                    </div>
                                                    <div className="proof-dossier-body">
                                                        {unit.postDeliveryDetails?.productReviewScreenshot ? (
                                                            <div
                                                                style={{ cursor: "pointer", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                                                                onClick={() => setPreviewImage(unit.postDeliveryDetails.productReviewScreenshot)}
                                                            >
                                                                <img
                                                                    src={unit.postDeliveryDetails.productReviewScreenshot}
                                                                    alt="Product Review Screenshot"
                                                                    className="proof-dossier-img"
                                                                />
                                                                <div className="proof-dossier-zoom-pill">🔍 Zoom</div>
                                                            </div>
                                                        ) : (
                                                            <div className="proof-dossier-empty">No screenshot provided</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Proof 3: Invoice */}
                                                <div className="proof-dossier-card">
                                                    <div className="proof-dossier-header">
                                                        <span className="proof-dossier-label">🧾 3. Invoice</span>
                                                        {unit.postDeliveryDetails?.invoiceScreenshot ? (
                                                            <span className="proof-tag-ok">Uploaded</span>
                                                        ) : (
                                                            <span className="proof-tag-na">Missing</span>
                                                        )}
                                                    </div>
                                                    <div className="proof-dossier-body">
                                                        {unit.postDeliveryDetails?.invoiceScreenshot ? (
                                                            <div
                                                                style={{ cursor: "pointer", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                                                                onClick={() => setPreviewImage(unit.postDeliveryDetails.invoiceScreenshot)}
                                                            >
                                                                <img
                                                                    src={unit.postDeliveryDetails.invoiceScreenshot}
                                                                    alt="Invoice Screenshot"
                                                                    className="proof-dossier-img"
                                                                />
                                                                <div className="proof-dossier-zoom-pill">🔍 Zoom</div>
                                                            </div>
                                                        ) : (
                                                            <div className="proof-dossier-empty">No screenshot provided</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Proof 4: Seller Feedback */}
                                                <div className="proof-dossier-card">
                                                    <div className="proof-dossier-header">
                                                        <span className="proof-dossier-label">💬 4. Seller Feedback</span>
                                                        {unit.postDeliveryDetails?.sellerFeedbackScreenShot ? (
                                                            <span className="proof-tag-ok">Uploaded</span>
                                                        ) : (
                                                            <span className="proof-tag-na">Missing</span>
                                                        )}
                                                    </div>
                                                    <div className="proof-dossier-body">
                                                        {unit.postDeliveryDetails?.sellerFeedbackScreenShot ? (
                                                            <div
                                                                style={{ cursor: "pointer", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                                                                onClick={() => setPreviewImage(unit.postDeliveryDetails.sellerFeedbackScreenShot)}
                                                            >
                                                                <img
                                                                    src={unit.postDeliveryDetails.sellerFeedbackScreenShot}
                                                                    alt="Seller Feedback Screenshot"
                                                                    className="proof-dossier-img"
                                                                />
                                                                <div className="proof-dossier-zoom-pill">🔍 Zoom</div>
                                                            </div>
                                                        ) : (
                                                            <div className="proof-dossier-empty">No screenshot provided</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Controls Bar */}
                                        <div className="verification-action-bar">
                                            <div className="verification-action-note">
                                                Inspect the 4 submitted proof tiles above. Verify this delivery to mark as Completed, or request revision if proofs are unsatisfactory.
                                            </div>
                                            <div className="verification-btn-group">
                                                <button
                                                    type="button"
                                                    disabled={verifyingUnitId === unit._id || revisionModal.isOpen}
                                                    onClick={() => openRevisionModal(unit._id)}
                                                    className="table-btn table-btn-danger"
                                                >
                                                    ✕ Request Revision
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={verifyingUnitId === unit._id}
                                                    onClick={() => handleVerifyUnit(unit._id)}
                                                    className="table-btn table-btn-success"
                                                    style={{ fontWeight: 700 }}
                                                >
                                                    {verifyingUnitId === unit._id ? "Verifying..." : "✓ Verify & Mark Completed"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Modal: Fullscreen Image Preview */}
            {previewImage && (
                <div className="image-modal-overlay" onClick={() => setPreviewImage(null)}>
                    <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="image-modal-header">
                            <span style={{ fontWeight: 700, fontSize: "14px" }}>Proof Screenshot Preview</span>
                            <button className="image-modal-close-btn" onClick={() => setPreviewImage(null)}>
                                ✕
                            </button>
                        </div>
                        <img src={previewImage} alt="Fullscreen Proof Preview" className="image-modal-img" />
                    </div>
                </div>
            )}

            {/* Modal: Executive Request Revision */}
            {revisionModal.isOpen && (
                <div className="revision-modal-overlay" onClick={closeRevisionModal}>
                    <div className="revision-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="revision-modal-header">
                            <div>
                                <h3 className="revision-modal-title">⚠️ Request Delivery Revision</h3>
                                <p className="revision-modal-subtitle">
                                    Return this delivery unit to the mediator for corrections. Choose where to send the order back.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeRevisionModal}
                                style={{ background: "none", border: "none", fontSize: "18px", color: "var(--slate-400)", cursor: "pointer" }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Destination Choice Cards */}
                        <div className="revision-dest-options">
                            <div
                                className={`revision-dest-card ${revisionModal.targetStatus === "pending_refund" ? "selected" : ""}`}
                                onClick={() => setRevisionModal((prev) => ({ ...prev, targetStatus: "pending_refund" }))}
                            >
                                <div className="dest-radio-indicator" />
                                <div className="dest-card-info">
                                    <div className="dest-card-title">
                                        🔄 Pending Refund (Stage 3) — Recommended for Proof Issues
                                    </div>
                                    <div className="dest-card-desc">
                                        Mediator keeps their order placement details intact, but must re-upload review, invoice, or seller feedback screenshots.
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`revision-dest-card ${revisionModal.targetStatus === "in_progress" ? "selected" : ""}`}
                                onClick={() => setRevisionModal((prev) => ({ ...prev, targetStatus: "in_progress" }))}
                            >
                                <div className="dest-radio-indicator" />
                                <div className="dest-card-info">
                                    <div className="dest-card-title">
                                        ⏪ Return to In Progress (Stage 2) — Re-enter Order Details
                                    </div>
                                    <div className="dest-card-desc">
                                        Mediator must re-enter Amazon Order ID, reviewer name, or order confirmation screenshot from scratch.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reason / Feedback input */}
                        <div className="revision-reason-group">
                            <label className="revision-reason-label">
                                Feedback / Reason for Revision <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <textarea
                                rows={3}
                                className="revision-reason-textarea"
                                placeholder="Explain what is wrong or missing with the submitted proofs (e.g. Review screenshot is blurry, invoice missing, 5-star rating not visible)..."
                                value={revisionModal.reason}
                                onChange={(e) => setRevisionModal((prev) => ({ ...prev, reason: e.target.value }))}
                            />
                            <div className="quick-reason-chips">
                                {[
                                    "Review screenshot is blurry or cropped",
                                    "5-star storefront rating not visible",
                                    "External Order ID does not match",
                                    "Platform invoice screenshot is missing",
                                    "Seller feedback proof incomplete",
                                    "Wrong order placed, re-place in progress",
                                ].map((chip) => (
                                    <button
                                        key={chip}
                                        type="button"
                                        className="quick-chip-btn"
                                        onClick={() =>
                                            setRevisionModal((prev) => ({
                                                ...prev,
                                                reason: prev.reason ? `${prev.reason}; ${chip}` : chip,
                                            }))
                                        }
                                    >
                                        + {chip}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="revision-modal-footer">
                            <button
                                type="button"
                                onClick={closeRevisionModal}
                                className="table-btn table-btn-outline"
                                disabled={revisionModal.isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitRevisionModal}
                                className="table-btn table-btn-danger"
                                disabled={revisionModal.isSubmitting || !revisionModal.reason.trim()}
                                style={{ fontWeight: 700 }}
                            >
                                {revisionModal.isSubmitting ? "Submitting..." : "Send Revision Request ⚠️"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
