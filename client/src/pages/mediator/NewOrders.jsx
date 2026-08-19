import { useEffect, useState } from "react"
import { fetchAllExecutiveAssignedOrders } from "../../services/executive/order"
import MediatorOrderCard from "../../component/mediator/MediatorOrderCard";

export default function NewOrders() {
    let [orders, setOrders] = useState([]);

    useEffect(() => {
        handleFetchAllExecutiveAssignedOrders();
    }, [])

    const handleFetchAllExecutiveAssignedOrders = async () => {
        try {
            let response = await fetchAllExecutiveAssignedOrders();
            setOrders(response.data.orders)

        }
        catch (err) {
            console.log(err);
        }
    }
    return (
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