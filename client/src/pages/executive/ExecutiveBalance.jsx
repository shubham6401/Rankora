import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    sendBalancePayment,
    fetchMyBalanceTransactions,
    verifyBalanceTransaction,
    rejectBalanceTransaction,
    fetchTeamMediators,
} from "../../services/balance";

export default function ExecutiveBalance() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [verifyingId, setVerifyingId] = useState(null);
    const [mediators, setMediators] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({
        totalSentVerified: 0,
        totalReceivedVerified: 0,
        netBalance: 0,
        pendingIncomingCount: 0,
        pendingOutgoingCount: 0,
    });

    // Form state
    const [selectedMediatorId, setSelectedMediatorId] = useState("");
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("Price Increased (Reimbursement to Mediator)");
    const [customReason, setCustomReason] = useState("");
    const [message, setMessage] = useState("");
    const [paymentFile, setPaymentFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [modalImage, setModalImage] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [txRes, medRes] = await Promise.all([
                fetchMyBalanceTransactions(),
                fetchTeamMediators(),
            ]);
            setTransactions(txRes.data.transactions || []);
            setSummary(txRes.data.summary || {});
            setMediators(medRes.data.mediators || []);
        } catch (err) {
            console.error("Error loading balance data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPaymentFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleClearFile = () => {
        setPaymentFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
    };

    const handleSendBalance = async (e) => {
        e.preventDefault();

        if (!selectedMediatorId) {
            alert("Please select a mediator");
            return;
        }

        const amtNum = Number(amount);
        if (!amtNum || amtNum <= 0) {
            alert("Please enter a valid amount greater than ₹0");
            return;
        }

        if (!paymentFile) {
            alert("Please attach a payment screenshot as proof");
            return;
        }

        const chosenReason = reason === "Other" ? customReason : reason;
        if (!chosenReason.trim()) {
            alert("Please specify a reason for this payment");
            return;
        }

        const selectedMed = mediators.find((m) => m._id === selectedMediatorId);
        const confirmMsg = `Confirm sending balance payment of ₹${amtNum.toLocaleString()} to mediator ${selectedMed?.name || ""}?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append("receiverId", selectedMediatorId);
            formData.append("amount", amtNum);
            formData.append("reason", chosenReason);
            formData.append("message", message);
            formData.append("paymentScreenshot", paymentFile);

            const res = await sendBalancePayment(formData);
            alert(res.data.message || "Balance payment sent successfully!");

            // Reset form
            setSelectedMediatorId("");
            setAmount("");
            setMessage("");
            setCustomReason("");
            handleClearFile();

            await loadData();
        } catch (err) {
            console.error("Error sending balance:", err);
            alert(err?.response?.data?.message || "Failed to send balance payment");
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerify = async (txId, senderName, amt) => {
        const confirmMsg = `Verify & accept refund payment of ₹${amt.toLocaleString()} from ${senderName}?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            setVerifyingId(txId);
            const res = await verifyBalanceTransaction(txId);
            alert(res.data.message || "Balance payment verified successfully!");
            await loadData();
        } catch (err) {
            console.error("Error verifying balance:", err);
            alert(err?.response?.data?.message || "Failed to verify balance payment");
        } finally {
            setVerifyingId(null);
        }
    };

    const handleReject = async (txId, senderName) => {
        const rejectReason = window.prompt(`Enter reason for rejecting payment from ${senderName}:`);
        if (rejectReason === null) return; // cancelled

        try {
            setVerifyingId(txId);
            const res = await rejectBalanceTransaction(txId, { reason: rejectReason });
            alert(res.data.message || "Balance payment rejected.");
            await loadData();
        } catch (err) {
            console.error("Error rejecting balance:", err);
            alert(err?.response?.data?.message || "Failed to reject balance payment");
        } finally {
            setVerifyingId(null);
        }
    };

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const incomingPending = transactions.filter(
        (tx) => tx.receiver?._id === user.id && tx.status === "pending"
    );

    if (loading) {
        return (
            <div style={{ maxWidth: "1150px", margin: "40px auto", textAlign: "center", fontFamily: "sans-serif" }}>
                <h2>Loading Balance Settlement...</h2>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "1150px", margin: "20px auto", padding: "20px", fontFamily: "sans-serif" }}>
            {/* HEADER & NAV */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
                <div>
                    <h1 style={{ margin: "0 0 6px 0", fontSize: "26px", color: "#0f766e" }}>
                        ⚖️ Executive Balance Settlement (Price Adjustments)
                    </h1>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                        Reconcile price differences: Pay extra money to mediators when prices rise, or verify refunds when prices fall.
                    </p>
                </div>
                <button
                    onClick={() => navigate("/dashboard-executive")}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontWeight: "600",
                        cursor: "pointer",
                        color: "#334155",
                    }}
                >
                    ← Executive Dashboard
                </button>
            </div>

            {/* SUMMARY METRIC CARDS */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "16px",
                    marginBottom: "28px",
                }}
            >
                <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "16px" }}>
                    <div style={{ fontSize: "12px", color: "#166534", fontWeight: "600" }}>Total Paid to Mediators (Price Rises)</div>
                    <div style={{ fontSize: "22px", fontWeight: "bold", color: "#15803d", marginTop: "4px" }}>
                        ₹{summary.totalSentVerified?.toLocaleString() || 0}
                    </div>
                </div>

                <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "16px" }}>
                    <div style={{ fontSize: "12px", color: "#1e40af", fontWeight: "600" }}>Total Refunds Received (Price Drops)</div>
                    <div style={{ fontSize: "22px", fontWeight: "bold", color: "#1d4ed8", marginTop: "4px" }}>
                        ₹{summary.totalReceivedVerified?.toLocaleString() || 0}
                    </div>
                </div>

                <div style={{ backgroundColor: "#fef3c7", border: "1px solid #fde68a", borderRadius: "8px", padding: "16px" }}>
                    <div style={{ fontSize: "12px", color: "#92400e", fontWeight: "600" }}>Pending Incoming Verifications</div>
                    <div style={{ fontSize: "22px", fontWeight: "bold", color: "#b45309", marginTop: "4px" }}>
                        {incomingPending.length}
                    </div>
                </div>

                <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px" }}>
                    <div style={{ fontSize: "12px", color: "#475569", fontWeight: "600" }}>Total Settlement Records</div>
                    <div style={{ fontSize: "22px", fontWeight: "bold", color: "#334155", marginTop: "4px" }}>
                        {transactions.length}
                    </div>
                </div>
            </div>

            {/* INCOMING PENDING REFUNDS FROM MEDIATOR (IF ANY) */}
            {incomingPending.length > 0 && (
                <div
                    style={{
                        border: "2px solid #f59e0b",
                        borderRadius: "10px",
                        padding: "20px",
                        backgroundColor: "#fffbeb",
                        marginBottom: "28px",
                        boxShadow: "0 4px 12px rgba(245,158,11,0.15)",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                        <h2 style={{ margin: 0, fontSize: "18px", color: "#92400e" }}>
                            ⚠️ Action Required: Incoming Balance Refunds Awaiting Verification ({incomingPending.length})
                        </h2>
                    </div>
                    <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#78350f" }}>
                        Mediators sent refund money (e.g. price decreased / leftover amount). Review their screenshot and verify to acknowledge receipt.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {incomingPending.map((tx) => (
                            <div
                                key={tx._id}
                                style={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #fde68a",
                                    borderRadius: "8px",
                                    padding: "16px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "16px",
                                }}
                            >
                                <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                                    <div style={{ cursor: "pointer" }} onClick={() => setModalImage(tx.paymentScreenshot)}>
                                        <img
                                            src={tx.paymentScreenshot}
                                            alt="Proof Screenshot"
                                            style={{
                                                width: "80px",
                                                height: "80px",
                                                objectFit: "cover",
                                                borderRadius: "6px",
                                                border: "1px solid #cbd5e1",
                                            }}
                                        />
                                        <div style={{ fontSize: "10px", color: "#0284c7", marginTop: "2px", textAlign: "center" }}>🔍 Zoom</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "15px", fontWeight: "bold", color: "#1e293b" }}>
                                            From Mediator: {tx.sender?.name} (Code: {tx.sender?.mediatorCode})
                                        </div>
                                        <div style={{ fontSize: "14px", color: "#b45309", fontWeight: "bold", marginTop: "2px" }}>
                                            Refund Amount: ₹{tx.amount?.toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: "13px", color: "#475569", marginTop: "2px" }}>
                                            <b>Reason:</b> {tx.reason}
                                        </div>
                                        {tx.message && (
                                            <div style={{ fontSize: "13px", color: "#334155", backgroundColor: "#f8fafc", padding: "4px 8px", borderRadius: "4px", marginTop: "4px" }}>
                                                <b>Note:</b> {tx.message}
                                            </div>
                                        )}
                                        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                                            Sent on: {new Date(tx.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button
                                        onClick={() => handleVerify(tx._id, tx.sender?.name, tx.amount)}
                                        disabled={verifyingId === tx._id}
                                        style={{
                                            backgroundColor: "#16a34a",
                                            color: "#fff",
                                            border: "none",
                                            padding: "8px 16px",
                                            borderRadius: "6px",
                                            fontWeight: "bold",
                                            cursor: verifyingId === tx._id ? "not-allowed" : "pointer",
                                            fontSize: "13px",
                                        }}
                                    >
                                        {verifyingId === tx._id ? "Verifying..." : "✓ Verify & Accept"}
                                    </button>
                                    <button
                                        onClick={() => handleReject(tx._id, tx.sender?.name)}
                                        disabled={verifyingId === tx._id}
                                        style={{
                                            backgroundColor: "#ef4444",
                                            color: "#fff",
                                            border: "none",
                                            padding: "8px 14px",
                                            borderRadius: "6px",
                                            fontWeight: "bold",
                                            cursor: verifyingId === tx._id ? "not-allowed" : "pointer",
                                            fontSize: "13px",
                                        }}
                                    >
                                        ✕ Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SEND BALANCE PAYMENT FORM (PRICE INCREASED) */}
            <div
                style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    padding: "24px",
                    backgroundColor: "#ffffff",
                    marginBottom: "28px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
            >
                <h2 style={{ margin: "0 0 6px 0", fontSize: "18px", color: "#0f766e" }}>
                    📤 Send Extra Balance to Mediator (When Price Increases / Mediator Used Own Money)
                </h2>
                <p style={{ margin: "0 0 18px 0", fontSize: "13px", color: "#64748b" }}>
                    Select a mediator from your team, enter the price difference amount you are paying them, and attach your payment screenshot proof.
                </p>

                <form onSubmit={handleSendBalance}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                        {/* Select Mediator */}
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                Select Mediator *
                            </label>
                            <select
                                value={selectedMediatorId}
                                onChange={(e) => setSelectedMediatorId(e.target.value)}
                                required
                                style={{
                                    width: "100%",
                                    padding: "9px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    backgroundColor: "#fff",
                                    fontSize: "14px",
                                }}
                            >
                                <option value="">-- Choose Mediator --</option>
                                {mediators.map((med) => (
                                    <option key={med._id} value={med._id}>
                                        {med.name} (Code: {med.mediatorCode})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Amount */}
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                Balance Amount (₹) *
                            </label>
                            <input
                                type="number"
                                min="1"
                                placeholder="e.g. 500"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                style={{
                                    width: "100%",
                                    padding: "9px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "14px",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>

                        {/* Reason */}
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                Reason *
                            </label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "9px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    backgroundColor: "#fff",
                                    fontSize: "14px",
                                }}
                            >
                                <option value="Price Increased (Reimbursement to Mediator)">Price Increased (Reimbursement to Mediator)</option>
                                <option value="Mediator Used Own Money">Mediator Used Own Money</option>
                                <option value="Delivery / Platform Charges">Delivery / Platform Charges</option>
                                <option value="Discrepancy Settlement">Discrepancy Settlement</option>
                                <option value="Other">Other (Type custom reason)</option>
                            </select>
                        </div>
                    </div>

                    {reason === "Other" && (
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                Custom Reason *
                            </label>
                            <input
                                type="text"
                                placeholder="Describe why you are paying this balance..."
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                required
                                style={{
                                    width: "100%",
                                    padding: "9px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "14px",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                    )}

                    {/* Note / Message */}
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                            Message / Payment Reference Note (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Paid via GooglePay UPI ref #83728492"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 12px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                fontSize: "14px",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    {/* Screenshot Upload */}
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                            Payment Proof Screenshot *
                        </label>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                            <input
                                type="file"
                                accept="image/*"
                                id="exec-balance-file"
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                            />
                            <label
                                htmlFor="exec-balance-file"
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: paymentFile ? "#ecfdf5" : "#f1f5f9",
                                    color: paymentFile ? "#059669" : "#334155",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    fontSize: "13px",
                                }}
                            >
                                {paymentFile ? `✓ ${paymentFile.name}` : "📁 Choose Screenshot"}
                            </label>

                            {previewUrl && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setModalImage(previewUrl)}
                                        style={{
                                            padding: "8px 12px",
                                            backgroundColor: "#e2e8f0",
                                            border: "none",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontSize: "13px",
                                        }}
                                    >
                                        🔍 Preview
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleClearFile}
                                        style={{
                                            padding: "8px 12px",
                                            backgroundColor: "#fee2e2",
                                            color: "#dc2626",
                                            border: "1px solid #fca5a5",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontSize: "13px",
                                        }}
                                    >
                                        ✕ Remove
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            backgroundColor: "#0f766e",
                            color: "#ffffff",
                            padding: "10px 24px",
                            borderRadius: "6px",
                            border: "none",
                            fontWeight: "bold",
                            fontSize: "14px",
                            cursor: submitting ? "not-allowed" : "pointer",
                            boxShadow: "0 2px 6px rgba(15,118,110,0.3)",
                        }}
                    >
                        {submitting ? "Sending Payment..." : "📤 Send Balance to Mediator"}
                    </button>
                </form>
            </div>

            {/* TRANSACTION HISTORY LOG */}
            <div
                style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    padding: "20px",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
            >
                <h2 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#1e293b" }}>
                    📜 Balance Settlement Transaction History ({transactions.length})
                </h2>

                {transactions.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontStyle: "italic", margin: 0 }}>No balance transactions recorded yet.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>
                                    <th style={{ padding: "10px", textAlign: "left" }}>Date</th>
                                    <th style={{ padding: "10px", textAlign: "left" }}>Type / Direction</th>
                                    <th style={{ padding: "10px", textAlign: "left" }}>Mediator</th>
                                    <th style={{ padding: "10px", textAlign: "left" }}>Amount</th>
                                    <th style={{ padding: "10px", textAlign: "left" }}>Reason & Message</th>
                                    <th style={{ padding: "10px", textAlign: "center" }}>Proof</th>
                                    <th style={{ padding: "10px", textAlign: "center" }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => {
                                    const isSentByMe = tx.sender?._id === user.id;
                                    const otherParty = isSentByMe ? tx.receiver : tx.sender;

                                    const statusStyle = {
                                        pending: { bg: "#fef3c7", text: "#b45309" },
                                        verified: { bg: "#dcfce7", text: "#15803d" },
                                        rejected: { bg: "#fee2e2", text: "#b91c1c" },
                                    }[tx.status] || { bg: "#f1f5f9", text: "#475569" };

                                    return (
                                        <tr key={tx._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "10px", color: "#64748b" }}>
                                                {new Date(tx.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: "10px" }}>
                                                {isSentByMe ? (
                                                    <span style={{ color: "#0f766e", fontWeight: "600" }}>
                                                        📤 Sent to Mediator
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "#2563eb", fontWeight: "600" }}>
                                                        📥 Received from Mediator
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: "10px", fontWeight: "600", color: "#1e293b" }}>
                                                {otherParty?.name} ({otherParty?.mediatorCode})
                                            </td>
                                            <td style={{ padding: "10px", fontWeight: "bold", fontSize: "14px", color: isSentByMe ? "#0f766e" : "#1d4ed8" }}>
                                                ₹{tx.amount?.toLocaleString()}
                                            </td>
                                            <td style={{ padding: "10px" }}>
                                                <div style={{ color: "#1e293b", fontWeight: "500" }}>{tx.reason}</div>
                                                {tx.message && (
                                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                                        {tx.message}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: "10px", textAlign: "center" }}>
                                                {tx.paymentScreenshot && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setModalImage(tx.paymentScreenshot)}
                                                        style={{
                                                            padding: "4px 8px",
                                                            fontSize: "11px",
                                                            backgroundColor: "#e0f2fe",
                                                            color: "#0369a1",
                                                            border: "1px solid #bae6fd",
                                                            borderRadius: "4px",
                                                            cursor: "pointer",
                                                            fontWeight: "600",
                                                        }}
                                                    >
                                                        🔍 View Proof
                                                    </button>
                                                )}
                                            </td>
                                            <td style={{ padding: "10px", textAlign: "center" }}>
                                                <span
                                                    style={{
                                                        backgroundColor: statusStyle.bg,
                                                        color: statusStyle.text,
                                                        padding: "3px 10px",
                                                        borderRadius: "12px",
                                                        fontWeight: "700",
                                                        fontSize: "11px",
                                                        textTransform: "uppercase",
                                                    }}
                                                >
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* FULLSCREEN IMAGE MODAL PREVIEW */}
            {modalImage && (
                <div
                    onClick={() => setModalImage(null)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "20px",
                        cursor: "zoom-out",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: "relative",
                            maxWidth: "90vw",
                            maxHeight: "90vh",
                            backgroundColor: "#fff",
                            borderRadius: "10px",
                            padding: "16px",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
                            <button
                                onClick={() => setModalImage(null)}
                                style={{
                                    border: "none",
                                    backgroundColor: "#ef4444",
                                    color: "#fff",
                                    padding: "6px 14px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    fontSize: "13px",
                                }}
                            >
                                Close ✕
                            </button>
                        </div>
                        <img
                            src={modalImage}
                            alt="Screenshot Enlarged"
                            style={{
                                maxWidth: "85vw",
                                maxHeight: "75vh",
                                objectFit: "contain",
                                borderRadius: "6px",
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
