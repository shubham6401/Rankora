import { useState, useEffect } from "react";
import { fetchExecutiveAddresses, createExecutiveAddress, deleteExecutiveAddress } from "../../services/executive/order";

export default function ExecutiveAddresses() {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form state
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
            const res = await fetchExecutiveAddresses();
            if (res.data.success) {
                setAddresses(res.data.addresses || []);
            }
        } catch (err) {
            console.error("Failed to load addresses:", err);
            setError("Unable to load saved delivery addresses");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!label.trim() || !recipientName.trim() || !phoneNumber.trim() || !addressLine1.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
            setError("Please fill out all required address fields");
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
        <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto", color: "#f8fafc" }}>
            {/* Header */}
            <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>📍</span>
                    <span>Executive Delivery Address Book</span>
                </h1>
                <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "0.3rem" }}>
                    Save pre-configured shipping delivery addresses to assign to mediators during unit allocation
                </p>
            </div>

            {error && (
                <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "8px", color: "#f87171", marginBottom: "1.5rem" }}>
                    ⚠️ {error}
                </div>
            )}

            {success && (
                <div style={{ padding: "1rem", backgroundColor: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981", borderRadius: "8px", color: "#34d399", marginBottom: "1.5rem" }}>
                    ✓ {success}
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 420px) 1fr", gap: "2rem", alignItems: "start" }}>
                {/* Form to Add New Address */}
                <div style={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "14px", padding: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "1rem" }}>
                        ➕ Add New Delivery Address
                    </h2>
                    <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.25rem" }}>Address Label / Nickname *</label>
                            <input
                                type="text"
                                placeholder="e.g. Delhi Warehouse Hub #1"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                required
                                style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", backgroundColor: "#1f2937", border: "1px solid #374151", color: "#ffffff", boxSizing: "border-box" }}
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.25rem" }}>Recipient Name *</label>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={recipientName}
                                    onChange={(e) => setRecipientName(e.target.value)}
                                    required
                                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", backgroundColor: "#1f2937", border: "1px solid #374151", color: "#ffffff", boxSizing: "border-box" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.25rem" }}>Phone Number *</label>
                                <input
                                    type="text"
                                    placeholder="10-digit number"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", backgroundColor: "#1f2937", border: "1px solid #374151", color: "#ffffff", boxSizing: "border-box" }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.25rem" }}>Address Line 1 *</label>
                            <input
                                type="text"
                                placeholder="Flat, House no., Building, Street"
                                value={addressLine1}
                                onChange={(e) => setAddressLine1(e.target.value)}
                                required
                                style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", backgroundColor: "#1f2937", border: "1px solid #374151", color: "#ffffff", boxSizing: "border-box" }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.25rem" }}>Address Line 2 (Optional)</label>
                            <input
                                type="text"
                                placeholder="Area, Landmark, Colony"
                                value={addressLine2}
                                onChange={(e) => setAddressLine2(e.target.value)}
                                style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", backgroundColor: "#1f2937", border: "1px solid #374151", color: "#ffffff", boxSizing: "border-box" }}
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.25rem" }}>City *</label>
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    required
                                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", backgroundColor: "#1f2937", border: "1px solid #374151", color: "#ffffff", boxSizing: "border-box" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.25rem" }}>State *</label>
                                <input
                                    type="text"
                                    placeholder="State"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    required
                                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", backgroundColor: "#1f2937", border: "1px solid #374151", color: "#ffffff", boxSizing: "border-box" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.25rem" }}>Pincode *</label>
                                <input
                                    type="text"
                                    placeholder="Pincode"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value)}
                                    required
                                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", backgroundColor: "#1f2937", border: "1px solid #374151", color: "#ffffff", boxSizing: "border-box" }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                marginTop: "0.5rem",
                                padding: "0.75rem",
                                borderRadius: "8px",
                                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                                color: "#ffffff",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                                opacity: submitting ? 0.7 : 1
                            }}
                        >
                            {submitting ? "Saving..." : "Save Delivery Address"}
                        </button>
                    </form>
                </div>

                {/* Saved Addresses List */}
                <div>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "1rem" }}>
                        Saved Delivery Locations ({addresses.length})
                    </h2>
                    {loading ? (
                        <div style={{ color: "#9ca3af" }}>Loading addresses...</div>
                    ) : addresses.length === 0 ? (
                        <div style={{ padding: "3rem", textAlign: "center", backgroundColor: "#111827", borderRadius: "12px", border: "1px solid #1f2937", color: "#6b7280" }}>
                            No addresses saved yet. Use the form on the left to add your delivery hubs or test locations.
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                            {addresses.map((addr) => (
                                <div
                                    key={addr._id}
                                    style={{
                                        backgroundColor: "#111827",
                                        border: "1px solid #1f2937",
                                        borderRadius: "12px",
                                        padding: "1.25rem",
                                        position: "relative"
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                                        <span style={{
                                            backgroundColor: "rgba(99, 102, 241, 0.2)",
                                            color: "#818cf8",
                                            fontWeight: "700",
                                            fontSize: "0.75rem",
                                            padding: "0.2rem 0.5rem",
                                            borderRadius: "4px"
                                        }}>
                                            {addr.label}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(addr._id)}
                                            title="Delete address"
                                            style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.9rem" }}
                                        >
                                            🗑️
                                        </button>
                                    </div>

                                    <div style={{ fontWeight: "700", color: "#f3f4f6", fontSize: "0.95rem" }}>
                                        {addr.recipientName}
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.5rem" }}>
                                        📞 {addr.phoneNumber}
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: "1.4" }}>
                                        {addr.addressLine1}
                                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                                        <br />
                                        {addr.city}, {addr.state} - {addr.pincode}
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
