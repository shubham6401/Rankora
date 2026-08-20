import { useEffect, useState } from "react"
import { FetchAllRefund_PendingOrders } from "../../services/mediator/orders";
import MediatorOrderCard from "../../component/mediator/MediatorOrderCard";

export default function MediatorRefundPendingOrders() {
    let [orders, setOrders] = useState([]);

    useEffect(() => {
        handleFetchAllRefund_PendingOrders();
    }, [])

    const handleFetchAllRefund_PendingOrders = async () => {
        try {
            console.log("hoo");
            let response = await FetchAllRefund_PendingOrders();
            setOrders(response.data.orders);

        }
        catch (err) {
            console.log(err);
        }
    }
    return (
        orders.length===0 ? <h1>No Orders with Refund Pending </h1> :
        <div>
            <h1>Refund Pending Orders</h1>

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