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
    const [pendingSearch, setPendingSearch] = useState("");

    // History state
    const [historyOrders, setHistoryOrders] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyViewMode, setHistoryViewMode] = useState("batches"); // "batches" | "table"
    const [historySearch, setHistorySearch] = useState("");
    const [historyMediatorFilter, setHistoryMediatorFilter] = useState("all");
    const [historyDateFilter, setHistoryDateFilter] = useState(""); // YYYY-MM-DD
    const [historyQuickDate, setHistoryQuickDate] = useState("all"); // "all" | "today" | "yesterday" | "last7" | "thisMonth"
    const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
    const [historyBrandFilter, setHistoryBrandFilter] = useState("all");

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

    const filteredPendingGroups = useMemo(() => {
        if (!pendingSearch.trim()) return mediatorGroups;
        const q = pendingSearch.toLowerCase().trim();
        return mediatorGroups.filter((g) => {
            return (
                (g.mediator.name || "").toLowerCase().includes(q) ||
                (g.mediator.mediatorCode || "").toLowerCase().includes(q) ||
                g.orders.some(
                    (o) =>
                        (o.productName || "").toLowerCase().includes(q) ||
                        (o.brand || "").toLowerCase().includes(q) ||
                        (o.orderPlatform || "").toLowerCase().includes(q)
                )
            );
        });
    }, [mediatorGroups, pendingSearch]);

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
                        productLink: order.productLink,
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

    // Group history units into Advance Payment Batches (orders funded together in one transaction)
    const advanceBatches = useMemo(() => {
        const advanceBatchesMap = {};

        historyUnitsList.forEach((u) => {
            const medId = u.mediatorId?._id?.toString() || u.mediatorId?.toString() || "unknown";
            const timeKey = u.paymentSentAt ? new Date(u.paymentSentAt).toISOString().slice(0, 16) : "notime";
            const ssKey = u.paymentScreenshot ? u.paymentScreenshot.split("/").pop().split("?")[0] : "";

            const batchKey =
                u.advanceBatchId ||
                (ssKey
                    ? `ss_${ssKey}_${medId}`
                    : timeKey !== "notime"
                    ? `time_${timeKey}_${medId}`
                    : `single_${u._id}`);

            if (!advanceBatchesMap[batchKey]) {
                advanceBatchesMap[batchKey] = {
                    batchKey,
                    advanceBatchId: u.advanceBatchId || null,
                    screenshot: u.paymentScreenshot || null,
                    message: u.paymentMessage || "",
                    paidAt: u.paymentSentAt || u.updatedAt || u.orderCreatedAt,
                    mediatorId: medId,
                    mediatorName: u.mediatorId?.name || "Mediator",
                    mediatorCode: u.mediatorId?.mediatorCode || "N/A",
                    teamCode: u.mediatorId?.teamCode || u.teamCode || "N/A",
                    totalAdvance: 0,
                    totalHikedDiff: 0,
                    units: [],
                    statusCounts: {
                        assigned: 0,
                        in_progress: 0,
                        pending_refund: 0,
                        pending_verification: 0,
                        completed: 0,
                    },
                };
            }

            advanceBatchesMap[batchKey].units.push(u);
            const base = Number(u.orderPrice) || 0;
            const actual = Number(u.purchasePrice) || base;
            advanceBatchesMap[batchKey].totalAdvance += actual;
            if (actual > base) {
                advanceBatchesMap[batchKey].totalHikedDiff += actual - base;
            }
            if (advanceBatchesMap[batchKey].statusCounts[u.status] !== undefined) {
                advanceBatchesMap[batchKey].statusCounts[u.status]++;
            }
        });

        return Object.values(advanceBatchesMap).sort((a, b) => {
            const timeA = new Date(a.paidAt || 0).getTime();
            const timeB = new Date(b.paidAt || 0).getTime();
            return timeB - timeA;
        });
    }, [historyUnitsList]);

    // Unique mediators list for filter dropdown
    const uniqueHistoryMediators = useMemo(() => {
        const map = {};
        historyUnitsList.forEach((u) => {
            const mId = u.mediatorId?._id?.toString() || u.mediatorId?.toString();
            if (mId && !map[mId]) {
                map[mId] = {
                    id: mId,
                    name: u.mediatorId?.name || "Mediator",
                    code: u.mediatorId?.mediatorCode || "N/A",
                    count: 0,
                };
            }
            if (mId) map[mId].count++;
        });
        return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
    }, [historyUnitsList]);

    // Unique brands list for filter dropdown
    const uniqueHistoryBrands = useMemo(() => {
        const set = new Set();
        historyUnitsList.forEach((u) => {
            if (u.brand) set.add(u.brand);
        });
        return Array.from(set).sort();
    }, [historyUnitsList]);

    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        const a = new Date(d1);
        const b = new Date(d2);
        if (isNaN(a.getTime()) || isNaN(b.getTime())) return false;
        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );
    };

    // Filtered Batches
    const filteredBatches = useMemo(() => {
        return advanceBatches.filter((batch) => {
            // Mediator filter
            if (historyMediatorFilter !== "all" && batch.mediatorId !== historyMediatorFilter) {
                return false;
            }

            // Date filter (exact YYYY-MM-DD or quick pill)
            if (historyDateFilter) {
                const d = batch.paidAt ? new Date(batch.paidAt) : null;
                if (!d) return false;
                const batchDateStr = d.toISOString().split("T")[0];
                const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
                    d.getDate()
                ).padStart(2, "0")}`;
                if (batchDateStr !== historyDateFilter && localDateStr !== historyDateFilter) {
                    return false;
                }
            } else if (historyQuickDate !== "all") {
                const d = batch.paidAt ? new Date(batch.paidAt) : null;
                if (!d) return false;
                const now = new Date();
                if (historyQuickDate === "today") {
                    if (!isSameDay(d, now)) return false;
                } else if (historyQuickDate === "yesterday") {
                    const yesterday = new Date(now);
                    yesterday.setDate(yesterday.getDate() - 1);
                    if (!isSameDay(d, yesterday)) return false;
                } else if (historyQuickDate === "last7") {
                    const diffMs = now.getTime() - d.getTime();
                    if (diffMs < -86400000 || diffMs > 7 * 86400000) return false;
                } else if (historyQuickDate === "thisMonth") {
                    if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
                }
            }

            // Brand filter
            if (historyBrandFilter !== "all") {
                const matchesBrand = batch.units.some(
                    (u) => (u.brand || "").toLowerCase() === historyBrandFilter.toLowerCase()
                );
                if (!matchesBrand) return false;
            }

            // Status filter
            if (historyStatusFilter !== "all") {
                const matchesStatus = batch.units.some((u) => u.status === historyStatusFilter);
                if (!matchesStatus) return false;
            }

            // Search query
            if (historySearch.trim()) {
                const q = historySearch.toLowerCase().trim();
                const medName = (batch.mediatorName || "").toLowerCase();
                const medCode = (batch.mediatorCode || "").toLowerCase();
                const note = (batch.message || "").toLowerCase();
                const batchId = (batch.advanceBatchId || "").toLowerCase();
                const hasUnitMatch = batch.units.some((u) => {
                    return (
                        (u.productName || "").toLowerCase().includes(q) ||
                        (u.brand || "").toLowerCase().includes(q) ||
                        (u.orderId || "").toLowerCase().includes(q) ||
                        (u._id || "").toLowerCase().includes(q) ||
                        (u.reviewerName || "").toLowerCase().includes(q)
                    );
                });

                if (
                    !medName.includes(q) &&
                    !medCode.includes(q) &&
                    !note.includes(q) &&
                    !batchId.includes(q) &&
                    !hasUnitMatch
                ) {
                    return false;
                }
            }

            return true;
        });
    }, [
        advanceBatches,
        historyMediatorFilter,
        historyDateFilter,
        historyQuickDate,
        historyBrandFilter,
        historyStatusFilter,
        historySearch,
    ]);

    // Filtered Individual Units for table mode
    const filteredHistoryUnits = useMemo(() => {
        return historyUnitsList.filter((item) => {
            // Mediator filter
            if (historyMediatorFilter !== "all") {
                const mId = item.mediatorId?._id?.toString() || item.mediatorId?.toString();
                if (mId !== historyMediatorFilter) return false;
            }

            // Date filter
            const paidDate = item.paymentSentAt || item.updatedAt || item.orderCreatedAt;
            if (historyDateFilter) {
                const d = paidDate ? new Date(paidDate) : null;
                if (!d) return false;
                const dStr = d.toISOString().split("T")[0];
                const localStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
                    d.getDate()
                ).padStart(2, "0")}`;
                if (dStr !== historyDateFilter && localStr !== historyDateFilter) return false;
            } else if (historyQuickDate !== "all") {
                const d = paidDate ? new Date(paidDate) : null;
                if (!d) return false;
                const now = new Date();
                if (historyQuickDate === "today") {
                    if (!isSameDay(d, now)) return false;
                } else if (historyQuickDate === "yesterday") {
                    const yesterday = new Date(now);
                    yesterday.setDate(yesterday.getDate() - 1);
                    if (!isSameDay(d, yesterday)) return false;
                } else if (historyQuickDate === "last7") {
                    const diffMs = now.getTime() - d.getTime();
                    if (diffMs < -86400000 || diffMs > 7 * 86400000) return false;
                } else if (historyQuickDate === "thisMonth") {
                    if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
                }
            }

            // Brand filter
            if (historyBrandFilter !== "all" && (item.brand || "").toLowerCase() !== historyBrandFilter.toLowerCase()) {
                return false;
            }

            // Status filter
            if (historyStatusFilter !== "all" && item.status !== historyStatusFilter) {
                return false;
            }

            // Search query
            if (historySearch.trim()) {
                const q = historySearch.toLowerCase().trim();
                const medName = (item.mediatorId?.name || "").toLowerCase();
                const medCode = (item.mediatorId?.mediatorCode || "").toLowerCase();
                const prod = (item.productName || "").toLowerCase();
                const br = (item.brand || "").toLowerCase();
                const oId = (item.orderId || item.parentOrderId || "").toLowerCase();
                const utr = (item.paymentMessage || "").toLowerCase();
                const batchId = (item.advanceBatchId || "").toLowerCase();

                if (
                    !medName.includes(q) &&
                    !medCode.includes(q) &&
                    !prod.includes(q) &&
                    !br.includes(q) &&
                    !oId.includes(q) &&
                    !utr.includes(q) &&
                    !batchId.includes(q)
                ) {
                    return false;
                }
            }

            return true;
        });
    }, [
        historyUnitsList,
        historyMediatorFilter,
        historyDateFilter,
        historyQuickDate,
        historyBrandFilter,
        historyStatusFilter,
        historySearch,
    ]);

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

    const resetFilters = () => {
        setHistorySearch("");
        setHistoryMediatorFilter("all");
        setHistoryDateFilter("");
        setHistoryQuickDate("all");
        setHistoryStatusFilter("all");
        setHistoryBrandFilter("all");
    };

    const hasActiveFilters =
        Boolean(historySearch.trim()) ||
        historyMediatorFilter !== "all" ||
        Boolean(historyDateFilter) ||
        historyQuickDate !== "all" ||
        historyStatusFilter !== "all" ||
        historyBrandFilter !== "all";

    const totalDue = mediatorGroups.reduce((acc, g) => acc + g.totalAmount, 0);
    const totalUnitsCount = mediatorGroups.reduce((acc, g) => acc + g.totalUnits, 0);

    // History statistics
    const historyTotalAmount = historyUnitsList.reduce((acc, u) => {
        const price = Number(u.purchasePrice || u.orderPrice || 0);
        return acc + price;
    }, 0);
    const historyCompletedCount = historyUnitsList.filter((u) => u.status === "completed").length;

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "—";
        return d.toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

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
                            background: "#eff6ff",
                            color: "#2563eb",
                            borderColor: "#bfdbfe",
                        }}
                    >
                        Stage 2 of Executive Pipeline
                    </span>
                    <h1 className="table-page-title">Advance Payments & Order Allocations</h1>
                    <p className="table-page-subtitle">
                        Manage upfront payments to mediators for newly assigned orders. Upload payment proofs to approve batches, or audit all past advance payment records.
                    </p>
                </div>
            </div>

            {/* View Switching Tabs */}
            <div
                style={{
                    display: "flex",
                    gap: "10px",
                    borderBottom: "2px solid var(--slate-200)",
                    marginBottom: "24px",
                    paddingBottom: "2px",
                }}
            >
                <button
                    type="button"
                    onClick={() => setActiveTab("pending")}
                    style={{
                        padding: "10px 22px",
                        fontWeight: 700,
                        fontSize: "14px",
                        borderRadius: "8px 8px 0 0",
                        border: "none",
                        cursor: "pointer",
                        background: activeTab === "pending" ? "#2563eb" : "#f1f5f9",
                        color: activeTab === "pending" ? "#ffffff" : "var(--slate-600)",
                        boxShadow: activeTab === "pending" ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.15s ease",
                    }}
                >
                    <span>⏳ Pending Advance Payments</span>
                    <span
                        style={{
                            background: activeTab === "pending" ? "rgba(255,255,255,0.25)" : "#e2e8f0",
                            color: activeTab === "pending" ? "#ffffff" : "var(--slate-700)",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 800,
                        }}
                    >
                        {mediatorGroups.length} Mediators
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setActiveTab("history");
                        if (historyOrders.length === 0) loadHistory();
                    }}
                    style={{
                        padding: "10px 22px",
                        fontWeight: 700,
                        fontSize: "14px",
                        borderRadius: "8px 8px 0 0",
                        border: "none",
                        cursor: "pointer",
                        background: activeTab === "history" ? "#0f172a" : "#f1f5f9",
                        color: activeTab === "history" ? "#ffffff" : "var(--slate-600)",
                        boxShadow: activeTab === "history" ? "0 2px 8px rgba(15, 23, 42, 0.25)" : "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.15s ease",
                    }}
                >
                    <span>📜 All Advance Payment History</span>
                    <span
                        style={{
                            background: activeTab === "history" ? "rgba(255,255,255,0.25)" : "#e2e8f0",
                            color: activeTab === "history" ? "#ffffff" : "var(--slate-700)",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 800,
                        }}
                    >
                        {advanceBatches.length} Batches
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
                            <span className="metric-value metric-value-warning">
                                {mediatorGroups.length} Mediators
                            </span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-label">Total Units Pending Payment</span>
                            <span className="metric-value">{totalUnitsCount} Units</span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-label">Total Payment Due</span>
                            <span className="metric-value metric-value-primary">
                                ₹{totalDue.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Pending Search */}
                    {mediatorGroups.length > 0 && (
                        <div style={{ marginBottom: "16px" }}>
                            <div style={{ position: "relative", maxWidth: "420px" }}>
                                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--slate-400)" }}>
                                    🔍
                                </span>
                                <input
                                    type="text"
                                    placeholder="Filter pending mediators, products, brands..."
                                    value={pendingSearch}
                                    onChange={(e) => setPendingSearch(e.target.value)}
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
                    )}

                    {loading ? (
                        <div className="table-page-container" style={{ textAlign: "center", padding: "60px 0" }}>
                            <h2>Loading Pending Advance Orders...</h2>
                        </div>
                    ) : mediatorGroups.length === 0 ? (
                        <div className="empty-state-card">
                            <div className="empty-state-icon">✓</div>
                            <h3 className="empty-state-title">No Advance Payments Pending</h3>
                            <p className="empty-state-text">
                                All newly assigned orders have been funded, or no orders are currently awaiting advance payment proof.
                            </p>
                            <button
                                type="button"
                                className="nav-btn nav-btn-primary"
                                onClick={() => navigate("/executive-assigned-order")}
                            >
                                View Assigned Orders →
                            </button>
                        </div>
                    ) : filteredPendingGroups.length === 0 ? (
                        <div className="empty-state-card">
                            <div className="empty-state-icon">🔍</div>
                            <h3 className="empty-state-title">No Matching Mediators Found</h3>
                            <p className="empty-state-text">No pending payment groups match your search query.</p>
                            <button
                                type="button"
                                className="nav-btn nav-btn-default"
                                onClick={() => setPendingSearch("")}
                            >
                                Clear Search
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                            {filteredPendingGroups.map((group) => {
                                const med = group.mediator;
                                const isUploading = uploadingMediatorId === med._id;
                                const hasFile = Boolean(selectedFiles[med._id]);

                                return (
                                    <div key={med._id} className="mediator-payment-card">
                                        {/* Card Header */}
                                        <div className="mediator-card-header">
                                            <div className="mediator-info">
                                                <div className="mediator-name">{med.name}</div>
                                                <div className="mediator-meta">
                                                    Code: <b>{med.mediatorCode}</b> • Team: <b>{med.teamCode || "N/A"}</b>
                                                </div>
                                            </div>
                                            <div className="mediator-due-box">
                                                <div className="due-label">Total Advance Due:</div>
                                                <div className="due-amount">₹{group.totalAmount.toLocaleString()}</div>
                                                <div className="due-count">
                                                    {group.totalUnits} {group.totalUnits === 1 ? "unit" : "units"} across {group.orders.length} product(s)
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nested Orders Table */}
                                        <div className="data-table-container" style={{ margin: "16px 0 20px 0" }}>
                                            <div className="data-table-responsive">
                                                <table className="data-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Product</th>
                                                            <th>Brand</th>
                                                            <th>Platform</th>
                                                            <th>Price</th>
                                                            <th>Assigned Units</th>
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
                                                                    <td className="product-name-cell">
                                                                        <span style={{ fontWeight: 600 }}>{ord.productName}</span>
                                                                        {ord.productLink && (
                                                                            <a
                                                                                href={ord.productLink}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                style={{
                                                                                    marginLeft: "6px",
                                                                                    color: "var(--primary-600)",
                                                                                    textDecoration: "none",
                                                                                }}
                                                                            >
                                                                                🔗
                                                                            </a>
                                                                        )}
                                                                    </td>
                                                                    <td>{ord.brand}</td>
                                                                    <td>{ord.orderPlatform}</td>
                                                                    <td>
                                                                        <PriceDisplay
                                                                            basePrice={ord.price}
                                                                            actualPrice={
                                                                                ord.units.find(
                                                                                    (u) =>
                                                                                        u.purchasePrice &&
                                                                                        Number(u.purchasePrice) > Number(ord.price)
                                                                                )?.purchasePrice
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
                            <span className="metric-label">Total Advance Batches</span>
                            <span className="metric-value metric-value-primary">
                                {advanceBatches.length} Batches
                            </span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-label">Total Disbursed Volume</span>
                            <span className="metric-value">₹{historyTotalAmount.toLocaleString()}</span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-label">Total Units Funded</span>
                            <span className="metric-value">{historyUnitsList.length} Units</span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-label">Unique Mediators Funded</span>
                            <span className="metric-value">{uniqueHistoryMediators.length}</span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-label">Fully Completed Units</span>
                            <span className="metric-value" style={{ color: "#059669" }}>
                                {historyCompletedCount}
                            </span>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div
                        style={{
                            background: "#ffffff",
                            padding: "16px 20px",
                            borderRadius: "12px",
                            border: "1px solid var(--slate-200)",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                            marginBottom: "20px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                        }}
                    >
                        {/* Top Row: Search, View Mode Switcher, Refresh */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "12px",
                                flexWrap: "wrap",
                            }}
                        >
                            <div style={{ position: "relative", flex: 1, minWidth: "260px", maxWidth: "460px" }}>
                                <span
                                    style={{
                                        position: "absolute",
                                        left: "12px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "var(--slate-400)",
                                    }}
                                >
                                    🔍
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search by mediator, product, brand, batch ID, or UTR note..."
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "9px 12px 9px 36px",
                                        borderRadius: "7px",
                                        border: "1px solid var(--slate-300)",
                                        fontSize: "13px",
                                        boxSizing: "border-box",
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                {/* View Mode Toggle */}
                                <div
                                    style={{
                                        display: "inline-flex",
                                        background: "#f1f5f9",
                                        padding: "3px",
                                        borderRadius: "8px",
                                        border: "1px solid #e2e8f0",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setHistoryViewMode("batches")}
                                        style={{
                                            padding: "6px 14px",
                                            borderRadius: "6px",
                                            border: "none",
                                            fontSize: "12.5px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            background: historyViewMode === "batches" ? "#2563eb" : "transparent",
                                            color: historyViewMode === "batches" ? "#ffffff" : "var(--slate-600)",
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        📦 Payment Batches ({filteredBatches.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setHistoryViewMode("table")}
                                        style={{
                                            padding: "6px 14px",
                                            borderRadius: "6px",
                                            border: "none",
                                            fontSize: "12.5px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            background: historyViewMode === "table" ? "#2563eb" : "transparent",
                                            color: historyViewMode === "table" ? "#ffffff" : "var(--slate-600)",
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        📋 Individual Orders ({filteredHistoryUnits.length})
                                    </button>
                                </div>

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

                        {/* Bottom Row: Mediator-wise, Date-wise, Status, Brand filters */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                flexWrap: "wrap",
                                paddingTop: "10px",
                                borderTop: "1px solid var(--slate-100)",
                            }}
                        >
                            {/* Mediator-wise Filter */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--slate-700)" }}>
                                    👤 Mediator:
                                </label>
                                <select
                                    value={historyMediatorFilter}
                                    onChange={(e) => setHistoryMediatorFilter(e.target.value)}
                                    style={{
                                        padding: "7px 10px",
                                        borderRadius: "6px",
                                        border: "1px solid var(--slate-300)",
                                        fontSize: "12.5px",
                                        fontWeight: 600,
                                        color: "var(--slate-800)",
                                        maxWidth: "200px",
                                    }}
                                >
                                    <option value="all">All Mediators ({uniqueHistoryMediators.length})</option>
                                    {uniqueHistoryMediators.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} ({m.code}) — {m.count}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date-wise Filter: Date Picker */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--slate-700)" }}>
                                    📅 Date:
                                </label>
                                <input
                                    type="date"
                                    value={historyDateFilter}
                                    onChange={(e) => {
                                        setHistoryDateFilter(e.target.value);
                                        setHistoryQuickDate("all");
                                    }}
                                    style={{
                                        padding: "6px 8px",
                                        borderRadius: "6px",
                                        border: "1px solid var(--slate-300)",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        color: "var(--slate-800)",
                                    }}
                                />
                                {historyDateFilter && (
                                    <button
                                        type="button"
                                        onClick={() => setHistoryDateFilter("")}
                                        style={{
                                            border: "none",
                                            background: "none",
                                            color: "#dc2626",
                                            cursor: "pointer",
                                            fontWeight: 700,
                                            fontSize: "12px",
                                            padding: "2px 4px",
                                        }}
                                        title="Clear Date"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Quick Date Pills */}
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                {[
                                    { label: "All Dates", val: "all" },
                                    { label: "Today", val: "today" },
                                    { label: "Yesterday", val: "yesterday" },
                                    { label: "Last 7 Days", val: "last7" },
                                    { label: "This Month", val: "thisMonth" },
                                ].map((pill) => (
                                    <button
                                        key={pill.val}
                                        type="button"
                                        onClick={() => {
                                            setHistoryQuickDate(pill.val);
                                            setHistoryDateFilter("");
                                        }}
                                        style={{
                                            padding: "4px 8px",
                                            borderRadius: "5px",
                                            border: "1px solid",
                                            borderColor:
                                                historyQuickDate === pill.val && !historyDateFilter
                                                    ? "#2563eb"
                                                    : "var(--slate-200)",
                                            background:
                                                historyQuickDate === pill.val && !historyDateFilter
                                                    ? "#eff6ff"
                                                    : "#ffffff",
                                            color:
                                                historyQuickDate === pill.val && !historyDateFilter
                                                    ? "#1d4ed8"
                                                    : "var(--slate-600)",
                                            fontSize: "11.5px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {pill.label}
                                    </button>
                                ))}
                            </div>

                            {/* Status Filter */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--slate-700)" }}>
                                    ⚡ Status:
                                </label>
                                <select
                                    value={historyStatusFilter}
                                    onChange={(e) => setHistoryStatusFilter(e.target.value)}
                                    style={{
                                        padding: "7px 10px",
                                        borderRadius: "6px",
                                        border: "1px solid var(--slate-300)",
                                        fontSize: "12.5px",
                                        fontWeight: 600,
                                        color: "var(--slate-800)",
                                    }}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="pending_verification">Pending Verification</option>
                                    <option value="completed">Completed</option>
                                    <option value="pending_refund">Pending Refund</option>
                                </select>
                            </div>

                            {/* Brand Filter */}
                            {uniqueHistoryBrands.length > 0 && (
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--slate-700)" }}>
                                        🏷️ Brand:
                                    </label>
                                    <select
                                        value={historyBrandFilter}
                                        onChange={(e) => setHistoryBrandFilter(e.target.value)}
                                        style={{
                                            padding: "7px 10px",
                                            borderRadius: "6px",
                                            border: "1px solid var(--slate-300)",
                                            fontSize: "12.5px",
                                            fontWeight: 600,
                                            color: "var(--slate-800)",
                                            maxWidth: "160px",
                                        }}
                                    >
                                        <option value="all">All Brands ({uniqueHistoryBrands.length})</option>
                                        {uniqueHistoryBrands.map((b) => (
                                            <option key={b} value={b}>
                                                {b}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Reset Filters */}
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    style={{
                                        background: "#fef2f2",
                                        color: "#dc2626",
                                        border: "1px solid #fecaca",
                                        borderRadius: "6px",
                                        padding: "6px 12px",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                    }}
                                >
                                    ↺ Reset Filters
                                </button>
                            )}
                        </div>
                    </div>

                    {historyLoading ? (
                        <div className="table-page-container" style={{ textAlign: "center", padding: "60px 0" }}>
                            <h2>Loading Advance Payment History...</h2>
                        </div>
                    ) : (historyViewMode === "batches" ? filteredBatches.length === 0 : filteredHistoryUnits.length === 0) ? (
                        <div className="empty-state-card">
                            <div className="empty-state-icon">📜</div>
                            <h3 className="empty-state-title">No Payment History Found</h3>
                            <p className="empty-state-text">
                                No advance payment records matched your selected filters or search query.
                            </p>
                            {hasActiveFilters && (
                                <button type="button" className="nav-btn nav-btn-default" onClick={resetFilters}>
                                    Reset All Filters
                                </button>
                            )}
                        </div>
                    ) : historyViewMode === "batches" ? (
                        /* BATCHES VIEW: Combine records given together in one transaction */
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {filteredBatches.map((batch, idx) => (
                                <div
                                    key={batch.batchKey || idx}
                                    style={{
                                        background: "#ffffff",
                                        borderRadius: "14px",
                                        border: "1.5px solid #bfdbfe",
                                        padding: "18px 22px",
                                        boxShadow: "0 4px 14px rgba(59, 130, 246, 0.08)",
                                    }}
                                >
                                    {/* Batch Card Header */}
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            flexWrap: "wrap",
                                            gap: "14px",
                                            paddingBottom: "14px",
                                            borderBottom: "1px solid #f1f5f9",
                                            marginBottom: "14px",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                                            <div
                                                style={{
                                                    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                                                    color: "#1d4ed8",
                                                    fontWeight: 800,
                                                    fontSize: "18px",
                                                    padding: "8px 16px",
                                                    borderRadius: "10px",
                                                    border: "1px solid #bfdbfe",
                                                    boxShadow: "0 2px 4px rgba(37, 99, 235, 0.1)",
                                                }}
                                            >
                                                ₹{batch.totalAdvance.toLocaleString()}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                                                    Advance to {batch.mediatorName} ({batch.mediatorCode || "Code"}) • {batch.units.length} Order(s) Funded Together
                                                    {batch.advanceBatchId && (
                                                        <span
                                                            style={{
                                                                marginLeft: "8px",
                                                                fontSize: "11px",
                                                                background: "#f1f5f9",
                                                                color: "#475569",
                                                                padding: "2px 8px",
                                                                borderRadius: "4px",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            #{batch.advanceBatchId}
                                                        </span>
                                                    )}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "12.5px",
                                                        color: "#64748b",
                                                        marginTop: "3px",
                                                        display: "flex",
                                                        flexWrap: "wrap",
                                                        gap: "12px",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <span>📅 Paid on: <b>{formatDateTime(batch.paidAt)}</b></span>
                                                    <span>🏢 Team: <b>{batch.teamCode}</b></span>
                                                    {batch.message && (
                                                        <span>
                                                            💬 UTR / Note: <b style={{ color: "#334155" }}>{batch.message}</b>
                                                        </span>
                                                    )}
                                                    {batch.totalHikedDiff > 0 && (
                                                        <span style={{ color: "#d97706", fontWeight: 700 }}>
                                                            ▲ Includes ₹{batch.totalHikedDiff.toLocaleString()} Price Hike
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {batch.screenshot && (
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <ProofThumbnail
                                                    url={batch.screenshot}
                                                    alt="Advance Proof"
                                                    size={42}
                                                    onClick={() => setModalImage(batch.screenshot)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setModalImage(batch.screenshot)}
                                                    className="table-btn table-btn-outline"
                                                    style={{ fontSize: "12px", padding: "5px 10px", fontWeight: 600 }}
                                                >
                                                    🔍 View Proof
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Nested Table of Units inside Batch */}
                                    <div
                                        className="data-table-responsive"
                                        style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}
                                    >
                                        <table className="data-table" style={{ fontSize: "12.5px" }}>
                                            <thead>
                                                <tr style={{ background: "#f8fafc" }}>
                                                    <th style={{ padding: "8px 12px" }}>Product</th>
                                                    <th style={{ padding: "8px 12px" }}>Brand</th>
                                                    <th style={{ padding: "8px 12px" }}>Platform</th>
                                                    <th style={{ padding: "8px 12px" }}>Unit / Market ID</th>
                                                    <th style={{ padding: "8px 12px" }}>Advance Amount</th>
                                                    <th style={{ padding: "8px 12px" }}>Current Status</th>
                                                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {batch.units.map((unit) => {
                                                    const statusClass = `status-badge status-badge-${unit.status}`;
                                                    return (
                                                        <tr key={unit._id}>
                                                            <td style={{ padding: "8px 12px", fontWeight: 600 }}>
                                                                {unit.productName}
                                                                {unit.productLink && (
                                                                    <a
                                                                        href={unit.productLink}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        style={{
                                                                            marginLeft: "6px",
                                                                            color: "var(--primary-600)",
                                                                            textDecoration: "none",
                                                                        }}
                                                                    >
                                                                        🔗
                                                                    </a>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: "8px 12px" }}>{unit.brand}</td>
                                                            <td style={{ padding: "8px 12px" }}>{unit.orderPlatform}</td>
                                                            <td style={{ padding: "8px 12px" }}>
                                                                <span style={{ color: "var(--primary-600)", fontWeight: 700 }}>
                                                                    {unit.orderId || unit._id?.slice(-8) || "N/A"}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: "8px 12px" }}>
                                                                <PriceDisplay
                                                                    basePrice={unit.orderPrice}
                                                                    actualPrice={unit.purchasePrice}
                                                                    layout="stack"
                                                                />
                                                            </td>
                                                            <td style={{ padding: "8px 12px" }}>
                                                                <span className={statusClass}>
                                                                    ● {unit.status?.replace("_", " ")}
                                                                </span>
                                                                {unit.unitType && (
                                                                    <span
                                                                        className={`unit-spec-chip ${unit.unitType}`}
                                                                        style={{
                                                                            fontSize: "9px",
                                                                            padding: "1px 5px",
                                                                            marginLeft: "6px",
                                                                        }}
                                                                    >
                                                                        {unit.unitType === "warehouse" ? "🏢 WH" : "📦 Empty"}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => navigate(`/order/${unit.parentOrderId}`)}
                                                                    className="table-btn table-btn-outline"
                                                                    style={{ fontSize: "11px", padding: "4px 8px" }}
                                                                >
                                                                    Details →
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Batch Status Summary Footer */}
                                    <div
                                        style={{
                                            marginTop: "12px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            flexWrap: "wrap",
                                            gap: "10px",
                                            fontSize: "12px",
                                            color: "#64748b",
                                            paddingTop: "6px",
                                        }}
                                    >
                                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                            {batch.statusCounts.completed > 0 && (
                                                <span
                                                    style={{
                                                        background: "#ecfdf5",
                                                        color: "#059669",
                                                        padding: "2px 8px",
                                                        borderRadius: "4px",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    ✓ {batch.statusCounts.completed} Completed
                                                </span>
                                            )}
                                            {batch.statusCounts.in_progress > 0 && (
                                                <span
                                                    style={{
                                                        background: "#eff6ff",
                                                        color: "#2563eb",
                                                        padding: "2px 8px",
                                                        borderRadius: "4px",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    ⏳ {batch.statusCounts.in_progress} In Progress
                                                </span>
                                            )}
                                            {batch.statusCounts.assigned > 0 && (
                                                <span
                                                    style={{
                                                        background: "#fef3c7",
                                                        color: "#d97706",
                                                        padding: "2px 8px",
                                                        borderRadius: "4px",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    📦 {batch.statusCounts.assigned} Assigned
                                                </span>
                                            )}
                                            {batch.statusCounts.pending_verification > 0 && (
                                                <span
                                                    style={{
                                                        background: "#f5f3ff",
                                                        color: "#7c3aed",
                                                        padding: "2px 8px",
                                                        borderRadius: "4px",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    🔍 {batch.statusCounts.pending_verification} Pending Verification
                                                </span>
                                            )}
                                            {batch.statusCounts.pending_refund > 0 && (
                                                <span
                                                    style={{
                                                        background: "#fef2f2",
                                                        color: "#dc2626",
                                                        padding: "2px 8px",
                                                        borderRadius: "4px",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    ⚠️ {batch.statusCounts.pending_refund} Pending Refund
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            Batch Total: <b>{batch.units.length} unit(s)</b>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* TABLE VIEW: Granular row-by-row table of units */
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
                                            const paidFormatted = formatDateTime(paidDateStr);
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
                                                            {item.advanceBatchId && ` • #${item.advanceBatchId}`}
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
                                                                <span
                                                                    className={`unit-spec-chip ${item.unitType}`}
                                                                    style={{ fontSize: "9px", padding: "1px 5px" }}
                                                                >
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
