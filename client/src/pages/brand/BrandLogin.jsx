import { useState } from "react"
import { loginExecutiveUser } from "../../services/authService";
import { useNavigate } from "react-router-dom";

export default function BrandLogin(){
    const navigate=useNavigate();
    let [formData,setFormData]=useState({
        name:"",
        password:"",
        brand:"",
    })
    let [loading,setLoading]=useState(false);
    const handleSubmit=async(e)=>{
        e.preventDefault();
        try{
            let loginResponse=await loginExecutiveUser(formData);
            localStorage.setItem("token",loginResponse.data.token);
            localStorage.setItem("user",JSON.stringify(loginResponse.data.user));
            navigate("/dashboard-brand");
        }
        catch(err){
            console.log("hoo");
            console.log(err);
        }
    }
    return (
        <div>
            <h1>Executive Login Page</h1>
            <form onSubmit={handleSubmit}>
                <label >Name:</label>
                <input value={formData.name} type="text" onChange={(e)=>
                    setFormData({
                        ...formData,name:e.target.value,
                    })
                } />
                <br /><br />



                <label >Brand:</label>
                <input value={formData.brand} type="text" onChange={(e)=>
                    setFormData({
                        ...formData,brand:e.target.value,
                    })
                } />

                <br /><br />


                <label >Password:</label>
                <input value={formData.password} type="password" onChange={(e)=>
                    setFormData({
                        ...formData,password:e.target.value,
                    })
                } />
                <br /><br />


                <button type="Submit" disabled={loading}> {loading? "Signing in" : "Sign in" }</button>
            </form>

        </div>
    )
}