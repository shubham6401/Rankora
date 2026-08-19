import {fetchAllMediators} from "../../services/executive/order"
import { useState,useEffect } from "react"
export default function AllMediator(){
    let [mediators,setMediators]=useState([]);

    useEffect(()=>{
        handleFetchAllMediator();
    },[])

    const handleFetchAllMediator=async ()=>{
        try{
            let response=await fetchAllMediators();
            console.log(response.data.mediators);
            setMediators(response.data.mediators);

        }
        catch(err){
            console.log(err);
        }
    }
    return (
        <div>
            <h1>All mediators</h1>
            
            {mediators.map((mediator)=>(
                <div key={mediator._id}> 
                    <b>{mediator.name} </b> &nbsp; {mediator.mediatorCode}
                </div>
                
            ))}

        </div>
    )
}