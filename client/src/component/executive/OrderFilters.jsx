import { useState } from "react";
import "../../styles/ordersTable.css";

export default function OrderFilters({ setAppliedFilters, status }) {
    const [filters, setFilters] = useState({
        date: "",
        brand: "",
        reviewerName: "",
        orderId: "",
    });
    const disable = status === "pending" || status === "assigned";

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value,
        });
    };

    const clearFilters = () => {
        const reset = {
            date: "",
            brand: "",
            reviewerName: "",
            orderId: "",
        };
        setFilters(reset);
        setAppliedFilters(reset);
    };

    const handleFilterSubmit = () => {
        const cleanedFilters = {
            date: filters.date,
            brand: filters.brand.trim(),
            reviewerName: filters.reviewerName.trim(),
            orderId: filters.orderId.trim(),
        };
        setFilters(cleanedFilters);
        setAppliedFilters(cleanedFilters);
    };

    return (
        <div className="filter-bar-card">
            <input
                type="text"
                className="filter-input-text"
                name="orderId"
                placeholder={disable ? "Order ID (N/A in this stage)" : "Filter by Order ID"}
                value={filters.orderId}
                disabled={disable}
                onChange={handleFilterChange}
            />

            <input
                type="text"
                className="filter-input-text"
                name="brand"
                placeholder="Filter by Brand"
                value={filters.brand}
                onChange={handleFilterChange}
            />

            <input
                type="text"
                className="filter-input-text"
                name="reviewerName"
                placeholder={disable ? "Reviewer (N/A in this stage)" : "Filter by Reviewer"}
                value={filters.reviewerName}
                disabled={disable}
                onChange={handleFilterChange}
            />

            <input
                type="date"
                className="filter-input-text"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
            />

            <button type="button" className="filter-btn-submit" onClick={handleFilterSubmit}>
                Apply Filters
            </button>
            <button type="button" className="filter-btn-clear" onClick={clearFilters}>
                Reset
            </button>
        </div>
    );
}