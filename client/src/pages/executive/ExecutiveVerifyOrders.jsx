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
    const [collapsedMediators, setCollapsedMediators] = useState({});

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

    const [revisionModal, setRevisionModal] = useState({
        isOpen: false,
        orderId: null,
        unitId: null,
        targetStatus: "pending_refund",
        reason: "",
        unitInfo: "",
    });

    const openRevisionModal = (orderId, unitId, unitInfo) => {
        setRevisionModal({
            isOpen: true,
            orderId,
            unitId,
            targetStatus: "pending_refund",
            reason: "",
            unitInfo: unitInfo || "",
        });
    };

    const closeRevisionModal = () => {
        setRevisionModal({
            isOpen: false,
            orderId: null,
            unitId: null,
            targetStatus: "pending_refund",
            reason: "",
            unitInfo: "",
        });
    };

    const submitRevisionModal = async () => {
        if (!revisionModal.reason.trim()) {
            alert("Please enter a reason or feedback for the revision request.");
            return;
        }
        try {
            setVerifyingId(revisionModal.unitId);
            const res = await rejectExecutiveOrderUnitVerification({
                orderId: revisionModal.orderId,
                unitId: revisionModal.unitId,
                reason: revisionModal.reason.trim(),
                targetStatus: revisionModal.targetStatus,
            });
            if (res.data?.success) {
                const destLabel = revisionModal.targetStatus === "in_progress" ? "In Progress" : "Pending Refund";
                alert(`Revision requested! Unit returned to ${destLabel} for mediator correction.`);
                closeRevisionModal();
                await loadVerificationOrders();
            }
        } catch (err) {
            console.error("Error rejecting verification:", err);
            alert(err?.response?.data?.message || "Failed to request revision");
        } finally {
            setVerifyingId(null);
        }
    };

    const toggleCollapseMediator = (medId) => {
        setCollapsedMediators((prev) => ({
            ...prev,
            [medId]: !prev[medId],
        }));
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

    // 3-LEVEL GROUPING: Mediator -> Brand -> Units
    const groupedByMediator = {};

    filteredItems.forEach(({ order, unit }) => {
        const med = unit.mediatorId || {};
        const medId = med._id ? med._id.toString() : (med.id || "unassigned");
        const medName = med.name || "Unknown Mediator";
        const medCode = med.mediatorCode || "N/A";
        const medPhone = med.phone || "";
        const medEmail = med.email || "";

        if (!groupedByMediator[medId]) {
            groupedByMediator[medId] = {
                mediator: {
                    _id: medId,
                    name: medName,
                    mediatorCode: medCode,
                    phone: medPhone,
                    email: medEmail,
                },
                totalUnits: 0,
                totalAmount: 0,
                brands: {},
            };
        }

        const brandName = (order.brand || "Unbranded").trim();
        const brandKey = brandName.toLowerCase();

        if (!groupedByMediator[medId].brands[brandKey]) {
            groupedByMediator[medId].brands[brandKey] = {
                brand: brandName,
                totalUnits: 0,
                totalAmount: 0,
                items: [],
            };
        }

        const price = parseFloat(order.price) || 0;
        groupedByMediator[medId].totalUnits += 1;
        groupedByMediator[medId].totalAmount += price;

        groupedByMediator[medId].brands[brandKey].totalUnits += 1;
        groupedByMediator[medId].brands[brandKey].totalAmount += price;
        groupedByMediator[medId].brands[brandKey].items.push({ order, unit });
    });

    const mediatorGroups = Object.values(groupedByMediator).map((group) => ({
        ...group,
        brandsList: Object.values(group.brands),
    }));

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
                        Mediator-wise & Brand-wise inspection of all 4 verification proofs (Ordered SS, Review SS, Invoice SS, and Seller Feedback). Approve deliveries to transition to Completed, or request revisions.
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
                    <span className="metric-label">Active Mediators</span>
                    <span className="metric-value metric-value-primary">{mediatorGroups.length}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Units Under Review</span>
                    <span className="metric-value" style={{ color: "#4f46e5" }}>
                        {pendingUnitsAll.length} Units
                    </span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Total Verification Value</span>
                    <span className="metric-value metric-value-green">₹{totalValue.toLocaleString()}</span>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="order-filters-card" style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ flex: "1 1 260px" }}>
                        <input
                            type="text"
                            placeholder="🔍 Search product, brand, reviewer, mediator code, order ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="filter-input"
                            style={{ width: "100%", boxSizing: "border-box" }}
                        />
                    </div>

                    <div style={{ minWidth: "200px" }}>
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
            {mediatorGroups.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">✅</div>
                    <h2 className="empty-state-title">Verification Queue Empty</h2>
                    <p className="empty-state-text">
                        There are currently no deliveries awaiting executive verification. When mediators submit review proofs, they will appear here grouped mediator-wise, brand-wise, and unit-wise.
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
                /* 3-LEVEL HIERARCHICAL VIEW */
                <div className="verification-hierarchy-wrapper">
                    {mediatorGroups.map((group) => {
                        const med = group.mediator;
                        const isCollapsed = !!collapsedMediators[med._id];

                        return (
                            <div key={med._id} className="mediator-verification-card">
                                {/* LEVEL 1: MEDIATOR HEADER */}
                                <div className="mediator-vcard-header">
                                    <div className="mediator-vcard-profile">
                                        <div className="mediator-vcard-avatar">
                                            {med.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="mediator-vcard-info">
                                            <h2 className="mediator-vcard-title">
                                                Mediator: {med.name}
                                                <span className="brand-tag" style={{ fontSize: "12px", padding: "2px 8px" }}>
                                                    {med.mediatorCode}
                                                </span>
                                            </h2>
                                            <div className="mediator-vcard-meta">
                                                {med.phone && <span>📞 {med.phone}</span>}
                                                {med.email && <span>✉️ {med.email}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mediator-vcard-stats">
                                        <span className="vcard-stat-chip units">
                                            ⏳ {group.totalUnits} {group.totalUnits === 1 ? "Unit" : "Units"} Under Review
                                        </span>
                                        <span className="vcard-stat-chip amount">
                                            💰 ₹{group.totalAmount.toLocaleString()} Value
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => toggleCollapseMediator(med._id)}
                                            className="mediator-vcard-collapse-btn"
                                            title={isCollapsed ? "Expand section" : "Collapse section"}
                                        >
                                            {isCollapsed ? "Expand ▼" : "Collapse ▲"}
                                        </button>
                                    </div>
                                </div>

                                {/* LEVEL 2 & 3: BRANDS & UNITS */}
                                {!isCollapsed && (
                                    <div className="mediator-vcard-body">
                                        {group.brandsList.map((brandSection) => (
                                            <div key={brandSection.brand} className="brand-verification-section">
                                                {/* LEVEL 2: BRAND HEADER */}
                                                <div className="brand-vsection-header">
                                                    <div className="brand-vsection-title">
                                                        <span>🏷️ Brand:</span>
                                                        <span className="brand-vsection-tag">
                                                            {brandSection.brand}
                                                        </span>
                                                    </div>
                                                    <div className="brand-vsection-meta">
                                                        <span style={{ fontWeight: 600, color: "var(--slate-700)" }}>
                                                            {brandSection.totalUnits} {brandSection.totalUnits === 1 ? "Unit" : "Units"}
                                                        </span>
                                                        <span>•</span>
                                                        <span style={{ fontWeight: 700, color: "#16a34a" }}>
                                                            Subtotal: ₹{brandSection.totalAmount.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* LEVEL 3: UNIT CARDS */}
                                                <div className="brand-vsection-units-list">
                                                    {brandSection.items.map(({ order, unit }, unitIdx) => {
                                                        const postDetails = unit.postDeliveryDetails || {};
                                                        const isActing = verifyingId === unit._id;

                                                        return (
                                                            <div key={unit._id} className="verification-unit-card">
                                                                {/* Unit Header Row */}
                                                                <div className="v-unit-header">
                                                                    <div className="v-unit-title-group">
                                                                        <span className="v-unit-badge">
                                                                            Unit #{unitIdx + 1}
                                                                        </span>
                                                                        <a
                                                                            href={order.productLink}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="v-unit-product-name"
                                                                            title="Open product link in new tab"
                                                                        >
                                                                            {order.productName} ↗
                                                                        </a>
                                                                        <span className="platform-badge">
                                                                            {order.orderPlatform || "Amazon"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="v-unit-meta-row">
                                                                        {unit.orderId && (
                                                                            <div className="v-unit-meta-item">
                                                                                <span style={{ color: "var(--slate-500)" }}>Order ID:</span>
                                                                                <span style={{ fontWeight: 600, color: "var(--slate-800)" }}>{unit.orderId}</span>
                                                                            </div>
                                                                        )}
                                                                        {unit.reviewerName && (
                                                                            <div className="v-unit-meta-item">
                                                                                <span style={{ color: "var(--slate-500)" }}>Reviewer:</span>
                                                                                <span style={{ fontWeight: 600, color: "var(--slate-800)" }}>{unit.reviewerName}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="v-unit-meta-item">
                                                                            <span style={{ color: "var(--slate-500)" }}>Price:</span>
                                                                            <span className="v-unit-price">₹{order.price}</span>
                                                                        </div>
                                                                        <div className="v-unit-meta-item" style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                                                                            {unit.submittedForVerificationAt
                                                                                ? `Submitted: ${new Date(unit.submittedForVerificationAt).toLocaleDateString()}`
                                                                                : `Created: ${new Date(order.createdAt).toLocaleDateString()}`}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Prior Revision Alert if any */}
                                                                {unit.verificationRejectionReason && (
                                                                    <div className="v-unit-revision-alert">
                                                                        <span>⚠️</span>
                                                                        <div>
                                                                            <b>Previous Revision Feedback:</b> {unit.verificationRejectionReason}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* 4-POINT DECLUTTERED PROOF DOSSIER */}
                                                                <div className="v-proofs-dossier">
                                                                    <div className="v-proofs-title">
                                                                        <span>📋 Submitted Verification Proofs</span>
                                                                        <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--slate-500)" }}>
                                                                            (Ordered SS, Review SS, Invoice, Seller Feedback)
                                                                        </span>
                                                                    </div>

                                                                    <div className="v-proofs-grid">
                                                                        {/* Proof 1: Ordered Screenshot */}
                                                                        <div className={`v-proof-card ${unit.orderedScreenshot ? "active" : "empty"}`}>
                                                                            <div className="v-proof-card-header">
                                                                                <span className={`v-proof-num ${unit.orderedScreenshot ? "" : "empty"}`}>1</span>
                                                                                <span className="v-proof-card-title">🛒 Ordered SS</span>
                                                                            </div>
                                                                            <div className="v-proof-media">
                                                                                {unit.orderedScreenshot ? (
                                                                                    <div
                                                                                        className="v-proof-img-wrap"
                                                                                        onClick={() =>
                                                                                            setSelectedProof({
                                                                                                title: "Ordered Screenshot (Placement Proof)",
                                                                                                url: unit.orderedScreenshot,
                                                                                                info: `${order.productName} — Unit #${unitIdx + 1} (${unit.reviewerName || "Reviewer"})`,
                                                                                            })
                                                                                        }
                                                                                    >
                                                                                        <img
                                                                                            src={unit.orderedScreenshot}
                                                                                            alt="Ordered Screenshot"
                                                                                            className="v-proof-img"
                                                                                        />
                                                                                        <span className="v-proof-zoom-hint">🔍 Zoom</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="v-proof-empty-box">
                                                                                        <span className="v-proof-empty-icon">🛒</span>
                                                                                        <span className="v-proof-empty-text">No Ordered SS</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            {unit.orderedScreenshot && (
                                                                                <div className="v-proof-footer-actions">
                                                                                    <button
                                                                                        type="button"
                                                                                        className="v-proof-btn-zoom"
                                                                                        onClick={() =>
                                                                                            setSelectedProof({
                                                                                                title: "Ordered Screenshot (Placement Proof)",
                                                                                                url: unit.orderedScreenshot,
                                                                                                info: `${order.productName} — Unit #${unitIdx + 1} (${unit.reviewerName || "Reviewer"})`,
                                                                                            })
                                                                                        }
                                                                                    >
                                                                                        Enlarge 🔍
                                                                                    </button>
                                                                                    <a
                                                                                        href={unit.orderedScreenshot}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="v-proof-btn-zoom"
                                                                                    >
                                                                                        New Tab ↗
                                                                                    </a>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Proof 2: Product Review Screenshot */}
                                                                        <div className={`v-proof-card ${postDetails.productReviewScreenshot ? "active" : "empty"}`}>
                                                                            <div className="v-proof-card-header">
                                                                                <span className={`v-proof-num ${postDetails.productReviewScreenshot ? "" : "empty"}`}>2</span>
                                                                                <span className="v-proof-card-title">⭐ Review SS</span>
                                                                            </div>
                                                                            <div className="v-proof-media">
                                                                                {postDetails.productReviewScreenshot ? (
                                                                                    <div
                                                                                        className="v-proof-img-wrap"
                                                                                        onClick={() =>
                                                                                            setSelectedProof({
                                                                                                title: "Product Review Screenshot",
                                                                                                url: postDetails.productReviewScreenshot,
                                                                                                info: `${order.productName} — Unit #${unitIdx + 1} (${unit.reviewerName || "Reviewer"})`,
                                                                                            })
                                                                                        }
                                                                                    >
                                                                                        <img
                                                                                            src={postDetails.productReviewScreenshot}
                                                                                            alt="Product Review Screenshot"
                                                                                            className="v-proof-img"
                                                                                        />
                                                                                        <span className="v-proof-zoom-hint">🔍 Zoom</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="v-proof-empty-box">
                                                                                        <span className="v-proof-empty-icon">⭐</span>
                                                                                        <span className="v-proof-empty-text">No Review SS</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="v-proof-footer-actions">
                                                                                {postDetails.productReviewScreenshot && (
                                                                                    <button
                                                                                        type="button"
                                                                                        className="v-proof-btn-zoom"
                                                                                        onClick={() =>
                                                                                            setSelectedProof({
                                                                                                title: "Product Review Screenshot",
                                                                                                url: postDetails.productReviewScreenshot,
                                                                                                info: `${order.productName} — Unit #${unitIdx + 1} (${unit.reviewerName || "Reviewer"})`,
                                                                                            })
                                                                                        }
                                                                                    >
                                                                                        Enlarge 🔍
                                                                                    </button>
                                                                                )}
                                                                                {postDetails.productReviewLink && (
                                                                                    <a
                                                                                        href={postDetails.productReviewLink}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="v-proof-btn-zoom"
                                                                                        title="Open Live Review Link"
                                                                                    >
                                                                                        Review URL ↗
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Proof 3: Invoice Screenshot */}
                                                                        <div className={`v-proof-card ${postDetails.invoiceScreenshot ? "active" : "empty"}`}>
                                                                            <div className="v-proof-card-header">
                                                                                <span className={`v-proof-num ${postDetails.invoiceScreenshot ? "" : "empty"}`}>3</span>
                                                                                <span className="v-proof-card-title">🧾 Invoice SS</span>
                                                                            </div>
                                                                            <div className="v-proof-media">
                                                                                {postDetails.invoiceScreenshot ? (
                                                                                    <div
                                                                                        className="v-proof-img-wrap"
                                                                                        onClick={() =>
                                                                                            setSelectedProof({
                                                                                                title: "Platform Invoice Screenshot",
                                                                                                url: postDetails.invoiceScreenshot,
                                                                                                info: `${order.productName} — Unit #${unitIdx + 1} Invoice`,
                                                                                            })
                                                                                        }
                                                                                    >
                                                                                        <img
                                                                                            src={postDetails.invoiceScreenshot}
                                                                                            alt="Invoice Screenshot"
                                                                                            className="v-proof-img"
                                                                                        />
                                                                                        <span className="v-proof-zoom-hint">🔍 Zoom</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="v-proof-empty-box">
                                                                                        <span className="v-proof-empty-icon">🧾</span>
                                                                                        <span className="v-proof-empty-text">Invoice Optional</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            {postDetails.invoiceScreenshot && (
                                                                                <div className="v-proof-footer-actions">
                                                                                    <button
                                                                                        type="button"
                                                                                        className="v-proof-btn-zoom"
                                                                                        onClick={() =>
                                                                                            setSelectedProof({
                                                                                                title: "Platform Invoice Screenshot",
                                                                                                url: postDetails.invoiceScreenshot,
                                                                                                info: `${order.productName} — Unit #${unitIdx + 1} Invoice`,
                                                                                            })
                                                                                        }
                                                                                    >
                                                                                        Enlarge 🔍
                                                                                    </button>
                                                                                    <a
                                                                                        href={postDetails.invoiceScreenshot}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="v-proof-btn-zoom"
                                                                                    >
                                                                                        New Tab ↗
                                                                                    </a>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Proof 4: Seller Feedback Screenshot */}
                                                                        <div className={`v-proof-card ${postDetails.sellerFeedbackScreenShot ? "active" : "empty"}`}>
                                                                            <div className="v-proof-card-header">
                                                                                <span className={`v-proof-num ${postDetails.sellerFeedbackScreenShot ? "" : "empty"}`}>4</span>
                                                                                <span className="v-proof-card-title">💬 Feedback SS</span>
                                                                            </div>
                                                                            <div className="v-proof-media">
                                                                                {postDetails.sellerFeedbackScreenShot ? (
                                                                                    <div
                                                                                        className="v-proof-img-wrap"
                                                                                        onClick={() =>
                                                                                            setSelectedProof({
                                                                                                title: "Seller Feedback Screenshot",
                                                                                                url: postDetails.sellerFeedbackScreenShot,
                                                                                                info: `${order.productName} — Unit #${unitIdx + 1} Seller Feedback`,
                                                                                            })
                                                                                        }
                                                                                    >
                                                                                        <img
                                                                                            src={postDetails.sellerFeedbackScreenShot}
                                                                                            alt="Seller Feedback Screenshot"
                                                                                            className="v-proof-img"
                                                                                        />
                                                                                        <span className="v-proof-zoom-hint">🔍 Zoom</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="v-proof-empty-box">
                                                                                        <span className="v-proof-empty-icon">💬</span>
                                                                                        <span className="v-proof-empty-text">Feedback Optional</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            {postDetails.sellerFeedbackScreenShot && (
                                                                                <div className="v-proof-footer-actions">
                                                                                    <button
                                                                                        type="button"
                                                                                        className="v-proof-btn-zoom"
                                                                                        onClick={() =>
                                                                                            setSelectedProof({
                                                                                                title: "Seller Feedback Screenshot",
                                                                                                url: postDetails.sellerFeedbackScreenShot,
                                                                                                info: `${order.productName} — Unit #${unitIdx + 1} Seller Feedback`,
                                                                                            })
                                                                                        }
                                                                                    >
                                                                                        Enlarge 🔍
                                                                                    </button>
                                                                                    <a
                                                                                        href={postDetails.sellerFeedbackScreenShot}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="v-proof-btn-zoom"
                                                                                    >
                                                                                        New Tab ↗
                                                                                    </a>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Unit Actions Bar */}
                                                                <div className="v-unit-actions-bar">
                                                                    <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                                                                        Unit Action:
                                                                    </div>
                                                                    <div className="v-unit-action-group">
                                                                        <button
                                                                            type="button"
                                                                            disabled={isActing}
                                                                            onClick={() => handleVerify(order._id, unit._id)}
                                                                            className="table-btn table-btn-success"
                                                                            style={{ padding: "7px 16px", fontSize: "12.5px", fontWeight: 700 }}
                                                                            title="Approve all proofs and transition to Completed"
                                                                        >
                                                                            {isActing ? "Verifying..." : "✓ Verify & Mark Completed"}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            disabled={isActing}
                                                                            onClick={() => openRevisionModal(order._id, unit._id, `${order.productName} — Unit #${unitIdx + 1}`)}
                                                                            className="table-btn table-btn-danger"
                                                                            style={{ padding: "7px 12px", fontSize: "12px" }}
                                                                            title="Reject proof and return to mediator with target state selection"
                                                                        >
                                                                            ✕ Request Revision
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => navigate(`/order/${order._id}`)}
                                                                            className="table-btn table-btn-detail"
                                                                            style={{ padding: "7px 12px", fontSize: "12px" }}
                                                                        >
                                                                            Order Details →
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* REVISION REQUEST MODAL WITH DESTINATION CHOICE */}
            {revisionModal.isOpen && (
                <div className="revision-modal-overlay" onClick={closeRevisionModal}>
                    <div className="revision-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="revision-modal-header">
                            <div>
                                <h3 className="revision-modal-title">
                                    <span>✕</span> Request Revision & Return Unit
                                </h3>
                                <p className="revision-modal-subtitle">
                                    {revisionModal.unitInfo ? `Unit: ${revisionModal.unitInfo}` : "Choose destination stage and specify feedback for mediator."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeRevisionModal}
                                className="image-modal-close-btn"
                            >
                                Close ✕
                            </button>
                        </div>

                        {/* Destination Selection */}
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--slate-800)", marginBottom: "8px" }}>
                                Select Return Destination Stage:
                            </label>
                            <div className="revision-dest-options">
                                <div
                                    className={`revision-dest-card ${revisionModal.targetStatus === "pending_refund" ? "selected" : ""}`}
                                    onClick={() => setRevisionModal((prev) => ({ ...prev, targetStatus: "pending_refund" }))}
                                >
                                    <input
                                        type="radio"
                                        name="targetStatus"
                                        checked={revisionModal.targetStatus === "pending_refund"}
                                        onChange={() => setRevisionModal((prev) => ({ ...prev, targetStatus: "pending_refund" }))}
                                        className="revision-dest-radio"
                                    />
                                    <div className="revision-dest-content">
                                        <span className="revision-dest-title">
                                            🔄 Return to Pending Refund (Stage 3)
                                        </span>
                                        <span className="revision-dest-desc">
                                            Mediator must re-upload product review screenshot, invoice, or seller feedback.
                                        </span>
                                    </div>
                                </div>

                                <div
                                    className={`revision-dest-card ${revisionModal.targetStatus === "in_progress" ? "selected" : ""}`}
                                    onClick={() => setRevisionModal((prev) => ({ ...prev, targetStatus: "in_progress" }))}
                                >
                                    <input
                                        type="radio"
                                        name="targetStatus"
                                        checked={revisionModal.targetStatus === "in_progress"}
                                        onChange={() => setRevisionModal((prev) => ({ ...prev, targetStatus: "in_progress" }))}
                                        className="revision-dest-radio"
                                    />
                                    <div className="revision-dest-content">
                                        <span className="revision-dest-title">
                                            ⏪ Return to In Progress (Stage 2)
                                        </span>
                                        <span className="revision-dest-desc">
                                            Mediator must re-enter order placement details, order ID, or order confirmation screenshot.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feedback / Reason Input */}
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--slate-800)", marginBottom: "6px" }}>
                                Rejection Feedback for Mediator:
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Describe what is wrong and what the mediator needs to fix..."
                                value={revisionModal.reason}
                                onChange={(e) => setRevisionModal((prev) => ({ ...prev, reason: e.target.value }))}
                                className="filter-input"
                                style={{ width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: "75px" }}
                            />

                            <div style={{ marginTop: "6px" }}>
                                <span style={{ fontSize: "11px", color: "var(--slate-500)", fontWeight: 600 }}>
                                    Quick suggestions:
                                </span>
                                <div className="revision-suggestion-chips">
                                    {[
                                        "Review screenshot is blurry or cropped",
                                        "5-star storefront rating not visible",
                                        "External Order ID does not match",
                                        "Platform invoice screenshot is missing",
                                        "Seller feedback proof incomplete",
                                        "Wrong order placed, re-place in progress",
                                    ].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            className="revision-chip-btn"
                                            onClick={() => setRevisionModal((prev) => ({ ...prev, reason: suggestion }))}
                                        >
                                            + {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                            <button
                                type="button"
                                onClick={closeRevisionModal}
                                className="table-btn table-btn-outline"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={verifyingId === revisionModal.unitId}
                                onClick={submitRevisionModal}
                                className="table-btn table-btn-danger"
                                style={{ fontWeight: 700, padding: "8px 18px" }}
                            >
                                {verifyingId === revisionModal.unitId ? "Returning Unit..." : "Confirm & Return Unit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LIGHTBOX ZOOM MODAL */}
            {selectedProof && (
                <div
                    className="image-modal-overlay"
                    onClick={() => setSelectedProof(null)}
                >
                    <div
                        className="image-modal-content"
                        style={{ maxWidth: "750px", width: "100%" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="image-modal-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--slate-900)" }}>
                                    {selectedProof.title}
                                </h3>
                                {selectedProof.info && (
                                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--slate-500)" }}>
                                        {selectedProof.info}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedProof(null)}
                                className="image-modal-close-btn"
                            >
                                Close ✕
                            </button>
                        </div>
                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                padding: "12px",
                                backgroundColor: "#0f172a",
                                borderRadius: "8px",
                                overflow: "hidden",
                            }}
                        >
                            <img
                                src={selectedProof.url}
                                alt={selectedProof.title}
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "72vh",
                                    objectFit: "contain",
                                    borderRadius: "4px",
                                }}
                            />
                        </div>
                        <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                            <a
                                href={selectedProof.url}
                                target="_blank"
                                rel="noreferrer"
                                className="table-btn table-btn-outline"
                                style={{ fontSize: "12px" }}
                            >
                                Open Original Full Image ↗
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
