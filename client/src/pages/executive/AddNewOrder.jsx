import { useState } from "react"
import { addExecutiveOrder } from "../../services/executive/order";
import { useNavigate } from "react-router-dom";
export default function AddNewOrder() {
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
            let data={
                ...formData,
                "teamCode":user["teamCode"],
                "executiveName":user["name"],
            }
            

            let response = await addExecutiveOrder(data);
            console.log(response);
            navigate("/dashboard-executive");
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
               



                <label >Price</label>
                <input type="text"
                    onChange={(e) => setFormData({
                        ...formData, price: e.target.value,
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

                <label >Product Link</label>
                <input type="text"
                    onChange={(e) => setFormData({
                        ...formData, productLink: e.target.value,
                    })}
                    required />
                <br /><br />





                <label >Executive Name </label>
                <input type="text"
                    value={user["name"]} disabled={true}
                    required />
                <br /><br />


                <label >Team Code</label>
                <input type="text" value={user["teamCode"]} 
                   disabled={true}
                    required />
                <br /><br />



                <label >Brand</label>
                <input type="text"
                    onChange={(e) => setFormData({
                        ...formData, brand: e.target.value,
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


                <button type="submit">Submit</button>



            </form>




        </div>
    )
}