import DisplayOrder from "../../component/DisplayOrder";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getOrder } from "../../services/orders";
import "../../styles/ordersTable.css";

export default function DisplayOrderDetails() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const response = await getOrder(id);
            setOrder(response.data.order);
        } catch (err) {
            console.error("Error fetching order details:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !order) {
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

    return (
        <div>
            <DisplayOrder order={order} />
        </div>
    );
}