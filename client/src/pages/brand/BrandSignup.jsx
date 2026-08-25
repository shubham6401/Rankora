import { useState } from "react"
import { loginExecutiveUser,signUpExecutiveUser } from "../../services/authService";
export default function BrandSignup(){
    let [formData,setFormData]= useState({
        name:"",
        password:"",
        brand:"",
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



                <button type="Submit">Signup</button>


            </form>

        </div>
    )
}