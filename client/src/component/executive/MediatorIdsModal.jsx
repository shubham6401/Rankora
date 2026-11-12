import { useState, useEffect } from "react";
import { fetchExecutiveMediatorIds, toggleMediatorIdStatus } from "../../services/executive/order";

export default function MediatorIdsModal({ mediator, isOpen, onClose }) {
    const [ids, setIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState(null);
    const [reasonInputId, setReasonInputId] = useState(null);
    const [deactivationReason, setDeactivationReason] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen && mediator?._id) {
            loadIds();
        }
    }, [isOpen, mediator?._id]);

    const loadIds = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await fetchExecutiveMediatorIds(mediator._id);
            if (res.data?.success) {
                setIds(res.data.platformIds || []);
            }
        } catch (err) {
            console.error("Failed to load mediator platform IDs:", err);
            setError("Could not load mediator's platform accounts.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleToggle = async (item, newStatus) => {
        if (newStatus === "inactive" && reasonInputId !== item._id) {
            setReasonInputId(item._id);
            setDeactivationReason("");
            return;
        }

        try {
            setTogglingId(item._id);
            const payload = {
                status: newStatus,
                reason: newStatus === "inactive" ? deactivationReason : undefined,
            };
            const res = await toggleMediatorIdStatus(mediator._id, item._id, payload);
            if (res.data?.success) {
                setIds((prev) =>
                    prev.map((x) => (x._id === item._id ? res.data.platformId : x))
                );
                setReasonInputId(null);
                setDeactivationReason("");
            }
        } catch (err) {
            console.error("Failed to toggle ID status:", err);
            alert(err.response?.data?.message || "Failed to update ID status.");
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
        }}>
            <div style={{
                background: "#ffffff",
                borderRadius: "14px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                width: "100%",
                maxWidth: "680px",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
            }}>
                {/* Header */}
                <div style={{
                    padding: "18px 24px",
                    borderBottom: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "20px" }}>💳</span>
                            <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                                Buyer Platform Accounts
                            </h2>
                            <span style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                background: "#e0e7ff",
                                color: "#3730a3",
                                padding: "2px 8px",
                                borderRadius: "10px"
                            }}>
                                {mediator?.name} ({mediator?.mediatorCode || "Mediator"})
                            </span>
                        </div>
                        <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>
                            Review registered buyer profiles and toggle Active/Inactive state to manage order eligibility.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            border: "none",
                            background: "transparent",
                            fontSize: "20px",
                            color: "#94a3b8",
                            cursor: "pointer",
                            padding: "4px 8px"
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Body Content */}
                <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
                    {error && (
                        <div style={{
                            padding: "10px 14px",
                            background: "#fff1f2",
                            border: "1px solid #fecdd3",
                            borderRadius: "8px",
                            color: "#be123c",
                            fontSize: "13px",
                            marginBottom: "16px"
                        }}>
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                            <div style={{ fontSize: "28px", marginBottom: "8px" }}>⏳</div>
                            <div style={{ fontWeight: 600 }}>Loading mediator platform accounts...</div>
                        </div>
                    ) : ids.length === 0 ? (
                        <div style={{
                            textAlign: "center",
                            padding: "40px 20px",
                            background: "#f8fafc",
                            borderRadius: "10px",
                            border: "1px dashed #cbd5e1"
                        }}>
                            <div style={{ fontSize: "36px", marginBottom: "8px" }}>📭</div>
                            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", margin: "0 0 4px 0" }}>
                                No Platform Accounts Registered
                            </h4>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                                This mediator has not added any e-commerce buyer accounts yet.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {ids.map((item) => {
                                const isActive = item.status === "active";
                                const isBusy = togglingId === item._id;
                                const isReasonOpen = reasonInputId === item._id;

                                return (
                                    <div
                                        key={item._id}
                                        style={{
                                            border: isActive ? "1px solid #e2e8f0" : "1.5px solid #fca5a5",
                                            background: isActive ? "#ffffff" : "#fffbfa",
                                            borderRadius: "10px",
                                            padding: "14px 16px",
                                            transition: "all 0.15s ease"
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                                                    <span style={{
                                                        fontSize: "11.5px",
                                                        fontWeight: 700,
                                                        background: "#f1f5f9",
                                                        color: "#334155",
                                                        padding: "2px 8px",
                                                        borderRadius: "4px"
                                                    }}>
                                                        🛍️ {item.platform}
                                                    </span>

                                                    <span style={{
                                                        fontSize: "11px",
                                                        fontWeight: 700,
                                                        padding: "2px 8px",
                                                        borderRadius: "10px",
                                                        background: isActive ? "#ecfdf5" : "#fef2f2",
                                                        color: isActive ? "#047857" : "#b91c1c",
                                                        border: `1px solid ${isActive ? "#a7f3d0" : "#fecaca"}`
                                                    }}>
                                                        {isActive ? "● Active" : "✕ Inactive"}
                                                    </span>

                                                    {item.identifier && (
                                                        <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600 }}>
                                                            #{item.identifier}
                                                        </span>
                                                    )}
                                                </div>

                                                <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
                                                    {item.profileName}
                                                </div>

                                                {item.profileUrl && (
                                                    <div style={{ marginTop: "4px" }}>
                                                        <a
                                                            href={item.profileUrl.startsWith("http") ? item.profileUrl : `https://${item.profileUrl}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                fontSize: "12px",
                                                                color: "#2563eb",
                                                                textDecoration: "none",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "4px",
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            <span>🔗 Profile Link</span>
                                                            <span>↗</span>
                                                        </a>
                                                    </div>
                                                )}

                                                {item.notes && (
                                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                                                        📝 {item.notes}
                                                    </div>
                                                )}

                                                {!isActive && item.deactivationReason && (
                                                    <div style={{
                                                        marginTop: "6px",
                                                        fontSize: "11.5px",
                                                        color: "#991b1b",
                                                        background: "#fee2e2",
                                                        padding: "4px 8px",
                                                        borderRadius: "4px",
                                                        display: "inline-block"
                                                    }}>
                                                        Reason: {item.deactivationReason}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Control */}
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                                                {isActive ? (
                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() => handleToggle(item, "inactive")}
                                                        style={{
                                                            padding: "6px 12px",
                                                            fontSize: "12px",
                                                            fontWeight: 700,
                                                            borderRadius: "6px",
                                                            border: "1px solid #fca5a5",
                                                            background: "#fff1f2",
                                                            color: "#dc2626",
                                                            cursor: isBusy ? "not-allowed" : "pointer"
                                                        }}
                                                    >
                                                        {isBusy ? "Updating..." : "Deactivate ID"}
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() => handleToggle(item, "active")}
                                                        style={{
                                                            padding: "6px 12px",
                                                            fontSize: "12px",
                                                            fontWeight: 700,
                                                            borderRadius: "6px",
                                                            border: "1px solid #86efac",
                                                            background: "#f0fdf4",
                                                            color: "#16a34a",
                                                            cursor: isBusy ? "not-allowed" : "pointer"
                                                        }}
                                                    >
                                                        {isBusy ? "Updating..." : "Activate ID"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Inline Reason Form when Deactivating */}
                                        {isReasonOpen && (
                                            <div style={{
                                                marginTop: "12px",
                                                paddingTop: "10px",
                                                borderTop: "1px dashed #fca5a5",
                                                display: "flex",
                                                gap: "8px",
                                                alignItems: "center"
                                            }}>
                                                <input
                                                    type="text"
                                                    placeholder="Enter reason for deactivation (e.g. Account Flagged)..."
                                                    value={deactivationReason}
                                                    onChange={(e) => setDeactivationReason(e.target.value)}
                                                    style={{
                                                        flex: 1,
                                                        padding: "6px 10px",
                                                        fontSize: "12px",
                                                        border: "1px solid #cbd5e1",
                                                        borderRadius: "6px",
                                                        outline: "none"
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    disabled={isBusy}
                                                    onClick={() => handleToggle(item, "inactive")}
                                                    style={{
                                                        padding: "6px 12px",
                                                        fontSize: "12px",
                                                        fontWeight: 700,
                                                        background: "#dc2626",
                                                        color: "#ffffff",
                                                        borderRadius: "6px",
                                                        border: "none",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    Confirm Deactivation
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setReasonInputId(null)}
                                                    style={{
                                                        padding: "6px 10px",
                                                        fontSize: "12px",
                                                        background: "#f1f5f9",
                                                        color: "#475569",
                                                        borderRadius: "6px",
                                                        border: "1px solid #cbd5e1",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: "14px 24px",
                    borderTop: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    display: "flex",
                    justifyContent: "flex-end"
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: "8px 18px",
                            fontSize: "13px",
                            fontWeight: 700,
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            color: "#334155",
                            cursor: "pointer"
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
