import { useState,useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {fetchAllExecutiveOrders} from "../../services/executive/order"
import OrderSummary from "../../component/executive/OrderSummary";
import Logout from "../../component/Logout";

export default function ExecutiveDashboard(){
    let [orders,setOrders]=useState([]);
    const navigate=useNavigate();
    const user=JSON.parse(localStorage.getItem("user"));

    useEffect(()=>{
        fetchOrders();
    },[]);
    const fetchOrders=async ()=>{
        let response=await fetchAllExecutiveOrders()
        setOrders(response.data.orders);

    }
    return (
        <div>
            <h1>Executive Dashboard</h1>
            <p>Welcome back Executive {user.name}</p>
            <h2>Team Code: <b>{user.teamCode}</b></h2>
            <br /> <br /> <br />

            <OrderSummary orders={orders}/>

            <br /> <br />
            <button onClick={()=> navigate("/executive-mediators")} >Your Mediators</button>  &nbsp; <br /> <br />
            <button onClick={()=> navigate("/executive-add-order")}>Add new order</button>  &nbsp;
            <button onClick={()=> navigate("/executive-pending-order")} >Pending Orders</button> <br /> <br />
            <button onClick={()=> navigate("/executive-assigned-order")}>Assigned Orders</button> &nbsp;
            <button onClick={()=> navigate("/executive-in_progress-order")}>In Progress Orders</button> &nbsp;

            <button onClick={()=>navigate("/executive-pending_refund-order")}>Pending Refund</button>&nbsp;
            <button onClick={()=>navigate("/executive-completed-order")}>Completed Orders</button>&nbsp; <br /> <br />
            <button onClick={()=> navigate("/signup-mediator")}>Create Mediator Account</button>&nbsp;  <br /> <br />
            <Logout/>

            
        </div>
    )
}