import { useNavigate } from "react-router-dom"
export default function Logout(){
    const navigate=useNavigate();
    const handleLogout=()=>{
        localStorage.clear("token");
        localStorage.clear("user");
        navigate("/role-selection");

    }
    return (
        <div>
            <button onClick={handleLogout}>Logout</button>
        </div>
    )
}