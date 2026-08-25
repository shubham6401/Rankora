import { useNavigate } from "react-router-dom";

export default function RoleSelection(){
    const navigate=useNavigate();
    return (
        <div>
            <h1>Role Selection</h1>
            <button onClick={()=>navigate("/login-brand")} >Brand</button>
            <br />
            <button onClick={()=>navigate("/login-executive")}>Executive</button>
            <br />
            <button onClick={()=>navigate("/login-mediator")} >Mediator</button>
            <br />
        </div>
    )
}