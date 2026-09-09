import { useState, useEffect } from "react";
import { fetchAllExecutivePendingOrders, fetchAllMediators } from "../../services/executive/order";
import { useNavigate } from "react-router-dom";
import PendingOrderCard from "../../component/executive/PendingOrderCard";
import OrderFilters from "../../component/executive/OrderFilters";
import PipelineStepper from "../../component/layout/PipelineStepper";
import "../../styles/ordersTable.css";

export default function PendingOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [mediators, setMediators] = useState([]);
    const [loading, setLoading] = useState(true);

    const [appliedFilters, setAppliedFilters] = useState({
        date: "",
        brand: "",
        reviewerName: "",
        orderId: "",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [ordersRes, medRes] = await Promise.all([
                fetchAllExecutivePendingOrders(),
                fetchAllMediators(),
            ]);
            setOrders(ordersRes.data.orders || []);
            setMediators(medRes.data.mediators || []);
        } catch (err) {
            console.error("Error loading pending orders data:", err);
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

    const totalUnassignedUnits = orders.reduce(
        (acc, curr) => acc + (curr.summary?.unassigned || 0),
        0
    );

    return (
        <div className="table-page-container">
            {/* Visual Pipeline Stepper */}
            <PipelineStepper role="executive" />

            {/* Header */}
            <div className="table-page-header">
                <div className="table-header-info">
                    <span className="table-page-badge">Stage 1</span>
                    <h1 className="table-page-title">Unassigned Orders</h1>
                    <p className="table-page-subtitle">
                        Orders waiting to be assigned to mediators.
                    </p>
                </div>
                <div className="table-header-actions">
                    <button
                        type="button"
                        className="nav-btn nav-btn-primary"
                        onClick={() => navigate("/executive-add-order")}
                    >
                        ➕ Create Order
                    </button>
                    <button
                        type="button"
                        className="nav-btn nav-btn-default"
                        onClick={() => navigate("/executive-pending-payment")}
                    >
                        Advance Payments →
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="table-metrics-bar">
                <div className="metric-card">
                    <span className="metric-label">Orders</span>
                    <span className="metric-value metric-value-primary">{orders.length}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Unassigned Units</span>
                    <span className="metric-value">{totalUnassignedUnits}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Mediators</span>
                    <span className="metric-value">{mediators.length}</span>
                </div>
            </div>

            {/* Filters */}
            <OrderFilters setAppliedFilters={setAppliedFilters} status="pending" />

            {/* Data Table or Empty */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "50px 0" }}>
                    <h3>Loading pending orders...</h3>
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
                                    <th>Total Qty</th>
                                    <th>Unassigned</th>
                                    <th>Team Code</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => (
                                    <PendingOrderCard
                                        key={order._id}
                                        order={order}
                                        status="unassigned"
                                        mediators={mediators}
                                        onOrderUpdated={loadData}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="empty-state-card">
                    <div className="empty-state-icon">📋</div>
                    <h3 className="empty-state-title">No Pending Orders in Pool</h3>
                    <p className="empty-state-text">
                        All campaign units have either been assigned to mediators or no matching orders exist with the current filters.
                    </p>
                    <button
                        type="button"
                        className="nav-btn nav-btn-primary"
                        onClick={() => navigate("/executive-add-order")}
                    >
                        ➕ Create a New Brand Order
                    </button>
                </div>
            )}
        </div>
    );
}
