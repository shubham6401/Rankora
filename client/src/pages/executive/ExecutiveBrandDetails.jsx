import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchExecutiveBrandDetails, deleteExecutiveOrderBatch } from "../../services/executive/order";
import BrandProductBreakdownModal from "../../component/brand/BrandProductBreakdownModal";
import ProofPreviewModal from "../../component/common/ProofPreviewModal";
import PriceDisplay from "../../component/common/PriceDisplay";
import {
    exportCompleteBrandExcel,
    exportFilteredUnitsExcel,
    exportSingleCampaignExcel,
} from "../../utils/brandExcelExport";
import "../../styles/brandDashboard.css";

export default function ExecutiveBrandDetails() {
    const { brandUserId } = useParams();
    const navigate = useNavigate();

    const [brand, setBrand] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // View Mode: 'units' (Master Ledger) vs 'campaigns' (Campaigns Overview)
    const [viewMode, setViewMode] = useState("units");

    // Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [filterPlatform, setFilterPlatform] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterUnitType, setFilterUnitType] = useState("all");
    const [filterPriceHike, setFilterPriceHike] = useState("all");
    const [filterMediator, setFilterMediator] = useState("all");
    const [filterProof, setFilterProof] = useState("all");
    const [datePreset, setDatePreset] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Modal & Lightbox States
    const [selectedOrderForBreakdown, setSelectedOrderForBreakdown] = useState(null);
    const [previewProof, setPreviewProof] = useState(null); // { url, title }
    const [copyFeedback, setCopyFeedback] = useState(null);
    const [expandedCampaigns, setExpandedCampaigns] = useState({});

    useEffect(() => {
        loadBrandOrders();
    }, [brandUserId]);

    const loadBrandOrders = async () => {
        try {
            setLoading(true);
            const res = await fetchExecutiveBrandDetails(brandUserId);
            if (res.data.success) {
                setBrand(res.data.brand);
                setOrders(res.data.orders || []);
            }
        } catch (err) {
            console.error("Failed to load brand details:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrder = async (order) => {
        const totalU = order.quantity || (order.orderUnits ? order.orderUnits.length : 0);
        const confirmMsg =
            `⚠️ ARE YOU SURE YOU WANT TO DELETE THIS ORDER BATCH?\n\n` +
            `Product: ${order.productName || "Unnamed"}\n` +
            `Total Units: ${totalU}\n\n` +
            `This will permanently delete the entire order batch and all associated units.\n` +
            `This action CANNOT be undone. Proceed?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            await deleteExecutiveOrderBatch(order._id);
            loadBrandOrders();
            setCopyFeedback("✓ Order batch deleted successfully.");
            setTimeout(() => setCopyFeedback(null), 3000);
        } catch (err) {
            console.error("Failed to delete order batch:", err);
            alert(err?.response?.data?.message || "Failed to delete order batch");
        }
    };

    const copyToClipboard = (text, label = "Order ID") => {
        if (!text || text === "Not Placed Yet") return;
        navigator.clipboard.writeText(text);
        setCopyFeedback(`✓ ${label} copied to clipboard!`);
        setTimeout(() => setCopyFeedback(null), 2500);
    };

    // Flatten all units with parent campaign order context
    const allUnitsWithOrder = useMemo(() => {
        const list = [];
        orders.forEach((order) => {
            const units = order.orderUnits || [];
            const basePrice = Number(order.price) || 0;
            units.forEach((u, uIdx) => {
                const purchasePrice =
                    u.purchasePrice !== undefined && u.purchasePrice !== null
                        ? Number(u.purchasePrice)
                        : basePrice;
                const isHiked = purchasePrice > basePrice;
                const hikeAmount = isHiked ? purchasePrice - basePrice : 0;
                const hikePercent = isHiked && basePrice > 0 ? Math.round((hikeAmount / basePrice) * 100) : 0;
                const deliveryFee = Number(u.deliveryFee) || 0;
                const totalAmount = Number(u.totalPurchasedAmount) || (purchasePrice + deliveryFee);

                list.push({
                    unit: u,
                    unitIndex: uIdx,
                    order: order,
                    orderBatchId: order._id,
                    productName: order.productName || "Unnamed Product",
                    productLink: order.productLink || "",
                    orderPlatform: order.orderPlatform || "Other",
                    basePrice: basePrice,
                    purchasePrice: purchasePrice,
                    isHiked: isHiked,
                    hikeAmount: hikeAmount,
                    hikePercent: hikePercent,
                    deliveryFee: deliveryFee,
                    totalAmount: totalAmount,
                    orderCreatedAt: order.createdAt,
                });
            });
        });
        return list;
    }, [orders]);

    // Unique mediators list for filter dropdown
    const uniqueMediators = useMemo(() => {
        const map = new Map();
        allUnitsWithOrder.forEach(({ unit }) => {
            if (unit.mediatorId) {
                const id = unit.mediatorId._id || unit.mediatorId;
                const name = unit.mediatorId.name || "Mediator";
                const code = unit.mediatorId.mediatorCode ? `(${unit.mediatorId.mediatorCode})` : "";
                if (!map.has(id.toString())) {
                    map.set(id.toString(), `${name} ${code}`.trim());
                }
            }
        });
        return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
    }, [allUnitsWithOrder]);

    // Date range checker
    const isDateInRange = (dateVal) => {
        if (!dateVal) return false;
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return false;

        if (startDate) {
            const s = new Date(startDate);
            s.setHours(0, 0, 0, 0);
            if (d < s) return false;
        }
        if (endDate) {
            const e = new Date(endDate);
            e.setHours(23, 59, 59, 999);
            if (d > e) return false;
        }

        if (datePreset === "all") return true;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        if (datePreset === "today") {
            return d >= startOfToday && d <= endOfToday;
        }
        if (datePreset === "yesterday") {
            const startOfYesterday = new Date(startOfToday);
            startOfYesterday.setDate(startOfYesterday.getDate() - 1);
            const endOfYesterday = new Date(endOfToday);
            endOfYesterday.setDate(endOfYesterday.getDate() - 1);
            return d >= startOfYesterday && d <= endOfYesterday;
        }
        if (datePreset === "7d") {
            const sevenDaysAgo = new Date(startOfToday);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            return d >= sevenDaysAgo && d <= endOfToday;
        }
        if (datePreset === "30d") {
            const thirtyDaysAgo = new Date(startOfToday);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
            return d >= thirtyDaysAgo && d <= endOfToday;
        }
        if (datePreset === "this_month") {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return d >= startOfMonth && d <= endOfToday;
        }
        return true;
    };

    // Filtered Units calculation
    const filteredUnits = useMemo(() => {
        return allUnitsWithOrder.filter(({ unit: u, order, productName, orderPlatform, isHiked }) => {
            // 1. Universal Search
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const pName = (productName || "").toLowerCase();
                const platform = (orderPlatform || "").toLowerCase();
                const orderId = (u.orderId || "").toLowerCase();
                const unitId = (u._id || "").toString().toLowerCase();
                const reviewer = (u.reviewerName || "").toLowerCase();
                const mediator = (u.mediatorId?.name || "").toLowerCase();
                const medCode = (u.mediatorId?.mediatorCode || "").toLowerCase();
                const address = (u.deliveryAddress || u.address || "").toLowerCase();
                const match =
                    pName.includes(q) ||
                    platform.includes(q) ||
                    orderId.includes(q) ||
                    unitId.includes(q) ||
                    reviewer.includes(q) ||
                    mediator.includes(q) ||
                    medCode.includes(q) ||
                    address.includes(q);
                if (!match) return false;
            }

            // 2. Platform Filter
            if (filterPlatform !== "all") {
                const p = (orderPlatform || "").toLowerCase();
                if (!p.includes(filterPlatform.toLowerCase())) return false;
            }

            // 3. Status Filter
            if (filterStatus !== "all") {
                if (u.status !== filterStatus) return false;
            }

            // 4. Unit Type Filter
            if (filterUnitType !== "all") {
                if (u.unitType !== filterUnitType) return false;
            }

            // 5. Price Hike Filter
            if (filterPriceHike === "hiked" && !isHiked) return false;
            if (filterPriceHike === "normal" && isHiked) return false;

            // 6. Mediator Filter
            if (filterMediator !== "all") {
                const medId = (u.mediatorId?._id || u.mediatorId || "").toString();
                if (medId !== filterMediator) return false;
            }

            // 7. Proof / Screenshot Filter
            if (filterProof !== "all") {
                if (filterProof === "has_order_ss" && !u.orderedScreenshot) return false;
                if (filterProof === "has_review_ss" && !u.postDeliveryDetails?.productReviewScreenshot) return false;
                if (filterProof === "has_feedback_ss" && !u.postDeliveryDetails?.sellerFeedbackScreenShot) return false;
                if (filterProof === "has_invoice_ss" && !u.postDeliveryDetails?.invoiceScreenshot) return false;
                if (filterProof === "has_advance_ss" && !u.paymentScreenshot) return false;
                if (filterProof === "has_settlement_ss" && !u.settlementScreenshot) return false;
                if (filterProof === "missing_any") {
                    const isMissing =
                        !u.orderedScreenshot ||
                        !u.postDeliveryDetails?.productReviewScreenshot ||
                        !u.postDeliveryDetails?.sellerFeedbackScreenShot ||
                        !u.postDeliveryDetails?.invoiceScreenshot;
                    if (!isMissing) return false;
                }
            }

            // 8. Date Range Filter
            if (datePreset !== "all" || startDate || endDate) {
                const relevantDate = u.orderedAt || u.orderReceivedOn || u.paymentSentAt || order.createdAt;
                if (!isDateInRange(relevantDate)) return false;
            }

            return true;
        });
    }, [
        allUnitsWithOrder,
        searchQuery,
        filterPlatform,
        filterStatus,
        filterUnitType,
        filterPriceHike,
        filterMediator,
        filterProof,
        datePreset,
        startDate,
        endDate,
    ]);

    // Filtered Campaigns (for Campaigns view mode)
    const filteredCampaigns = useMemo(() => {
        const matchedBatchIds = new Set(filteredUnits.map((item) => item.orderBatchId?.toString()));
        return orders.filter((o) => matchedBatchIds.has(o._id?.toString()));
    }, [orders, filteredUnits]);

    // KPI Metrics Totals across all units
    const totalUnitsCount = allUnitsWithOrder.length;
    const totalCompleted = allUnitsWithOrder.filter((u) => u.unit.status === "completed").length;
    const totalInProgress = allUnitsWithOrder.filter((u) => u.unit.status === "in_progress").length;
    const totalPendingRefund = allUnitsWithOrder.filter((u) => u.unit.status === "pending_refund").length;
    const totalPendingVerification = allUnitsWithOrder.filter((u) => u.unit.status === "pending_verification").length;
    const totalWarehouse = allUnitsWithOrder.filter((u) => u.unit.unitType === "warehouse").length;
    const totalEmpty = allUnitsWithOrder.filter((u) => u.unit.unitType === "empty").length;
    const totalHikedUnits = allUnitsWithOrder.filter((u) => u.isHiked).length;
    const totalVolume = allUnitsWithOrder.reduce((acc, u) => acc + u.totalAmount, 0);
    const completionRate = totalUnitsCount > 0 ? Math.round((totalCompleted / totalUnitsCount) * 100) : 0;

    // Check if any filter is active
    const isFiltered =
        searchQuery.trim() !== "" ||
        filterPlatform !== "all" ||
        filterStatus !== "all" ||
        filterUnitType !== "all" ||
        filterPriceHike !== "all" ||
        filterMediator !== "all" ||
        filterProof !== "all" ||
        datePreset !== "all" ||
        startDate !== "" ||
        endDate !== "";

    const resetFilters = () => {
        setSearchQuery("");
        setFilterPlatform("all");
        setFilterStatus("all");
        setFilterUnitType("all");
        setFilterPriceHike("all");
        setFilterMediator("all");
        setFilterProof("all");
        setDatePreset("all");
        setStartDate("");
        setEndDate("");
    };

    const handleDownloadCompleteExcel = () => {
        if (!orders.length) return;
        exportCompleteBrandExcel(brand?.brand || brand?.name || "Brand", orders);
    };

    const handleDownloadFilteredExcel = () => {
        if (!filteredUnits.length) {
            alert("No units match your current filter settings to export.");
            return;
        }
        exportFilteredUnitsExcel(brand?.brand || brand?.name || "Brand", filteredUnits, {
            Search: searchQuery || "None",
            Platform: filterPlatform,
            Status: filterStatus,
            "Unit Type": filterUnitType,
            "Price Hike": filterPriceHike,
            Mediator: filterMediator !== "all" ? uniqueMediators.find((m) => m.id === filterMediator)?.label || filterMediator : "All",
            "Proof Presence": filterProof,
            "Date Range": datePreset !== "all" ? datePreset : startDate || endDate ? `${startDate} to ${endDate}` : "All Time",
        });
    };

    const toggleCampaignAccordion = (orderId) => {
        setExpandedCampaigns((prev) => ({
            ...prev,
            [orderId]: !prev[orderId],
        }));
    };

    const brandDisplayName = brand?.brand || brand?.name || "Brand Details";

    return (
        <div className="brand-dashboard-container" style={{ padding: "20px 24px 80px", maxWidth: "1600px", margin: "0 auto" }}>
            {/* Copy Notification Toast */}
            {copyFeedback && (
                <div className="copy-toast-bubble">
                    <span>{copyFeedback}</span>
                </div>
            )}

            {/* Top Hero Card */}
            <div className="brand-hero-card" style={{ marginBottom: "20px" }}>
                <div className="brand-hero-left">
                    <button
                        type="button"
                        onClick={() => navigate("/executive-brands")}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--primary-600)",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "800",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 0",
                            marginBottom: "8px",
                        }}
                    >
                        ← Back to Brands Overview
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                        <div className="brand-avatar-box" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", color: "#2563eb", fontWeight: "900" }}>
                            {brandDisplayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="brand-hero-title-row">
                                <h1 className="brand-hero-title" style={{ fontSize: "26px", margin: 0 }}>
                                    {brandDisplayName}
                                </h1>
                                <span className="brand-verified-chip">✓ Verified Brand</span>
                                {brand?.role && (
                                    <span style={{ fontSize: "11px", fontWeight: "700", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "4px" }}>
                                        {brand.role.toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="brand-hero-meta">
                                <span>📧 <b>{brand?.email || "No email"}</b></span>
                                {brand?.phone && (
                                    <>
                                        <span className="dot-separator">•</span>
                                        <span>📞 <b>{brand.phone}</b></span>
                                    </>
                                )}
                                {brand?.teamCode && (
                                    <>
                                        <span className="dot-separator">•</span>
                                        <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "2px 8px", borderRadius: "4px", fontWeight: "700", fontSize: "12px" }}>
                                            🛡️ Team: {brand.teamCode}
                                        </span>
                                    </>
                                )}
                                <span className="dot-separator">•</span>
                                <span>📦 <b>{orders.length} Campaigns</b> ({totalUnitsCount} Units)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="brand-hero-actions">
                    <button
                        type="button"
                        onClick={loadBrandOrders}
                        className="brand-refresh-btn"
                        title="Refresh real-time data"
                    >
                        <span>🔄</span>
                        <span>Refresh Data</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleDownloadCompleteExcel}
                        className="saas-btn saas-btn-emerald"
                        disabled={!orders.length}
                        title="Exports 41 granular columns including all screenshot URLs and order IDs"
                    >
                        <span>📥</span>
                        <span>Complete Brand Master Excel</span>
                    </button>
                </div>
            </div>

            {/* KPI Metrics Ribbon */}
            <div className="brand-kpi-grid" style={{ marginBottom: "22px" }}>
                <div className="brand-kpi-card kpi-campaigns">
                    <div className="brand-kpi-top">
                        <span className="brand-kpi-label">Total Campaigns</span>
                        <div className="brand-kpi-icon">📦</div>
                    </div>
                    <div className="brand-kpi-val">{orders.length}</div>
                    <div className="brand-kpi-sub">
                        <span>{totalUnitsCount} total units configured</span>
                    </div>
                </div>

                <div className="brand-kpi-card kpi-inprogress">
                    <div className="brand-kpi-top">
                        <span className="brand-kpi-label">In Progress</span>
                        <div className="brand-kpi-icon">🚀</div>
                    </div>
                    <div className="brand-kpi-val">{totalInProgress}</div>
                    <div className="brand-kpi-sub">
                        <span>Under mediator execution</span>
                    </div>
                </div>

                <div className="brand-kpi-card" style={{ borderColor: "#bfdbfe" }}>
                    <div className="brand-kpi-top">
                        <span className="brand-kpi-label" style={{ color: "#1e40af" }}>Pending Verification</span>
                        <div className="brand-kpi-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>🔍</div>
                    </div>
                    <div className="brand-kpi-val" style={{ color: "#1d4ed8" }}>{totalPendingVerification}</div>
                    <div className="brand-kpi-sub">
                        <span>Submitted proofs awaiting check</span>
                    </div>
                </div>

                <div className="brand-kpi-card kpi-refund">
                    <div className="brand-kpi-top">
                        <span className="brand-kpi-label">Pending Refund</span>
                        <div className="brand-kpi-icon">⏳</div>
                    </div>
                    <div className="brand-kpi-val">{totalPendingRefund}</div>
                    <div className="brand-kpi-sub">
                        <span>Refund / payout pending</span>
                    </div>
                </div>

                <div className="brand-kpi-card kpi-completed">
                    <div className="brand-kpi-top">
                        <span className="brand-kpi-label">Completed Units</span>
                        <div className="brand-kpi-icon">✅</div>
                    </div>
                    <div className="brand-kpi-val">{totalCompleted}</div>
                    <div className="brand-kpi-sub">
                        <span>{completionRate}% fulfillment rate</span>
                    </div>
                    <div className="brand-kpi-bar">
                        <div className="brand-kpi-bar-fill" style={{ width: `${completionRate}%` }}></div>
                    </div>
                </div>

                <div className="brand-kpi-card" style={{ background: "#f8fafc" }}>
                    <div className="brand-kpi-top">
                        <span className="brand-kpi-label">Specs & Hike</span>
                        <div className="brand-kpi-icon" style={{ background: "#f1f5f9", color: "#475569" }}>⚙️</div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", margin: "4px 0 6px", flexWrap: "wrap" }}>
                        <span className="unit-spec-chip warehouse" style={{ fontSize: "12px", padding: "3px 8px" }}>
                            🏢 {totalWarehouse} WH
                        </span>
                        <span className="unit-spec-chip empty" style={{ fontSize: "12px", padding: "3px 8px" }}>
                            📦 {totalEmpty} Empty
                        </span>
                    </div>
                    <div className="brand-kpi-sub" style={{ color: totalHikedUnits > 0 ? "#b45309" : "#64748b" }}>
                        <span>{totalHikedUnits > 0 ? `▲ ${totalHikedUnits} Price Hiked Units` : "No price hikes detected"}</span>
                    </div>
                </div>
            </div>

            {/* Filter Toolbar Card */}
            <div className="brand-toolbar" style={{ marginBottom: "20px" }}>
                {/* Top Row: Search and Dropdowns */}
                <div className="brand-toolbar-top">
                    {/* Universal Search Input */}
                    <div className="brand-search-box" style={{ minWidth: "300px" }}>
                        <span className="brand-search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search Order ID, Product, Reviewer, Mediator..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="brand-search-input"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                style={{
                                    position: "absolute",
                                    right: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#94a3b8",
                                    fontWeight: "bold",
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="brand-toolbar-controls">
                        {/* Platform Filter */}
                        <select
                            value={filterPlatform}
                            onChange={(e) => setFilterPlatform(e.target.value)}
                            className="brand-select"
                        >
                            <option value="all">🌐 All Platforms</option>
                            <option value="amazon">Amazon</option>
                            <option value="flipkart">Flipkart</option>
                            <option value="myntra">Myntra</option>
                            <option value="ajio">Ajio</option>
                            <option value="meesho">Meesho</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="brand-select"
                        >
                            <option value="all">⚡ All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="in_progress">In Progress</option>
                            <option value="pending_verification">Pending Verification</option>
                            <option value="pending_refund">Pending Refund</option>
                            <option value="pending_payment">Pending Payment</option>
                            <option value="unassigned">Unassigned</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        {/* Unit Type Filter */}
                        <select
                            value={filterUnitType}
                            onChange={(e) => setFilterUnitType(e.target.value)}
                            className="brand-select"
                        >
                            <option value="all">📦 All Unit Specs</option>
                            <option value="warehouse">🏢 Warehouse Only</option>
                            <option value="empty">📦 Empty Package Only</option>
                        </select>

                        {/* Price Hike Filter */}
                        <select
                            value={filterPriceHike}
                            onChange={(e) => setFilterPriceHike(e.target.value)}
                            className="brand-select"
                        >
                            <option value="all">💰 All Pricing</option>
                            <option value="hiked">▲ Price Hiked Only</option>
                            <option value="normal">Normal Base Price</option>
                        </select>

                        {/* Mediator Filter */}
                        {uniqueMediators.length > 0 && (
                            <select
                                value={filterMediator}
                                onChange={(e) => setFilterMediator(e.target.value)}
                                className="brand-select"
                            >
                                <option value="all">👤 All Mediators</option>
                                {uniqueMediators.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.label}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Screenshot / Proof Filter */}
                        <select
                            value={filterProof}
                            onChange={(e) => setFilterProof(e.target.value)}
                            className="brand-select"
                        >
                            <option value="all">🖼️ All Proof States</option>
                            <option value="has_order_ss">🛒 Has Order SS</option>
                            <option value="has_review_ss">⭐ Has Review SS</option>
                            <option value="has_feedback_ss">💬 Has Feedback SS</option>
                            <option value="has_invoice_ss">📄 Has Invoice SS</option>
                            <option value="has_advance_ss">💸 Has Advance Payment SS</option>
                            <option value="has_settlement_ss">🤝 Has Settlement SS</option>
                            <option value="missing_any">⚠️ Missing Any Proof</option>
                        </select>

                        {/* Reset Filters Button */}
                        {isFiltered && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="brand-reset-filters-btn"
                            >
                                ✕ Reset Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Bottom Row: Quick Date Presets & Custom Date Pickers */}
                <div className="brand-toolbar-bottom">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Date Filter:</span>
                        <div className="filter-presets-ribbon">
                            {[
                                { key: "all", label: "All Time" },
                                { key: "today", label: "Today" },
                                { key: "yesterday", label: "Yesterday" },
                                { key: "7d", label: "Last 7 Days" },
                                { key: "30d", label: "Last 30 Days" },
                                { key: "this_month", label: "This Month" },
                            ].map((preset) => (
                                <button
                                    key={preset.key}
                                    type="button"
                                    onClick={() => {
                                        setDatePreset(preset.key);
                                        setStartDate("");
                                        setEndDate("");
                                    }}
                                    className={`filter-preset-pill ${datePreset === preset.key && !startDate && !endDate ? "active" : ""}`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom Date Pickers */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "6px" }}>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setDatePreset("custom");
                                }}
                                className="brand-date-input"
                                title="Start Date"
                            />
                            <span style={{ color: "#94a3b8", fontSize: "12px" }}>to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setDatePreset("custom");
                                }}
                                className="brand-date-input"
                                title="End Date"
                            />
                        </div>
                    </div>

                    {/* Active Match Stats & Export Filtered Button */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <span className="brand-filter-stats-text">
                            Showing <b>{filteredUnits.length}</b> of {totalUnitsCount} units
                            {isFiltered && ` (${filteredCampaigns.length} campaigns)`}
                        </span>

                        <button
                            type="button"
                            onClick={handleDownloadFilteredExcel}
                            className="saas-btn"
                            style={{
                                background: "#0284c7",
                                color: "#ffffff",
                                padding: "7px 14px",
                                fontSize: "12.5px",
                                borderRadius: "7px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontWeight: "700",
                                border: "none",
                                cursor: "pointer",
                            }}
                            disabled={filteredUnits.length === 0}
                            title="Download Excel for currently filtered units with all proof links and order IDs"
                        >
                            <span>📑</span>
                            <span>Export Filtered ({filteredUnits.length} Units)</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* View Mode Switcher Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <div className="view-mode-switcher">
                    <button
                        type="button"
                        onClick={() => setViewMode("units")}
                        className={`view-mode-btn ${viewMode === "units" ? "active" : ""}`}
                    >
                        <span>📋</span>
                        <span>All Units Master Ledger</span>
                        <span className="view-mode-count-badge">{filteredUnits.length}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setViewMode("campaigns")}
                        className={`view-mode-btn ${viewMode === "campaigns" ? "active" : ""}`}
                    >
                        <span>📦</span>
                        <span>Campaigns Overview</span>
                        <span className="view-mode-count-badge">{filteredCampaigns.length}</span>
                    </button>
                </div>

                <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                    💡 Tip: Click any proof badge to preview the full screenshot lightbox.
                </div>
            </div>

            {/* Content Rendering: Loading / Empty / Data */}
            {loading ? (
                <div className="saas-card" style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ fontSize: "28px", marginBottom: "10px" }}>⏳</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#334155" }}>Loading Brand Order Ledger...</div>
                    <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>Fetching units, marketplace order IDs, and proof links...</div>
                </div>
            ) : filteredUnits.length === 0 ? (
                <div className="saas-card" style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔍</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b" }}>No Matching Records Found</div>
                    <div style={{ fontSize: "13px", color: "#64748b", marginTop: "6px", maxWidth: "420px", margin: "6px auto 16px" }}>
                        No order units match your active filter or search keywords. Try adjusting your platform, status, or date range.
                    </div>
                    {isFiltered && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="saas-btn saas-btn-primary"
                            style={{ margin: "0 auto" }}
                        >
                            Reset All Filters
                        </button>
                    )}
                </div>
            ) : viewMode === "units" ? (
                /* ==========================================================
                   VIEW 1: ALL UNITS MASTER LEDGER
                   ========================================================== */
                <div className="master-ledger-table-container">
                    <div style={{ overflowX: "auto" }}>
                        <table className="master-ledger-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "45px", textAlign: "center" }}>#</th>
                                    <th>Marketplace Order ID</th>
                                    <th>Product & Platform</th>
                                    <th>Mediator & Reviewer</th>
                                    <th>Pricing & Hike</th>
                                    <th>Unit Spec</th>
                                    <th>Proof Screenshots (All SS)</th>
                                    <th>Status</th>
                                    <th>Key Dates</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUnits.map((item, idx) => {
                                    const u = item.unit;
                                    const order = item.order;
                                    const isHiked = item.isHiked;
                                    const hikeAmount = item.hikeAmount;
                                    const hikePercent = item.hikePercent;

                                    return (
                                        <tr key={u._id || `unit-${idx}`}>
                                            {/* SL # */}
                                            <td style={{ textAlign: "center", color: "#94a3b8", fontWeight: "700", fontSize: "12px" }}>
                                                {idx + 1}
                                            </td>

                                            {/* Marketplace Order ID */}
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                    {u.orderId ? (
                                                        <div className="order-id-chip" title="Click icon to copy Order ID">
                                                            <span>{u.orderId}</span>
                                                            <button
                                                                type="button"
                                                                className="order-id-copy-btn"
                                                                onClick={() => copyToClipboard(u.orderId, "Marketplace Order ID")}
                                                                title="Copy Order ID"
                                                            >
                                                                📋
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="order-id-unplaced">⏳ Not Placed Yet</span>
                                                    )}
                                                    <span style={{ fontSize: "10.5px", color: "#94a3b8", fontFamily: "monospace" }}>
                                                        Unit #{item.unitIndex + 1} • ID: {u._id ? u._id.toString().slice(-6) : "—"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Product & Platform */}
                                            <td style={{ maxWidth: "260px" }}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <span className={`platform-badge platform-${(order.orderPlatform || "other").toLowerCase()}`} style={{ fontSize: "11px", padding: "2px 6px" }}>
                                                            {order.orderPlatform || "Other"}
                                                        </span>
                                                        {order.productLink && (
                                                            <a
                                                                href={order.productLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{ fontSize: "11px", color: "#2563eb", fontWeight: "700", textDecoration: "none" }}
                                                                title="Open Product Listing"
                                                            >
                                                                Listing ↗
                                                            </a>
                                                        )}
                                                    </div>
                                                    <span
                                                        style={{
                                                            fontWeight: "700",
                                                            color: "#0f172a",
                                                            fontSize: "13px",
                                                            lineHeight: "1.3",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                            maxWidth: "250px",
                                                        }}
                                                        title={order.productName}
                                                    >
                                                        {order.productName || "Unnamed Product"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Mediator & Reviewer */}
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b" }}>
                                                            👤 {u.mediatorId?.name || "Unassigned"}
                                                        </span>
                                                        {u.mediatorId?.mediatorCode && (
                                                            <span style={{ fontSize: "10.5px", background: "#f1f5f9", color: "#475569", padding: "1px 5px", borderRadius: "4px", fontWeight: "700" }}>
                                                                {u.mediatorId.mediatorCode}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                                                        Reviewer: <b>{u.reviewerName || "—"}</b>
                                                    </div>
                                                    {(u.deliveryAddress || u.address) && (
                                                        <div
                                                            style={{
                                                                fontSize: "10.5px",
                                                                color: "#94a3b8",
                                                                maxWidth: "200px",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
                                                            }}
                                                            title={u.deliveryAddress || u.address}
                                                        >
                                                            📍 {u.deliveryAddress || u.address}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Pricing & Hike */}
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                                    <PriceDisplay
                                                        basePrice={item.basePrice}
                                                        actualPrice={u.purchasePrice}
                                                        layout="stack"
                                                    />
                                                    {isHiked && (
                                                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#b45309", background: "#fef3c7", padding: "1px 6px", borderRadius: "4px", display: "inline-block", width: "fit-content" }}>
                                                            ▲ +₹{hikeAmount} ({hikePercent}%)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Unit Spec */}
                                            <td>
                                                {u.unitType === "warehouse" ? (
                                                    <span className="unit-spec-chip warehouse" style={{ fontSize: "11.5px" }}>
                                                        🏢 Warehouse
                                                    </span>
                                                ) : u.unitType === "empty" ? (
                                                    <span className="unit-spec-chip empty" style={{ fontSize: "11.5px" }}>
                                                        📦 Empty Pkg
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: "11px", color: "#94a3b8", fontStyle: "italic" }}>
                                                        Standard
                                                    </span>
                                                )}
                                            </td>

                                            {/* Proof Screenshots Gallery (All SS) */}
                                            <td style={{ minWidth: "240px" }}>
                                                <div className="proof-badges-container">
                                                    {/* 1. Order SS */}
                                                    {u.orderedScreenshot ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPreviewProof({
                                                                    url: u.orderedScreenshot,
                                                                    title: `Order Placement Proof • ${order.productName} (Order ID: ${u.orderId || "Pending"})`,
                                                                })
                                                            }
                                                            className="proof-pill-btn has-proof"
                                                            title="View Order Placement Screenshot"
                                                        >
                                                            <span>🛒</span>
                                                            <span>Order SS</span>
                                                        </button>
                                                    ) : (
                                                        <span className="proof-pill-btn missing-proof" title="No order screenshot uploaded">
                                                            <span>🛒</span>
                                                            <span>—</span>
                                                        </span>
                                                    )}

                                                    {/* 2. Review SS */}
                                                    {u.postDeliveryDetails?.productReviewScreenshot ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPreviewProof({
                                                                    url: u.postDeliveryDetails.productReviewScreenshot,
                                                                    title: `Product Review Proof • ${order.productName} (Order ID: ${u.orderId || "Pending"})`,
                                                                })
                                                            }
                                                            className="proof-pill-btn has-proof"
                                                            title="View Product Review Screenshot"
                                                        >
                                                            <span>⭐</span>
                                                            <span>Review SS</span>
                                                        </button>
                                                    ) : (
                                                        <span className="proof-pill-btn missing-proof" title="No review screenshot uploaded">
                                                            <span>⭐</span>
                                                            <span>—</span>
                                                        </span>
                                                    )}

                                                    {/* 3. Feedback SS */}
                                                    {u.postDeliveryDetails?.sellerFeedbackScreenShot ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPreviewProof({
                                                                    url: u.postDeliveryDetails.sellerFeedbackScreenShot,
                                                                    title: `Seller Feedback Proof • ${order.productName}`,
                                                                })
                                                            }
                                                            className="proof-pill-btn has-proof"
                                                            title="View Seller Feedback Screenshot"
                                                        >
                                                            <span>💬</span>
                                                            <span>Feedback</span>
                                                        </button>
                                                    ) : null}

                                                    {/* 4. Invoice SS */}
                                                    {u.postDeliveryDetails?.invoiceScreenshot ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPreviewProof({
                                                                    url: u.postDeliveryDetails.invoiceScreenshot,
                                                                    title: `Invoice Proof • ${order.productName}`,
                                                                })
                                                            }
                                                            className="proof-pill-btn has-proof"
                                                            title="View Invoice Proof"
                                                        >
                                                            <span>📄</span>
                                                            <span>Invoice</span>
                                                        </button>
                                                    ) : null}

                                                    {/* 5. Advance Payment SS */}
                                                    {u.paymentScreenshot ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPreviewProof({
                                                                    url: u.paymentScreenshot,
                                                                    title: `Advance Payment Proof • ₹${u.totalPurchasedAmount || u.purchasePrice} to ${u.mediatorId?.name || "Mediator"}`,
                                                                })
                                                            }
                                                            className="proof-pill-btn has-proof advance"
                                                            title="View Advance Payment Proof"
                                                        >
                                                            <span>💸</span>
                                                            <span>Advance SS</span>
                                                        </button>
                                                    ) : null}

                                                    {/* 6. Settlement SS */}
                                                    {u.settlementScreenshot ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPreviewProof({
                                                                    url: u.settlementScreenshot,
                                                                    title: `Settlement Payout Proof • ₹${u.settlementAmount || 0} to ${u.mediatorId?.name || "Mediator"}`,
                                                                })
                                                            }
                                                            className="proof-pill-btn has-proof settlement"
                                                            title="View Final Settlement Proof"
                                                        >
                                                            <span>🤝</span>
                                                            <span>Settled SS</span>
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td>
                                                <span className={`status-badge-saas ${u.status || "unassigned"}`}>
                                                    <span className="dot" />
                                                    {(u.status || "unassigned").replace("_", " ")}
                                                </span>
                                            </td>

                                            {/* Key Dates */}
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "11px", color: "#64748b" }}>
                                                    {u.orderedAt && (
                                                        <span>Placed: <b>{new Date(u.orderedAt).toLocaleDateString("en-IN")}</b></span>
                                                    )}
                                                    {u.orderReceivedOn && (
                                                        <span>Delivered: <b>{new Date(u.orderReceivedOn).toLocaleDateString("en-IN")}</b></span>
                                                    )}
                                                    {u.paymentSentAt && (
                                                        <span style={{ color: "#0d9488" }}>Paid: <b>{new Date(u.paymentSentAt).toLocaleDateString("en-IN")}</b></span>
                                                    )}
                                                    {!u.orderedAt && !u.orderReceivedOn && !u.paymentSentAt && (
                                                        <span style={{ color: "#94a3b8" }}>Created: {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "—"}</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedOrderForBreakdown(order)}
                                                    style={{
                                                        background: "#eff6ff",
                                                        border: "1px solid #bfdbfe",
                                                        color: "#2563eb",
                                                        padding: "5px 10px",
                                                        borderRadius: "6px",
                                                        fontSize: "12px",
                                                        fontWeight: "700",
                                                        cursor: "pointer",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                    title="Inspect all units in this campaign batch"
                                                >
                                                    Campaign 🔍
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* ==========================================================
                   VIEW 2: CAMPAIGNS OVERVIEW (BATCH VIEW)
                   ========================================================== */
                <div className="orders-table-wrapper" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <table className="brand-orders-table">
                        <thead>
                            <tr>
                                <th>Campaign Product</th>
                                <th>Platform</th>
                                <th>Base & Actual Price</th>
                                <th>Units Quantity</th>
                                <th>Progress</th>
                                <th>Status Breakdown</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCampaigns.map((order) => {
                                const q = order.quantity || (order.orderUnits || []).length || 0;
                                const comp = order.summary?.completed || 0;
                                const pct = q > 0 ? Math.round((comp / q) * 100) : 0;
                                const isExpanded = !!expandedCampaigns[order._id];
                                const units = order.orderUnits || [];

                                return (
                                    <>
                                        <tr key={order._id}>
                                            <td>
                                                <div className="product-cell">
                                                    <span className="product-name" style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>
                                                        {order.productName}
                                                    </span>
                                                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px", flexWrap: "wrap" }}>
                                                        {units.filter((u) => u.unitType === "warehouse").length > 0 && (
                                                            <span className="unit-spec-chip warehouse" style={{ fontSize: "11px" }}>
                                                                🏢 {units.filter((u) => u.unitType === "warehouse").length} WH
                                                            </span>
                                                        )}
                                                        {units.filter((u) => u.unitType === "empty").length > 0 && (
                                                            <span className="unit-spec-chip empty" style={{ fontSize: "11px" }}>
                                                                📦 {units.filter((u) => u.unitType === "empty").length} Empty
                                                            </span>
                                                        )}
                                                        {order.productLink && (
                                                            <a
                                                                href={order.productLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="product-link-btn"
                                                                style={{ fontSize: "11px", padding: "2px 6px" }}
                                                            >
                                                                View Listing ↗
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span className={`platform-badge platform-${(order.orderPlatform || "other").toLowerCase()}`}>
                                                    {order.orderPlatform}
                                                </span>
                                            </td>

                                            <td>
                                                <PriceDisplay
                                                    basePrice={order.price}
                                                    actualPrice={
                                                        units.find((u) => u.purchasePrice && Number(u.purchasePrice) > Number(order.price))?.purchasePrice
                                                    }
                                                    layout="stack"
                                                />
                                            </td>

                                            <td>
                                                <span className="quantity-badge" style={{ fontSize: "13px", fontWeight: "800" }}>
                                                    {q} units
                                                </span>
                                            </td>

                                            <td>
                                                <div className="progress-cell" style={{ minWidth: "140px" }}>
                                                    <div className="progress-bar-bg" style={{ height: "7px", background: "#e2e8f0", borderRadius: "999px" }}>
                                                        <div
                                                            className="progress-bar-fill"
                                                            style={{
                                                                width: `${pct}%`,
                                                                background: pct === 100 ? "#10b981" : "linear-gradient(90deg, #3b82f6, #06b6d4)",
                                                                height: "100%",
                                                                borderRadius: "999px",
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="progress-text" style={{ fontSize: "12px", fontWeight: "700" }}>
                                                        {pct}% ({comp}/{q})
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", fontSize: "11.5px" }}>
                                                    {order.summary?.completed > 0 && (
                                                        <span style={{ backgroundColor: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                                                            ✓ {order.summary.completed} Done
                                                        </span>
                                                    )}
                                                    {order.summary?.inProgress > 0 && (
                                                        <span style={{ backgroundColor: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                                                            🚀 {order.summary.inProgress} Prog
                                                        </span>
                                                    )}
                                                    {order.summary?.pendingRefund > 0 && (
                                                        <span style={{ backgroundColor: "#faf5ff", color: "#6b21a8", border: "1px solid #e9d5ff", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                                                            ⏳ {order.summary.pendingRefund} Ref
                                                        </span>
                                                    )}
                                                    {order.summary?.unassigned > 0 && (
                                                        <span style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                                                            {order.summary.unassigned} Unassigned
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleCampaignAccordion(order._id)}
                                                        className="breakdown-btn"
                                                        style={{ background: isExpanded ? "#e0e7ff" : "#f1f5f9", color: isExpanded ? "#3730a3" : "#334155" }}
                                                        title="Expand/Collapse units inline"
                                                    >
                                                        {isExpanded ? "▲ Hide" : "▼ Units"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => exportSingleCampaignExcel(order, brandDisplayName)}
                                                        className="breakdown-btn"
                                                        style={{ background: "#ecfdf5", color: "#065f46", borderColor: "#a7f3d0" }}
                                                        title="Download Excel for this campaign"
                                                    >
                                                        📥 Excel
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedOrderForBreakdown(order)}
                                                        className="breakdown-btn"
                                                        title="Deep inspect units modal"
                                                    >
                                                        🔍 Inspect
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteOrder(order)}
                                                        className="breakdown-btn"
                                                        style={{ backgroundColor: "#fee2e2", color: "#b91c1c", borderColor: "#fca5a5" }}
                                                        title="Delete this order batch"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Inline Accordion Row for Campaign Units */}
                                        {isExpanded && (
                                            <tr key={`${order._id}-expanded`}>
                                                <td colSpan="7" style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                                        <div style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>
                                                            📦 Inline Units ({units.length} total) for: {order.productName}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedOrderForBreakdown(order)}
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                color: "#2563eb",
                                                                fontSize: "12px",
                                                                fontWeight: "700",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            Open Full Inspection Modal →
                                                        </button>
                                                    </div>

                                                    <div style={{ overflowX: "auto" }}>
                                                        <table className="master-ledger-table" style={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                                                            <thead>
                                                                <tr>
                                                                    <th>#</th>
                                                                    <th>Marketplace Order ID</th>
                                                                    <th>Mediator</th>
                                                                    <th>Reviewer</th>
                                                                    <th>Price</th>
                                                                    <th>Spec</th>
                                                                    <th>Proof Screenshots</th>
                                                                    <th>Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {units.map((u, uIdx) => (
                                                                    <tr key={u._id || uIdx}>
                                                                        <td style={{ color: "#94a3b8", fontWeight: "700", fontSize: "11px" }}>{uIdx + 1}</td>
                                                                        <td>
                                                                            {u.orderId ? (
                                                                                <div className="order-id-chip">
                                                                                    <span>{u.orderId}</span>
                                                                                    <button
                                                                                        type="button"
                                                                                        className="order-id-copy-btn"
                                                                                        onClick={() => copyToClipboard(u.orderId, "Order ID")}
                                                                                    >
                                                                                        📋
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="order-id-unplaced">⏳ Pending</span>
                                                                            )}
                                                                        </td>
                                                                        <td>
                                                                            <span style={{ fontWeight: "700", fontSize: "12px" }}>
                                                                                {u.mediatorId?.name || "Unassigned"}
                                                                            </span>
                                                                        </td>
                                                                        <td style={{ fontSize: "12px", color: "#475569" }}>
                                                                            {u.reviewerName || "—"}
                                                                        </td>
                                                                        <td>
                                                                            <PriceDisplay basePrice={order.price} actualPrice={u.purchasePrice} layout="inline" />
                                                                        </td>
                                                                        <td>
                                                                            {u.unitType === "warehouse" ? "🏢 WH" : u.unitType === "empty" ? "📦 Empty" : "Standard"}
                                                                        </td>
                                                                        <td>
                                                                            <div className="proof-badges-container">
                                                                                {u.orderedScreenshot && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            setPreviewProof({
                                                                                                url: u.orderedScreenshot,
                                                                                                title: `Order SS • ${order.productName}`,
                                                                                            })
                                                                                        }
                                                                                        className="proof-pill-btn has-proof"
                                                                                    >
                                                                                        🛒 Order
                                                                                    </button>
                                                                                )}
                                                                                {u.postDeliveryDetails?.productReviewScreenshot && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            setPreviewProof({
                                                                                                url: u.postDeliveryDetails.productReviewScreenshot,
                                                                                                title: `Review SS • ${order.productName}`,
                                                                                            })
                                                                                        }
                                                                                        className="proof-pill-btn has-proof"
                                                                                    >
                                                                                        ⭐ Review
                                                                                    </button>
                                                                                )}
                                                                                {u.paymentScreenshot && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            setPreviewProof({
                                                                                                url: u.paymentScreenshot,
                                                                                                title: `Advance Payment SS • ${order.productName}`,
                                                                                            })
                                                                                        }
                                                                                        className="proof-pill-btn has-proof advance"
                                                                                    >
                                                                                        💸 Advance
                                                                                    </button>
                                                                                )}
                                                                                {u.settlementScreenshot && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            setPreviewProof({
                                                                                                url: u.settlementScreenshot,
                                                                                                title: `Settlement SS • ${order.productName}`,
                                                                                            })
                                                                                        }
                                                                                        className="proof-pill-btn has-proof settlement"
                                                                                    >
                                                                                        🤝 Settled
                                                                                    </button>
                                                                                )}
                                                                                {!u.orderedScreenshot && !u.postDeliveryDetails?.productReviewScreenshot && !u.paymentScreenshot && (
                                                                                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>No proofs yet</span>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td>
                                                                            <span className={`status-badge-saas ${u.status || "unassigned"}`}>
                                                                                <span className="dot" />
                                                                                {(u.status || "unassigned").replace("_", " ")}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal for Order Units Breakdown (Deep inspection) */}
            {selectedOrderForBreakdown && (
                <BrandProductBreakdownModal
                    order={selectedOrderForBreakdown}
                    onClose={() => setSelectedOrderForBreakdown(null)}
                />
            )}

            {/* Proof Preview Modal Lightbox */}
            {previewProof && (
                <ProofPreviewModal
                    isOpen={true}
                    url={previewProof.url}
                    title={previewProof.title}
                    onClose={() => setPreviewProof(null)}
                />
            )}
        </div>
    );
}
