import { useState,useEffect } from "react"
import { mediatorOrderSubmit } from "../../services/orders";
import { useParams } from "react-router-dom";
import { getOrder } from "../../services/orders";
import { useNavigate } from "react-router-dom";
export default function OrderSubmission() {
    const navigate = useNavigate();
    const {id}=useParams();

    let [order,setOrder]=useState(null);
    const [formData, setFormData] = useState({
    });


    useEffect(()=>{
        fetchOrder();
        
    },[]);

    const fetchOrder=async ()=>{
        let response =await getOrder(id);
        setOrder(response.data.order);

        console.log(response.data.order)
    }
     if (!order) {
        return <h2>Loading...</h2>;
    }

   
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let data=new FormData();
            
            Object.keys(formData).forEach((key) => {
                data.append(key, formData[key]);
            });

            let response = await mediatorOrderSubmit(id,data);
            console.log(response);
            navigate("/mediator-pending-orders", { replace: true });
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
                    value={order.price} disabled={true}
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
                    value={order.productName} disabled={true}
                    required />
                <br /><br />


                <label >Address</label>
                <input type="text"
                    onChange={(e) => setFormData({
                        ...formData, address: e.target.value,
                    })}
                    required />
                <br /><br />

                <label >Executive Name</label>
                <input type="text"
                    value={order.executiveName} disabled={true}
                    required />
                <br /><br />

                <label >Team Code</label>
                <input type="text"
                    value={order.teamCode} disabled={true}
                    required />
                <br /><br />

                <label >Mediator Name</label>
                <input type="text"
                    value={order.assignedTo.name} disabled={true}
                    required />
                <br /><br />

                <label >Mediator Code</label>
                <input type="text"
                    value={order.assignedTo.mediatorCode} disabled={true}
                    required />
                <br /><br />



                <label >Reviewer Name </label>
                <input type="text"
                    onChange={(e) => setFormData({
                        ...formData, reviewerName: e.target.value,
                    })}
                    required />
                <br /><br />




                <label >Brand</label>
                <input type="text"
                    value={order.brand} disabled={true}
                    required />
                <br /><br />



                <label >Orders Received Date</label>
                <input type="date"
                    onChange={(e) => setFormData({
                        ...formData, orderReceivedOn: e.target.value,
                    })}
                    required />
                <br /><br />

                <label >Order Placed on</label>
                <input type="text"
                    value={order.orderPlatform} disabled={true}
                    required />
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