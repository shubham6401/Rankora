import { useState, useEffect, useMemo } from "react";
import { 
    fetchBrandOrders, 
    updateBrandUnitType, 
    bulkUpdateBrandUnitTypes,
    reportBrandUnitIssue,
    resolveBrandUnitIssue,
    clearBrandUnitIssue,
    moveBrandOrderToAllCampaigns 
} from "../../services/brand/orders";
import Logout from "../../component/Logout";
import "../../styles/brandDashboard.css";

export default function BrandDashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterPlatform, setFilterPlatform] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterClassification, setFilterClassification] = useState("all");
    const [filterIssue, setFilterIssue] = useState("all"); // "all" | "flagged" | "no_issues"
    const [filterDatePreset, setFilterDatePreset] = useState("all");
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");
    
    // View Switcher: "new_orders" | "all_campaigns" | "warehouse" | "empty"
    const [activeTab, setActiveTab] = useState("new_orders");
    const [updatingUnitId, setUpdatingUnitId] = useState(null);
    const [movingOrderId, setMovingOrderId] = useState(null);

    // Bulk selection state
    const [selectedUnitKeys, setSelectedUnitKeys] = useState(new Set());
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    // Spend & Analytics bar visibility
    const [showAnalyticsBar, setShowAnalyticsBar] = useState(true);
    
    // Detailed Unit Modal (Address, Screenshot, Full Info, Issue Reporting)
    const [viewDetailsUnit, setViewDetailsUnit] = useState(null);
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [copiedOrderId, setCopiedOrderId] = useState(false);

    // Modal Issue Reporting Form State
    const [isReportingIssue, setIsReportingIssue] = useState(false);
    const [issueReason, setIssueReason] = useState("Buyer Cancelled Order");
    const [issueDetails, setIssueDetails] = useState("");
    const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

    const user = JSON.parse(localStorage.getItem("user")) || {};

    useEffect(() => {
        loadBrandOrders();
    }, []);

    const loadBrandOrders = async () => {
        try {
            setLoading(true);
            const response = await fetchBrandOrders();
            const fetchedOrders = response.data.orders || [];
            setOrders(fetchedOrders);

            // If no new orders, default to All Orders
            const hasNew = fetchedOrders.some((o) => o.isMovedToAllCampaigns !== true && o.isMovedToAllCampaigns !== "true");
            if (!hasNew && fetchedOrders.length > 0) {
                setActiveTab("all_campaigns");
            }
        } catch (err) {
            console.error("Error loading brand orders:", err);
        } finally {
            setLoading(false);
        }
    };

    // Classify unit as Warehouse or Empty
    const handleSetUnitType = async (orderId, unitId, type) => {
        try {
            setUpdatingUnitId(unitId);

            // Optimistic update
            setOrders((prev) =>
                prev.map((ord) => {
                    if (ord._id !== orderId) return ord;
                    const newUnits = (ord.orderUnits || []).map((u) => {
                        if (u._id !== unitId) return u;
                        return { ...u, unitType: type };
                    });
                    return { ...ord, orderUnits: newUnits };
                })
            );

            // If modal is open for this unit, update it too
            if (viewDetailsUnit && viewDetailsUnit.unitId === unitId) {
                setViewDetailsUnit((prev) => prev ? { ...prev, unitType: type } : null);
            }

            await updateBrandUnitType(orderId, unitId, type);
        } catch (err) {
            console.error("Error updating unit classification:", err);
            alert("Failed to update classification. Please try again.");
            loadBrandOrders();
        } finally {
            setUpdatingUnitId(null);
        }
    };

    // Move single order to All Orders
    const handleMoveOrder = async (orderId) => {
        try {
            setMovingOrderId(orderId);

            // Optimistic update: immediately mark as moved so it disappears from New Orders
            setOrders((prev) =>
                prev.map((ord) => {
                    if (String(ord._id) === String(orderId)) {
                        return { ...ord, isMovedToAllCampaigns: true };
                    }
                    return ord;
                })
            );

            if (viewDetailsUnit && String(viewDetailsUnit.orderId) === String(orderId)) {
                setViewDetailsUnit((prev) => prev ? { ...prev, isMovedToAllCampaigns: true } : null);
            }

            await moveBrandOrderToAllCampaigns(orderId);
            await loadBrandOrders();
        } catch (err) {
            console.error("Error moving order to all orders:", err);
            alert("Failed to move order. Please try again.");
            loadBrandOrders();
        } finally {
            setMovingOrderId(null);
        }
    };

    // Move all fully classified orders to All Orders in 1-click
    const handleMoveAllClassified = async () => {
        const fullyClassifiedOrders = orders.filter((ord) => {
            if (ord.isMovedToAllCampaigns === true || ord.isMovedToAllCampaigns === "true") return false;
            const placedUnits = (ord.orderUnits || []).filter((u) => u.orderId && u.orderId.trim() !== "");
            if (placedUnits.length === 0) return false;
            return placedUnits.every((u) => u.unitType === "warehouse" || u.unitType === "empty");
        });

        if (fullyClassifiedOrders.length === 0) return;

        try {
            setLoading(true);
            for (const ord of fullyClassifiedOrders) {
                await moveBrandOrderToAllCampaigns(ord._id);
            }
            alert(`✓ Successfully moved ${fullyClassifiedOrders.length} order(s) to All Orders!`);
            loadBrandOrders();
        } catch (err) {
            console.error("Error moving classified orders:", err);
            alert("Failed to move some orders. Please refresh and try again.");
            loadBrandOrders();
        } finally {
            setLoading(false);
        }
    };

    // Helper: Check if all placed units (with orderId) in an order are classified
    const isOrderFullyClassified = (orderId) => {
        const order = orders.find((o) => o._id === orderId);
        if (!order) return false;
        const placedUnits = (order.orderUnits || []).filter((u) => u.orderId && u.orderId.trim() !== "");
        if (placedUnits.length === 0) return false;
        return placedUnits.every((u) => u.unitType === "warehouse" || u.unitType === "empty");
    };

    // Copy to clipboard helper
    const handleCopy = (text, type = "address") => {
        if (!text || text === "—") return;
        navigator.clipboard.writeText(text);
        if (type === "address") {
            setCopiedAddress(true);
            setTimeout(() => setCopiedAddress(false), 2000);
        } else {
            setCopiedOrderId(true);
            setTimeout(() => setCopiedOrderId(false), 2000);
        }
    };

    // Helper to get local YYYY-MM-DD from any Date object or ISO string (timezone-safe)
    const getLocalDateString = (dateVal) => {
        if (!dateVal) return null;
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return null;
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        } catch {
            return null;
        }
    };

    // Quick date preset handler (Today, Yesterday, Last 7 Days, Last 30 Days)
    const handleDatePresetChange = (preset) => {
        setFilterDatePreset(preset);
        const today = new Date();
        const todayStr = getLocalDateString(today);

        if (preset === "all") {
            setFilterDateFrom("");
            setFilterDateTo("");
        } else if (preset === "today") {
            setFilterDateFrom(todayStr);
            setFilterDateTo(todayStr);
        } else if (preset === "yesterday") {
            const yest = new Date();
            yest.setDate(yest.getDate() - 1);
            const yestStr = getLocalDateString(yest);
            setFilterDateFrom(yestStr);
            setFilterDateTo(yestStr);
        } else if (preset === "last_7") {
            const d7 = new Date();
            d7.setDate(d7.getDate() - 6);
            setFilterDateFrom(getLocalDateString(d7));
            setFilterDateTo(todayStr);
        } else if (preset === "last_30") {
            const d30 = new Date();
            d30.setDate(d30.getDate() - 29);
            setFilterDateFrom(getLocalDateString(d30));
            setFilterDateTo(todayStr);
        }
    };

    const handleDateFromChange = (val) => {
        setFilterDateFrom(val);
        setFilterDatePreset("custom");
    };

    const handleDateToChange = (val) => {
        setFilterDateTo(val);
        setFilterDatePreset("custom");
    };

    const handleClearDate = () => {
        setFilterDatePreset("all");
        setFilterDateFrom("");
        setFilterDateTo("");
    };

    // Counts for view tabs (Unit counts for 1-to-1 correspondence with table rows)
    const newPlacedUnitsCount = useMemo(() => {
        return orders.reduce((sum, o) => {
            if (o.isMovedToAllCampaigns === true || o.isMovedToAllCampaigns === "true") return sum;
            const placedUnits = (o.orderUnits || []).filter((u) => u.orderId && u.orderId.trim() !== "");
            return sum + placedUnits.length;
        }, 0);
    }, [orders]);

    const allUnitsCount = useMemo(() => {
        return orders.reduce((sum, o) => {
            const units = o.orderUnits || [];
            return sum + (units.length > 0 ? units.length : 1);
        }, 0);
    }, [orders]);

    const warehouseUnitsCount = useMemo(() => {
        return orders.reduce((sum, o) => sum + (o.orderUnits || []).filter((u) => u.unitType === "warehouse").length, 0);
    }, [orders]);

    const emptyUnitsCount = useMemo(() => {
        return orders.reduce((sum, o) => sum + (o.orderUnits || []).filter((u) => u.unitType === "empty").length, 0);
    }, [orders]);
    
    // Count of new orders ready to move (placed units classified as warehouse or empty)
    const readyToMoveCount = useMemo(() => {
        return orders.filter((ord) => {
            if (ord.isMovedToAllCampaigns === true || ord.isMovedToAllCampaigns === "true") return false;
            const placedUnits = (ord.orderUnits || []).filter((u) => u.orderId && u.orderId.trim() !== "");
            return placedUnits.length > 0 && placedUnits.every((u) => u.unitType === "warehouse" || u.unitType === "empty");
        }).length;
    }, [orders]);

    // Format Date & Time safely
    const formatDateTime = (dateVal) => {
        if (!dateVal) return { date: "—", time: "—" };
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return { date: "—", time: "—" };
            return {
                date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
                time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
            };
        } catch {
            return { date: "—", time: "—" };
        }
    };

    // Extract unique platforms
    const platformList = useMemo(() => {
        const set = new Set();
        orders.forEach((o) => {
            if (o.orderPlatform && typeof o.orderPlatform === "string") {
                set.add(o.orderPlatform.trim());
            }
        });
        return Array.from(set);
    }, [orders]);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (searchQuery.trim()) count++;
        if (filterPlatform !== "all") count++;
        if (filterStatus !== "all") count++;
        if (filterClassification !== "all") count++;
        if (filterIssue !== "all") count++;
        if (filterDatePreset !== "all" || filterDateFrom || filterDateTo) count++;
        return count;
    }, [searchQuery, filterPlatform, filterStatus, filterClassification, filterIssue, filterDatePreset, filterDateFrom, filterDateTo]);

    const isAnyFilterActive = activeFiltersCount > 0;

    const clearAllFilters = () => {
        setSearchQuery("");
        setFilterPlatform("all");
        setFilterStatus("all");
        setFilterClassification("all");
        setFilterIssue("all");
        setFilterDatePreset("all");
        setFilterDateFrom("");
        setFilterDateTo("");
    };

    // Flatten orders into direct unit rows for a clean, simple table format
    const flattenedUnitRows = useMemo(() => {
        let baseOrders = orders;
        if (activeTab === "new_orders") {
            baseOrders = orders.filter((o) => o.isMovedToAllCampaigns !== true && o.isMovedToAllCampaigns !== "true");
        } else if (activeTab === "warehouse") {
            baseOrders = orders.filter((o) => (o.orderUnits || []).some((u) => u.unitType === "warehouse"));
        } else if (activeTab === "empty") {
            baseOrders = orders.filter((o) => (o.orderUnits || []).some((u) => u.unitType === "empty"));
        }

        const rows = [];
        baseOrders.forEach((order) => {
            const units = order.orderUnits || [];
            if (units.length === 0) {
                // In new orders, do NOT show orders without placed units
                if (activeTab === "new_orders") return;

                rows.push({
                    orderId: order._id,
                    orderObj: order,
                    unitId: null,
                    unitIndex: 1,
                    totalUnits: 1,
                    productName: order.productName,
                    orderPlatform: order.orderPlatform,
                    productLink: order.productLink,
                    price: order.price,
                    marketplaceOrderId: null,
                    orderedAt: order.createdAt,
                    reviewerName: "—",
                    address: "—",
                    unitType: null,
                    status: "unassigned",
                    isMovedToAllCampaigns: order.isMovedToAllCampaigns,
                    brandIssue: null,
                });
            } else {
                units.forEach((u, idx) => {
                    // In New Orders tab: ONLY show units where mediator has filled the orderId
                    if (activeTab === "new_orders" && (!u.orderId || !u.orderId.trim())) {
                        return;
                    }

                    // Filter specific tab if needed
                    if (activeTab === "warehouse" && u.unitType !== "warehouse") return;
                    if (activeTab === "empty" && u.unitType !== "empty") return;

                    rows.push({
                        orderId: order._id,
                        orderObj: order,
                        unitId: u._id,
                        unitIndex: idx + 1,
                        totalUnits: units.length,
                        productName: order.productName,
                        orderPlatform: order.orderPlatform,
                        productLink: order.productLink,
                        price: u.purchasePrice !== undefined && u.purchasePrice !== null ? u.purchasePrice : order.price,
                        marketplaceOrderId: u.orderId || null,
                        orderedAt: u.orderedAt || u.updatedAt || u.orderReceivedOn || u.createdAt || order.createdAt,
                        reviewerName: u.reviewerName || "—",
                        address: u.address || u.deliveryAddress || "—",
                        unitType: u.unitType || null,
                        status: u.status || "unassigned",
                        isMovedToAllCampaigns: order.isMovedToAllCampaigns,
                        orderedScreenshot: u.orderedScreenshot,
                        brandIssue: u.brandIssue || null,
                    });
                });
            }
        });

        // Filter by Search Query, Platform, Status, Classification, Issue, and Date
        return rows.filter((r) => {
            // 1. Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const match =
                    (r.productName || "").toLowerCase().includes(q) ||
                    (r.marketplaceOrderId || "").toLowerCase().includes(q) ||
                    (r.reviewerName || "").toLowerCase().includes(q) ||
                    (r.address || "").toLowerCase().includes(q) ||
                    (r.orderPlatform || "").toLowerCase().includes(q);
                if (!match) return false;
            }

            // 2. Platform filter
            if (filterPlatform !== "all") {
                const p = (r.orderPlatform || "").toLowerCase();
                if (!p.includes(filterPlatform.toLowerCase())) return false;
            }

            // 3. Status filter
            if (filterStatus !== "all") {
                const st = (r.status || "unassigned").toLowerCase();
                if (st !== filterStatus.toLowerCase()) {
                    return false;
                }
            }

            // 4. Classification filter (if not on warehouse/empty tab which are already scoped)
            if (activeTab !== "warehouse" && activeTab !== "empty" && filterClassification !== "all") {
                if (filterClassification === "warehouse" && r.unitType !== "warehouse") return false;
                if (filterClassification === "empty" && r.unitType !== "empty") return false;
                if (filterClassification === "unclassified" && (r.unitType === "warehouse" || r.unitType === "empty")) return false;
            }

            // 5. Flagged Issue filter
            if (filterIssue !== "all") {
                const isFlagged = r.brandIssue?.isReported && !r.brandIssue?.resolved;
                if (filterIssue === "flagged" && !isFlagged) return false;
                if (filterIssue === "no_issues" && isFlagged) return false;
            }

            // 6. Date filter (from & to on placement/orderedAt date in local timezone)
            if (filterDateFrom || filterDateTo) {
                const rowDateStr = getLocalDateString(r.orderedAt);
                if (!rowDateStr) return false;
                if (filterDateFrom && rowDateStr < filterDateFrom) return false;
                if (filterDateTo && rowDateStr > filterDateTo) return false;
            }

            return true;
        });
    }, [orders, activeTab, searchQuery, filterPlatform, filterStatus, filterClassification, filterIssue, filterDatePreset, filterDateFrom, filterDateTo]);

    // Format status label - follows Executive and Mediator conventions exactly
    const formatStatus = (st = "") => {
        switch (st) {
            case "unassigned": return "Unassigned";
            case "assigned": return "Assigned";
            case "in_progress": return "In Progress";
            case "pending_refund": return "Pending Refund";
            case "pending_verification": return "Pending Verification";
            case "completed": return "Completed";
            case "pending_payment": return "Pending Payment";
            default: return st ? st.replace(/_/g, " ") : "Pending";
        }
    };

    // Compact Spend & Unit Analytics
    const analytics = useMemo(() => {
        const totalUnits = flattenedUnitRows.length;
        let totalSpend = 0;
        let whCount = 0;
        let emCount = 0;
        let unclassCount = 0;
        let flaggedCount = 0;

        flattenedUnitRows.forEach((r) => {
            const p = Number(r.price) || 0;
            totalSpend += p;
            if (r.unitType === "warehouse") whCount++;
            else if (r.unitType === "empty") emCount++;
            else unclassCount++;

            if (r.brandIssue?.isReported && !r.brandIssue?.resolved) {
                flaggedCount++;
            }
        });

        const whPercent = totalUnits > 0 ? Math.round((whCount / totalUnits) * 100) : 0;
        const emPercent = totalUnits > 0 ? Math.round((emCount / totalUnits) * 100) : 0;
        const unclassPercent = totalUnits > 0 ? Math.round((unclassCount / totalUnits) * 100) : 0;

        return {
            totalUnits,
            totalSpend,
            whCount,
            whPercent,
            emCount,
            emPercent,
            unclassCount,
            unclassPercent,
            flaggedCount,
        };
    }, [flattenedUnitRows]);

    // Selectable units in current filtered view
    const selectableUnits = useMemo(() => {
        return flattenedUnitRows.filter((r) => r.unitId);
    }, [flattenedUnitRows]);

    const isAllSelected = selectableUnits.length > 0 && selectableUnits.every((r) => selectedUnitKeys.has(`${r.orderId}:${r.unitId}`));
    const isIndeterminate = selectableUnits.some((r) => selectedUnitKeys.has(`${r.orderId}:${r.unitId}`)) && !isAllSelected;

    // Toggle single unit row selection
    const handleToggleUnitSelect = (orderId, unitId) => {
        if (!unitId) return;
        const key = `${orderId}:${unitId}`;
        setSelectedUnitKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    // Toggle select all
    const handleToggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedUnitKeys(new Set());
        } else {
            const next = new Set();
            selectableUnits.forEach((r) => next.add(`${r.orderId}:${r.unitId}`));
            setSelectedUnitKeys(next);
        }
    };

    // Clear selection
    const handleClearSelection = () => {
        setSelectedUnitKeys(new Set());
    };

    // Bulk set unit classification
    const handleBulkSetUnitType = async (targetType) => {
        if (selectedUnitKeys.size === 0) return;

        const items = [];
        selectedUnitKeys.forEach((key) => {
            const [orderId, unitId] = key.split(":");
            if (orderId && unitId) {
                items.push({ orderId, unitId });
            }
        });

        if (items.length === 0) return;

        try {
            setIsBulkUpdating(true);
            const keySet = new Set(selectedUnitKeys);

            // Optimistic update
            setOrders((prev) =>
                prev.map((ord) => {
                    const newUnits = (ord.orderUnits || []).map((u) => {
                        if (keySet.has(`${ord._id}:${u._id}`)) {
                            return { ...u, unitType: targetType };
                        }
                        return u;
                    });
                    return { ...ord, orderUnits: newUnits };
                })
            );

            await bulkUpdateBrandUnitTypes(items, targetType);
            handleClearSelection();
        } catch (err) {
            console.error("Bulk classification failed:", err);
            alert("Failed to update classification. Refreshing data...");
            loadBrandOrders();
        } finally {
            setIsBulkUpdating(false);
        }
    };

    // Bulk move selected orders to All Orders
    const handleBulkMoveSelected = async () => {
        if (selectedUnitKeys.size === 0) return;

        const uniqueOrderIds = new Set();
        selectedUnitKeys.forEach((key) => {
            const [orderId] = key.split(":");
            if (orderId) uniqueOrderIds.add(orderId);
        });

        if (uniqueOrderIds.size === 0) return;

        try {
            setIsBulkUpdating(true);
            for (const ordId of uniqueOrderIds) {
                await moveBrandOrderToAllCampaigns(ordId);
            }
            handleClearSelection();
            await loadBrandOrders();
        } catch (err) {
            console.error("Bulk move failed:", err);
            alert("Failed to move some orders. Please refresh and try again.");
            loadBrandOrders();
        } finally {
            setIsBulkUpdating(false);
        }
    };

    // 1-Click Export to CSV / Excel
    const handleExportCSV = () => {
        if (flattenedUnitRows.length === 0) {
            alert("No units to export in the current view/filters.");
            return;
        }

        const headers = [
            "Sr No",
            "Product Name",
            "Platform",
            "Order ID",
            "Ordered Date",
            "Ordered Time",
            "Price (INR)",
            "Reviewer Name",
            "Delivery Address",
            "Classification",
            "Status",
            "Flagged Issue",
            "Issue Details",
            "Product Link"
        ];

        const escapeCSV = (val) => {
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
        };

        const rows = flattenedUnitRows.map((r, i) => {
            const dt = formatDateTime(r.orderedAt);
            const classification = r.unitType === "warehouse" ? "Warehouse" : r.unitType === "empty" ? "Empty" : "Unclassified";
            const statusLabel = formatStatus(r.status);
            const issueFlag = r.brandIssue?.isReported ? (r.brandIssue.resolved ? "Resolved" : `Flagged: ${r.brandIssue.reason}`) : "No Issues";
            const issueNotes = r.brandIssue?.details || "";

            return [
                i + 1,
                escapeCSV(r.productName),
                escapeCSV(r.orderPlatform || "—"),
                escapeCSV(r.marketplaceOrderId ? `#${r.marketplaceOrderId}` : "Pending"),
                escapeCSV(dt.date),
                escapeCSV(dt.time),
                escapeCSV(r.price),
                escapeCSV(r.reviewerName !== "—" ? r.reviewerName : ""),
                escapeCSV(r.address !== "—" ? r.address : ""),
                escapeCSV(classification),
                escapeCSV(statusLabel),
                escapeCSV(issueFlag),
                escapeCSV(issueNotes),
                escapeCSV(r.productLink || "")
            ].join(",");
        });

        // Prepend UTF-8 BOM so Excel opens Hindi/rupee/Unicode correctly
        const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const brandLabel = (user.brand || user.name || "Brand").replace(/[^a-zA-Z0-9_-]/g, "_");
        link.href = url;
        link.setAttribute("download", `${brandLabel}_Orders_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Report Issue on Unit
    const handleReportIssue = async (orderId, unitId) => {
        if (!issueReason || !issueReason.trim()) {
            alert("Please select a reason for the issue.");
            return;
        }

        try {
            setIsSubmittingIssue(true);
            const res = await reportBrandUnitIssue(orderId, unitId, {
                reason: issueReason,
                details: issueDetails
            });

            const newIssue = res.data.brandIssue;

            // Optimistic update
            setOrders((prev) =>
                prev.map((ord) => {
                    if (ord._id !== orderId) return ord;
                    const newUnits = (ord.orderUnits || []).map((u) => {
                        if (u._id !== unitId) return u;
                        return { ...u, brandIssue: newIssue };
                    });
                    return { ...ord, orderUnits: newUnits };
                })
            );

            if (viewDetailsUnit && viewDetailsUnit.unitId === unitId) {
                setViewDetailsUnit((prev) => prev ? { ...prev, brandIssue: newIssue } : null);
            }

            setIsReportingIssue(false);
            setIssueDetails("");
        } catch (err) {
            console.error("Error reporting issue:", err);
            alert("Failed to report issue. Please try again.");
        } finally {
            setIsSubmittingIssue(false);
        }
    };

    // Mark Issue as Resolved
    const handleResolveIssue = async (orderId, unitId) => {
        try {
            setIsSubmittingIssue(true);
            await resolveBrandUnitIssue(orderId, unitId);

            const resolvedTime = new Date();

            setOrders((prev) =>
                prev.map((ord) => {
                    if (ord._id !== orderId) return ord;
                    const newUnits = (ord.orderUnits || []).map((u) => {
                        if (u._id !== unitId) return u;
                        return {
                            ...u,
                            brandIssue: {
                                ...(u.brandIssue || {}),
                                resolved: true,
                                resolvedAt: resolvedTime,
                            }
                        };
                    });
                    return { ...ord, orderUnits: newUnits };
                })
            );

            if (viewDetailsUnit && viewDetailsUnit.unitId === unitId) {
                setViewDetailsUnit((prev) =>
                    prev ? {
                        ...prev,
                        brandIssue: {
                            ...(prev.brandIssue || {}),
                            resolved: true,
                            resolvedAt: resolvedTime,
                        }
                    } : null
                );
            }
        } catch (err) {
            console.error("Error resolving issue:", err);
            alert("Failed to resolve issue. Please try again.");
        } finally {
            setIsSubmittingIssue(false);
        }
    };

    // Clear / Unflag Issue
    const handleClearIssue = async (orderId, unitId) => {
        try {
            setIsSubmittingIssue(true);
            await clearBrandUnitIssue(orderId, unitId);

            setOrders((prev) =>
                prev.map((ord) => {
                    if (ord._id !== orderId) return ord;
                    const newUnits = (ord.orderUnits || []).map((u) => {
                        if (u._id !== unitId) return u;
                        return {
                            ...u,
                            brandIssue: {
                                isReported: false,
                                reason: null,
                                details: null,
                                reportedAt: null,
                                resolved: false,
                                resolvedAt: null,
                            }
                        };
                    });
                    return { ...ord, orderUnits: newUnits };
                })
            );

            if (viewDetailsUnit && viewDetailsUnit.unitId === unitId) {
                setViewDetailsUnit((prev) =>
                    prev ? {
                        ...prev,
                        brandIssue: {
                            isReported: false,
                            reason: null,
                            details: null,
                            reportedAt: null,
                            resolved: false,
                            resolvedAt: null,
                        }
                    } : null
                );
            }
        } catch (err) {
            console.error("Error clearing issue:", err);
            alert("Failed to clear issue. Please try again.");
        } finally {
            setIsSubmittingIssue(false);
        }
    };

    return (
        <div className="brand-simple-container">
            {/* MINIMAL HEADER */}
            <div className="brand-simple-header">
                <div>
                    <h1 className="brand-simple-title">
                        {user.brand || user.name || "Brand"} Orders
                    </h1>
                    <p className="brand-simple-sub">
                        Review product units, order IDs, placement times, and classify as Warehouse or Empty.
                    </p>
                </div>
                <div className="brand-simple-actions">
                    <button
                        type="button"
                        onClick={() => setShowAnalyticsBar((prev) => !prev)}
                        className="simple-action-btn secondary-btn"
                        title={showAnalyticsBar ? "Collapse analytics summary bar" : "Expand analytics summary bar"}
                    >
                        {showAnalyticsBar ? "▲ Hide Stats" : "📊 Show Stats"}
                    </button>
                    <button
                        type="button"
                        onClick={handleExportCSV}
                        className="simple-action-btn export-csv-btn"
                        title="Export currently filtered units to CSV / Excel spreadsheet"
                    >
                        <span>📥</span>
                        <span>Export CSV</span>
                    </button>
                    <button
                        type="button"
                        onClick={loadBrandOrders}
                        className="simple-refresh-btn"
                        title="Refresh data"
                    >
                        ↻ Refresh
                    </button>
                    <Logout />
                </div>
            </div>

            {/* COMPACT SPEND & UNIT ANALYTICS BAR (Feature 4) */}
            {showAnalyticsBar && (
                <div className="simple-analytics-ribbon">
                    <div className="analytics-card card-total">
                        <div className="analytics-icon">📦</div>
                        <div className="analytics-content">
                            <span className="analytics-label">Total Units</span>
                            <span className="analytics-value">{analytics.totalUnits} <span className="analytics-sub">units</span></span>
                        </div>
                    </div>

                    <div className="analytics-card card-spend">
                        <div className="analytics-icon">💰</div>
                        <div className="analytics-content">
                            <span className="analytics-label">Total Spend</span>
                            <span className="analytics-value">₹{analytics.totalSpend.toLocaleString("en-IN")}</span>
                        </div>
                    </div>

                    <div className="analytics-card card-wh">
                        <div className="analytics-icon">🏢</div>
                        <div className="analytics-content">
                            <span className="analytics-label">Warehouse</span>
                            <span className="analytics-value">
                                {analytics.whCount} <span className="analytics-pct">({analytics.whPercent}%)</span>
                            </span>
                        </div>
                    </div>

                    <div className="analytics-card card-em">
                        <div className="analytics-icon">📦</div>
                        <div className="analytics-content">
                            <span className="analytics-label">Empty</span>
                            <span className="analytics-value">
                                {analytics.emCount} <span className="analytics-pct">({analytics.emPercent}%)</span>
                            </span>
                        </div>
                    </div>

                    <div className="analytics-card card-unclass">
                        <div className="analytics-icon">⏳</div>
                        <div className="analytics-content">
                            <span className="analytics-label">Unclassified</span>
                            <span className="analytics-value">
                                {analytics.unclassCount} <span className="analytics-pct">({analytics.unclassPercent}%)</span>
                            </span>
                        </div>
                    </div>

                    {analytics.flaggedCount > 0 && (
                        <div 
                            className={`analytics-card card-flagged ${filterIssue === "flagged" ? "active-filter" : ""}`}
                            onClick={() => setFilterIssue((prev) => prev === "flagged" ? "all" : "flagged")}
                            title="Click to toggle filter for flagged orders"
                        >
                            <div className="analytics-icon">🚩</div>
                            <div className="analytics-content">
                                <span className="analytics-label">Flagged Issues</span>
                                <span className="analytics-value">
                                    {analytics.flaggedCount} 
                                    <span className="analytics-filter-tip">
                                        {filterIssue === "flagged" ? " (Filtering)" : " (Click)"}
                                    </span>
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* FLOATING BULK ACTIONS TOOLBAR (Feature 2) */}
            {selectedUnitKeys.size > 0 && (
                <div className="simple-bulk-action-bar">
                    <div className="bulk-bar-info">
                        <span className="bulk-bar-count">✓ {selectedUnitKeys.size} Unit(s) Selected</span>
                        <span className="bulk-bar-hint">Apply bulk action to selected units:</span>
                    </div>
                    <div className="bulk-bar-actions">
                        <button
                            type="button"
                            onClick={() => handleBulkSetUnitType("warehouse")}
                            disabled={isBulkUpdating}
                            className="bulk-btn bulk-wh-btn"
                            title="Classify all selected units as Warehouse"
                        >
                            🏢 Mark as Warehouse
                        </button>
                        <button
                            type="button"
                            onClick={() => handleBulkSetUnitType("empty")}
                            disabled={isBulkUpdating}
                            className="bulk-btn bulk-em-btn"
                            title="Classify all selected units as Empty"
                        >
                            📦 Mark as Empty
                        </button>
                        <button
                            type="button"
                            onClick={() => handleBulkSetUnitType(null)}
                            disabled={isBulkUpdating}
                            className="bulk-btn bulk-unclass-btn"
                            title="Reset classification for selected units"
                        >
                            ↺ Unclassify
                        </button>
                        {activeTab === "new_orders" && (
                            <button
                                type="button"
                                onClick={handleBulkMoveSelected}
                                disabled={isBulkUpdating}
                                className="bulk-btn bulk-move-btn"
                                title="Move parent orders of selected units to All Orders"
                            >
                                🚀 Move Selected Orders
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleClearSelection}
                            className="bulk-btn bulk-clear-btn"
                            title="Clear selection"
                        >
                            ✕ Deselect All
                        </button>
                    </div>
                </div>
            )}

            {/* SIMPLE TABS & CONTROLS */}
            <div className="brand-simple-controls-bar">
                {/* 4 Main View Buttons */}
                <div className="simple-tabs-row">
                    <button
                        type="button"
                        onClick={() => setActiveTab("new_orders")}
                        className={`simple-tab ${activeTab === "new_orders" ? "active-new" : ""}`}
                    >
                        <span>🆕 New Orders</span>
                        <span className="simple-badge badge-amber">{newPlacedUnitsCount}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("all_campaigns")}
                        className={`simple-tab ${activeTab === "all_campaigns" ? "active-all" : ""}`}
                    >
                        <span>📋 All Orders</span>
                        <span className="simple-badge badge-blue">{allUnitsCount}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("warehouse")}
                        className={`simple-tab ${activeTab === "warehouse" ? "active-wh" : ""}`}
                    >
                        <span>🏢 Warehouse</span>
                        <span className="simple-badge badge-green">{warehouseUnitsCount}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("empty")}
                        className={`simple-tab ${activeTab === "empty" ? "active-em" : ""}`}
                    >
                        <span>📦 Empty</span>
                        <span className="simple-badge badge-purple">{emptyUnitsCount}</span>
                    </button>
                </div>

                {/* Move All Classified Button (When on New Orders) */}
                {activeTab === "new_orders" && readyToMoveCount > 0 && (
                    <button
                        type="button"
                        onClick={handleMoveAllClassified}
                        className="simple-bulk-move-btn"
                        title="Move all fully classified orders to All Orders"
                    >
                        <span>🚀</span>
                        <span>Move {readyToMoveCount} Classified Order(s) to All Orders</span>
                    </button>
                )}
            </div>

            {/* SEARCH & FILTERS TOOLBAR (Platform, Status, Date Presets & Range, Search) */}
            <div className="simple-filter-row">
                {/* Search Input */}
                <div className="simple-search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search Order ID, Reviewer, Address, or Product..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="simple-search-input"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="simple-search-clear"
                            title="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="simple-dropdowns-group">
                    {/* Platform Filter */}
                    <div className="simple-filter-field">
                        <label className="simple-filter-label">Platform:</label>
                        <select
                            value={filterPlatform}
                            onChange={(e) => setFilterPlatform(e.target.value)}
                            className="simple-filter-select"
                            title="Filter by platform"
                        >
                            <option value="all">🏷️ All Platforms</option>
                            <option value="amazon">Amazon</option>
                            <option value="flipkart">Flipkart</option>
                            <option value="myntra">Myntra</option>
                            <option value="meesho">Meesho</option>
                            {platformList
                                .filter((p) => !["amazon", "flipkart", "myntra", "meesho"].includes(p.toLowerCase()))
                                .map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                        </select>
                    </div>

                    {/* Status Filter (Exact Executive & Mediator Statuses) */}
                    <div className="simple-filter-field">
                        <label className="simple-filter-label">Status:</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="simple-filter-select"
                            title="Filter by status"
                        >
                            <option value="all">📊 All Statuses</option>
                            <option value="in_progress">⚡ In Progress</option>
                            <option value="pending_refund">🔄 Pending Refund</option>
                            <option value="pending_verification">⏳ Pending Verification</option>
                            <option value="completed">✅ Completed</option>
                            <option value="unassigned">📦 Unassigned</option>
                            <option value="assigned">📤 Assigned</option>
                            <option value="pending_payment">💳 Pending Payment</option>
                        </select>
                    </div>

                    {/* Issue Filter (Feature 5) */}
                    <div className="simple-filter-field">
                        <label className="simple-filter-label">Issues:</label>
                        <select
                            value={filterIssue}
                            onChange={(e) => setFilterIssue(e.target.value)}
                            className="simple-filter-select"
                            title="Filter by flagged issues"
                        >
                            <option value="all">🚩 All (Normal & Flagged)</option>
                            <option value="flagged">⚠️ Only Flagged</option>
                            <option value="no_issues">✓ No Issues</option>
                        </select>
                    </div>

                    {/* Date Filter (Preset + Range Picker) */}
                    <div className="simple-filter-field">
                        <label className="simple-filter-label">Date:</label>
                        <select
                            value={filterDatePreset}
                            onChange={(e) => handleDatePresetChange(e.target.value)}
                            className="simple-filter-select date-preset-select"
                            title="Quick date filter preset"
                        >
                            <option value="all">📅 All Dates</option>
                            <option value="today">⚡ Today</option>
                            <option value="yesterday">⏪ Yesterday</option>
                            <option value="last_7">🗓️ Last 7 Days</option>
                            <option value="last_30">📆 Last 30 Days</option>
                            <option value="custom">🎯 Custom Range</option>
                        </select>

                        <div className="simple-date-picker-wrap">
                            <input
                                type="date"
                                value={filterDateFrom}
                                onChange={(e) => handleDateFromChange(e.target.value)}
                                className="simple-date-input"
                                title="From date"
                                placeholder="From"
                            />
                            <span className="date-separator">to</span>
                            <input
                                type="date"
                                value={filterDateTo}
                                onChange={(e) => handleDateToChange(e.target.value)}
                                className="simple-date-input"
                                title="To date"
                                placeholder="To"
                            />
                            {(filterDateFrom || filterDateTo || filterDatePreset !== "all") && (
                                <button
                                    type="button"
                                    onClick={handleClearDate}
                                    className="simple-date-clear"
                                    title="Clear date filter"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Classification Filter (Only for New Orders & All Campaigns) */}
                    {activeTab !== "warehouse" && activeTab !== "empty" && (
                        <div className="simple-filter-field">
                            <label className="simple-filter-label">Type:</label>
                            <select
                                value={filterClassification}
                                onChange={(e) => setFilterClassification(e.target.value)}
                                className="simple-filter-select"
                                title="Filter by warehouse or empty classification"
                            >
                                <option value="all">📦 All Types</option>
                                <option value="warehouse">🏢 Warehouse</option>
                                <option value="empty">📦 Empty</option>
                                <option value="unclassified">⏳ Unclassified</option>
                            </select>
                        </div>
                    )}

                    {/* Reset Button (Visible when any filter is active) */}
                    {isAnyFilterActive && (
                        <button
                            type="button"
                            onClick={clearAllFilters}
                            className="simple-filter-reset-btn"
                            title="Clear all filters and search query"
                        >
                            <span>↺</span>
                            <span>Reset ({activeFiltersCount})</span>
                        </button>
                    )}
                </div>

                <div className="simple-count-text">
                    Showing <b>{flattenedUnitRows.length}</b> unit(s)
                    {activeFiltersCount > 0 && <span className="filtered-indicator"> (Filtered)</span>}
                </div>
            </div>

            {/* SIMPLE CLEAN DATA TABLE */}
            <div className="simple-table-wrapper">
                {loading ? (
                    <div className="simple-table-empty">
                        <div className="empty-spinner">⏳</div>
                        <p>Loading order units...</p>
                    </div>
                ) : flattenedUnitRows.length === 0 ? (
                    <div className="simple-table-empty">
                        {isAnyFilterActive ? (
                            <div>
                                <p style={{ fontWeight: "600", color: "#334155", marginBottom: "8px" }}>
                                    No units match the applied filters in {
                                        activeTab === "new_orders" ? "New Orders" :
                                        activeTab === "all_campaigns" ? "All Orders" :
                                        activeTab === "warehouse" ? "Warehouse" : "Empty"
                                    }.
                                </p>
                                <button
                                    type="button"
                                    onClick={clearAllFilters}
                                    className="simple-filter-reset-btn"
                                    style={{ margin: "0 auto" }}
                                >
                                    ↺ Reset All Filters
                                </button>
                            </div>
                        ) : (
                            <p>
                                {activeTab === "new_orders" 
                                    ? "No new pending orders found. All orders have been moved to All Orders."
                                    : `No ${activeTab === "all_campaigns" ? "orders" : activeTab.replace("_", " ") + " units"} found.`}
                            </p>
                        )}
                    </div>
                ) : (
                    <table className="simple-data-table">
                        <thead>
                            <tr>
                                <th style={{ width: "36px", textAlign: "center" }}>
                                    <input
                                        type="checkbox"
                                        className="simple-select-checkbox master-checkbox"
                                        checked={isAllSelected}
                                        ref={(el) => {
                                            if (el) el.indeterminate = isIndeterminate;
                                        }}
                                        onChange={handleToggleSelectAll}
                                        title={isAllSelected ? "Deselect all units" : "Select all units"}
                                    />
                                </th>
                                <th style={{ width: "42px" }}>#</th>
                                <th style={{ width: "135px" }}>Product</th>
                                <th style={{ width: "185px" }}>Order ID</th>
                                <th style={{ width: "140px" }}>Date & Time</th>
                                <th style={{ width: "80px" }}>Price</th>
                                <th style={{ width: "125px" }}>Reviewer</th>
                                <th style={{ width: "85px", textAlign: "center" }}>Details</th>
                                <th style={{ width: "195px", textAlign: "center" }}>Classification</th>
                                <th style={{ width: "105px", textAlign: "center" }}>Status</th>
                                {activeTab === "new_orders" && (
                                    <th style={{ width: "115px", textAlign: "center" }}>Action</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {flattenedUnitRows.map((row, idx) => {
                                const dt = formatDateTime(row.orderedAt);
                                const isUpdating = updatingUnitId === row.unitId;
                                const isWarehouse = row.unitType === "warehouse";
                                const isEmpty = row.unitType === "empty";
                                const fullyClassified = isOrderFullyClassified(row.orderId);
                                const isSelected = selectedUnitKeys.has(`${row.orderId}:${row.unitId}`);

                                // Very small product name (1 line, 14 chars max)
                                const tinyProductName = row.productName && row.productName.length > 15
                                    ? row.productName.substring(0, 15) + "..."
                                    : row.productName || "Product";

                                return (
                                    <tr 
                                        key={`${row.orderId}_${row.unitId || idx}`}
                                        className={`simple-row ${isWarehouse ? "row-wh-highlight" : isEmpty ? "row-em-highlight" : ""} ${isSelected ? "row-selected" : ""}`}
                                    >
                                        {/* Selection Checkbox */}
                                        <td style={{ textAlign: "center" }}>
                                            {row.unitId ? (
                                                <input
                                                    type="checkbox"
                                                    className="simple-select-checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleUnitSelect(row.orderId, row.unitId)}
                                                    title="Select this unit"
                                                />
                                            ) : (
                                                <span style={{ color: "#cbd5e1" }}>—</span>
                                            )}
                                        </td>

                                        {/* Row Index */}
                                        <td style={{ color: "#64748b", fontWeight: "700" }}>
                                            {idx + 1}
                                        </td>

                                        {/* Product Name (Very Small & Clickable Link to Open Product) */}
                                        <td>
                                            <div className="simple-prod-compact" title={row.productName || "Product"}>
                                                {row.productLink ? (
                                                    <a
                                                        href={row.productLink.startsWith("http") ? row.productLink : `https://${row.productLink}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="simple-prod-tiny-link"
                                                        title={`Open product listing: ${row.productName}`}
                                                    >
                                                        <span className="simple-prod-tiny-text">{tinyProductName}</span>
                                                        <span className="simple-prod-open-icon">↗</span>
                                                    </a>
                                                ) : (
                                                    <a
                                                        href={`https://www.google.com/search?q=${encodeURIComponent(`${row.productName} ${row.orderPlatform || ""}`)}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="simple-prod-tiny-link fallback"
                                                        title={`Search product online: ${row.productName}`}
                                                    >
                                                        <span className="simple-prod-tiny-text">{tinyProductName}</span>
                                                        <span className="simple-prod-open-icon">↗</span>
                                                    </a>
                                                )}
                                                <span className="simple-platform-micro-tag">
                                                    {row.orderPlatform || "Store"}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Order ID (Strictly 1 Line, No Wrapping) + Flagged Badge */}
                                        <td>
                                            <div className="simple-order-id-wrapper">
                                                {row.marketplaceOrderId ? (
                                                    <span 
                                                        className="simple-order-id-singleline" 
                                                        title={`Order ID: ${row.marketplaceOrderId} (Click to copy)`}
                                                        onClick={() => handleCopy(row.marketplaceOrderId, "orderId")}
                                                    >
                                                        #{row.marketplaceOrderId}
                                                    </span>
                                                ) : (
                                                    <span className="simple-pending-tag-single">
                                                        Pending
                                                    </span>
                                                )}
                                                {row.brandIssue?.isReported && !row.brandIssue?.resolved && (
                                                    <span 
                                                        className="simple-issue-pill" 
                                                        title={`🚩 Flagged: ${row.brandIssue.reason}${row.brandIssue.details ? ` - ${row.brandIssue.details}` : ""} (Click to view)`}
                                                        onClick={() => setViewDetailsUnit(row)}
                                                    >
                                                        🚩 {row.brandIssue.reason}
                                                    </span>
                                                )}
                                                {row.brandIssue?.isReported && row.brandIssue?.resolved && (
                                                    <span 
                                                        className="simple-issue-resolved-pill" 
                                                        title="Flagged issue was marked resolved"
                                                        onClick={() => setViewDetailsUnit(row)}
                                                    >
                                                        ✓ Resolved
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Time & Date (when mediator entered details) */}
                                        <td>
                                            <div className="simple-dt-cell">
                                                <span className="simple-dt-time">🕒 {dt.time}</span>
                                                <span className="simple-dt-date">📅 {dt.date}</span>
                                            </div>
                                        </td>

                                        {/* Price */}
                                        <td>
                                            <span className="simple-price-tag">
                                                ₹{row.price}
                                            </span>
                                        </td>

                                        {/* Reviewer Name */}
                                        <td>
                                            <span className="simple-reviewer-name-compact" title={row.reviewerName}>
                                                {row.reviewerName !== "—" ? row.reviewerName : "—"}
                                            </span>
                                        </td>

                                        {/* View Details Button (Replaces bulky address column) */}
                                        <td style={{ textAlign: "center" }}>
                                            <button
                                                type="button"
                                                onClick={() => setViewDetailsUnit(row)}
                                                className="btn-view-details"
                                                title="Click to view full address, product details, and proof screenshot"
                                            >
                                                <span>👁️</span>
                                                <span>View</span>
                                            </button>
                                        </td>

                                        {/* Two Buttons: Warehouse & Empty */}
                                        <td style={{ textAlign: "center" }}>
                                            {row.unitId ? (
                                                <div className="simple-btn-group">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetUnitType(row.orderId, row.unitId, "warehouse")}
                                                        disabled={isUpdating}
                                                        className={`simple-classify-btn btn-wh ${isWarehouse ? "active" : ""}`}
                                                        title="Classify as Warehouse"
                                                    >
                                                        🏢 Warehouse
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetUnitType(row.orderId, row.unitId, "empty")}
                                                        disabled={isUpdating}
                                                        className={`simple-classify-btn btn-em ${isEmpty ? "active" : ""}`}
                                                        title="Classify as Empty"
                                                    >
                                                        📦 Empty
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ color: "#94a3b8", fontSize: "12px" }}>—</span>
                                            )}
                                        </td>

                                        {/* Status Column (Shown across all tabs) */}
                                        <td style={{ textAlign: "center" }}>
                                            <span className={`simple-status-chip status-${row.status}`}>
                                                {formatStatus(row.status)}
                                            </span>
                                        </td>

                                        {/* Action Column (Only on New Orders tab) */}
                                        {activeTab === "new_orders" && (
                                            <td style={{ textAlign: "center" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveOrder(row.orderId)}
                                                    disabled={movingOrderId === row.orderId}
                                                    className="simple-move-btn ready"
                                                    title="Move this order to All Orders"
                                                >
                                                    {movingOrderId === row.orderId ? "Moving..." : "🚀 Move"}
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* QUICK UNIT DETAILS MODAL (Address, Proof Screenshot, Complete Info) */}
            {viewDetailsUnit && (
                <div className="details-modal-overlay" onClick={() => setViewDetailsUnit(null)}>
                    <div className="details-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="details-modal-header">
                            <div>
                                <h3 className="details-modal-title">
                                    Unit #{viewDetailsUnit.unitIndex} Details
                                </h3>
                                <span className="details-modal-subtitle">
                                    {viewDetailsUnit.orderPlatform} • Order ID: {viewDetailsUnit.marketplaceOrderId || "Pending"} • <span className={`simple-status-chip status-${viewDetailsUnit.status}`} style={{ fontSize: "11px", padding: "2px 6px" }}>{formatStatus(viewDetailsUnit.status)}</span>
                                </span>
                            </div>
                            <button
                                type="button"
                                className="details-modal-close"
                                onClick={() => setViewDetailsUnit(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="details-modal-body">
                            {/* Product Title */}
                            <div className="detail-item-group">
                                <span className="detail-label">Full Product Name</span>
                                <div className="detail-val-product">
                                    <span>{viewDetailsUnit.productName}</span>
                                    {viewDetailsUnit.productLink && (
                                        <a
                                            href={viewDetailsUnit.productLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="detail-store-link"
                                        >
                                            Open Storefront Listing ↗
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Two Column Grid */}
                            <div className="detail-two-col">
                                <div className="detail-item-group">
                                    <span className="detail-label">Order ID</span>
                                    <div className="detail-copyable-row">
                                        <span className="detail-val-mono">
                                            {viewDetailsUnit.marketplaceOrderId || "Not Placed Yet"}
                                        </span>
                                        {viewDetailsUnit.marketplaceOrderId && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(viewDetailsUnit.marketplaceOrderId, "orderId")}
                                                className="btn-copy-chip"
                                            >
                                                {copiedOrderId ? "✓ Copied" : "📋 Copy"}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="detail-item-group">
                                    <span className="detail-label">Placement Time & Date</span>
                                    <span className="detail-val">
                                        {formatDateTime(viewDetailsUnit.orderedAt).time} • {formatDateTime(viewDetailsUnit.orderedAt).date}
                                    </span>
                                </div>

                                <div className="detail-item-group">
                                    <span className="detail-label">Unit Price</span>
                                    <span className="detail-val-price">
                                        ₹{viewDetailsUnit.price}
                                    </span>
                                </div>

                                <div className="detail-item-group">
                                    <span className="detail-label">Reviewer Name</span>
                                    <span className="detail-val">
                                        {viewDetailsUnit.reviewerName || "—"}
                                    </span>
                                </div>
                            </div>

                            {/* Full Delivery Address */}
                            <div className="detail-item-group">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                    <span className="detail-label">Complete Delivery Address</span>
                                    {viewDetailsUnit.address && viewDetailsUnit.address !== "—" && (
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(viewDetailsUnit.address, "address")}
                                            className="btn-copy-chip"
                                        >
                                            {copiedAddress ? "✓ Copied Address" : "📋 Copy Address"}
                                        </button>
                                    )}
                                </div>
                                <div className="detail-address-box">
                                    {viewDetailsUnit.address && viewDetailsUnit.address !== "—" 
                                        ? viewDetailsUnit.address 
                                        : "Address not provided yet by mediator."}
                                </div>
                            </div>

                            {/* Classification Buttons in Modal */}
                            {viewDetailsUnit.unitId && (
                                <div className="detail-item-group">
                                    <span className="detail-label">Unit Classification</span>
                                    <div className="detail-classify-row">
                                        <button
                                            type="button"
                                            onClick={() => handleSetUnitType(viewDetailsUnit.orderId, viewDetailsUnit.unitId, "warehouse")}
                                            className={`simple-classify-btn btn-wh ${viewDetailsUnit.unitType === "warehouse" ? "active" : ""}`}
                                            style={{ padding: "8px 16px", fontSize: "13px" }}
                                        >
                                            🏢 Warehouse
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSetUnitType(viewDetailsUnit.orderId, viewDetailsUnit.unitId, "empty")}
                                            className={`simple-classify-btn btn-em ${viewDetailsUnit.unitType === "empty" ? "active" : ""}`}
                                            style={{ padding: "8px 16px", fontSize: "13px" }}
                                        >
                                            📦 Empty
                                        </button>
                                        {viewDetailsUnit.unitType ? (
                                            <span style={{ fontSize: "12px", color: "#059669", fontWeight: "700" }}>
                                                ✓ Marked as {viewDetailsUnit.unitType.toUpperCase()}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: "12px", color: "#d97706", fontWeight: "600" }}>
                                                ⚠️ Awaiting Classification
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ISSUE & FLAG MANAGEMENT (Feature 5) */}
                            {viewDetailsUnit.unitId && (
                                <div className="detail-item-group detail-issue-section">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                        <span className="detail-label">🚩 Order Issue / Dispute Status</span>
                                        {!viewDetailsUnit.brandIssue?.isReported && !isReportingIssue && (
                                            <button
                                                type="button"
                                                onClick={() => setIsReportingIssue(true)}
                                                className="btn-report-issue-trigger"
                                                title="Report an issue with this unit order"
                                            >
                                                🚩 Flag / Report Issue
                                            </button>
                                        )}
                                    </div>

                                    {viewDetailsUnit.brandIssue?.isReported ? (
                                        <div className={`detail-issue-card ${viewDetailsUnit.brandIssue.resolved ? "resolved" : "active"}`}>
                                            <div className="issue-card-header">
                                                <span className="issue-reason-tag">
                                                    {viewDetailsUnit.brandIssue.resolved ? "✓ Resolved Issue:" : "🚩 Reported Issue:"} {viewDetailsUnit.brandIssue.reason}
                                                </span>
                                                {viewDetailsUnit.brandIssue.reportedAt && (
                                                    <span className="issue-time-tag">
                                                        {formatDateTime(viewDetailsUnit.brandIssue.reportedAt).date}
                                                    </span>
                                                )}
                                            </div>
                                            {viewDetailsUnit.brandIssue.details && (
                                                <p className="issue-details-text">
                                                    "{viewDetailsUnit.brandIssue.details}"
                                                </p>
                                            )}
                                            <div className="issue-actions-row">
                                                {!viewDetailsUnit.brandIssue.resolved ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleResolveIssue(viewDetailsUnit.orderId, viewDetailsUnit.unitId)}
                                                        disabled={isSubmittingIssue}
                                                        className="btn-resolve-issue"
                                                    >
                                                        {isSubmittingIssue ? "Updating..." : "✓ Mark as Resolved"}
                                                    </button>
                                                ) : (
                                                    <span className="issue-resolved-note">
                                                        ✓ Marked resolved {viewDetailsUnit.brandIssue.resolvedAt ? `on ${formatDateTime(viewDetailsUnit.brandIssue.resolvedAt).date}` : ""}
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleClearIssue(viewDetailsUnit.orderId, viewDetailsUnit.unitId)}
                                                    disabled={isSubmittingIssue}
                                                    className="btn-clear-issue"
                                                    title="Remove this issue flag completely"
                                                >
                                                    {isSubmittingIssue ? "Removing..." : "✕ Remove Flag"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : isReportingIssue ? (
                                        <div className="detail-report-issue-form">
                                            <div className="form-field-group">
                                                <label className="form-field-label">Select Issue Reason:</label>
                                                <select
                                                    value={issueReason}
                                                    onChange={(e) => setIssueReason(e.target.value)}
                                                    className="simple-filter-select issue-reason-select"
                                                >
                                                    <option value="Buyer Cancelled Order">Buyer Cancelled Order</option>
                                                    <option value="Invalid Order ID">Invalid / Fake Order ID</option>
                                                    <option value="Wrong Variant / Item">Wrong Variant or Item Ordered</option>
                                                    <option value="Address Incomplete / Delivery Failed">Address Incomplete / Delivery Failed</option>
                                                    <option value="Duplicate Order ID">Duplicate Order ID</option>
                                                    <option value="Other Issue">Other Issue</option>
                                                </select>
                                            </div>
                                            <div className="form-field-group" style={{ marginTop: "8px" }}>
                                                <label className="form-field-label">Additional Details / Notes (Optional):</label>
                                                <textarea
                                                    rows={2}
                                                    placeholder="Enter any notes or explanation for mediator/team..."
                                                    value={issueDetails}
                                                    onChange={(e) => setIssueDetails(e.target.value)}
                                                    className="issue-textarea"
                                                />
                                            </div>
                                            <div className="issue-form-actions">
                                                <button
                                                    type="button"
                                                    onClick={() => handleReportIssue(viewDetailsUnit.orderId, viewDetailsUnit.unitId)}
                                                    disabled={isSubmittingIssue}
                                                    className="btn-submit-issue"
                                                >
                                                    {isSubmittingIssue ? "Flagging..." : "🚩 Submit Issue Flag"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsReportingIssue(false);
                                                        setIssueDetails("");
                                                    }}
                                                    className="btn-cancel-issue"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="issue-clean-note">
                                            ✓ No issues reported for this unit.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Order Placement Screenshot Proof (if uploaded) */}
                            {viewDetailsUnit.orderedScreenshot && (
                                <div className="detail-item-group">
                                    <span className="detail-label">Order Confirmation Screenshot</span>
                                    <div className="detail-screenshot-box">
                                        <a href={viewDetailsUnit.orderedScreenshot} target="_blank" rel="noreferrer">
                                            <img
                                                src={viewDetailsUnit.orderedScreenshot}
                                                alt="Order Confirmation Proof"
                                                className="detail-proof-img"
                                            />
                                        </a>
                                        <div style={{ marginTop: "4px" }}>
                                            <a
                                                href={viewDetailsUnit.orderedScreenshot}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="simple-store-link"
                                            >
                                                Open Full Size Image ↗
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="details-modal-footer">
                            <button
                                type="button"
                                className="btn-close-details"
                                onClick={() => setViewDetailsUnit(null)}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}