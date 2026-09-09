import DisplayOrder from "../../component/DisplayOrder";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getOrder } from "../../services/orders";
import "../../styles/ordersTable.css";

export default function DisplayOrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            fetchOrder();
        }
    }, [id]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getOrder(id);
            if (response.data?.order) {
                setOrder(response.data.order);
            } else {
                setError("Order details could not be found.");
            }
        } catch (err) {
            console.error("Error fetching order details:", err);
            setError(err?.response?.data?.message || "Failed to load order details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="table-page-container">
                <div className="empty-state-card">
                    <div className="empty-state-icon">⏳</div>
                    <h2 className="empty-state-title">Loading Order Details...</h2>
                    <p className="empty-state-text">Fetching order specifications, units breakdown, and verification proofs.</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="table-page-container">
                <div className="empty-state-card">
                    <div className="empty-state-icon">⚠️</div>
                    <h2 className="empty-state-title">Unable to Load Order</h2>
                    <p className="empty-state-text">{error || "The requested order could not be loaded."}</p>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "16px" }}>
                        <button
                            onClick={fetchOrder}
                            className="table-btn table-btn-primary"
                        >
                            🔄 Retry
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="table-btn table-btn-outline"
                        >
                            ← Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <DisplayOrder order={order} />
        </div>
    );
}