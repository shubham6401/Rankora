import { useNavigate } from "react-router-dom";
import "../../styles/ordersTable.css";

export default function OrderCard({ order, status }) {
    const navigate = useNavigate();

    const units = order.orderUnits || [];
    const targetStatus = status ? status.toLowerCase() : null;

    // Filter units matching this table's specific status (e.g. only in_progress accepted units)
    const matchingUnits = targetStatus && targetStatus !== "all"
        ? units.filter((u) => u.status === targetStatus)
        : units;

    // Extract all unique mediators from the matching units
    const assignedMediatorsMap = {};
    matchingUnits.forEach((unit) => {
        if (unit.mediatorId) {
            const mId = unit.mediatorId._id || unit.mediatorId;
            if (!assignedMediatorsMap[mId]) {
                assignedMediatorsMap[mId] = {
                    name: unit.mediatorId.name || "Mediator",
                    mediatorCode: unit.mediatorId.mediatorCode || "N/A",
                    count: 0,
                };
            }
            assignedMediatorsMap[mId].count++;
        }
    });
    const assignedMediatorsList = Object.values(assignedMediatorsMap);

    const getBadgeClass = (s) => {
        const lower = (s || "").toLowerCase();
        if (lower.includes("progress")) return "status-badge status-badge-in_progress";
        if (lower.includes("refund")) return "status-badge status-badge-pending_refund";
        if (lower.includes("complete")) return "status-badge status-badge-completed";
        return "status-badge status-badge-assigned";
    };

    return (
        <tr>
            <td className="product-name-cell">{order.productName}</td>
            <td>{order.brand}</td>
            <td>{order.orderPlatform}</td>
            <td className="price-pill">₹{order.price}</td>
            <td>{order.executiveName || "-"}</td>
            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
            <td>
                <span className={getBadgeClass(status)}>
                    {(status || "Active").replace("_", " ")}
                </span>
            </td>
            <td>{order.teamCode}</td>

            {/* Assigned Mediator Names */}
            <td>
                {assignedMediatorsList.length > 0 ? (
                    assignedMediatorsList.map((m, i) => (
                        <div key={i} style={{ fontWeight: "600", color: "var(--slate-800)" }}>
                            {m.name} {m.count > 1 && <span style={{ color: "var(--slate-500)", fontWeight: "normal" }}>({m.count} Units)</span>}
                        </div>
                    ))
                ) : (
                    <span style={{ color: "var(--slate-400)", fontStyle: "italic" }}>
                        {status === "in_progress" ? "None Accepted Yet" : "Not Assigned"}
                    </span>
                )}
            </td>

            {/* Assigned Mediator Codes */}
            <td>
                {assignedMediatorsList.length > 0 ? (
                    assignedMediatorsList.map((m, i) => (
                        <div key={i}>
                            <span className="qty-pill">{m.mediatorCode}</span>
                        </div>
                    ))
                ) : (
                    <span style={{ color: "var(--slate-400)", fontStyle: "italic" }}>-</span>
                )}
            </td>

            {/* Actions */}
            <td>
                <button
                    type="button"
                    className="table-btn table-btn-primary"
                    onClick={() => navigate(`/order/${order._id}`)}
                >
                    View Details
                </button>
            </td>
        </tr>
    );
}