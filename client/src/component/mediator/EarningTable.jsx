import { useState, useEffect } from "react";
import { fetchMediatorSummary } from "../../services/mediator/orders";
import { fetchMyBalanceTransactions } from "../../services/balance";
import "../../styles/earningTable.css";

export default function EarningTable() {
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Live counts & values from DB
    const [liveStats, setLiveStats] = useState({
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
    });

    // Financial Table State
    const [tableData, setTableData] = useState(() => {
        const saved = localStorage.getItem("mediator_earning_table_v2");
        if (saved) {
            try {
                return JSON.parse(saved);
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
            totalBillingAmount: 0,
            remainingBalance: null,
            useManualOverrides: false,
        };
    });

    useEffect(() => {
        fetchLiveFinancialData();
    }, []);

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
                    if (u.status === "in_progress") inProgVal += price;
                    else if (u.status === "pending_refund") pendRefVal += price;
                    else if (u.status === "pending_payment") rejVal += price;
                });
            });

            const balanceReceived = balanceSummary.totalReceivedVerified || 0;
            const balanceReturned = balanceSummary.totalSentVerified || 0;
            const netBalance = balanceSummary.netBalance || 0;

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
                    remainingBalance: netBalance,
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
        localStorage.setItem("mediator_earning_table_v2", JSON.stringify(updated));
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
            totalBillingAmount: 0,
            remainingBalance: liveStats.netBalance,
            useManualOverrides: false,
        };

        setTableData(updated);
        localStorage.setItem("mediator_earning_table_v2", JSON.stringify(updated));
        setIsEditing(false);
    };

    const totalAmountReceived =
        tableData.totalAmountReceived !== null
            ? Number(tableData.totalAmountReceived)
            : (liveStats.inProgressValue + liveStats.pendingRefundValue + liveStats.completedValue + liveStats.rejectedValue + liveStats.balanceReceived);

    const cancelledReturnOrders =
        tableData.cancelledReturnOrders !== null ? Number(tableData.cancelledReturnOrders) : liveStats.rejectedValue;

    const totalAmountReturned =
        tableData.totalAmountReturned !== null
            ? Number(tableData.totalAmountReturned)
            : (liveStats.rejectedValue + liveStats.balanceReturned);

    const left1 = Number((totalAmountReceived - cancelledReturnOrders - totalAmountReturned).toFixed(2));

    const orderForm =
        tableData.orderForm !== null
            ? Number(tableData.orderForm)
            : (liveStats.inProgressValue + liveStats.pendingRefundValue + liveStats.completedValue);

    const amountNotUsed = Number((left1 - orderForm).toFixed(2));

    const refundForm = tableData.refundForm !== null ? Number(tableData.refundForm) : liveStats.completedValue;

    const amountNotRecovered = Number((orderForm - refundForm).toFixed(2));

    const refundFormExtra = Number(tableData.refundFormExtra) || 0;
    const perOrderAmount = Number(tableData.perOrderAmount) || 20;

    const completedUnitsCount = liveStats.completedUnits;
    const dynamicEarning = completedUnitsCount * perOrderAmount;

    const totalBillingAmount = Number(tableData.totalBillingAmount) || 0;
    const remainingBalance =
        tableData.remainingBalance !== null ? Number(tableData.remainingBalance) : liveStats.netBalance;

    const exactEarning = Number(
        (dynamicEarning + remainingBalance + refundFormExtra).toFixed(2)
    );

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
            </div>

            {/* HIGH LEVEL FINANCIAL METRIC CHIPS */}
            <div className="earning-metrics-row">
                <div className="earning-metric-card em-card-blue">
                    <div className="earning-metric-title">Order Form (Executed)</div>
                    <div className="earning-metric-num">{formatCurrency(orderForm)}</div>
                </div>

                <div className="earning-metric-card em-card-green">
                    <div className="earning-metric-title">Refund Form (Completed)</div>
                    <div className="earning-metric-num">{formatCurrency(refundForm)}</div>
                </div>

                <div className="earning-metric-card em-card-amber">
                    <div className="earning-metric-title">Pending Recovery</div>
                    <div className="earning-metric-num">{formatCurrency(amountNotRecovered)}</div>
                </div>

                <div className="earning-metric-card em-card-emerald">
                    <div className="earning-metric-title">Exact Net Earning</div>
                    <div className="earning-metric-num">{formatCurrency(exactEarning)}</div>
                </div>
            </div>

            {/* SPREADSHEET STYLE EARNING TABLE */}
            <div className="spreadsheet-table-container">
                <table className="spreadsheet-table">
                    <thead>
                        <tr>
                            <th colSpan="2" className="spreadsheet-header-th">
                                📊 Mediator Financial Breakdown & Earnings
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* Row 1: Total Amount Received */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-sky">
                                Total Amount Received
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
                                Left 1 <span style={{ fontSize: "11px", fontWeight: "normal", color: "#475569" }}>(Received - Return - Cancelled)</span>
                            </td>
                            <td className="cell-val bg-mint cell-bold">
                                {formatCurrency(left1)}
                            </td>
                        </tr>

                        {/* Row 5: Order Form */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-sky">
                                Order Form <span style={{ fontSize: "11px", fontWeight: "normal", color: "#475569" }}>(Total Value Ordered)</span>
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
                                Amount Not Used <span style={{ fontSize: "11px", fontWeight: "normal", color: "#475569" }}>(Left 1 - Order Form)</span>
                            </td>
                            <td className="cell-val bg-mint cell-bold">
                                {formatCurrency(amountNotUsed)}
                            </td>
                        </tr>

                        {/* Row 7: Refund Form */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-sky">
                                Refund Form <span style={{ fontSize: "11px", fontWeight: "normal", color: "#475569" }}>(Completed Refunds)</span>
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

                        {/* Row 8: Amount not Recovered */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-sky">
                                Amount not Recovered <span style={{ fontSize: "11px", fontWeight: "normal", color: "#475569" }}>(Order Form - Refund Form)</span>
                            </td>
                            <td className="cell-val bg-mint">
                                {formatCurrency(amountNotRecovered)}
                            </td>
                        </tr>

                        {/* Row 9: Refund Form (extra) */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-sky">
                                Refund Form (extra adjustments)
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

                        {/* Row 10: Per Order Amount */}
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

                        {/* Row 11: Earning */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-leaf cell-bold">
                                Commission Earning <span style={{ fontSize: "11px", fontWeight: "normal" }}>({completedUnitsCount} completed × ₹{perOrderAmount})</span>
                            </td>
                            <td className="cell-val bg-mint cell-bold" style={{ color: "#15803d" }}>
                                {formatCurrency(dynamicEarning)}
                            </td>
                        </tr>

                        {/* Row 12: Total Billing Amount */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-sky">
                                Total Billing Amount
                            </td>
                            <td className="cell-val bg-mint">
                                {isEditing ? (
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={tableData.totalBillingAmount}
                                        onChange={(e) => handleChange("totalBillingAmount", e.target.value)}
                                        className="spreadsheet-input"
                                    />
                                ) : (
                                    formatCurrency(totalBillingAmount)
                                )}
                            </td>
                        </tr>

                        {/* Row 13: Remaining Balance */}
                        <tr className="spreadsheet-row">
                            <td className="cell-label bg-apricot cell-bold">
                                Remaining Balance <span style={{ fontSize: "11px", fontWeight: "normal", color: "#475569" }}>(Balance Settlement Net)</span>
                            </td>
                            <td className="cell-val bg-mint cell-bold">
                                {isEditing ? (
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={tableData.remainingBalance ?? remainingBalance}
                                        onChange={(e) => handleChange("remainingBalance", e.target.value)}
                                        className="spreadsheet-input"
                                    />
                                ) : (
                                    formatCurrency(remainingBalance)
                                )}
                            </td>
                        </tr>

                        {/* Row 14: Exact Earning */}
                        <tr>
                            <td className="cell-label bg-neon cell-exact-total">
                                Exact Net Earning
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
