import { useState } from "react"
import { signUpUser,loginUser } from "../../services/authService";
import { useNavigate } from "react-router-dom";
export default function SignUP(){
    let [formData,setFormData]=useState({
        name:"",
        mediatorCode:"",
        password:"",
    })

    let [loading,setLoading]=useState(false);
    const navigate=useNavigate();
    const handleSubmit=async (e)=>{
        e.preventDefault();

        try{
            setLoading(true);
            if(!formData.name.trim()){
                alert("name is required");
                return ;
            }

            if(!formData.mediatorCode.trim()){
                alert("code is required");
                return ; 
            }
            if(formData.password.length<6){
                alert("password must be atleast 6 digit");
                return ;
            }
            let signupResponse= await signUpUser(formData);

            // let loginResponse=await loginUser(formData);

            // store in local storage
            // localStorage.setItem("token",loginResponse.data.token);
            // localStorage.setItem("user",JSON.stringify(loginResponse.data.token));
            alert("Successfully created mediator account");

            navigate("/dashboard-executive");
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
            <h1> Mediator Signup PAGE</h1>
            <form onSubmit={handleSubmit} >
                <label >Name:</label>
                <input value={formData.name} type="text" onChange={(e)=>setFormData({
                    ...formData,name:e.target.value,
                })} /> <br /> <br />

                <label >Mediator Code:</label>
                <input value={formData.mediatorCode} type="text" onChange={(e)=>setFormData({
                    ...formData,mediatorCode:e.target.value,
                })} /> <br /><br />

                <label >Password:</label>
                <input value={formData.password} type="password" onChange={(e)=>setFormData({
                    ...formData,password:e.target.value,
                })} /> <br /> <br />

                <button type="submit" disabled={loading} > {loading? "Signing up..." : "Signup"}</button>
            </form>

        </div>
    )
}