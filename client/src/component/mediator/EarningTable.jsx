import { useState, useEffect } from "react";
import { fetchMediatorSummary } from "../../services/mediator/orders";
import { fetchMyBalanceTransactions } from "../../services/balance";
import "../../styles/earningTable.css";

export default function EarningTable({
    mediatorData = null,
    readOnly = false,
    title = "Mediator Financial Breakdown & Earnings",
}) {
    const [loading, setLoading] = useState(!mediatorData);
    const [isEditing, setIsEditing] = useState(false);

    // Live counts & values from DB
    const [liveStats, setLiveStats] = useState(() => {
        if (mediatorData) {
            return {
                completedUnits: mediatorData.completedUnits || 0,
                inProgressUnits: mediatorData.inProgressUnits || 0,
                pendingRefundUnits: mediatorData.pendingRefundUnits || 0,
                pendingPaymentUnits: mediatorData.pendingPaymentUnits || 0,
                totalAssignedUnits: mediatorData.totalAssignedUnits || 0,
                totalOrderValue: mediatorData.totalOrderValue || 0,
                completedValue: mediatorData.completedValue || 0,
                inProgressValue: mediatorData.inProgressValue || 0,
                pendingRefundValue: mediatorData.pendingRefundValue || 0,
                rejectedValue: mediatorData.rejectedValue || 0,
                balanceReceived: mediatorData.balanceReceived || 0,
                balanceReturned: mediatorData.balanceReturned || 0,
                netBalance: mediatorData.netBalance || 0,
                settledPayout: mediatorData.settledPayout || 0,
            };
        }
        return {
            completedUnits: 0,
            inProgressUnits: 0,
            pendingRefundUnits: 0,
            pendingPaymentUnits: 0,
            totalAssignedUnits: 0,
            totalOrderValue: 0,
            completedValue: 0,
            inProgressValue: 0,
            pendingRefundValue: 0,
            rejectedValue: 0,
            balanceReceived: 0,
            balanceReturned: 0,
            netBalance: 0,
            settledPayout: 0,
        };
    });

    // Financial Table State
    const [tableData, setTableData] = useState(() => {
        if (mediatorData) {
            const inProgVal = mediatorData.inProgressValue || 0;
            const pendRefVal = mediatorData.pendingRefundValue || 0;
            const completedVal = mediatorData.completedValue || 0;
            const rejVal = mediatorData.rejectedValue || 0;
            const balRec = mediatorData.balanceReceived || 0;
            const balRet = mediatorData.balanceReturned || 0;

            const executedOrderForm = inProgVal + pendRefVal + completedVal;
            const autoReceived = executedOrderForm + rejVal + balRec;
            const autoReturned = rejVal + balRet;

            return {
                totalAmountReceived: autoReceived,
                cancelledReturnOrders: rejVal,
                totalAmountReturned: autoReturned,
                orderForm: executedOrderForm,
                refundForm: completedVal,
                refundFormExtra: 0,
                perOrderAmount: 20,
                settledEarningAmount: mediatorData.settledPayout || 0,
                finalAmountToReturn: null,
                useManualOverrides: false,
            };
        }

        const saved = localStorage.getItem("mediator_earning_table_v3");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.useManualOverrides) {
                    return parsed;
                }
            } catch {
                // fallback
            }
        }
        return {
            totalAmountReceived: null,
            cancelledReturnOrders: null,
            totalAmountReturned: null,
            orderForm: null,
            refundForm: null,
            refundFormExtra: 0,
            perOrderAmount: 20,
            settledEarningAmount: null,
            finalAmountToReturn: null,
            useManualOverrides: false,
        };
    });

    useEffect(() => {
        if (mediatorData) {
            setLiveStats(mediatorData);
            setLoading(false);
            const inProgVal = mediatorData.inProgressValue || 0;
            const pendRefVal = mediatorData.pendingRefundValue || 0;
            const completedVal = mediatorData.completedValue || 0;
            const rejVal = mediatorData.rejectedValue || 0;
            const balRec = mediatorData.balanceReceived || 0;
            const balRet = mediatorData.balanceReturned || 0;

            const executedOrderForm = inProgVal + pendRefVal + completedVal;
            const autoReceived = executedOrderForm + rejVal + balRec;
            const autoReturned = rejVal + balRet;

            setTableData({
                totalAmountReceived: autoReceived,
                cancelledReturnOrders: rejVal,
                totalAmountReturned: autoReturned,
                orderForm: executedOrderForm,
                refundForm: completedVal,
                refundFormExtra: 0,
                perOrderAmount: 20,
                settledEarningAmount: mediatorData.settledPayout || 0,
                finalAmountToReturn: null,
                useManualOverrides: false,
            });
        } else {
            fetchLiveFinancialData();
        }
    }, [mediatorData]);

    const fetchLiveFinancialData = async () => {
        try {
            setLoading(true);
            const [summaryRes, balanceRes] = await Promise.all([
                fetchMediatorSummary().catch(() => ({ data: { success: false } })),
                fetchMyBalanceTransactions().catch(() => ({ data: { success: false } })),
            ]);

            const summary = summaryRes.data?.summary || {};
            const orders = summaryRes.data?.orders || [];
            const balanceSummary = balanceRes.data?.summary || {};

            let completedUnits = summary.completedUnits || 0;
            let inProgressUnits = summary.inProgressUnits || 0;
            let pendingRefundUnits = summary.pendingRefundUnits || 0;
            let pendingPaymentUnits = summary.pendingPaymentUnits || 0;
            let totalAssignedUnits = summary.totalUnits || 0;

            let completedVal = summary.completedValue || 0;
            let totalVal = summary.totalValue || 0;
            let inProgVal = 0;
            let pendRefVal = 0;
            let rejVal = 0;

            orders.forEach((ord) => {
                const price = parseFloat(ord.price) || 0;
                const units = ord.orderUnits || [];
                units.forEach((u) => {
                    const isCancelledOrReturned =
                        u.status === "pending_payment" ||
                        u.status === "unassigned" ||
                        Boolean(u.refundedByMediatorId) ||
                        Boolean(u.returnReason) ||
                        Boolean(u.rejectedAt);

                    if (isCancelledOrReturned && u.status !== "completed") {
                        rejVal += price;
                    } else if (u.status === "in_progress") {
                        inProgVal += price;
                    } else if (u.status === "pending_refund") {
                        pendRefVal += price;
                    }
                });
            });

            // Ensure cancelledValue from summary is fully respected
            if (summary.cancelledValue !== undefined && summary.cancelledValue > 0) {
                rejVal = Math.max(rejVal, summary.cancelledValue);
            }

            const balanceReceived = balanceSummary.totalReceivedVerified || 0;
            const balanceReturned = balanceSummary.totalSentVerified || 0;
            const netBalance = balanceSummary.netBalance || 0;
            const settledPayout = summary.settledPayout || 0;

            const executedOrderForm = inProgVal + pendRefVal + completedVal;
            const autoReceived = executedOrderForm + rejVal + balanceReceived;
            const autoReturned = rejVal + balanceReturned;

            const stats = {
                completedUnits,
                inProgressUnits,
                pendingRefundUnits,
                pendingPaymentUnits,
                totalAssignedUnits,
                totalOrderValue: totalVal,
                completedValue: completedVal,
                inProgressValue: inProgVal,
                pendingRefundValue: pendRefVal,
                rejectedValue: rejVal,
                balanceReceived,
                balanceReturned,
                netBalance,
                settledPayout,
            };

            setLiveStats(stats);

            setTableData((prev) => {
                if (prev.useManualOverrides) {
                    return prev;
                }
                return {
                    ...prev,
                    totalAmountReceived: autoReceived,
                    cancelledReturnOrders: rejVal,
                    totalAmountReturned: autoReturned,
                    orderForm: executedOrderForm,
                    refundForm: completedVal,
                    settledEarningAmount: settledPayout,
                };
            });
        } catch (err) {
            console.error("Error loading live mediator financial stats:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        const updated = {
            ...tableData,
            [field]: Number(value) || 0,
            useManualOverrides: true,
        };
        setTableData(updated);
        localStorage.setItem("mediator_earning_table_v3", JSON.stringify(updated));
    };

    const resetToLiveData = () => {
        const executedOrderForm = liveStats.inProgressValue + liveStats.pendingRefundValue + liveStats.completedValue;
        const autoReceived = executedOrderForm + liveStats.rejectedValue + liveStats.balanceReceived;
        const autoReturned = liveStats.rejectedValue + liveStats.balanceReturned;

        const updated = {
            totalAmountReceived: autoReceived,
            cancelledReturnOrders: liveStats.rejectedValue,
            totalAmountReturned: autoReturned,
            orderForm: executedOrderForm,
            refundForm: liveStats.completedValue,
            refundFormExtra: 0,
            perOrderAmount: tableData.perOrderAmount || 20,
            settledEarningAmount: liveStats.settledPayout || 0,
            finalAmountToReturn: null,
            useManualOverrides: false,
        };

        setTableData(updated);
        localStorage.setItem("mediator_earning_table_v3", JSON.stringify(updated));
        setIsEditing(false);
    };

    // Row 1: Total Amount Received (Amount given by executive)
    const cancelledReturnOrders =
        tableData.useManualOverrides && tableData.cancelledReturnOrders !== null
            ? Number(tableData.cancelledReturnOrders)
            : liveStats.rejectedValue;

    const totalAmountReturned =
        tableData.useManualOverrides && tableData.totalAmountReturned !== null
            ? Number(tableData.totalAmountReturned)
            : Number((liveStats.rejectedValue + liveStats.balanceReturned).toFixed(2));

    const orderForm =
        tableData.useManualOverrides && tableData.orderForm !== null
            ? Number(tableData.orderForm)
            : Number((liveStats.inProgressValue + liveStats.pendingRefundValue + liveStats.completedValue).toFixed(2));

    const totalAmountReceived =
        tableData.useManualOverrides && tableData.totalAmountReceived !== null
            ? Number(tableData.totalAmountReceived)
            : Number((orderForm + liveStats.rejectedValue + liveStats.balanceReceived).toFixed(2));

    // Row 4: Left 1 (Amount left with mediator: Received - Total Returned)
    const left1 = Number((totalAmountReceived - totalAmountReturned).toFixed(2));

    // Row 6: Amount Not Used (Unspent advance: Left 1 - Ordered Form)
    const amountNotUsed = Number((left1 - orderForm).toFixed(2));

    // Row 7: Refund Form (Total amount whose refund form is filled)
    const refundForm =
        tableData.useManualOverrides && tableData.refundForm !== null
            ? Number(tableData.refundForm)
            : liveStats.completedValue;

    // Row 8: Amount Not Recovered (Awaiting brand refund: Ordered Form - Refund Form)
    const amountNotRecovered = Number((orderForm - refundForm).toFixed(2));

    // Row 9: Refund Form Extra Adjustments
    const refundFormExtra = Number(tableData.refundFormExtra) || 0;

    // Row 10: Per Order Commission Amount
    const perOrderAmount = Number(tableData.perOrderAmount) || 20;

    // Row 11: Commission Earning
    const completedUnitsCount = liveStats.completedUnits;
    const dynamicEarning = completedUnitsCount * perOrderAmount;

    // Row 12: Settled Earning Amount (Commission payouts settled by executive)
    const settledEarningAmount =
        tableData.useManualOverrides && tableData.settledEarningAmount !== null
            ? Number(tableData.settledEarningAmount)
            : Number((liveStats.settledPayout || 0).toFixed(2));

    // Row 13: Remaining Earning Amount (Awaiting executive payout: Commission - Settled)
    const remainingEarningAmount = Number(Math.max(0, dynamicEarning - settledEarningAmount).toFixed(2));

    // Row 14: Final Amount to Return to Executive (Money whose refund form is not filled: Ordered Form - Refund Form + Unspent Advance)
    const calculatedFinalReturn = Number(
        (amountNotRecovered + (amountNotUsed > 0 ? amountNotUsed : 0) + refundFormExtra).toFixed(2)
    );
    const finalAmountToReturn =
        tableData.useManualOverrides && tableData.finalAmountToReturn !== null
            ? Number(tableData.finalAmountToReturn)
            : calculatedFinalReturn;

    // Row 15: Exact Net Earning (Commission Earning + Extra Adjustments)
    const exactEarning = Number((dynamicEarning + refundFormExtra).toFixed(2));

    const formatCurrency = (val) => {
        if (val === null || val === undefined || isNaN(val)) return "₹0.00";
        return "₹" + Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="earning-wrapper">
            {/* LIVE DATA SYNC HEADER & CONTROLS */}
            <div className="earning-sync-bar">
                <div className="sync-status-group">
                    <span
                        className={`sync-dot ${tableData.useManualOverrides ? "sync-dot-manual" : "sync-dot-live"}`}
                    />
                    <span className="sync-status-text">
                        {tableData.useManualOverrides ? "Manual Custom Values Active" : "Live Database Sync Active"}
                    </span>
                    <span className="sync-subtext">
                        ({completedUnitsCount} Completed Units in System)
                    </span>
                </div>

                {!readOnly && (
                    <div className="earning-controls">
                        <button
                            type="button"
                            onClick={() => setIsEditing(!isEditing)}
                            className={`earning-btn ${isEditing ? "earning-btn-active" : ""}`}
                        >
                            {isEditing ? "Done Editing ✓" : "✎ Edit Custom Values"}
                        </button>

                        <button
                            type="button"
                            onClick={resetToLiveData}
                            title="Recalculate and reset table strictly from database orders & balances"
                            className="earning-btn"
                        >
                            ↻ Reset to Live Database
                        </button>
                    </div>
                )}
            </div>

            {/* HIGH LEVEL FINANCIAL METRIC CHIPS */}
            <div className="earning-metrics-row">
                <div className="earning-metric-card em-card-blue">
                    <div className="earning-metric-title">Ordered Form</div>
                    <div className="earning-metric-num">{formatCurrency(orderForm)}</div>
                </div>

                <div className="earning-metric-card em-card-green">
                    <div className="earning-metric-title">Refund Form</div>
                    <div className="earning-metric-num">{formatCurrency(refundForm)}</div>
                </div>

                <div className="earning-metric-card em-card-amber">
                    <div className="earning-metric-title">Amount Not Recovered</div>
                    <div className="earning-metric-num">{formatCurrency(amountNotRecovered)}</div>
                </div>

                <div className="earning-metric-card em-card-purple">
                    <div className="earning-metric-title">Final Return to Executive</div>
                    <div className="earning-metric-num">{formatCurrency(finalAmountToReturn)}</div>
                </div>

                <div className="earning-metric-card em-card-emerald">
                    <div className="earning-metric-title">Remaining Earning</div>
                    <div className="earning-metric-num">{formatCurrency(remainingEarningAmount)}</div>
                </div>
            </div>

            {/* SPREADSHEET STYLE EARNING TABLE */}
            <div className="spreadsheet-table-container">
                <table className="spreadsheet-table">
                    <thead>
                        <tr>
                            <th colSpan="2" className="spreadsheet-header-th">
                                📊 {title || "Mediator Financial Breakdown & Earnings"}
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* Row 1: Total Amount Received */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-sky">
                                Total Amount Received
                                <div className="cell-subtext">(Amount given by Executive)</div>
                            </td>
                            <td className="cell-val bg-mint">
                                {isEditing ? (
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={tableData.totalAmountReceived ?? totalAmountReceived}
                                        onChange={(e) => handleChange("totalAmountReceived", e.target.value)}
                                        className="spreadsheet-input"
                                    />
                                ) : (
                                    formatCurrency(totalAmountReceived)
                                )}
                            </td>
                        </tr>

                        {/* Row 2: Cancelled / Return Orders */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-sky">
                                Cancelled / Return Orders
                                <div className="cell-subtext">(Amount mediator returned to Executive)</div>
                            </td>
                            <td className="cell-val bg-mint">
                                {isEditing ? (
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={tableData.cancelledReturnOrders ?? cancelledReturnOrders}
                                        onChange={(e) => handleChange("cancelledReturnOrders", e.target.value)}
                                        className="spreadsheet-input"
                                    />
                                ) : (
                                    formatCurrency(cancelledReturnOrders)
                                )}
                            </td>
                        </tr>

                        {/* Row 3: Total Amount Returned */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-sky">
                                Total Amount Returned
                                <div className="cell-subtext">(Total amount returned to Executive)</div>
                            </td>
                            <td className="cell-val bg-mint">
                                {isEditing ? (
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={tableData.totalAmountReturned ?? totalAmountReturned}
                                        onChange={(e) => handleChange("totalAmountReturned", e.target.value)}
                                        className="spreadsheet-input"
                                    />
                                ) : (
                                    formatCurrency(totalAmountReturned)
                                )}
                            </td>
                        </tr>

                        {/* Row 4: Left 1 */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-lavender cell-bold">
                                Left 1
                                <div className="cell-subtext" style={{ color: "#334155" }}>(Amount left with Mediator: Received − Total Returned)</div>
                            </td>
                            <td className="cell-val bg-mint cell-bold">
                                {formatCurrency(left1)}
                            </td>
                        </tr>

                        {/* Row 5: Ordered Form */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-sky">
                                Ordered Form
                                <div className="cell-subtext">(Amount used to order: Order Form filled before Refund Form)</div>
                            </td>
                            <td className="cell-val bg-mint">
                                {isEditing ? (
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={tableData.orderForm ?? orderForm}
                                        onChange={(e) => handleChange("orderForm", e.target.value)}
                                        className="spreadsheet-input"
                                    />
                                ) : (
                                    formatCurrency(orderForm)
                                )}
                            </td>
                        </tr>

                        {/* Row 6: Amount Not Used */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-lavender cell-bold">
                                Amount Not Used
                                <div className="cell-subtext" style={{ color: "#334155" }}>(Unspent Advance: Left 1 − Ordered Form)</div>
                            </td>
                            <td className="cell-val bg-mint cell-bold">
                                {formatCurrency(amountNotUsed)}
                            </td>
                        </tr>

                        {/* Row 7: Refund Form */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-sky">
                                Refund Form
                                <div className="cell-subtext">(Total amount whose refund form is filled)</div>
                            </td>
                            <td className="cell-val bg-mint">
                                {isEditing ? (
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={tableData.refundForm ?? refundForm}
                                        onChange={(e) => handleChange("refundForm", e.target.value)}
                                        className="spreadsheet-input"
                                    />
                                ) : (
                                    formatCurrency(refundForm)
                                )}
                            </td>
                        </tr>

                        {/* Row 8: Amount Not Recovered */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-sky">
                                Amount Not Recovered
                                <div className="cell-subtext">(Awaiting Brand Refund: Ordered Form − Refund Form)</div>
                            </td>
                            <td className="cell-val bg-mint">
                                {formatCurrency(amountNotRecovered)}
                            </td>
                        </tr>

                        {/* Row 9: Refund Form (Extra Adjustments) */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-sky">
                                Refund Form (Extra Adjustments)
                                <div className="cell-subtext">(Manual adjustments & corrections)</div>
                            </td>
                            <td className="cell-val bg-cornflower">
                                {isEditing ? (
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={tableData.refundFormExtra}
                                        onChange={(e) => handleChange("refundFormExtra", e.target.value)}
                                        className="spreadsheet-input"
                                    />
                                ) : (
                                    formatCurrency(refundFormExtra)
                                )}
                            </td>
                        </tr>

                        {/* Row 10: Per Order Commission Amount */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-banana cell-bold">
                                Per Order Commission Amount
                            </td>
                            <td className="cell-val bg-mint cell-bold">
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={perOrderAmount}
                                        onChange={(e) => handleChange("perOrderAmount", e.target.value)}
                                        className="spreadsheet-input"
                                    />
                                ) : (
                                    `₹${perOrderAmount} / order`
                                )}
                            </td>
                        </tr>

                        {/* Row 11: Commission Earning */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-leaf cell-bold">
                                Commission Earning
                                <div className="cell-subtext">({completedUnitsCount} completed × ₹{perOrderAmount})</div>
                            </td>
                            <td className="cell-val bg-mint cell-bold" style={{ color: "#15803d" }}>
                                {formatCurrency(dynamicEarning)}
                            </td>
                        </tr>

                        {/* Row 12: Settled Earning Amount */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-mint cell-bold">
                                Settled Earning Amount
                                <div className="cell-subtext">(Commission payouts settled by Executive)</div>
                            </td>
                            <td className="cell-val bg-mint cell-bold" style={{ color: "#059669" }}>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={tableData.settledEarningAmount ?? settledEarningAmount}
                                        onChange={(e) => handleChange("settledEarningAmount", e.target.value)}
                                        className="spreadsheet-input"
                                    />
                                ) : (
                                    formatCurrency(settledEarningAmount)
                                )}
                            </td>
                        </tr>

                        {/* Row 13: Remaining Earning Amount */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-apricot cell-bold">
                                Remaining Earning Amount
                                <div className="cell-subtext">(Awaiting Executive Payout: Commission − Settled)</div>
                            </td>
                            <td className="cell-val bg-mint cell-bold" style={{ color: "#d97706" }}>
                                {formatCurrency(remainingEarningAmount)}
                            </td>
                        </tr>

                        {/* Row 14: Final Amount to Return to Executive */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-lavender cell-bold">
                                Final Amount to Return to Executive
                                <div className="cell-subtext" style={{ color: "#334155" }}>
                                    (Money whose refund form is not filled: Ordered Form − Refund Form
                                    {amountNotUsed > 0 ? ` + Unspent Advance: ${formatCurrency(amountNotUsed)}` : ""}
                                    {refundFormExtra !== 0 ? ` + Extra: ${formatCurrency(refundFormExtra)}` : ""})
                                </div>
                            </td>
                            <td className="cell-val bg-mint cell-bold" style={{ color: "#4338ca", fontSize: "15px" }}>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={tableData.finalAmountToReturn ?? finalAmountToReturn}
                                        onChange={(e) => handleChange("finalAmountToReturn", e.target.value)}
                                        className="spreadsheet-input"
                                    />
                                ) : (
                                    formatCurrency(finalAmountToReturn)
                                )}
                            </td>
                        </tr>

                        {/* Row 15: Exact Net Earning */}
                        <tr>
                            <td className="cell-label bg-neon cell-exact-total">
                                Exact Net Earning
                                <div className="cell-subtext" style={{ color: "#000000", fontWeight: "600" }}>(Total Commission + Extra Adjustments)</div>
                            </td>
                            <td className="cell-val bg-neon cell-exact-total">
                                {formatCurrency(exactEarning)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="earning-footer-tip">
                💡 <i>Values dynamically synced with live database orders and balance transactions. Click "✎ Edit Custom Values" to override.</i>
            </div>
        </div>
    );
}
