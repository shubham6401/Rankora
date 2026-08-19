import { useNavigate } from "react-router-dom";
import { getOrders } from "../../services/orders";
import { useState, useEffect } from "react";
import Order from "../../component/DisplayOrder"; 
import Logout from "../../component/Logout";
export default function Dashboard() {
    const [orders, setOrders] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        handleHistory();
    }, []);

    const handleHistory = async () => {
        try {
            const response = await getOrders();
            
            setOrders(response.data.orders);
        }
        catch (err) {
            console.log(err);
        }
    }
    let completedRefunds=orders.filter((order)=>order.postDeliveryDetails?.success).length;

    return (
        <div> 
            <h1>Dashboard</h1> <Logout/>
            <div>
                <h2>Orders summary</h2>
                <p> Total Order : {orders.length}</p>
                <p>Refund completed :{completedRefunds}</p>
                <p>Not refund completed :{orders.length-completedRefunds}</p>
            </div>
            <button onClick={() => navigate("/order-submission")}>Add new order</button>
            {
                orders.length==0? (<h3>No order history</h3> ):
                 (
                 
                 <div>
                    <h3>History exist</h3>
                    <hr />
                    {orders.map((order,index)=>(
                        <div key={index}>
                            <p>Order Id: {order.orderId}</p>
                            <p>Product Name: {order.productName}</p>
                            <button onClick={()=> navigate(`/order/${order._id}`)}>view details</button> &nbsp; &nbsp;
                            <button onClick={()=> navigate(`/refund-submission/${order._id}`)} disabled={order.postDeliveryDetails.success}>{order.postDeliveryDetails.success ?"Refund Added":"Add refund" }</button>
                            <hr />
                            <br />
                        </div>
                        

                    ))}

                 </div>
                )
            }


        </div>
    )
}