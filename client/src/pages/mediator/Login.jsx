import { useState } from "react"
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../services/authService";

export default function Login(){
    let [loading,setLoading]=useState(false);
    let [formData ,setFormData]=useState({
        name:"",
        mediatorCode:"",
        password:"",
    }); 
    const navigate=useNavigate(); 

    const handleSubmit=async(e)=>{
        e.preventDefault();
        try{
            setLoading(true);
            const response=await loginUser(formData);

            localStorage.setItem("token",response.data.token);
            localStorage.setItem("user",JSON.stringify(response.data.user));
            
            navigate("/panel-mediator");
        }
        catch(err){
            console.log(err.response);

        }
        finally{
            setLoading(false);
        }
    }

    return (
        <div>
            <h1>Mediator LOGIN PAGE</h1>
            <form onSubmit={handleSubmit} >
                <label >Name:</label>
                <input value={formData.name} type="text" onChange={(e)=>setFormData({
                    ...formData,name:e.target.value,
                })} /> <br /> <br />

                <label >Mediator Code:</label>
                <input value={formData.code} type="text" onChange={(e)=>setFormData({
                    ...formData,mediatorCode:e.target.value,
                })} /> <br /><br />

                <label >Password:</label>
                <input value={formData.password} type="password" onChange={(e)=>setFormData({
                    ...formData,password:e.target.value,
                })} /> <br /> <br />

                <button type="submit" disabled={loading} > {loading? "Logging in..." : "Login"}</button>
            </form>

        </div>
    )
}