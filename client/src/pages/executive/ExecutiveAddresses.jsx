import { useState, useEffect } from "react";
import {
    fetchExecutiveAddresses,
    createExecutiveAddress,
    deleteExecutiveAddress,
} from "../../services/executive/order";
import "../../styles/theme.css";

export default function ExecutiveAddresses() {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form fields
    const [label, setLabel] = useState("");
    const [recipientName, setRecipientName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [pincode, setPincode] = useState("");

    useEffect(() => {
        loadAddresses();
    }, []);

    const loadAddresses = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await fetchExecutiveAddresses();
            if (res.data.success) {
                setAddresses(res.data.addresses || []);
            }
        } catch (err) {
            console.error("Error loading addresses:", err);
            setError("Failed to load saved delivery addresses");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!label.trim() || !recipientName.trim() || !phoneNumber.trim() || !addressLine1.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
            setError("Please fill out all required fields marked with *");
            return;
        }

        try {
            setSubmitting(true);
            const res = await createExecutiveAddress({
                label: label.trim(),
                recipientName: recipientName.trim(),
                phoneNumber: phoneNumber.trim(),
                addressLine1: addressLine1.trim(),
                addressLine2: addressLine2.trim(),
                city: city.trim(),
                state: state.trim(),
                pincode: pincode.trim(),
            });

            if (res.data.success) {
                setSuccess(`Address "${label}" saved successfully!`);
                setLabel("");
                setRecipientName("");
                setPhoneNumber("");
                setAddressLine1("");
                setAddressLine2("");
                setCity("");
                setState("");
                setPincode("");
                loadAddresses();
            }
        } catch (err) {
            console.error("Error creating address:", err);
            setError(err.response?.data?.message || "Failed to save address");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this saved address?")) return;
        try {
            const res = await deleteExecutiveAddress(id);
            if (res.data.success) {
                setAddresses((prev) => prev.filter((a) => a._id !== id));
            }
        } catch (err) {
            console.error("Error deleting address:", err);
            alert("Failed to delete address");
        }
    };

    return (
        <div style={{ padding: "24px 28px 60px", maxWidth: "1280px", margin: "0 auto", boxSizing: "border-box" }}>
            {/* Header Hero Card */}
            <div className="saas-card" style={{ padding: "24px 28px", marginBottom: "24px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #2563eb, #38bdf8)" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <span className="saas-badge" style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                                📍 Logistics Management
                            </span>
                            <span style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: "500" }}>
                                Saved Shipping Addresses
                            </span>
                        </div>
                        <h1 style={{ fontSize: "26px", fontWeight: "800", color: "var(--slate-900)", margin: 0 }}>
                            Executive Delivery Address Book
                        </h1>
                        <p style={{ color: "var(--slate-500)", fontSize: "13.5px", marginTop: "4px", marginBottom: 0 }}>
                            Save pre-configured shipping delivery addresses to assign to mediators during unit allocation
                        </p>
                    </div>

                    <span className="saas-badge" style={{ background: "#f8fafc", color: "var(--slate-700)", border: "1px solid var(--slate-300)", padding: "6px 14px", fontSize: "13px" }}>
                        Saved Addresses: <b>{addresses.length}</b>
                    </span>
                </div>
            </div>

            {error && (
                <div style={{
                    padding: "12px 16px",
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "10px",
                    color: "#dc2626",
                    fontSize: "13.5px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                }}>
                    <span>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div style={{
                    padding: "12px 16px",
                    backgroundColor: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: "10px",
                    color: "#059669",
                    fontSize: "13.5px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                }}>
                    <span>✓</span>
                    <span>{success}</span>
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 440px) 1fr", gap: "24px", alignItems: "start" }}>
                {/* Form to Add New Address */}
                <div className="saas-card" style={{ padding: "22px" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--slate-900)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>➕</span>
                        <span>Add New Delivery Address</span>
                    </h2>

                    <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "var(--slate-700)", marginBottom: "4px", textTransform: "uppercase" }}>
                                Address Label / Nickname *
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Delhi Warehouse Hub #1"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                required
                                className="saas-input"
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "var(--slate-700)", marginBottom: "4px", textTransform: "uppercase" }}>
                                    Recipient Name *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={recipientName}
                                    onChange={(e) => setRecipientName(e.target.value)}
                                    required
                                    className="saas-input"
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "var(--slate-700)", marginBottom: "4px", textTransform: "uppercase" }}>
                                    Phone Number *
                                </label>
                                <input
                                    type="text"
                                    placeholder="10-digit number"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                    className="saas-input"
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "var(--slate-700)", marginBottom: "4px", textTransform: "uppercase" }}>
                                Address Line 1 (Flat, House no., Building) *
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Flat 402, Lotus Towers"
                                value={addressLine1}
                                onChange={(e) => setAddressLine1(e.target.value)}
                                required
                                className="saas-input"
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "var(--slate-700)", marginBottom: "4px", textTransform: "uppercase" }}>
                                Address Line 2 (Area, Street, Landmark)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Sector 62, Near Metro Station"
                                value={addressLine2}
                                onChange={(e) => setAddressLine2(e.target.value)}
                                className="saas-input"
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "var(--slate-700)", marginBottom: "4px", textTransform: "uppercase" }}>
                                    City *
                                </label>
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    required
                                    className="saas-input"
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "var(--slate-700)", marginBottom: "4px", textTransform: "uppercase" }}>
                                    State *
                                </label>
                                <input
                                    type="text"
                                    placeholder="State"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    required
                                    className="saas-input"
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "var(--slate-700)", marginBottom: "4px", textTransform: "uppercase" }}>
                                    PIN *
                                </label>
                                <input
                                    type="text"
                                    placeholder="6 digits"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value)}
                                    required
                                    className="saas-input"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="saas-btn saas-btn-primary"
                            style={{ width: "100%", marginTop: "6px", padding: "11px" }}
                        >
                            {submitting ? "Saving Address..." : "💾 Save Address to Book"}
                        </button>
                    </form>
                </div>

                {/* Saved Addresses List */}
                <div className="saas-card" style={{ padding: "22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--slate-900)", margin: 0 }}>
                            Saved Delivery Locations ({addresses.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--slate-500)", fontSize: "13px" }}>
                            Loading saved addresses...
                        </div>
                    ) : addresses.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "50px 20px" }}>
                            <div style={{ fontSize: "32px", marginBottom: "10px" }}>📍</div>
                            <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--slate-700)" }}>No Saved Addresses Yet</div>
                            <div style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>
                                Use the form on the left to add shipping destinations. You can assign these addresses to individual units during mediator allocation!
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {addresses.map((addr) => (
                                <div
                                    key={addr._id}
                                    style={{
                                        border: "1px solid var(--slate-200)",
                                        borderRadius: "10px",
                                        padding: "16px",
                                        background: "var(--slate-50)",
                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                            <span style={{ fontSize: "16px" }}>🏷️</span>
                                            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "var(--slate-900)" }}>
                                                {addr.label}
                                            </h3>
                                            {(addr.executiveName || addr.teamCode) && (
                                                <span className="saas-badge" style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", fontSize: "11px", textTransform: "none" }}>
                                                    👤 {addr.executiveName || "Executive"} {addr.teamCode ? `(${addr.teamCode})` : ""}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(addr._id)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "#dc2626",
                                                cursor: "pointer",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                padding: "4px 8px",
                                                borderRadius: "6px"
                                            }}
                                            title="Delete Address"
                                        >
                                            🗑️ Remove
                                        </button>
                                    </div>

                                    <div style={{ fontSize: "13.5px", color: "var(--slate-800)", marginBottom: "4px" }}>
                                        <b>Recipient:</b> {addr.recipientName} • <b>Phone:</b> {addr.phoneNumber}
                                    </div>

                                    <div style={{ fontSize: "13px", color: "var(--slate-600)", lineHeight: "1.4" }}>
                                        {addr.addressLine1}
                                        {addr.addressLine2 && `, ${addr.addressLine2}`}
                                        <br />
                                        {addr.city}, {addr.state} - <b>{addr.pincode}</b>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
