import { useState, useEffect } from "react"
import { fetchAllExecutiveAssignedOrders } from "../../services/executive/order";
import OrderCard from "../../component/executive/OrderCard";
import OrderFilters from "../../component/executive/OrderFilters";

export default function PendingOrders() {
    let [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchOrders();
    }, []);



    let [appliedFilters, setAppliedFilters] = useState({
        date: "",
        brand: "",
        reviewerName: "",
        orderId: "",
    })

    const filteredOrders = orders.filter((order) => {
        let orderIdMatch = !appliedFilters.orderId || order.orderId?.toLowerCase().includes(
            appliedFilters.orderId.toLowerCase()
        );


        let brandMatch = !appliedFilters.brand || order.brand?.toLowerCase().includes(
            appliedFilters.brand.toLowerCase()
        );

        let reviewerNameMatch = !appliedFilters.reviewerName || order.reviewerName?.toLowerCase().includes(
            appliedFilters.reviewerName.toLowerCase()
        );

        let dateMatch = !appliedFilters.date || new Date(order.createdAt).toISOString().split("T")[0] ===
            appliedFilters.date;


        return orderIdMatch && brandMatch && reviewerNameMatch && dateMatch
    })

    const fetchOrders = async () => {
        try {
            let response = await fetchAllExecutiveAssignedOrders();
            setOrders(response.data.orders);

        }
        catch (err) {
            console.log(err);
        }



    }
    return (
        <>
            
            {filteredOrders.length!==0 ?  <div>
                <h1>Assigned Orders</h1>

                <OrderFilters setAppliedFilters={setAppliedFilters} status={"assigned"} />


                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Brand</th>
                            <th>Platform</th>
                            <th>Price</th>
                            <th>Executive Name</th>
                            <th>Created On</th>
                            <th>Status</th>
                            <th>Team Code</th>

                            <th>Assigned To</th>
                            <th>Mediator Code</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {
                            filteredOrders.map((order) => (
                                <OrderCard key={order._id} order={order} />
                            )
                            )
                        }

                    </tbody>
                </table>



            </div> : "No assigned Orders" }
            </>
    )
}