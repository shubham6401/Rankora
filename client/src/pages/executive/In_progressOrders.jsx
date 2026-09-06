import { useState, useEffect } from "react";
import { fetchAllExecutiveIn_ProgressOrders } from "../../services/executive/order";
import { useNavigate } from "react-router-dom";
import OrderCard from "../../component/executive/OrderCard";
import OrderFilters from "../../component/executive/OrderFilters";
import "../../styles/ordersTable.css";

export default function In_progressOrders() {
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
            const response = await fetchAllExecutiveIn_ProgressOrders();
            setOrders(response.data.orders || []);
        } catch (err) {
            console.error("Error loading in-progress orders:", err);
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

    const totalUnits = orders.reduce((acc, order) => {
        const units = (order.orderUnits || []).filter((u) => u.status === "in_progress");
        return acc + units.length;
    }, 0);

    return (
        <div className="table-page-container">
            {/* Header */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge">Execution Pipeline</span>
                    <h1 className="table-page-title">⚡ In-Progress Orders</h1>
                    <p className="table-page-subtitle">
                        Orders accepted by mediators currently in purchase, transit, or delivery stage.
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
                        className="nav-btn nav-btn-amber"
                        onClick={() => navigate("/executive-pending_refund-order")}
                    >
                        Pending Refund Orders →
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="table-metrics-bar">
                <div className="metric-card">
                    <span className="metric-label">In-Progress Batches</span>
                    <span className="metric-value metric-value-primary">{orders.length}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Active Units Under Fulfillment</span>
                    <span className="metric-value metric-value-emerald">{totalUnits} Units</span>
                </div>
            </div>

            {/* Filters */}
            <OrderFilters setAppliedFilters={setAppliedFilters} status="in_progress" />

            {/* Data Table or Empty */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "50px 0" }}>
                    <h3>Loading in-progress orders...</h3>
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
                                    <th>Assigned To</th>
                                    <th>Mediator Code</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => (
                                    <OrderCard
                                        key={order._id}
                                        order={order}
                                        status="in_progress"
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="empty-state-card">
                    <div className="empty-state-icon">⚡</div>
                    <h3 className="empty-state-title">No Orders In-Progress</h3>
                    <p className="empty-state-text">
                        There are currently no orders being fulfilled. Once mediators accept assigned units, they appear here.
                    </p>
                    <button
                        type="button"
                        className="nav-btn nav-btn-default"
                        onClick={() => navigate("/executive-assigned-order")}
                    >
                        Check Assigned Orders
                    </button>
                </div>
            )}
        </div>
    );
}