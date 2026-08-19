import { useNavigate } from "react-router-dom"
import { useState } from "react";
import { AssignOrderToMediator } from "../../services/executive/order";
export default function OrderCard({ order, mediators }) {
    const navigate = useNavigate();
    let [showAssign, setShowAssign] = useState(false);
    let [selectedMediator, setSelectedMediator] = useState("");

    const handleAssign = async () => {
        try {
            const response = await AssignOrderToMediator(order._id, {
                mediatorId: selectedMediator
            });
            console.log(response);
            window.location.reload();

        }
        catch (err) {
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
            }</td>
            <td>{order.status !== "pending" &&
                order.assignedTo.mediatorCode
            }</td>
            <td>
                <button onClick={() => navigate(`/order/${order._id}`)}>View Details</button>
                {order.status === "pending" && <button onClick={() => setShowAssign(!showAssign)} >Assign Mediator</button>}

                {showAssign && (
                    <div>
                        <select value={selectedMediator} onChange={(e) => setSelectedMediator(e.target.value)}>

                            <option value="">Select Mediator</option>

                            {mediators.map((mediator) => (
                                <option key={mediator._id} value={mediator._id}>
                                    {mediator.name} - {mediator.mediatorCode}
                                </option>
                            ))}
                        </select>
                        <button disabled={!showAssign} onClick={() => handleAssign()}>Assign</button>
                    </div>
                )}
            </td>
            
        </tr>
    )

}