import { useState, useEffect } from "react"
import { fetchAllExecutivePendingOrders } from "../../services/executive/order";
import OrderCard from "../../component/executive/OrderCard";
import { fetchAllMediators } from "../../services/executive/order";


export default function PendingOrders() {
    let [orders, setOrders] = useState([]);
    let [mediators, setMediators] = useState([]);


    useEffect(() => {
        fetchOrders();
        handleFetchAllMediator();
    }, []);

    const fetchOrders = async () => {
        try {
            let response = await fetchAllExecutivePendingOrders();
            setOrders(response.data.orders);

        }
        catch (err) {
            console.log(err);
        }
    }
    const handleFetchAllMediator = async () => {
        try {
            let response = await fetchAllMediators();
            setMediators(response.data.mediators);

        }
        catch (err) {
            console.log(err);
        }
    }
    return (
        orders.length!==0 ? <div>
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
                            <OrderCard key={order._id} order={order} mediators={mediators}/> 
                        )
                    )
                    }

                </tbody>
            </table>



        </div> : <h1>No pending Orders</h1>
        
    )
}