import { useNavigate } from "react-router-dom";
import EarningTable from "../../component/mediator/EarningTable";

export default function MediatorEarnings() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user")) || {};

    return (
        <div style={{ maxWidth: "800px", margin: "20px auto", padding: "20px", fontFamily: "sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                    <h1 style={{ margin: "0 0 6px 0", fontSize: "24px", color: "#1a202c" }}>Mediator Earnings</h1>
                    <p style={{ margin: 0, color: "#718096", fontSize: "14px" }}>
                        Mediator: <b>{user.name || "N/A"}</b> | Code: <b>{user.mediatorCode || "N/A"}</b> | Team: <b>{user.teamCode || "N/A"}</b>
                    </p>
                </div>
                <button
                    onClick={() => navigate("/panel-mediator")}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: "#edf2f7",
                        border: "1px solid #cbd5e0",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600",
                    }}
                >
                    ← Back to Dashboard
                </button>
            </div>

            <EarningTable />
        </div>
    );
}
