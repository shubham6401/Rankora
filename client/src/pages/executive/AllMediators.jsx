import { fetchAllMediators } from "../../services/executive/order";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/ordersTable.css";

export default function AllMediator() {
    const navigate = useNavigate();
    const [mediators, setMediators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        handleFetchAllMediator();
    }, []);

    const handleFetchAllMediator = async () => {
        try {
            setLoading(true);
            const response = await fetchAllMediators();
            setMediators(response.data.mediators || []);
        } catch (err) {
            console.error("Error loading mediators:", err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = mediators.filter(
        (m) =>
            m.name?.toLowerCase().includes(search.toLowerCase()) ||
            m.mediatorCode?.toLowerCase().includes(search.toLowerCase()) ||
            m.teamCode?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="table-page-container">
            {/* Header */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge">Fulfillment Network</span>
                    <h1 className="table-page-title">🤝 Mediator Directory</h1>
                    <p className="table-page-subtitle">
                        Registered partner mediators authorized under your operations network.
                    </p>
                </div>
                <div className="table-header-actions">
                    <button
                        type="button"
                        className="nav-btn nav-btn-default"
                        onClick={() => navigate("/dashboard-executive")}
                    >
                        ← Executive Dashboard
                    </button>
                    <button
                        type="button"
                        className="nav-btn nav-btn-primary"
                        onClick={() => navigate("/executive-pending-order")}
                    >
                        Assign Orders →
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="table-metrics-bar">
                <div className="metric-card">
                    <span className="metric-label">Registered Mediators</span>
                    <span className="metric-value metric-value-primary">{mediators.length}</span>
                </div>
            </div>

            {/* Filter Search */}
            <div className="filter-bar-card">
                <input
                    type="text"
                    className="filter-input-text"
                    placeholder="Search by mediator name, code, or team..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ minWidth: "320px" }}
                />
                {search && (
                    <button
                        type="button"
                        className="filter-btn-clear"
                        onClick={() => setSearch("")}
                    >
                        Clear Search
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "50px 0" }}>
                    <h3>Loading mediator directory...</h3>
                </div>
            ) : filtered.length > 0 ? (
                <div className="data-table-container">
                    <div className="data-table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Mediator Name</th>
                                    <th>Mediator Code</th>
                                    <th>Team Code</th>
                                    <th>Registered On</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((m, idx) => (
                                    <tr key={m._id}>
                                        <td>{idx + 1}</td>
                                        <td className="product-name-cell" style={{ color: "var(--slate-900)" }}>
                                            {m.name}
                                        </td>
                                        <td>
                                            <span className="qty-pill qty-pill-warning">
                                                {m.mediatorCode}
                                            </span>
                                        </td>
                                        <td>{m.teamCode || "Default"}</td>
                                        <td>
                                            {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "Active"}
                                        </td>
                                        <td>
                                            <span className="status-badge status-badge-completed">
                                                Verified
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="empty-state-card">
                    <div className="empty-state-icon">👥</div>
                    <h3 className="empty-state-title">No Mediators Found</h3>
                    <p className="empty-state-text">
                        {search ? "No mediators match your search filter." : "No mediators are currently registered."}
                    </p>
                </div>
            )}
        </div>
    );
}