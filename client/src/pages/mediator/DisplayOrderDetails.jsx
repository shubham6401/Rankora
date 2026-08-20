import DisplayOrder from "../../component/DisplayOrder";
import { useParams } from "react-router-dom";
import { useEffect,useState } from "react";
import { getOrder } from "../../services/orders";

export default function DisplayOrderDetails(){
    const {id}=useParams();
    let [order,setOrder]=useState(null);
    useEffect(()=>{
        fetchOrder();
        
    },[]);
    const fetchOrder=async ()=>{
        let response =await getOrder(id);
        setOrder(response.data.order);

    }
     if (!order) {
        return <h2>Loading...</h2>;
    }
    return (
        <div>

            <DisplayOrder order={order}/>
        </div>


    )
}