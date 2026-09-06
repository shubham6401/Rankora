import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/ordersTable.css";

export default function AssignedOrderCard({ order, status }) {
    const navigate = useNavigate();
    const [modalImg, setModalImg] = useState(null);

    // Group assigned units by mediator
    const assignedMediators = {};

    (order.orderUnits || [])
        .filter((unit) => unit.status === "assigned" && unit.mediatorId)
        .forEach((unit) => {
            const mediatorId = unit.mediatorId._id || unit.mediatorId;

            if (!assignedMediators[mediatorId]) {
                assignedMediators[mediatorId] = {
                    name: unit.mediatorId.name || "Mediator",
                    mediatorCode: unit.mediatorId.mediatorCode || "N/A",
                    quantity: 0,
                    paymentScreenshot: unit.paymentScreenshot || null,
                    paymentSentAt: unit.paymentSentAt || null,
                };
            }

            assignedMediators[mediatorId].quantity++;
            if (!assignedMediators[mediatorId].paymentScreenshot && unit.paymentScreenshot) {
                assignedMediators[mediatorId].paymentScreenshot = unit.paymentScreenshot;
            }
        });

    const mediators = Object.values(assignedMediators);

    return (
        <>
            <tr>
                <td className="product-name-cell">{order.productName}</td>
                <td>{order.brand}</td>
                <td>{order.orderPlatform}</td>
                <td className="price-pill">₹{order.price}</td>
                <td>{order.executiveName || "-"}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                    <span className="status-badge status-badge-assigned">
                        {status || "assigned"}
                    </span>
                </td>
                <td>{order.teamCode}</td>

                {/* Mediator Name */}
                <td>
                    {mediators.length > 0 ? (
                        mediators.map((mediator, idx) => (
                            <div key={idx} style={{ fontWeight: "600", color: "var(--slate-800)" }}>
                                {mediator.name}
                            </div>
                        ))
                    ) : (
                        <span style={{ color: "var(--slate-400)", fontStyle: "italic" }}>-</span>
                    )}
                </td>

                {/* Mediator Code */}
                <td>
                    {mediators.length > 0 ? (
                        mediators.map((mediator, idx) => (
                            <div key={idx}>
                                <span className="qty-pill">{mediator.mediatorCode}</span>
                            </div>
                        ))
                    ) : (
                        <span style={{ color: "var(--slate-400)", fontStyle: "italic" }}>-</span>
                    )}
                </td>

                {/* Assigned Quantity */}
                <td>
                    {mediators.length > 0 ? (
                        mediators.map((mediator, idx) => (
                            <div key={idx}>
                                <span className="qty-pill qty-pill-warning">
                                    {mediator.quantity} Units
                                </span>
                            </div>
                        ))
                    ) : (
                        <span>0 Units</span>
                    )}
                </td>

                {/* Payment Proof SS */}
                <td>
                    {mediators.length > 0 ? (
                        mediators.map((mediator, idx) => (
                            <div key={idx} style={{ margin: "4px 0" }}>
                                {mediator.paymentScreenshot ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <img
                                            src={mediator.paymentScreenshot}
                                            alt="Payment SS"
                                            className="proof-thumb"
                                            onClick={() => setModalImg(mediator.paymentScreenshot)}
                                            title="Click to view payment proof"
                                        />
                                        <button
                                            type="button"
                                            className="table-btn table-btn-outline"
                                            style={{ padding: "3px 8px", fontSize: "11px" }}
                                            onClick={() => setModalImg(mediator.paymentScreenshot)}
                                        >
                                            View SS
                                        </button>
                                    </div>
                                ) : (
                                    <span style={{ fontSize: "12px", color: "var(--slate-400)", fontStyle: "italic" }}>
                                        No Proof
                                    </span>
                                )}
                            </div>
                        ))
                    ) : (
                        <span style={{ color: "var(--slate-400)" }}>-</span>
                    )}
                </td>

                <td>
                    <button
                        type="button"
                        className="table-btn table-btn-outline"
                        onClick={() => navigate(`/order/${order._id}`)}
                    >
                        View Details
                    </button>
                </td>
            </tr>

            {/* Lightbox Modal */}
            {modalImg && (
                <div className="image-modal-overlay" onClick={() => setModalImg(null)}>
                    <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="image-modal-header">
                            <span style={{ fontWeight: "700", fontSize: "14px" }}>
                                Payment Proof Verification Screenshot
                            </span>
                            <button
                                type="button"
                                className="image-modal-close-btn"
                                onClick={() => setModalImg(null)}
                            >
                                Close ✕
                            </button>
                        </div>
                        <img src={modalImg} alt="Payment SS" className="image-modal-img" />
                    </div>
                </div>
            )}
        </>
    );
}