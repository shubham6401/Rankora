import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { refundSubmit } from "../../services/orders";
import { useNavigate } from "react-router-dom";
export default function RefundSubmission() {
    const { id } = useParams();
    const navigate=useNavigate();
    let [formData,setFormData]=useState({});
    const handleSubmit= async (e)=>{
        e.preventDefault();
        try{
            let data= new FormData();
            Object.keys(formData).forEach((key)=>{
                data.append(key,formData[key]);
            });
            const response= await refundSubmit(id,data);
            navigate("/dashboard" ,{replace:true});
        }
        catch(err){
            console.log(err);
        }
    }

    return (
        <div>
            <h1>Refund submit details</h1>

            <form onSubmit={handleSubmit}>
                <label >Product Review Screenshot</label>
                <input type="file" onChange={(e)=> setFormData({
                    ...formData,productReviewScreenshot:e.target.files[0],
                })} />
                <br /><br />

                <label >Invoice Screenshot</label>
                <input type="file" onChange={(e)=> setFormData({
                    ...formData,invoiceScreenshot:e.target.files[0],
                })} />
                <br /><br />


                <label >Seller Feedback Screenshot</label>
                <input type="file" onChange={(e)=> setFormData({
                    ...formData,sellerFeedbackScreenShot:e.target.files[0],
                })} />
                <br /><br />

                <button type="submit">Submit</button>

            </form>
        </div>
    )
}