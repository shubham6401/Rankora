import { useState, useEffect } from "react";
import {
    fetchMediatorPlatformIds,
    addMediatorPlatformId,
    updateMediatorPlatformId,
    deleteMediatorPlatformId,
} from "../../services/mediator/orders";
import "../../styles/ordersTable.css";

const PLATFORMS = [
    { label: "Amazon", value: "Amazon", badgeBg: "#fff7ed", badgeColor: "#c2410c", border: "#fed7aa" },
    { label: "Flipkart", value: "Flipkart", badgeBg: "#eff6ff", badgeColor: "#1d4ed8", border: "#bfdbfe" },
    { label: "Myntra", value: "Myntra", badgeBg: "#fdf2f8", badgeColor: "#be185d", border: "#fbcfe8" },
    { label: "Nykaa", value: "Nykaa", badgeBg: "#fff1f2", badgeColor: "#e11d48", border: "#fecdd3" },
    { label: "Meesho", value: "Meesho", badgeBg: "#f5f3ff", badgeColor: "#6d28d9", border: "#ddd6fe" },
    { label: "Other", value: "Other", badgeBg: "#f1f5f9", badgeColor: "#475569", border: "#cbd5e1" },
];

export default function MediatorPlatformIds() {
    const [ids, setIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterPlatform, setFilterPlatform] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [modalForm, setModalForm] = useState({
        platform: "Amazon",
        profileName: "",
        profileUrl: "",
        identifier: "",
        notes: "",
    });

    useEffect(() => {
        loadPlatformIds();
    }, []);

    const loadPlatformIds = async () => {
        try {
            setLoading(true);
            const res = await fetchMediatorPlatformIds();
            if (res.data?.success) {
                setIds(res.data.platformIds || []);
            }
        } catch (err) {
            console.error("Failed to load platform IDs:", err);
            setError("Could not load platform account IDs.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setEditingId(null);
        setModalForm({
            platform: "Amazon",
            profileName: "",
            profileUrl: "",
            identifier: "",
            notes: "",
        });
        setError("");
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item) => {
        setEditingId(item);
        setModalForm({
            platform: item.platform || "Amazon",
            profileName: item.profileName || "",
            profileUrl: item.profileUrl || "",
            identifier: item.identifier || "",
            notes: item.notes || "",
        });
        setError("");
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setError("");
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError("");
        if (!modalForm.profileName.trim()) {
            setError("Profile Name / Buyer Name is required.");
            return;
        }

        try {
            setSubmitting(true);
            if (editingId) {
                const res = await updateMediatorPlatformId(editingId._id, modalForm);
                if (res.data?.success) {
                    setIds((prev) =>
                        prev.map((id) => (id._id === editingId._id ? res.data.platformId : id))
                    );
                    handleCloseModal();
                }
            } else {
                const res = await addMediatorPlatformId(modalForm);
                if (res.data?.success) {
                    setIds((prev) => [res.data.platformId, ...prev]);
                    handleCloseModal();
                }
            }
        } catch (err) {
            console.error("Failed to save platform ID:", err);
            setError(err.response?.data?.message || "Failed to save buyer platform ID.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (idToDelete) => {
        if (!window.confirm("Are you sure you want to remove this buyer profile ID?")) return;
        try {
            const res = await deleteMediatorPlatformId(idToDelete);
            if (res.data?.success) {
                setIds((prev) => prev.filter((item) => item._id !== idToDelete));
            }
        } catch (err) {
            console.error("Failed to delete platform ID:", err);
            alert(err.response?.data?.message || "Could not delete platform ID.");
        }
    };

    const getPlatformStyle = (pName) => {
        const found = PLATFORMS.find((p) => p.value.toLowerCase() === (pName || "").toLowerCase());
        return found || { badgeBg: "#f1f5f9", badgeColor: "#475569", border: "#cbd5e1" };
    };

    const filteredIds = ids.filter((item) => {
        if (filterPlatform !== "all" && item.platform.toLowerCase() !== filterPlatform.toLowerCase()) {
            return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const matchName = item.profileName?.toLowerCase().includes(q);
            const matchId = item.identifier?.toLowerCase().includes(q);
            const matchNotes = item.notes?.toLowerCase().includes(q);
            const matchUrl = item.profileUrl?.toLowerCase().includes(q);
            if (!matchName && !matchId && !matchNotes && !matchUrl) return false;
        }
        return true;
    });

    const activeCount = ids.filter((item) => item.status === "active").length;
    const inactiveCount = ids.filter((item) => item.status === "inactive").length;

    return (
        <div className="table-page-container">
            {/* Header & Quick Action */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "16px",
                marginBottom: "24px"
            }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "28px" }}>💳</span>
                        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                            Buyer Platform IDs
                        </h1>
                        <span style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: "12px",
                            backgroundColor: "#e0f2fe",
                            color: "#0369a1",
                            border: "1px solid #bae6fd"
                        }}>
                            Profile Vault
                        </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b", maxWidth: "680px" }}>
                        Register your e-commerce buyer accounts (Amazon, Flipkart, Myntra, Nykaa, Meesho). Active accounts will automatically auto-fill reviewer credentials when placing orders.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleOpenAddModal}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "14px",
                        padding: "10px 18px",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(37,99,235,0.25)",
                        transition: "background-color 0.15s"
                    }}
                >
                    <span>➕</span>
                    <span>Add New Platform ID</span>
                </button>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "24px"
            }}>
                <div style={{
                    background: "#ffffff",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                        Total Registered IDs
                    </div>
                    <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
                        {ids.length}
                    </div>
                </div>

                <div style={{
                    background: "#ffffff",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    border: "1px solid #bbf7d0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#15803d", textTransform: "uppercase" }}>
                        Active Buyer IDs
                    </div>
                    <div style={{ fontSize: "26px", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>
                        {activeCount}
                    </div>
                </div>

                <div style={{
                    background: "#ffffff",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    border: "1px solid #fecaca",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#b91c1c", textTransform: "uppercase" }}>
                        Inactive / Suspended IDs
                    </div>
                    <div style={{ fontSize: "26px", fontWeight: 800, color: "#dc2626", marginTop: "4px" }}>
                        {inactiveCount}
                    </div>
                </div>
            </div>

            {/* Filters & Search Toolbar */}
            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                marginBottom: "20px"
            }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#475569" }}>Platform:</span>
                    <button
                        type="button"
                        onClick={() => setFilterPlatform("all")}
                        style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "12.5px",
                            fontWeight: 600,
                            cursor: "pointer",
                            border: filterPlatform === "all" ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                            backgroundColor: filterPlatform === "all" ? "#eff6ff" : "#ffffff",
                            color: filterPlatform === "all" ? "#1d4ed8" : "#475569",
                        }}
                    >
                        All ({ids.length})
                    </button>
                    {PLATFORMS.map((p) => {
                        const count = ids.filter((item) => item.platform.toLowerCase() === p.value.toLowerCase()).length;
                        return (
                            <button
                                key={p.value}
                                type="button"
                                onClick={() => setFilterPlatform(p.value)}
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    fontSize: "12.5px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    border: filterPlatform === p.value ? `1.5px solid ${p.badgeColor}` : "1px solid #cbd5e1",
                                    backgroundColor: filterPlatform === p.value ? p.badgeBg : "#ffffff",
                                    color: filterPlatform === p.value ? p.badgeColor : "#475569",
                                }}
                            >
                                {p.label} {count > 0 && `(${count})`}
                            </button>
                        );
                    })}
                </div>

                <div style={{ position: "relative", minWidth: "240px", flex: "1 1 200px", maxWidth: "340px" }}>
                    <input
                        type="text"
                        placeholder="Search by name, ID tag, notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "8px 12px 8px 32px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            outline: "none",
                        }}
                    />
                    <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                        🔍
                    </span>
                </div>
            </div>

            {/* Platform ID Cards Grid */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</div>
                    <div style={{ fontWeight: 700 }}>Loading Registered Platform IDs...</div>
                </div>
            ) : filteredIds.length === 0 ? (
                <div style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px dashed #cbd5e1",
                    padding: "48px 24px",
                    textAlign: "center"
                }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>💳</div>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 6px 0" }}>
                        No Platform IDs Found
                    </h3>
                    <p style={{ fontSize: "13.5px", color: "#64748b", margin: "0 0 16px 0" }}>
                        {searchQuery || filterPlatform !== "all"
                            ? "No accounts match your current filter."
                            : "You haven't registered any buyer platform accounts yet."}
                    </p>
                    <button
                        type="button"
                        onClick={handleOpenAddModal}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer"
                        }}
                    >
                        + Add Your First Buyer ID
                    </button>
                </div>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: "18px"
                }}>
                    {filteredIds.map((item) => {
                        const styleInfo = getPlatformStyle(item.platform);
                        const isActive = item.status === "active";
                        return (
                            <div
                                key={item._id}
                                style={{
                                    background: "#ffffff",
                                    borderRadius: "12px",
                                    border: isActive ? "1px solid #e2e8f0" : "1.5px solid #fecaca",
                                    padding: "18px",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                <div>
                                    {/* Top Row: Platform & Status Badge */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                        <span style={{
                                            backgroundColor: styleInfo.badgeBg,
                                            color: styleInfo.badgeColor,
                                            border: `1px solid ${styleInfo.border}`,
                                            fontWeight: 700,
                                            fontSize: "12px",
                                            padding: "3px 10px",
                                            borderRadius: "6px",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px"
                                        }}>
                                            🛍️ {item.platform}
                                        </span>

                                        <span style={{
                                            backgroundColor: isActive ? "#ecfdf5" : "#fef2f2",
                                            color: isActive ? "#047857" : "#b91c1c",
                                            border: `1px solid ${isActive ? "#a7f3d0" : "#fecaca"}`,
                                            fontWeight: 700,
                                            fontSize: "11px",
                                            padding: "2px 8px",
                                            borderRadius: "12px",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px"
                                        }}>
                                            <span>{isActive ? "●" : "✕"}</span>
                                            <span>{isActive ? "Active" : "Inactive"}</span>
                                        </span>
                                    </div>

                                    {/* Profile Name & Identifier */}
                                    <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                                        {item.profileName}
                                    </h3>
                                    {item.identifier && (
                                        <div style={{
                                            fontSize: "12px",
                                            color: "#475569",
                                            fontWeight: 600,
                                            backgroundColor: "#f8fafc",
                                            display: "inline-block",
                                            padding: "2px 8px",
                                            borderRadius: "4px",
                                            border: "1px solid #e2e8f0",
                                            marginBottom: "8px"
                                        }}>
                                            Tag: #{item.identifier}
                                        </div>
                                    )}

                                    {/* Profile URL Link */}
                                    {item.profileUrl && (
                                        <div style={{ margin: "6px 0 10px 0" }}>
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
                                                    fontWeight: 600,
                                                    maxWidth: "100%",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap"
                                                }}
                                            >
                                                <span>🔗</span>
                                                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>View Buyer Profile</span>
                                                <span>↗</span>
                                            </a>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {item.notes && (
                                        <p style={{
                                            fontSize: "12px",
                                            color: "#64748b",
                                            lineHeight: "1.4",
                                            margin: "6px 0",
                                            background: "#f8fafc",
                                            padding: "8px 10px",
                                            borderRadius: "6px",
                                            border: "1px solid #f1f5f9"
                                        }}>
                                            📝 {item.notes}
                                        </p>
                                    )}

                                    {/* Inactive Callout from Executive */}
                                    {!isActive && (
                                        <div style={{
                                            marginTop: "10px",
                                            padding: "8px 10px",
                                            background: "#fef2f2",
                                            border: "1px solid #fecaca",
                                            borderRadius: "6px",
                                            fontSize: "11.5px",
                                            color: "#991b1b"
                                        }}>
                                            <b>⚠️ Deactivated by Executive:</b>{" "}
                                            {item.deactivationReason || "Contact your executive to re-activate this buyer profile."}
                                        </div>
                                    )}
                                </div>

                                {/* Footer Action Buttons */}
                                <div style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: "8px",
                                    borderTop: "1px solid #f1f5f9",
                                    paddingTop: "12px",
                                    marginTop: "14px"
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenEditModal(item)}
                                        style={{
                                            padding: "5px 12px",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            borderRadius: "6px",
                                            border: "1px solid #cbd5e1",
                                            backgroundColor: "#ffffff",
                                            color: "#334155",
                                            cursor: "pointer"
                                        }}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(item._id)}
                                        style={{
                                            padding: "5px 12px",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            borderRadius: "6px",
                                            border: "1px solid #fecaca",
                                            backgroundColor: "#fff1f2",
                                            color: "#b91c1c",
                                            cursor: "pointer"
                                        }}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal for Adding or Editing ID */}
            {isModalOpen && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.55)",
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
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                        width: "100%",
                        maxWidth: "480px",
                        overflow: "hidden"
                    }}>
                        <div style={{
                            padding: "18px 22px",
                            borderBottom: "1px solid #e2e8f0",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#f8fafc"
                        }}>
                            <div>
                                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                                    {editingId ? "Edit Buyer Platform ID" : "Register New Platform ID"}
                                </h3>
                                <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                                    Record your buyer account credentials for rapid order placement.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    fontSize: "18px",
                                    color: "#94a3b8",
                                    cursor: "pointer"
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {error && (
                            <div style={{
                                margin: "14px 22px 0 22px",
                                padding: "8px 12px",
                                background: "#fff1f2",
                                border: "1px solid #fecdd3",
                                borderRadius: "6px",
                                color: "#be123c",
                                fontSize: "12.5px"
                            }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSave} style={{ padding: "20px 22px" }}>
                            {/* Platform */}
                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                                    Platform <span style={{ color: "#e11d48" }}>*</span>
                                </label>
                                <select
                                    value={modalForm.platform}
                                    onChange={(e) => setModalForm({ ...modalForm, platform: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "9px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13.5px",
                                        fontWeight: 600,
                                        outline: "none"
                                    }}
                                >
                                    {PLATFORMS.map((p) => (
                                        <option key={p.value} value={p.value}>
                                            {p.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Profile Name */}
                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                                    Buyer Profile Name <span style={{ color: "#e11d48" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Rohan Sharma"
                                    required
                                    value={modalForm.profileName}
                                    onChange={(e) => setModalForm({ ...modalForm, profileName: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "9px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13.5px",
                                        outline: "none"
                                    }}
                                />
                            </div>

                            {/* Profile URL */}
                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                                    Buyer Profile URL (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. amazon.in/gp/profile/amzn1.account.XYZ"
                                    value={modalForm.profileUrl}
                                    onChange={(e) => setModalForm({ ...modalForm, profileUrl: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "9px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none"
                                    }}
                                />
                            </div>

                            {/* Identifier */}
                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                                    Internal Identifier / Tag (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. prime_delhi_01 or mobile hint"
                                    value={modalForm.identifier}
                                    onChange={(e) => setModalForm({ ...modalForm, identifier: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "9px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none"
                                    }}
                                />
                            </div>

                            {/* Notes */}
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                                    Personal Notes (Optional)
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="e.g. Daily limit 2 reviews, tied to SBI card."
                                    value={modalForm.notes}
                                    onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        resize: "vertical"
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    style={{
                                        padding: "9px 16px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        backgroundColor: "#ffffff",
                                        color: "#475569",
                                        fontWeight: 600,
                                        fontSize: "13px",
                                        cursor: "pointer"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        padding: "9px 20px",
                                        borderRadius: "6px",
                                        border: "none",
                                        backgroundColor: "#2563eb",
                                        color: "#ffffff",
                                        fontWeight: 700,
                                        fontSize: "13px",
                                        cursor: submitting ? "not-allowed" : "pointer",
                                        opacity: submitting ? 0.7 : 1
                                    }}
                                >
                                    {submitting ? "Saving..." : editingId ? "Update ID" : "Register ID"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
