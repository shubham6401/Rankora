import { useState, useEffect } from "react"
import { fetchAllExecutiveCompletedOrders } from "../../services/executive/order";
import OrderCard from "../../component/executive/OrderCard";

export default function CompletedOrders() {
    let [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            let response = await fetchAllExecutiveCompletedOrders();
            setOrders(response.data.orders);

        }
        catch (err) {
            console.log(err);
        }



    }
    return (
        orders.length===0? <h1>No Completed Orders</h1> :
        <div>
            <h1> Completed Orders</h1>

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