import { useNavigate } from "react-router-dom";
import "../styles/ordersTable.css";

export default function Logout() {
    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.clear();
        navigate("/role-selection");
    };

    return (
        <div>
            <button
                onClick={handleLogout}
                className="table-btn table-btn-danger"
                style={{ padding: "8px 16px", fontSize: "13px", fontWeight: 700 }}
            >
                🚪 Logout
            </button>
        </div>
    );
}