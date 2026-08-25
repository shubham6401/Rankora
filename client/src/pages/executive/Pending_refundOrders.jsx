import { useState, useEffect } from "react"
import { fetchAllExecutivePending_RefundOrders } from "../../services/executive/order";
import OrderCard from "../../component/executive/OrderCard";
import OrderFilters from "../../component/executive/OrderFilters";

export default function Pending_refundOrders() {
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
            let response = await fetchAllExecutivePending_RefundOrders();
            setOrders(response.data.orders);

        }
        catch (err) {
            console.log(err);
        }



    }
    return (
        filteredOrders.length===0? <h1>No Orders with Pending refund</h1> :
        <div>
            <h1> Orders with Pending Refunds</h1>

            <OrderFilters setAppliedFilters={setAppliedFilters} status={"pending_refund"} />


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
                            <OrderCard key={order._id} order={order}/> 
                        )
                    )
                    }

                </tbody>
            </table>



        </div>
    )
}