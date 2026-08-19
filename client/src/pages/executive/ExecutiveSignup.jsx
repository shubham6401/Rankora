import { useState,useEffect } from "react"
import { loginExecutiveUser,signUpExecutiveUser } from "../../services/authService";
export default function ExecutiveSignup(){
    let [formData,setFormData]= useState({
        name:"",
        password:"",
        teamCode:"",
    });

    const handleSubmit=async(e)=>{
        e.preventDefault();


        try{
            let signupResponse=await signUpExecutiveUser(formData);
            console.log(signupResponse);

        }
        catch(err){
            console.log(err);
        }

        console.log(formData);

    }
    return (
        <div>
            <h1>Executive signup page</h1>
            <form onSubmit={handleSubmit}>
                <label >Name:</label>
                <input value={formData.name} type="text" onChange={(e)=>
                    setFormData({
                        ...formData,name:e.target.value,
                    })
                } />
                <br /><br />


                {/* <label >Role:</label>
                <select value={formData.role} onChange={(e)=>setFormData({
                    ...formData,role:e.target.value,
                })}>
                    <option value="">Select Role</option>
                    <option value="executive">Executive</option>
                    <option value="mediator">Mediator</option>


                </select>
                <br /><br /> */}


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



                <button type="Submit">Signup</button>


            </form>

        </div>
    )
}