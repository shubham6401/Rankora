import { AcceptOrderByMediator } from "../../services/mediator/orders";
import { useNavigate } from "react-router-dom"
export default function MediatorOrderCard({ order }) {
    const navigate=useNavigate();
    const handleAcceptButton=async()=>{
        try{
            let response=await AcceptOrderByMediator(order._id);
            console.log(response);
            window.location.reload();


        }
        catch(err){
            console.log(err);
        }

    }
    return (
        
        <tr >
            <td>{order.productName}</td>
            <td>{order.brand}</td>
            <td>{order.orderPlatform}</td>
            <td>₹{order.price}</td>
            <td>{order.executiveName}</td>
            <td>
                {new Date(order.createdAt).toLocaleDateString()}
            </td>
            <td>{order.status}</td>
            <td>{order.teamCode}</td>

            <td>{order.status !== "pending" &&
                order.assignedTo.name
            }
            </td>
            <td>{order.status !== "pending" &&
                order.assignedTo.mediatorCode
            }
            </td>
            <td>
                <div>
                    <button onClick={() => navigate(`/order/${order._id}`)}>View Details</button>
                    {order.status==="assigned" && <button onClick={handleAcceptButton}>Accept Order</button> }
                    {order.status==="in_progress" && <button onClick={()=> navigate(`/mediator-order-submission/${order._id}`)} >Submit Order Details</button> }
                    {order.status==="pending_refund" && <button onClick={()=> navigate(`/mediator-refund-submission/${order._id}`)} >Submit Refund Details</button> } 


                </div>
                

            </td>
        </tr>
    )

}