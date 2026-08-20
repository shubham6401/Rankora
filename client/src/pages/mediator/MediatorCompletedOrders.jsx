import { useEffect, useState } from "react"
import { FetchAllCompletedOrders } from "../../services/mediator/orders";
import MediatorOrderCard from "../../component/mediator/MediatorOrderCard";

export default function MediatorCompletedOrders() {
    let [orders, setOrders] = useState([]);

    useEffect(() => {
        handleFetchAllCompletedOrders();
    }, [])

    const handleFetchAllCompletedOrders = async () => {
        try {
            console.log("hoo");
            let response = await FetchAllCompletedOrders();
            setOrders(response.data.orders);

        }
        catch (err) {
            console.log(err);
        }
    }
    return (
        orders.length===0 ? <h1> No orders are completed yet </h1> :
        <div>
            <h1>Completed Orders</h1>

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
                            <MediatorOrderCard key={order._id} order={order} />
                        )
                        )
                    }

                </tbody>
            </table>
        </div>
    )
}