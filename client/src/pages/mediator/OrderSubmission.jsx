import { useState } from "react"
import { orderSubmit } from "../../services/orders";
import { useNavigate } from "react-router-dom";
export default function OrderSubmission() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
    });
    let user=JSON.parse(localStorage.getItem("user"));
    const platforms = [
        "Amazon",
        "Flipkart",
        "Myntra",
        "Ajio",
        "Meesho"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let data=new FormData();
            
            Object.keys(formData).forEach((key) => {
                data.append(key, formData[key]);
            });
            data.append("teamCode",user["teamCode"]);
            let response = await orderSubmit(data);
            console.log(response);
            navigate("/dashboard");
        }
        catch (err) {
            console.log("order data have issues...");
            console.log(err);
        }
    }
    return (
        <div>
            <h1>Order Submit details</h1>


            <form onSubmit={handleSubmit}>
                <label >OrderID</label>
                <input type="text" onChange={(e) =>
                    setFormData({ ...formData, orderId: e.target.value })
                }
                    required />

                <br /><br />



                <label >Price</label>
                <input type="text"
                    onChange={(e) => setFormData({
                        ...formData, price: e.target.value,
                    })}
                    required />
                <br /><br />


                <label >Ordered Screenshot</label>
                <input type="file"
                    onChange={(e) => setFormData({
                        ...formData, orderedScreenshot: e.target.files[0],
                    })}
                    required />
                <br /><br />


                <label >Expected Arrival Date </label>
                <input type="date"
                    onChange={(e) => setFormData({
                        ...formData, expectedArrivalDate: e.target.value,
                    })}
                    required />

                <br /><br />


                <label >Product Name</label>
                <input type="text"
                    onChange={(e) => setFormData({
                        ...formData, productName: e.target.value,
                    })}
                    required />
                <br /><br />


                <label >Address</label>
                <input type="text"
                    onChange={(e) => setFormData({
                        ...formData, address: e.target.value,
                    })}
                    required />
                <br /><br />


                <label >Reviewer Name </label>
                <input type="text"
                    onChange={(e) => setFormData({
                        ...formData, reviewerName: e.target.value,
                    })}
                    required />
                <br /><br />


                {/* <label >Mediator Name</label>
                <input type="text"
                    onChange={(e) => setFormData({
                        ...formData, mediatorName: e.target.value,
                    })}
                    required />
                <br /><br /> */}


                <label >Team Code</label>
                <input type="text" value={user["teamCode"]} 
                   disabled={true}
                    required />
                <br /><br />

{/* 
                <label >Mediator Code</label>
                <input type="text"  onChange={(e) => setFormData({
                        ...formData, mediatorCode: e.target.value,
                    })}  required />
                <br /><br /> */}


                <label >Brand</label>
                <input type="text"
                    onChange={(e) => setFormData({
                        ...formData, brand: e.target.value,
                    })}
                    required />
                <br /><br />



                <label >Orders Received Date</label>
                <input type="date"
                    onChange={(e) => setFormData({
                        ...formData, orderReceivedOn: e.target.value,
                    })}
                    required />
                <br /><br />



                <label >Orders placed on </label>
                <select
                    value={formData.orderPlatform || ""}
                    onChange={(e) => setFormData({
                        ...formData, orderPlatform: e.target.value,
                    })} required>
                    <option value="">Select Platform</option>
                    {platforms.map((platform)=>(
                        <option key={platform} value={platform}>{platform}</option>
                    ))}
                </select>

                <br /><br />



                <label >Season </label>
                <input type="text"
                    onChange={(e) => setFormData({
                        ...formData, season: e.target.value,
                    })}
                    required />
                <br /><br />

                <button type="submit">Submit</button>



            </form>




        </div>
    )
}