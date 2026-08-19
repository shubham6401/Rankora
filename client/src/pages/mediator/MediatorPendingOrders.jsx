import { useEffect, useState } from "react"
import { FetchAllPendingOrders } from "../../services/mediator/orders";
import MediatorOrderCard from "../../component/mediator/MediatorOrderCard";

export default function MediatorPendingOrders() {
    let [orders, setOrders] = useState([]);

    useEffect(() => {
        handleFetchAllPendingOrders();
    }, [])

    const handleFetchAllPendingOrders = async () => {
        try {
            console.log("hoo");
            let response = await FetchAllPendingOrders();
            setOrders(response.data.orders);

        }
        catch (err) {
            console.log(err);
        }
    }
    return (
        orders.length===0 ? <h1>No Pending Orders </h1> :
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