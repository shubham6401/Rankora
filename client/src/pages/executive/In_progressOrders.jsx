import { useState, useEffect } from "react"
import { fetchAllExecutiveAssignedOrders } from "../../services/executive/order";
import OrderCard from "../../component/executive/OrderCard";

export default function PendingOrders() {
    let [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchOrders();
    }, []);

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
        <div>
            <h1>Pending Orders</h1>

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