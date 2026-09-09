import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import "../../styles/brandDashboard.css";

export default function BrandProductBreakdownModal({ order, onClose }) {
    if (!order) return null;

    const [statusFilter, setStatusFilter] = useState("all");
    const [proofFilter, setProofFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUnitForProofs, setSelectedUnitForProofs] = useState(null);
    const [zoomedImage, setZoomedImage] = useState(null);

    const units = order.orderUnits || [];
    const summary = order.summary || {
        unassigned: 0,
        assigned: 0,
        inProgress: 0,
        pendingRefund: 0,
        completed: 0,
    };

    const totalScheduled = order.quantity || units.length || 0;

    // Format readable status label
    const formatStatus = (st = "") => {
        switch (st) {
            case "unassigned":
                return "Pending";
            case "assigned":
                return "Assigned";
            case "in_progress":
                return "In Progress";
            case "pending_refund":
                return "Under Review";
            case "completed":
                return "Completed";
            case "pending_payment":
                return "Processing";
            default:
                return st ? st.replace(/_/g, " ") : "Pending";
        }
    };

    // Calculate uploaded proof count out of 4
    const getProofCount = (unit) => {
        let count = 0;
        if (unit.orderedScreenshot) count++;
        if (unit.postDeliveryDetails?.productReviewScreenshot) count++;
        if (unit.postDeliveryDetails?.sellerFeedbackScreenShot) count++;
        if (unit.postDeliveryDetails?.invoiceScreenshot) count++;
        return count;
    };

    // Filter units
    const filteredUnits = useMemo(() => {
        return units.filter((unit, idx) => {
            const unitStatus = unit.status || "unassigned";

            // Status filter
            if (statusFilter !== "all") {
                if (statusFilter === "pending" && unitStatus !== "unassigned" && unitStatus !== "assigned") {
                    return false;
                }
                if (statusFilter !== "pending" && unitStatus !== statusFilter) {
                    return false;
                }
            }

            // Proof Filter
            if (proofFilter !== "all") {
                const proofCount = getProofCount(unit);
                if (proofFilter === "all_4" && proofCount < 4) return false;
                if (proofFilter === "partial" && (proofCount === 0 || proofCount === 4)) return false;
                if (proofFilter === "none" && proofCount > 0) return false;
            }

            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const reviewer = (unit.reviewerName || "").toLowerCase();
                const orderId = (unit.orderId || "").toLowerCase();
                const unitNum = `unit #${idx + 1}`.toLowerCase();
                const unitIdx = `${idx + 1}`;

                const match =
                    reviewer.includes(q) ||
                    orderId.includes(q) ||
                    unitNum.includes(q) ||
                    unitIdx === q;

                if (!match) return false;
            }

            return true;
        });
    }, [units, statusFilter, proofFilter, searchQuery]);

    // Handle Excel Download
    const handleDownloadExcel = () => {
        const rows = filteredUnits.map((u) => {
            const unitIndex = units.indexOf(u) + 1;
            const arrivalDate = u.expectedArrivalDate
                ? new Date(u.expectedArrivalDate).toLocaleDateString("en-IN")
                : "N/A";
            const receivedDate = u.orderReceivedOn
                ? new Date(u.orderReceivedOn).toLocaleDateString("en-IN")
                : "N/A";
            const completedDate = u.completedAt
                ? new Date(u.completedAt).toLocaleDateString("en-IN")
                : "N/A";

            return {
                "Unit #": `Unit ${unitIndex}`,
                "Product Name": order.productName || "N/A",
                "Platform": order.orderPlatform || "N/A",
                "Unit Price (₹)": order.price || 0,
                "Status": formatStatus(u.status),
                "Platform Order ID": u.orderId || "Not Placed Yet",
                "Reviewer Name": u.reviewerName || "N/A",
                "Proof Count (out of 4)": `${getProofCount(u)} / 4`,
                "Order Confirmation Proof": u.orderedScreenshot || "Not Uploaded",
                "Product Review Proof": u.postDeliveryDetails?.productReviewScreenshot || "Not Uploaded",
                "Seller Feedback Proof": u.postDeliveryDetails?.sellerFeedbackScreenShot || "Not Uploaded",
                "Invoice / Delivery Proof": u.postDeliveryDetails?.invoiceScreenshot || "Not Uploaded",
                "Expected Arrival": arrivalDate,
                "Order Received": receivedDate,
                "Completed On": completedDate,
            };
        });

        if (rows.length === 0) {
            rows.push({
                "Note": "No units matched the applied filter criteria.",
                "Product Name": order.productName || "N/A",
                "Platform": order.orderPlatform || "N/A",
                "Total Quantity": totalScheduled,
            });
        }

        const worksheet = XLSX.utils.json_to_sheet(rows);

        // Make all proof screenshot URLs directly clickable hyperlinks in Excel
        filteredUnits.forEach((u, idx) => {
            const rowIndex = idx + 1; // 1-indexed (Row 2, 3, etc.)

            // Proof 1: Order Placement Proof (Col I / index 8)
            const orderSS = u.orderedScreenshot;
            if (orderSS && typeof orderSS === "string" && orderSS.startsWith("http")) {
                const cellRef = XLSX.utils.encode_cell({ c: 8, r: rowIndex });
                worksheet[cellRef] = {
                    t: "s",
                    v: orderSS,
                    f: `HYPERLINK("${orderSS}", "${orderSS}")`,
                    l: { Target: orderSS, Tooltip: "Click to open Order Placement Proof in browser" },
                };
            }

            // Proof 2: Product Review Proof (Col J / index 9)
            const reviewSS = u.postDeliveryDetails?.productReviewScreenshot;
            if (reviewSS && typeof reviewSS === "string" && reviewSS.startsWith("http")) {
                const cellRef = XLSX.utils.encode_cell({ c: 9, r: rowIndex });
                worksheet[cellRef] = {
                    t: "s",
                    v: reviewSS,
                    f: `HYPERLINK("${reviewSS}", "${reviewSS}")`,
                    l: { Target: reviewSS, Tooltip: "Click to open Product Review Proof in browser" },
                };
            }

            // Proof 3: Seller Feedback Proof (Col K / index 10)
            const sellerSS = u.postDeliveryDetails?.sellerFeedbackScreenShot;
            if (sellerSS && typeof sellerSS === "string" && sellerSS.startsWith("http")) {
                const cellRef = XLSX.utils.encode_cell({ c: 10, r: rowIndex });
                worksheet[cellRef] = {
                    t: "s",
                    v: sellerSS,
                    f: `HYPERLINK("${sellerSS}", "${sellerSS}")`,
                    l: { Target: sellerSS, Tooltip: "Click to open Seller Feedback Proof in browser" },
                };
            }

            // Proof 4: Invoice / Delivery Proof (Col L / index 11)
            const invoiceSS = u.postDeliveryDetails?.invoiceScreenshot;
            if (invoiceSS && typeof invoiceSS === "string" && invoiceSS.startsWith("http")) {
                const cellRef = XLSX.utils.encode_cell({ c: 11, r: rowIndex });
                worksheet[cellRef] = {
                    t: "s",
                    v: invoiceSS,
                    f: `HYPERLINK("${invoiceSS}", "${invoiceSS}")`,
                    l: { Target: invoiceSS, Tooltip: "Click to open Invoice / Delivery Proof in browser" },
                };
            }
        });

        // Auto-width formatting
        worksheet["!cols"] = [
            { wch: 10 }, // Unit #
            { wch: 28 }, // Product Name
            { wch: 12 }, // Platform
            { wch: 14 }, // Price
            { wch: 15 }, // Status
            { wch: 22 }, // Order ID
            { wch: 18 }, // Reviewer Name
            { wch: 20 }, // Proof Count
            { wch: 36 }, // Order Confirmation Proof
            { wch: 36 }, // Product Review Proof
            { wch: 36 }, // Seller Feedback Proof
            { wch: 36 }, // Invoice Proof
            { wch: 16 }, // Expected Arrival
            { wch: 16 }, // Order Received
            { wch: 16 }, // Completed On
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Product Units & Proofs");

        const cleanName = (order.productName || "Product")
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .slice(0, 30);
        const fileName = `${cleanName}_Units_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;

        XLSX.writeFile(workbook, fileName);
    };

    const resetFilters = () => {
        setStatusFilter("all");
        setProofFilter("all");
        setSearchQuery("");
    };

    return (
        <div className="brand-modal-backdrop" onClick={onClose}>
            <div
                className="brand-breakdown-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {/* MODAL HEADER */}
                <div className="modal-header">
                    <div className="modal-header-info">
                        <div className="modal-product-title-row">
                            <span className="modal-badge-pill">Product Order Units</span>
                            <span className="modal-platform-badge">{order.orderPlatform}</span>
                        </div>
                        <h2 className="modal-title">{order.productName}</h2>
                        <div className="modal-meta-row">
                            <span>Unit Price: <b>₹{order.price}</b></span>
                            <span className="dot-sep">•</span>
                            <span>Total Ordered Quantity: <b>{totalScheduled} Units</b></span>
                            <span className="dot-sep">•</span>
                            <span>Campaign Registered: <b>{new Date(order.createdAt).toLocaleDateString("en-IN")}</b></span>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="modal-close-btn"
                        onClick={onClose}
                        title="Close Modal"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* MODAL BODY */}
                <div className="modal-body">
                    {/* QUANTITY STATS CARDS */}
                    <div className="modal-kpi-grid">
                        <div className="modal-kpi-card kpi-total">
                            <span className="modal-kpi-label">Total Quantity</span>
                            <span className="modal-kpi-val">{totalScheduled}</span>
                            <span className="modal-kpi-sub">Total Units Dispatched</span>
                        </div>

                        <div className="modal-kpi-card kpi-unassigned">
                            <span className="modal-kpi-label">Pending Placement</span>
                            <span className="modal-kpi-val">{(summary.unassigned || 0) + (summary.assigned || 0)}</span>
                            <span className="modal-kpi-sub">Preparing for order placement</span>
                        </div>

                        <div className="modal-kpi-card kpi-inprogress">
                            <span className="modal-kpi-label">In Progress</span>
                            <span className="modal-kpi-val">{summary.inProgress || 0}</span>
                            <span className="modal-kpi-sub">Order placed / shipping</span>
                        </div>

                        <div className="modal-kpi-card kpi-refund">
                            <span className="modal-kpi-label">Under Review</span>
                            <span className="modal-kpi-val">{summary.pendingRefund || 0}</span>
                            <span className="modal-kpi-sub">Delivered & verifying proofs</span>
                        </div>

                        <div className="modal-kpi-card kpi-completed">
                            <span className="modal-kpi-label">Completed</span>
                            <span className="modal-kpi-val">{summary.completed || 0}</span>
                            <span className="modal-kpi-sub">Reviewed & verified</span>
                        </div>
                    </div>

                    {/* FILTER TOOLBAR & EXCEL DOWNLOAD */}
                    <div className="modal-toolbar">
                        <div className="modal-toolbar-filters">
                            {/* Search Filter */}
                            <div className="modal-search-box">
                                <span className="modal-search-icon">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search by Order ID, Reviewer Name, or Unit #..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="modal-search-input"
                                />
                            </div>

                            {/* Status Filter */}
                            <div className="modal-select-wrapper">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="modal-select"
                                >
                                    <option value="all">All Statuses ({units.length})</option>
                                    <option value="pending">Pending / Processing ({(summary.unassigned || 0) + (summary.assigned || 0)})</option>
                                    <option value="in_progress">In Progress ({summary.inProgress || 0})</option>
                                    <option value="pending_refund">Under Review ({summary.pendingRefund || 0})</option>
                                    <option value="completed">Completed ({summary.completed || 0})</option>
                                </select>
                            </div>

                            {/* Proofs Filter */}
                            <div className="modal-select-wrapper">
                                <select
                                    value={proofFilter}
                                    onChange={(e) => setProofFilter(e.target.value)}
                                    className="modal-select"
                                >
                                    <option value="all">All Verification States</option>
                                    <option value="all_4">All 4 Proofs Uploaded</option>
                                    <option value="partial">Partial Proofs Uploaded</option>
                                    <option value="none">Awaiting Proofs (0/4)</option>
                                </select>
                            </div>

                            {(statusFilter !== "all" || proofFilter !== "all" || searchQuery) && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="modal-reset-btn"
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>

                        {/* EXCEL DOWNLOAD BUTTON */}
                        <div className="modal-toolbar-actions">
                            <button
                                type="button"
                                onClick={handleDownloadExcel}
                                className="modal-download-excel-btn"
                                title="Download filtered units and proof details in Excel sheet"
                            >
                                <span className="excel-icon">📥</span>
                                <span>Download Excel ({filteredUnits.length})</span>
                            </button>
                        </div>
                    </div>

                    {/* PRODUCT UNITS TABLE */}
                    <div className="modal-table-card">
                        <div className="modal-table-header">
                            <h3 className="modal-table-title">
                                <span>📦</span>
                                <span>Unit Quantities & Verification Status</span>
                            </h3>
                            <span className="modal-table-count">
                                Showing <b>{filteredUnits.length}</b> of <b>{units.length}</b> Units
                            </span>
                        </div>

                        {filteredUnits.length === 0 ? (
                            <div className="modal-empty-state">
                                <div className="modal-empty-icon">🔎</div>
                                <h4>No units match your filter</h4>
                                <p>Try clearing your search query or selecting a different status.</p>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="modal-reset-pill-btn"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        ) : (
                            <div className="modal-table-responsive">
                                <table className="modal-data-table">
                                    <thead>
                                        <tr>
                                            <th>Quantity #</th>
                                            <th>Status</th>
                                            <th>Platform Order ID</th>
                                            <th>Reviewer Name</th>
                                            <th>Order / Activity Date</th>
                                            <th style={{ textAlign: "center" }}>Verification Proofs</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUnits.map((unit) => {
                                            const originalIndex = units.indexOf(unit) + 1;
                                            const statusClass = `status-pill-${unit.status || "unassigned"}`;
                                            const proofCount = getProofCount(unit);

                                            return (
                                                <tr key={unit._id || originalIndex}>
                                                    {/* Unit Number */}
                                                    <td>
                                                        <span className="unit-idx-pill">
                                                            Unit #{originalIndex}
                                                        </span>
                                                    </td>

                                                    {/* Status Badge */}
                                                    <td>
                                                        <span className={`modal-status-pill ${statusClass}`}>
                                                            {formatStatus(unit.status)}
                                                        </span>
                                                    </td>

                                                    {/* Platform Order ID */}
                                                    <td>
                                                        {unit.orderId ? (
                                                            <span className="order-id-tag">
                                                                {unit.orderId}
                                                            </span>
                                                        ) : (
                                                            <span className="unassigned-text">Not Placed Yet</span>
                                                        )}
                                                    </td>

                                                    {/* Reviewer Name */}
                                                    <td>
                                                        {unit.reviewerName ? (
                                                            <span className="reviewer-name-cell">
                                                                {unit.reviewerName}
                                                            </span>
                                                        ) : (
                                                            <span className="unassigned-text">—</span>
                                                        )}
                                                    </td>

                                                    {/* Date */}
                                                    <td>
                                                        <span className="date-cell">
                                                            {unit.orderReceivedOn
                                                                ? new Date(unit.orderReceivedOn).toLocaleDateString("en-IN", {
                                                                      day: "numeric",
                                                                      month: "short",
                                                                      year: "numeric",
                                                                  })
                                                                : unit.expectedArrivalDate
                                                                ? new Date(unit.expectedArrivalDate).toLocaleDateString("en-IN", {
                                                                      day: "numeric",
                                                                      month: "short",
                                                                      year: "numeric",
                                                                  })
                                                                : new Date(order.createdAt).toLocaleDateString("en-IN", {
                                                                      day: "numeric",
                                                                      month: "short",
                                                                      year: "numeric",
                                                                  })}
                                                        </span>
                                                    </td>

                                                    {/* 4 PROOFS ACTION BUTTON */}
                                                    <td style={{ textAlign: "center" }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedUnitForProofs({ unit, index: originalIndex })}
                                                            className={`brand-proof-btn ${proofCount === 4 ? "proof-btn-full" : proofCount > 0 ? "proof-btn-partial" : "proof-btn-empty"}`}
                                                            title="Click to view all 4 verification proofs for this unit"
                                                        >
                                                            <span>📸 View 4 Proofs</span>
                                                            <span className="proof-counter-pill">
                                                                {proofCount}/4
                                                            </span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* MODAL FOOTER */}
                <div className="modal-footer">
                    <div className="modal-footer-left">
                        <span>Showing <b>{filteredUnits.length}</b> filtered units</span>
                    </div>
                    <div className="modal-footer-right">
                        <button
                            type="button"
                            onClick={handleDownloadExcel}
                            className="modal-download-excel-btn"
                        >
                            <span className="excel-icon">📥</span>
                            <span>Download Excel ({filteredUnits.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="modal-secondary-btn"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* ==========================================================================
               SUB-MODAL: 4-PROOF GALLERY VIEWER FOR SELECTED UNIT
               ========================================================================== */}
            {selectedUnitForProofs && (
                <div
                    className="proof-modal-backdrop"
                    onClick={() => setSelectedUnitForProofs(null)}
                >
                    <div
                        className="proof-modal-card"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="proof-modal-header">
                            <div>
                                <div className="proof-modal-badge">Verification Dossier</div>
                                <h3 className="proof-modal-title">
                                    Unit #{selectedUnitForProofs.index} Proofs
                                </h3>
                                <div className="proof-modal-subtitle">
                                    <span>Product: <b>{order.productName}</b></span>
                                    <span className="dot-sep">•</span>
                                    <span>Order ID: <b>{selectedUnitForProofs.unit.orderId || "Not Placed Yet"}</b></span>
                                    <span className="dot-sep">•</span>
                                    <span>Reviewer: <b>{selectedUnitForProofs.unit.reviewerName || "N/A"}</b></span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={() => setSelectedUnitForProofs(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="proof-modal-body">
                            <div className="proofs-grid">
                                {/* Proof 1: Ordered Screenshot */}
                                <div className="proof-card">
                                    <div className="proof-card-header">
                                        <span className="proof-step-num">1</span>
                                        <div>
                                            <div className="proof-card-title">Order Placement Proof</div>
                                            <span className="proof-card-desc">Initial Order Confirmation</span>
                                        </div>
                                    </div>
                                    <div className="proof-card-media">
                                        {selectedUnitForProofs.unit.orderedScreenshot ? (
                                            <div
                                                className="proof-img-wrap"
                                                onClick={() => setZoomedImage(selectedUnitForProofs.unit.orderedScreenshot)}
                                            >
                                                <img
                                                    src={selectedUnitForProofs.unit.orderedScreenshot}
                                                    alt="Order Screenshot"
                                                    className="proof-img"
                                                />
                                                <span className="proof-zoom-hint">🔍 Click to Zoom</span>
                                            </div>
                                        ) : (
                                            <div className="proof-pending-box">
                                                <span className="proof-pending-icon">⏳</span>
                                                <span className="proof-pending-text">Awaiting Order Placement Proof</span>
                                            </div>
                                        )}
                                    </div>
                                    {selectedUnitForProofs.unit.orderedScreenshot && (
                                        <a
                                            href={selectedUnitForProofs.unit.orderedScreenshot}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="proof-link-btn"
                                        >
                                            Open Full Image ↗
                                        </a>
                                    )}
                                </div>

                                {/* Proof 2: Product Review Screenshot */}
                                <div className="proof-card">
                                    <div className="proof-card-header">
                                        <span className="proof-step-num">2</span>
                                        <div>
                                            <div className="proof-card-title">Product Review Proof</div>
                                            <span className="proof-card-desc">5-Star Storefront Rating</span>
                                        </div>
                                    </div>
                                    <div className="proof-card-media">
                                        {selectedUnitForProofs.unit.postDeliveryDetails?.productReviewScreenshot ? (
                                            <div
                                                className="proof-img-wrap"
                                                onClick={() => setZoomedImage(selectedUnitForProofs.unit.postDeliveryDetails.productReviewScreenshot)}
                                            >
                                                <img
                                                    src={selectedUnitForProofs.unit.postDeliveryDetails.productReviewScreenshot}
                                                    alt="Product Review Screenshot"
                                                    className="proof-img"
                                                />
                                                <span className="proof-zoom-hint">🔍 Click to Zoom</span>
                                            </div>
                                        ) : (
                                            <div className="proof-pending-box">
                                                <span className="proof-pending-icon">📝</span>
                                                <span className="proof-pending-text">Awaiting Review Proof</span>
                                            </div>
                                        )}
                                    </div>
                                    {selectedUnitForProofs.unit.postDeliveryDetails?.productReviewScreenshot && (
                                        <a
                                            href={selectedUnitForProofs.unit.postDeliveryDetails.productReviewScreenshot}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="proof-link-btn"
                                        >
                                            Open Full Image ↗
                                        </a>
                                    )}
                                </div>

                                {/* Proof 3: Seller Feedback Screenshot */}
                                <div className="proof-card">
                                    <div className="proof-card-header">
                                        <span className="proof-step-num">3</span>
                                        <div>
                                            <div className="proof-card-title">Seller Feedback Proof</div>
                                            <span className="proof-card-desc">Seller Account Rating</span>
                                        </div>
                                    </div>
                                    <div className="proof-card-media">
                                        {selectedUnitForProofs.unit.postDeliveryDetails?.sellerFeedbackScreenShot ? (
                                            <div
                                                className="proof-img-wrap"
                                                onClick={() => setZoomedImage(selectedUnitForProofs.unit.postDeliveryDetails.sellerFeedbackScreenShot)}
                                            >
                                                <img
                                                    src={selectedUnitForProofs.unit.postDeliveryDetails.sellerFeedbackScreenShot}
                                                    alt="Seller Feedback Screenshot"
                                                    className="proof-img"
                                                />
                                                <span className="proof-zoom-hint">🔍 Click to Zoom</span>
                                            </div>
                                        ) : (
                                            <div className="proof-pending-box">
                                                <span className="proof-pending-icon">⭐</span>
                                                <span className="proof-pending-text">Awaiting Seller Feedback Proof</span>
                                            </div>
                                        )}
                                    </div>
                                    {selectedUnitForProofs.unit.postDeliveryDetails?.sellerFeedbackScreenShot && (
                                        <a
                                            href={selectedUnitForProofs.unit.postDeliveryDetails.sellerFeedbackScreenShot}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="proof-link-btn"
                                        >
                                            Open Full Image ↗
                                        </a>
                                    )}
                                </div>

                                {/* Proof 4: Invoice / Delivery Screenshot */}
                                <div className="proof-card">
                                    <div className="proof-card-header">
                                        <span className="proof-step-num">4</span>
                                        <div>
                                            <div className="proof-card-title">Invoice & Delivery Proof</div>
                                            <span className="proof-card-desc">Platform Invoice / Package Bill</span>
                                        </div>
                                    </div>
                                    <div className="proof-card-media">
                                        {selectedUnitForProofs.unit.postDeliveryDetails?.invoiceScreenshot ? (
                                            <div
                                                className="proof-img-wrap"
                                                onClick={() => setZoomedImage(selectedUnitForProofs.unit.postDeliveryDetails.invoiceScreenshot)}
                                            >
                                                <img
                                                    src={selectedUnitForProofs.unit.postDeliveryDetails.invoiceScreenshot}
                                                    alt="Invoice Screenshot"
                                                    className="proof-img"
                                                />
                                                <span className="proof-zoom-hint">🔍 Click to Zoom</span>
                                            </div>
                                        ) : (
                                            <div className="proof-pending-box">
                                                <span className="proof-pending-icon">🧾</span>
                                                <span className="proof-pending-text">Awaiting Invoice / Bill Proof</span>
                                            </div>
                                        )}
                                    </div>
                                    {selectedUnitForProofs.unit.postDeliveryDetails?.invoiceScreenshot && (
                                        <a
                                            href={selectedUnitForProofs.unit.postDeliveryDetails.invoiceScreenshot}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="proof-link-btn"
                                        >
                                            Open Full Image ↗
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="proof-modal-footer">
                            <button
                                type="button"
                                onClick={() => setSelectedUnitForProofs(null)}
                                className="modal-secondary-btn"
                            >
                                Back to Breakdown
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FULL-IMAGE LIGHTBOX ZOOM */}
            {zoomedImage && (
                <div
                    className="lightbox-backdrop"
                    onClick={() => setZoomedImage(null)}
                >
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img src={zoomedImage} alt="Zoomed Proof" className="lightbox-img" />
                        <button
                            type="button"
                            className="lightbox-close-btn"
                            onClick={() => setZoomedImage(null)}
                        >
                            ✕ Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
