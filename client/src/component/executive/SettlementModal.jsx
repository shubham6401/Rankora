import React, { useState } from "react";
import { settleExecutivePayout } from "../../services/executive/order";
import ProofThumbnail from "../common/ProofThumbnail";
import ProofPreviewModal from "../common/ProofPreviewModal";
import "../../styles/ordersTable.css";

export default function SettlementModal({
    mediator,
    units = [],
    onClose,
    onSuccess,
}) {
    const eligibleUnits = units.filter(
        (u) => u.settlementStatus !== "settled" && u.settlementStatus !== "pending_confirmation"
    );
    const displayUnits = eligibleUnits.length > 0 ? eligibleUnits : units;

    const [selectedUnitIds, setSelectedUnitIds] = useState(
        displayUnits.map((u) => (u._id || u.id)?.toString()).filter(Boolean)
    );
    const [amountPerOrder, setAmountPerOrder] = useState("20");
    const [useIndividualAmounts, setUseIndividualAmounts] = useState(false);
    const [customAmounts, setCustomAmounts] = useState({});
    const [utrNote, setUtrNote] = useState("");
    const [paymentFile, setPaymentFile] = useState(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState(null);
    const [previewModalUrl, setPreviewModalUrl] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const toggleUnitSelection = (unitId) => {
        const idStr = unitId?.toString();
        setSelectedUnitIds((prev) =>
            prev.includes(idStr)
                ? prev.filter((id) => id !== idStr)
                : [...prev, idStr]
        );
    };

    const toggleSelectAll = () => {
        if (selectedUnitIds.length === units.length) {
            setSelectedUnitIds([]);
        } else {
            setSelectedUnitIds(units.map((u) => (u._id || u.id)?.toString()).filter(Boolean));
        }
    };

    const handleCustomAmountChange = (unitId, val) => {
        setCustomAmounts((prev) => ({
            ...prev,
            [unitId]: val,
        }));
    };

    const getUnitPayout = (unitId) => {
        if (useIndividualAmounts && customAmounts[unitId] !== undefined) {
            const parsed = parseFloat(customAmounts[unitId]);
            return isNaN(parsed) ? 0 : parsed;
        }
        const parsedGlobal = parseFloat(amountPerOrder);
        return isNaN(parsedGlobal) ? 0 : parsedGlobal;
    };

    const selectedUnitsList = units.filter((u) =>
        selectedUnitIds.includes((u._id || u.id)?.toString())
    );

    const totalPayoutAmount = selectedUnitsList.reduce((sum, u) => {
        return sum + getUnitPayout((u._id || u.id)?.toString());
    }, 0);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setPaymentFile(file);
        const objUrl = URL.createObjectURL(file);
        setFilePreviewUrl(objUrl);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        if (selectedUnitIds.length === 0) {
            setErrorMessage("Please select at least one unit to settle.");
            return;
        }

        const parsedRate = parseFloat(amountPerOrder);
        if (!useIndividualAmounts && (isNaN(parsedRate) || parsedRate < 0)) {
            setErrorMessage("Please enter a valid amount per order.");
            return;
        }

        if (!paymentFile) {
            setErrorMessage("Please upload a payment proof screenshot (Image or PDF).");
            return;
        }

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append("settlementScreenshot", paymentFile);
            formData.append("unitIds", JSON.stringify(selectedUnitIds));
            formData.append("amountPerOrder", parsedRate || 0);

            const unitAmountsPayload = {};
            selectedUnitsList.forEach((u) => {
                const uId = (u._id || u.id)?.toString();
                if (uId) {
                    unitAmountsPayload[uId] = getUnitPayout(uId);
                }
            });
            formData.append("unitAmounts", JSON.stringify(unitAmountsPayload));
            formData.append("totalPayout", totalPayoutAmount);

            if (utrNote) {
                formData.append("utr", utrNote);
            }
            if (mediator?.id) {
                formData.append("mediatorId", mediator.id);
            }

            const response = await settleExecutivePayout(formData);
            if (response.data?.success) {
                if (onSuccess) onSuccess(response.data);
                if (onClose) onClose();
            } else {
                setErrorMessage(response.data?.message || "Failed to submit settlement");
            }
        } catch (err) {
            console.error("Settlement submission error:", err);
            setErrorMessage(err.response?.data?.message || err.message || "An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const quickRates = ["15", "20", "25", "30", "50"];

    return (
        <div
            className="image-modal-overlay"
            onClick={onClose}
            style={{
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                className="image-modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "680px",
                    maxWidth: "94vw",
                    maxHeight: "92vh",
                    padding: "24px",
                    overflowY: "auto",
                    borderRadius: "14px",
                }}
            >
                {/* Header */}
                <div className="image-modal-header" style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                            💳 Settle Mediator Payout
                        </h2>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
                            Mediator: <b style={{ color: "#334155" }}>{mediator?.name || "Mediator"}</b> ({mediator?.mediatorCode || "Code"})
                            {" "}• Team: <b style={{ color: "#334155" }}>{mediator?.teamCode || "N/A"}</b>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="image-modal-close-btn"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ marginTop: "16px" }}>
                    {errorMessage && (
                        <div
                            style={{
                                padding: "10px 14px",
                                backgroundColor: "#fef2f2",
                                color: "#b91c1c",
                                border: "1px solid #fecaca",
                                borderRadius: "8px",
                                fontSize: "12.5px",
                                marginBottom: "14px",
                            }}
                        >
                            ⚠️ {errorMessage}
                        </div>
                    )}

                    {/* Amount Per Order Section */}
                    <div
                        style={{
                            padding: "14px 16px",
                            backgroundColor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            marginBottom: "18px",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "8px" }}>
                            <label style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                                Payout Amount Per Order (₹) <span style={{ color: "#dc2626" }}>*</span>
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={useIndividualAmounts}
                                    onChange={(e) => setUseIndividualAmounts(e.target.checked)}
                                    style={{ accentColor: "#059669" }}
                                />
                                Custom amount per unit
                            </label>
                        </div>

                        {!useIndividualAmounts && (
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                    <div style={{ position: "relative", width: "160px" }}>
                                        <span style={{ position: "absolute", left: "10px", top: "9px", color: "#64748b", fontWeight: 700 }}>₹</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            placeholder="20"
                                            value={amountPerOrder}
                                            onChange={(e) => setAmountPerOrder(e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "8px 12px 8px 24px",
                                                border: "1px solid #cbd5e1",
                                                borderRadius: "6px",
                                                fontSize: "14px",
                                                fontWeight: 700,
                                                color: "#0f172a",
                                                boxSizing: "border-box",
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                        <span style={{ fontSize: "12px", color: "#64748b" }}>Quick choose:</span>
                                        {quickRates.map((rate) => (
                                            <button
                                                key={rate}
                                                type="button"
                                                onClick={() => setAmountPerOrder(rate)}
                                                style={{
                                                    padding: "5px 10px",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    borderRadius: "5px",
                                                    border: amountPerOrder === rate ? "1.5px solid #059669" : "1px solid #cbd5e1",
                                                    backgroundColor: amountPerOrder === rate ? "#ecfdf5" : "#ffffff",
                                                    color: amountPerOrder === rate ? "#059669" : "#475569",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                ₹{rate}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Units Selection List */}
                    <div style={{ marginBottom: "18px" }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "8px",
                            }}
                        >
                            <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                                Select Units to Settle ({selectedUnitIds.length}/{units.length})
                            </label>
                            <button
                                type="button"
                                onClick={toggleSelectAll}
                                style={{
                                    border: "none",
                                    background: "none",
                                    color: "var(--primary-600)",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    padding: 0,
                                }}
                            >
                                {selectedUnitIds.length === units.length ? "Deselect All" : "Select All"}
                            </button>
                        </div>

                        <div
                            style={{
                                maxHeight: "200px",
                                overflowY: "auto",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                background: "#f8fafc",
                                padding: "8px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                            }}
                        >
                            {units.map((unit, idx) => {
                                const uId = (unit._id || unit.id)?.toString();
                                const isChecked = selectedUnitIds.includes(uId);
                                const productPrice = unit.purchasePrice || unit.price || 0;
                                const unitPayout = getUnitPayout(uId);

                                return (
                                    <div
                                        key={uId || idx}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "8px 10px",
                                            background: isChecked ? "#ffffff" : "#f1f5f9",
                                            border: `1px solid ${isChecked ? "#93c5fd" : "#e2e8f0"}`,
                                            borderRadius: "6px",
                                            transition: "all 0.12s ease",
                                        }}
                                    >
                                        <div
                                            onClick={() => toggleUnitSelection(uId)}
                                            style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flex: 1 }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => {}} // handled by parent div onClick
                                                style={{ cursor: "pointer", accentColor: "#2563eb" }}
                                            />
                                            <div>
                                                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#1e293b" }}>
                                                    {unit.productName || "Product"}
                                                </div>
                                                <div style={{ fontSize: "11px", color: "#64748b" }}>
                                                    Order ID: <b style={{ color: "#475569" }}>{unit.orderId || "N/A"}</b> | Platform: {unit.orderPlatform || "N/A"}
                                                    {unit.reviewerName && ` | Reviewer: ${unit.reviewerName}`}
                                                </div>
                                                <div style={{ fontSize: "10.5px", color: "#94a3b8" }}>
                                                    Product Cost: ₹{productPrice} (already paid in advance)
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ textAlign: "right", marginLeft: "12px" }}>
                                            {useIndividualAmounts ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <span style={{ fontSize: "12px", color: "#059669", fontWeight: 700 }}>₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="any"
                                                        value={customAmounts[uId] !== undefined ? customAmounts[uId] : amountPerOrder}
                                                        onChange={(e) => handleCustomAmountChange(uId, e.target.value)}
                                                        style={{
                                                            width: "70px",
                                                            padding: "4px 6px",
                                                            border: "1px solid #a7f3d0",
                                                            borderRadius: "4px",
                                                            fontSize: "12.5px",
                                                            fontWeight: 700,
                                                            color: "#059669",
                                                            textAlign: "right",
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#059669" }}>
                                                    ₹{unitPayout}
                                                </div>
                                            )}
                                            {unit.unitType && (
                                                <span
                                                    className={`unit-spec-chip ${unit.unitType}`}
                                                    style={{ fontSize: "9px", padding: "1px 5px", marginTop: "2px", display: "inline-block" }}
                                                >
                                                    {unit.unitType === "warehouse" ? "🏢 WH" : "📦 Empty"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Total Summary Box */}
                    <div
                        style={{
                            padding: "14px 18px",
                            backgroundColor: "#ecfdf5",
                            border: "1px solid #a7f3d0",
                            borderRadius: "10px",
                            marginBottom: "18px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div>
                            <div style={{ fontSize: "13px", color: "#065f46", fontWeight: 700 }}>
                                Total Settlement Payout ({selectedUnitIds.length} units selected)
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#047857", marginTop: "2px" }}>
                                {useIndividualAmounts
                                    ? "Sum of customized per-unit payout amounts"
                                    : `${selectedUnitIds.length} units × ₹${amountPerOrder || 0} per order`}
                            </div>
                        </div>
                        <div style={{ fontSize: "22px", fontWeight: 800, color: "#065f46" }}>
                            ₹{totalPayoutAmount.toLocaleString()}
                        </div>
                    </div>

                    {/* UTR / Transaction Reference Note */}
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                            Transaction Reference / UTR Note (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. UPI Ref / Bank IMPS 2026101700123"
                            value={utrNote}
                            onChange={(e) => setUtrNote(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #cbd5e1",
                                borderRadius: "6px",
                                fontSize: "13px",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    {/* Payment Proof File Picker: Accepts Image and PDF */}
                    <div style={{ marginBottom: "22px" }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                            Payment Proof Screenshot / Receipt <span style={{ color: "#dc2626" }}>*</span>
                            <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", marginLeft: "6px" }}>
                                (Accepts JPG, PNG, WEBP, or PDF)
                            </span>
                        </label>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                            <input
                                type="file"
                                id="settlement-payment-proof"
                                accept="image/*,application/pdf"
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                            />
                            <label
                                htmlFor="settlement-payment-proof"
                                className="table-btn table-btn-outline"
                                style={{
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 14px",
                                    fontSize: "12.5px",
                                    fontWeight: 600,
                                }}
                            >
                                📁 {paymentFile ? `Change File (${paymentFile.name})` : "Choose Screenshot or PDF"}
                            </label>

                            {paymentFile && filePreviewUrl && (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <ProofThumbnail
                                        url={filePreviewUrl}
                                        fileName={paymentFile.name}
                                        alt="Selected Payment Proof"
                                        size={40}
                                        onClick={() => setPreviewModalUrl(filePreviewUrl)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setPreviewModalUrl(filePreviewUrl)}
                                        className="table-btn table-btn-outline"
                                        style={{ fontSize: "11px", padding: "4px 8px" }}
                                    >
                                        🔍 Preview Proof
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "10px",
                            borderTop: "1px solid #f1f5f9",
                            paddingTop: "14px",
                        }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="table-btn table-btn-outline"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="table-btn table-btn-primary"
                            disabled={submitting}
                            style={{
                                background: "#059669",
                                borderColor: "#059669",
                                color: "#ffffff",
                                fontWeight: 700,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 18px",
                                cursor: submitting ? "not-allowed" : "pointer",
                                opacity: submitting ? 0.7 : 1,
                            }}
                        >
                            {submitting ? "Submitting Settlement..." : `✓ Submit Payout for Confirmation (₹${totalPayoutAmount.toLocaleString()})`}
                        </button>
                    </div>
                </form>

                {/* Local Proof Preview Modal */}
                {previewModalUrl && (
                    <ProofPreviewModal
                        url={previewModalUrl}
                        title="Selected Payment Proof Preview"
                        onClose={() => setPreviewModalUrl(null)}
                    />
                )}
            </div>
        </div>
    );
}
