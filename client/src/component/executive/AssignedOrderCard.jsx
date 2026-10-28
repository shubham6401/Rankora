import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProofThumbnail from "../common/ProofThumbnail";
import ProofPreviewModal from "../common/ProofPreviewModal";
import { deleteExecutiveOrderBatch } from "../../services/executive/order";
import "../../styles/ordersTable.css";

export default function AssignedOrderCard({ order, status, onOrderUpdated }) {
    const navigate = useNavigate();
    const [modalImg, setModalImg] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteBatch = async () => {
        const totalU = order.quantity || (order.orderUnits ? order.orderUnits.length : 0);
        const confirmMsg =
            `⚠️ ARE YOU SURE YOU WANT TO DELETE THIS ORDER BATCH?\n\n` +
            `Product: ${order.productName || "Unnamed"}\n` +
            `Brand: ${order.brand || "Unknown"}\n` +
            `Total Units: ${totalU}\n\n` +
            `This will permanently delete the entire order batch and all associated units.\n` +
            `This action CANNOT be undone. Proceed?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            setIsDeleting(true);
            await deleteExecutiveOrderBatch(order._id);
            alert("✓ Order batch deleted successfully.");
            if (onOrderUpdated) {
                onOrderUpdated();
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error("Failed to delete order batch:", err);
            alert(err?.response?.data?.message || "Failed to delete order batch");
            setIsDeleting(false);
        }
    };

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

    const assignedUnits = (order.orderUnits || []).filter((u) => u.status === "assigned");
    const whCount = assignedUnits.filter((u) => u.unitType === "warehouse").length;
    const emCount = assignedUnits.filter((u) => u.unitType === "empty").length;

    return (
        <>
            <tr>
                <td className="product-name-cell">
                    <div>{order.productName}</div>
                    {(whCount > 0 || emCount > 0) && (
                        <div className="unit-spec-group" style={{ marginTop: "4px" }}>
                            {whCount > 0 && (
                                <span className="unit-spec-chip warehouse">🏢 {whCount} WH</span>
                            )}
                            {emCount > 0 && (
                                <span className="unit-spec-chip empty">📦 {emCount} Empty</span>
                            )}
                        </div>
                    )}
                </td>
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
                                        <ProofThumbnail
                                            url={mediator.paymentScreenshot}
                                            alt="Payment Proof"
                                            size={32}
                                            onClick={() => setModalImg(mediator.paymentScreenshot)}
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
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <button
                            type="button"
                            className="table-btn table-btn-outline"
                            onClick={() => navigate(`/order/${order._id}`)}
                        >
                            View Details
                        </button>
                        <button
                            type="button"
                            className="table-btn table-btn-danger"
                            style={{
                                background: "#fee2e2",
                                color: "#dc2626",
                                border: "1px solid #fca5a5",
                                padding: "6px 10px",
                                cursor: isDeleting ? "not-allowed" : "pointer"
                            }}
                            disabled={isDeleting}
                            onClick={handleDeleteBatch}
                            title="Permanently delete this entire order batch"
                        >
                            {isDeleting ? "..." : "🗑️"}
                        </button>
                    </div>
                </td>
            </tr>

            {/* Lightbox Modal (Supports Image & PDF) */}
            {modalImg && (
                <ProofPreviewModal
                    url={modalImg}
                    title="Payment Proof Verification Screenshot"
                    onClose={() => setModalImg(null)}
                />
            )}
        </>
    );
}