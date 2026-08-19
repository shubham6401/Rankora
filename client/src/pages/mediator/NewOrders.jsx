import { useEffect, useState } from "react"
import { fetchMediatorNewOrders } from "../../services/mediator/orders";
import MediatorOrderCard from "../../component/mediator/MediatorOrderCard";

export default function NewOrders() {
    let [orders, setOrders] = useState([]);

    useEffect(() => {
        handleFetchMediatorNewOrders();
    }, [])

    const handleFetchMediatorNewOrders = async () => {
        try {
            let response = await fetchMediatorNewOrders();
            setOrders(response.data.orders);

        }
        catch (err) {
            console.log(err);
        }
    }
    return (
        orders.length===0 ? <h1>No new Orders </h1> :
        <div>
            <h1>New Orders</h1>

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