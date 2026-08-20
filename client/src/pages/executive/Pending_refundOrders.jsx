import { useState, useEffect } from "react"
import { fetchAllExecutivePending_RefundOrders } from "../../services/executive/order";
import OrderCard from "../../component/executive/OrderCard";

export default function Pending_refundOrders() {
    let [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchOrders();
    }, []);

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
        orders.length===0? <h1>No Orders with Pending refund</h1> :
        <div>
            <h1> Orders with Pending Refunds</h1>

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
                        orders.map((order) => (
                            <OrderCard key={order._id} order={order}/> 
                        )
                    )
                    }

                </tbody>
            </table>



        </div>
    )
}