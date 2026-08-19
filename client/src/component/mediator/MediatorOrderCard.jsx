
import { useNavigate } from "react-router-dom"
export default function MediatorOrderCard({ order }) {
    const navigate=useNavigate();
    const handleAcceptButton=()=>{
        try{
            


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
                    <button>Accept Order</button>
                </div>
                

            </td>
        </tr>
    )

}