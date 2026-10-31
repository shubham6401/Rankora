import * as XLSX from "xlsx";

/**
 * Generates and downloads an exhaustive, professional Excel spreadsheet
 * containing every single data field available for a brand.
 */
export const exportCompleteBrandExcel = (brandName, orders = []) => {
    if (!orders || orders.length === 0) {
        alert(`No order data available to export for ${brandName || "this brand"}.`);
        return;
    }

    const cleanBrandName = (brandName || "Brand").replace(/[^a-zA-Z0-9_-]/g, "_");
    const today = new Date().toISOString().split("T")[0];

    // 1. Build Granular Units Sheet (Every single unit detail)
    const unitRows = [];
    let grandCompleted = 0;
    let grandInProgress = 0;
    let grandPendingRefund = 0;
    let grandPendingVerification = 0;
    let grandPendingPayment = 0;
    let grandUnassigned = 0;
    let grandVolume = 0;

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

            if (u.status === "completed") grandCompleted++;
            else if (u.status === "in_progress") grandInProgress++;
            else if (u.status === "pending_refund") grandPendingRefund++;
            else if (u.status === "pending_verification") grandPendingVerification++;
            else if (u.status === "pending_payment") grandPendingPayment++;
            else grandUnassigned++;

            grandVolume += totalAmount;

            unitRows.push({
                "Batch Order ID": order._id?.toString() || "—",
                "Marketplace Order ID": u.orderId || "Not Placed Yet",
                "Unit ID": u._id?.toString() || "—",
                "Unit #": `Unit ${uIdx + 1} of ${units.length}`,
                "Product Name": order.productName || "—",
                "Brand": order.brand || brandName || "—",
                "Platform": order.orderPlatform || "—",
                "Product Link": order.productLink || "—",
                "Base Fixed Price (₹)": basePrice,
                "Actual Purchase Price (₹)": purchasePrice,
                "Price Hike (₹)": hikeAmount,
                "Price Hike Status": isHiked ? `▲ Hiked (+₹${hikeAmount}, ${hikePercent}%)` : "Normal",
                "Delivery Fee (₹)": deliveryFee,
                "Total Amount Paid (₹)": totalAmount,
                "Assigned Mediator": u.mediatorId?.name || "Unassigned",
                "Mediator Code": u.mediatorId?.mediatorCode || "—",
                "Mediator Team Code": u.mediatorId?.teamCode || order.teamCode || "—",
                "Reviewer Account": u.reviewerName || "—",
                "Delivery Address": u.deliveryAddress || u.address || "—",
                "Address Type": u.addressType || "—",
                "Unit Type":
                    u.unitType === "warehouse"
                        ? "Warehouse"
                        : u.unitType === "empty"
                        ? "Empty Package"
                        : "Unclassified",
                "Current Status": (u.status || "unassigned").replace("_", " ").toUpperCase(),
                "Campaign Created Date": order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("en-IN")
                    : "—",
                "Order Placed Date": u.orderedAt
                    ? new Date(u.orderedAt).toLocaleString("en-IN")
                    : "—",
                "Expected Arrival Date": u.expectedArrivalDate
                    ? new Date(u.expectedArrivalDate).toLocaleDateString("en-IN")
                    : "—",
                "Order Received Date": u.orderReceivedOn
                    ? new Date(u.orderReceivedOn).toLocaleDateString("en-IN")
                    : "—",
                "Order Proof Screenshot Link": u.orderedScreenshot || "None",
                "Product Review Proof Link":
                    u.postDeliveryDetails?.productReviewScreenshot || "None",
                "Seller Feedback Proof Link":
                    u.postDeliveryDetails?.sellerFeedbackScreenShot || "None",
                "Invoice Proof Link":
                    u.postDeliveryDetails?.invoiceScreenshot || "None",
                "Advance Payment Sent Date": u.paymentSentAt
                    ? new Date(u.paymentSentAt).toLocaleString("en-IN")
                    : "—",
                "Advance Payment Proof Link": u.paymentScreenshot || "None",
                "Advance Payment Note": u.paymentMessage || "—",
                "Settlement Status": (u.settlementStatus || "unsettled").toUpperCase(),
                "Settlement Payout (₹)": Number(u.settlementAmount) || 0,
                "Settlement Batch ID": u.settlementBatchId || "—",
                "Settlement Proof Link": u.settlementScreenshot || "None",
                "Settlement Reference Note": u.settlementMessage || "—",
                "Settlement Paid At": u.settledAt
                    ? new Date(u.settledAt).toLocaleString("en-IN")
                    : "—",
                "Settlement Confirmed By Mediator At": u.settlementConfirmedAt
                    ? new Date(u.settlementConfirmedAt).toLocaleString("en-IN")
                    : "—",
                "Brand Flagged Issue": u.brandIssue?.reason || "No Issues",
            });
        });
    });

    const wb = XLSX.utils.book_new();

    // Sheet 1: All Units
    const wsUnits = XLSX.utils.json_to_sheet(unitRows);
    // Set column widths
    const colWidths = [
        { wch: 26 }, // Batch Order ID
        { wch: 22 }, // Marketplace Order ID
        { wch: 26 }, // Unit ID
        { wch: 14 }, // Unit #
        { wch: 30 }, // Product Name
        { wch: 18 }, // Brand
        { wch: 14 }, // Platform
        { wch: 32 }, // Product Link
        { wch: 18 }, // Base Price
        { wch: 22 }, // Actual Purchase Price
        { wch: 16 }, // Hike
        { wch: 22 }, // Hike Status
        { wch: 14 }, // Delivery Fee
        { wch: 20 }, // Total Amount
        { wch: 22 }, // Assigned Mediator
        { wch: 16 }, // Mediator Code
        { wch: 16 }, // Team Code
        { wch: 20 }, // Reviewer
        { wch: 32 }, // Address
        { wch: 16 }, // Address Type
        { wch: 16 }, // Unit Type
        { wch: 20 }, // Status
        { wch: 18 }, // Created Date
        { wch: 22 }, // Placed Date
        { wch: 18 }, // Expected Arrival
        { wch: 18 }, // Order Received
        { wch: 35 }, // Order Proof
        { wch: 35 }, // Review Proof
        { wch: 35 }, // Seller Feedback
        { wch: 35 }, // Invoice Proof
        { wch: 22 }, // Advance Date
        { wch: 35 }, // Advance Proof
        { wch: 24 }, // Advance Note
        { wch: 18 }, // Settlement Status
        { wch: 18 }, // Settlement Payout
        { wch: 20 }, // Settlement Batch
        { wch: 35 }, // Settlement Proof
        { wch: 24 }, // Settlement Note
        { wch: 22 }, // Settlement Paid At
        { wch: 26 }, // Confirmed At
        { wch: 25 }, // Flagged Issue
    ];
    wsUnits["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(wb, wsUnits, "All Order Units");

    // Sheet 2: Brand Performance Summary
    const totalUnits = unitRows.length;
    const completionRate = totalUnits > 0 ? Math.round((grandCompleted / totalUnits) * 100) : 0;
    const summaryRows = [
        { "Metric": "Brand Name", "Value": brandName },
        { "Metric": "Export Date", "Value": new Date().toLocaleString("en-IN") },
        { "Metric": "Total Orders (Campaigns)", "Value": orders.length },
        { "Metric": "Total Units Scheduled", "Value": totalUnits },
        { "Metric": "Completed & Verified Units", "Value": grandCompleted },
        { "Metric": "Completion Rate", "Value": `${completionRate}%` },
        { "Metric": "In Progress Units", "Value": grandInProgress },
        { "Metric": "Pending Refund Units", "Value": grandPendingRefund },
        { "Metric": "Pending Verification Units", "Value": grandPendingVerification },
        { "Metric": "Pending Payment Units", "Value": grandPendingPayment },
        { "Metric": "Unassigned Units", "Value": grandUnassigned },
        { "Metric": "Total Fulfillment Volume (₹)", "Value": `₹${grandVolume.toLocaleString()}` },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary["!cols"] = [{ wch: 30 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Brand Overview Summary");

    // Write file
    XLSX.writeFile(wb, `${cleanBrandName}_Complete_Master_Fulfillment_${today}.xlsx`);
};

/**
 * Generates and downloads an Excel spreadsheet for the currently filtered set of units
 * including all 41 fields, proof screenshot links, and active filter parameters.
 */
export const exportFilteredUnitsExcel = (brandName, unitsWithOrder = [], filterSummary = {}) => {
    if (!unitsWithOrder || unitsWithOrder.length === 0) {
        alert("No matching units available to export.");
        return;
    }

    const cleanBrandName = (brandName || "Brand").replace(/[^a-zA-Z0-9_-]/g, "_");
    const today = new Date().toISOString().split("T")[0];

    const unitRows = unitsWithOrder.map((item, idx) => {
        const u = item.unit || item;
        const order = item.order || item.campaignOrder || {};
        const basePrice = Number(order.price !== undefined ? order.price : item.basePrice) || 0;
        const purchasePrice =
            u.purchasePrice !== undefined && u.purchasePrice !== null
                ? Number(u.purchasePrice)
                : basePrice;
        const isHiked = purchasePrice > basePrice;
        const hikeAmount = isHiked ? purchasePrice - basePrice : 0;
        const hikePercent = isHiked && basePrice > 0 ? Math.round((hikeAmount / basePrice) * 100) : 0;
        const deliveryFee = Number(u.deliveryFee) || 0;
        const totalAmount = Number(u.totalPurchasedAmount) || (purchasePrice + deliveryFee);

        return {
            "SL #": idx + 1,
            "Marketplace Order ID": u.orderId || "Not Placed Yet",
            "Batch Order ID": (order._id || item.orderBatchId || "").toString() || "—",
            "Unit ID": (u._id || "").toString() || "—",
            "Product Name": order.productName || item.productName || "—",
            "Brand": order.brand || brandName || "—",
            "Platform": order.orderPlatform || item.orderPlatform || "—",
            "Product Link": order.productLink || item.productLink || "—",
            "Base Fixed Price (₹)": basePrice,
            "Actual Purchase Price (₹)": purchasePrice,
            "Price Hike (₹)": hikeAmount,
            "Price Hike Status": isHiked ? `▲ Hiked (+₹${hikeAmount}, ${hikePercent}%)` : "Normal",
            "Delivery Fee (₹)": deliveryFee,
            "Total Amount Paid (₹)": totalAmount,
            "Assigned Mediator": u.mediatorId?.name || "Unassigned",
            "Mediator Code": u.mediatorId?.mediatorCode || "—",
            "Team Code": u.mediatorId?.teamCode || order.teamCode || item.teamCode || "—",
            "Reviewer Account": u.reviewerName || "—",
            "Delivery Address": u.deliveryAddress || u.address || "—",
            "Address Type": u.addressType || "—",
            "Unit Type":
                u.unitType === "warehouse"
                    ? "Warehouse"
                    : u.unitType === "empty"
                    ? "Empty Package"
                    : "Standard / Unclassified",
            "Current Status": (u.status || "unassigned").replace("_", " ").toUpperCase(),
            "Order Placed Date": u.orderedAt
                ? new Date(u.orderedAt).toLocaleString("en-IN")
                : "—",
            "Expected Arrival Date": u.expectedArrivalDate
                ? new Date(u.expectedArrivalDate).toLocaleDateString("en-IN")
                : "—",
            "Order Received Date": u.orderReceivedOn
                ? new Date(u.orderReceivedOn).toLocaleDateString("en-IN")
                : "—",
            "Order Proof Screenshot Link": u.orderedScreenshot || "None",
            "Product Review Proof Link":
                u.postDeliveryDetails?.productReviewScreenshot || "None",
            "Seller Feedback Proof Link":
                u.postDeliveryDetails?.sellerFeedbackScreenShot || "None",
            "Invoice Proof Link":
                u.postDeliveryDetails?.invoiceScreenshot || "None",
            "Advance Payment Sent Date": u.paymentSentAt
                ? new Date(u.paymentSentAt).toLocaleString("en-IN")
                : "—",
            "Advance Payment Proof Link": u.paymentScreenshot || "None",
            "Advance Payment Note": u.paymentMessage || "—",
            "Settlement Status": (u.settlementStatus || "unsettled").toUpperCase(),
            "Settlement Payout (₹)": Number(u.settlementAmount) || 0,
            "Settlement Proof Link": u.settlementScreenshot || "None",
            "Settlement Reference Note": u.settlementMessage || "—",
            "Settlement Paid At": u.settledAt
                ? new Date(u.settledAt).toLocaleString("en-IN")
                : "—",
            "Brand Flagged Issue": u.brandIssue?.reason || "No Issues",
        };
    });

    const wb = XLSX.utils.book_new();

    const wsUnits = XLSX.utils.json_to_sheet(unitRows);
    wsUnits["!cols"] = [
        { wch: 6 },  // SL #
        { wch: 22 }, // Marketplace Order ID
        { wch: 26 }, // Batch Order ID
        { wch: 26 }, // Unit ID
        { wch: 30 }, // Product Name
        { wch: 18 }, // Brand
        { wch: 14 }, // Platform
        { wch: 32 }, // Product Link
        { wch: 18 }, // Base Price
        { wch: 22 }, // Actual Purchase Price
        { wch: 16 }, // Hike
        { wch: 22 }, // Hike Status
        { wch: 14 }, // Delivery Fee
        { wch: 20 }, // Total Amount
        { wch: 22 }, // Mediator
        { wch: 16 }, // Mediator Code
        { wch: 16 }, // Team Code
        { wch: 20 }, // Reviewer
        { wch: 32 }, // Address
        { wch: 16 }, // Address Type
        { wch: 16 }, // Unit Type
        { wch: 20 }, // Status
        { wch: 22 }, // Placed Date
        { wch: 18 }, // Expected Arrival
        { wch: 18 }, // Order Received
        { wch: 35 }, // Order Proof
        { wch: 35 }, // Review Proof
        { wch: 35 }, // Seller Feedback
        { wch: 35 }, // Invoice Proof
        { wch: 22 }, // Advance Date
        { wch: 35 }, // Advance Proof
        { wch: 24 }, // Advance Note
        { wch: 18 }, // Settlement Status
        { wch: 18 }, // Settlement Payout
        { wch: 35 }, // Settlement Proof
        { wch: 24 }, // Settlement Note
        { wch: 22 }, // Settlement Paid At
        { wch: 25 }, // Flagged Issue
    ];
    XLSX.utils.book_append_sheet(wb, wsUnits, "Filtered Units Ledger");

    // Filter Parameters Sheet
    const filterRows = [
        { "Filter Setting": "Brand Name", "Applied Value": brandName },
        { "Filter Setting": "Export Date", "Applied Value": new Date().toLocaleString("en-IN") },
        { "Filter Setting": "Total Units Exported", "Applied Value": unitRows.length },
        ...Object.entries(filterSummary).map(([k, v]) => ({
            "Filter Setting": k,
            "Applied Value": v || "All",
        })),
    ];
    const wsFilter = XLSX.utils.json_to_sheet(filterRows);
    wsFilter["!cols"] = [{ wch: 26 }, { wch: 34 }];
    XLSX.utils.book_append_sheet(wb, wsFilter, "Active Filters");

    XLSX.writeFile(wb, `${cleanBrandName}_Filtered_Units_Ledger_${today}.xlsx`);
};

/**
 * Export a single campaign batch order with all units and proofs
 */
export const exportSingleCampaignExcel = (order, brandName) => {
    if (!order) return;
    const cleanBrandName = (brandName || order.brand || "Brand").replace(/[^a-zA-Z0-9_-]/g, "_");
    const productName = (order.productName || "Product").slice(0, 20).replace(/[^a-zA-Z0-9_-]/g, "_");
    const today = new Date().toISOString().split("T")[0];
    exportCompleteBrandExcel(brandName || order.brand, [order]);
};

