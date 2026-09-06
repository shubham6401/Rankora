import { useState, useEffect } from "react";
import { fetchAllExecutiveAssignedOrders } from "../../services/executive/order";
import { useNavigate } from "react-router-dom";
import AssignedOrderCard from "../../component/executive/AssignedOrderCard";
import OrderFilters from "../../component/executive/OrderFilters";
import "../../styles/ordersTable.css";

export default function AssignedOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [appliedFilters, setAppliedFilters] = useState({
        date: "",
        brand: "",
        reviewerName: "",
        orderId: "",
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await fetchAllExecutiveAssignedOrders();
            setOrders(response.data.orders || []);
        } catch (err) {
            console.error("Error loading assigned orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter((order) => {
        const orderIdMatch =
            !appliedFilters.orderId ||
            order.orderId?.toLowerCase().includes(appliedFilters.orderId.toLowerCase());

        const brandMatch =
            !appliedFilters.brand ||
            order.brand?.toLowerCase().includes(appliedFilters.brand.toLowerCase());

        const reviewerNameMatch =
            !appliedFilters.reviewerName ||
            order.reviewerName?.toLowerCase().includes(appliedFilters.reviewerName.toLowerCase());

        const dateMatch =
            !appliedFilters.date ||
            new Date(order.createdAt).toISOString().split("T")[0] === appliedFilters.date;

        return orderIdMatch && brandMatch && reviewerNameMatch && dateMatch;
    });

    const totalAssignedUnits = orders.reduce((acc, order) => {
        const units = (order.orderUnits || []).filter((u) => u.status === "assigned");
        return acc + units.length;
    }, 0);

    return (
        <div className="table-page-container">
            {/* Header */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge">Fulfillment Pipeline</span>
                    <h1 className="table-page-title">🤝 Mediator Assigned Orders</h1>
                    <p className="table-page-subtitle">
                        Units assigned with advance payment proof forwarded to mediators for order placement.
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
                        className="nav-btn nav-btn-emerald"
                        onClick={() => navigate("/executive-in_progress-order")}
                    >
                        In Progress Orders →
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="table-metrics-bar">
                <div className="metric-card">
                    <span className="metric-label">Assigned Batches</span>
                    <span className="metric-value metric-value-primary">{orders.length}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Total Assigned Units</span>
                    <span className="metric-value metric-value-amber">{totalAssignedUnits} Units</span>
                </div>
            </div>

            {/* Filters */}
            <OrderFilters setAppliedFilters={setAppliedFilters} status="assigned" />

            {/* Data Table or Empty */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "50px 0" }}>
                    <h3>Loading assigned orders...</h3>
                </div>
            ) : filteredOrders.length > 0 ? (
                <div className="data-table-container">
                    <div className="data-table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Brand</th>
                                    <th>Platform</th>
                                    <th>Price</th>
                                    <th>Executive</th>
                                    <th>Created On</th>
                                    <th>Status</th>
                                    <th>Team Code</th>
                                    <th>Mediator</th>
                                    <th>Mediator Code</th>
                                    <th>Assigned Qty</th>
                                    <th>Payment Proof (SS)</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => (
                                    <AssignedOrderCard
                                        key={order._id}
                                        order={order}
                                        status="assigned"
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="empty-state-card">
                    <div className="empty-state-icon">🤝</div>
                    <h3 className="empty-state-title">No Assigned Orders</h3>
                    <p className="empty-state-text">
                        There are currently no orders in the assigned stage. Assign pending orders to mediators to see them here.
                    </p>
                    <button
                        type="button"
                        className="nav-btn nav-btn-primary"
                        onClick={() => navigate("/executive-pending-order")}
                    >
                        View Pending Orders
                    </button>
                </div>
            )}
        </div>
    );
}