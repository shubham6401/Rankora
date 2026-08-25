import { useState } from "react";
export default function OrderFilters({ setAppliedFilters, status }) {



    let [filters, setFilters] = useState({
        date: "",
        brand: "",
        reviewerName: "",
        orderId: "",
    })
      const disable = status === "pending" || status === "assigned";  



    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value,
        });
    }

    const clearFilters = () => {

       
        setFilters({
            date: "",
            brand: "",
            reviewerName: "",
            orderId: "",
        })
        setAppliedFilters({
            date: "",
            brand: "",
            reviewerName: "",
            orderId: "",

        })
    }

    const HandleFilterSubmit = () => {

         const cleanedFilters = {
        date: filters.date,
        brand: filters.brand.trim(),
        reviewerName: filters.reviewerName.trim(),
        orderId: filters.orderId.trim(),
    };
        setFilters(cleanedFilters);
        setAppliedFilters(cleanedFilters);

        console.log(filters);
    }
    return (
        <div>
            <input
                type="text"
                name="orderId"
                placeholder="Order ID"
                value={filters.orderId}
                disabled={disable}
                onChange={handleFilterChange}
            />

            <input
                type="text"
                name="brand"
                placeholder="Brand"
                value={filters.brand}
                onChange={handleFilterChange}
            />

            <input
                type="text"
                name="reviewerName"
                placeholder="Reviewer Name"
                value={filters.reviewerName}
                disabled={disable}
                onChange={handleFilterChange}
            />

            <input
                type="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
            />
            <br />
            <button onClick={HandleFilterSubmit}>
                Filter
            </button> &nbsp;
            <button onClick={clearFilters}>
                Clear Filters
            </button>
            <br /> <br /> <hr></hr>
        </div>
    );
}