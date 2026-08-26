import { useState,useEffect } from "react"
import { loginExecutiveUser } from "../../services/authService";
import { useNavigate } from "react-router-dom";

export default function ExecutiveLogin(){
    const navigate=useNavigate();
    let [formData,setFormData]=useState({
        name:"",
        password:"",
        teamCode:"",
    })
    let [loading,setLoading]=useState(false);
    const handleSubmit=async(e)=>{
        e.preventDefault();
        try{
            let loginResponse=await loginExecutiveUser(formData);
            localStorage.setItem("token",loginResponse.data.token);
            localStorage.setItem("user",JSON.stringify(loginResponse.data.user));
            navigate("/dashboard-executive");
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



                <label >TeamCode:</label>
                <input value={formData.teamCode} type="text" onChange={(e)=>
                    setFormData({
                        ...formData,teamCode:e.target.value,
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


            <button onClick={()=>navigate("/signup-executive")}>Signup Executive</button>

        </div>
    )
}