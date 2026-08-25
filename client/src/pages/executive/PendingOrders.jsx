import { useState, useEffect } from "react"
import { fetchAllExecutivePendingOrders } from "../../services/executive/order";
import OrderCard from "../../component/executive/OrderCard";
import { fetchAllMediators } from "../../services/executive/order";
import OrderFilters from "../../component/executive/OrderFilters";


export default function PendingOrders() {
    let [orders, setOrders] = useState([]);
    let [mediators, setMediators] = useState([]);

    let [appliedFilters, setAppliedFilters] = useState({
        date: "",
        brand: "",
        reviewerName: "",
        orderId: "",
    })

    const filteredOrders=orders.filter((order)=>{
        let orderIdMatch= !appliedFilters.orderId || order.orderId?.toLowerCase().includes(
            appliedFilters.orderId.toLowerCase()
        );


        let brandMatch= !appliedFilters.brand || order.brand?.toLowerCase().includes(
            appliedFilters.brand.toLowerCase()
        );

        let reviewerNameMatch= !appliedFilters.reviewerName ||  order.reviewerName?.toLowerCase().includes(
            appliedFilters.reviewerName.toLowerCase()
        );

        let dateMatch=!appliedFilters.date || new Date(order.createdAt).toISOString().split("T")[0] ===
        appliedFilters.date;


        return orderIdMatch && brandMatch && reviewerNameMatch &&  dateMatch
    })

    





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
        <>
        {filteredOrders.length!==0 ? <div>
            <h1>Pending Orders</h1>

        <OrderFilters setAppliedFilters={setAppliedFilters} status={"pending"} />


            

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
                        filteredOrders.map((order) => (
                            <OrderCard key={order._id} order={order} mediators={mediators}/> 
                        )
                    )
                    }

                </tbody>
            </table>



        </div> : <h1>No pending Orders</h1>}
        </>
        
    )
}
