import { useNavigate } from "react-router-dom";
import Logout from "../../component/Logout";
export default function MediatorDashboard(){
    const navigate=useNavigate();
    let user=JSON.parse(localStorage.getItem("user"));

    return (
        <div>
            <h1>Mediator Dashboard</h1>
            <h2>Welcome: <b>{user.name}</b> </h2>
            <h3>Team Code: <b> {user.teamCode}</b> </h3>
            <h3>Mediator Code: <b> {user.mediatorCode}</b> </h3>


            <button onClick={()=>navigate("/mediator-neworders")} >New Orders</button> <br /> <br />
            <button onClick={()=>navigate("/mediator-pending-orders")} >Pending Orders</button> <br /> <br />
            <button  onClick={()=>navigate("/mediator-refund_pending-orders")}   >Pending Refund Orders</button> <br /> <br />
            <button  onClick={()=>navigate("/mediator-completed-orders")}>Completed Orders</button> <br /> <br />

            <Logout/>
        </div>
    )
}