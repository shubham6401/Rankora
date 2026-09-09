import { useNavigate } from "react-router-dom";
import "../styles/appLayout.css";

export default function Logout({ className }) {
    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.clear();
        navigate("/role-selection");
    };

    return (
        <button
            type="button"
            onClick={handleLogout}
            className={className || "topbar-logout-btn"}
            title="Sign out of Rankora"
            aria-label="Logout"
        >
            <span>🚪</span>
            <span>Logout</span>
        </button>
    );
}