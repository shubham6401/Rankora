import { useEffect, useState } from "react";
import { AcceptOrderByMediator } from "../../services/mediator/orders";
import { useNavigate } from "react-router-dom";
import "../../styles/ordersTable.css";

export default function MediatorOrderCard({ order }) {
    const navigate = useNavigate();

    const units = order.orderUnits || [];

    // Only assigned units
    const assignedUnits = units.filter(
        (unit) => unit.status === "assigned"
    );

    const availableQuantity = assignedUnits.length;

    // Get payment screenshot from any assigned unit
    const paymentScreenshot = assignedUnits.find((u) => u.paymentScreenshot)?.paymentScreenshot || null;

    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [modalImg, setModalImg] = useState(null);

    // If available quantity changes, make sure selected quantity is still valid.
    useEffect(() => {
        if (availableQuantity === 0) {
            setQuantity(0);
        } else if (quantity > availableQuantity) {
            setQuantity(availableQuantity);
        }
    }, [availableQuantity, quantity]);

    const handleQuantityChange = (value) => {
        if (value < 1) {
            setQuantity(1);
        } else if (value > availableQuantity) {
            setQuantity(availableQuantity);
        } else {
            setQuantity(value);
        }
    };

    const handleAccept = async () => {
        if (quantity <= 0 || availableQuantity === 0) {
            return;
        }

        const confirmMsg = paymentScreenshot
            ? `Confirm that you verified the payment proof of ₹${(Number(order.price) * quantity).toLocaleString()} and want to accept ${quantity} unit(s)?`
            : `Accept ${quantity} unit(s) of this order?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            setLoading(true);
            await AcceptOrderByMediator(order._id, quantity);
            alert("Order verified & accepted! Moved to In-Progress.");
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.message || "Failed to accept order");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <tr>
                {/* MASTER ORDER */}
                <td className="product-name-cell">{order.productName}</td>
                <td>{order.brand}</td>
                <td>{order.orderPlatform}</td>
                <td className="price-pill">₹{order.price}</td>
                <td>{order.executiveName || "Executive"}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>

                {/* PAYMENT SCREENSHOT PROOF */}
                <td>
                    {paymentScreenshot ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <img
                                src={paymentScreenshot}
                                alt="Payment SS"
                                onClick={() => setModalImg(paymentScreenshot)}
                                className="proof-thumb"
                                title="Click to view full payment screenshot"
                            />
                            <button
                                type="button"
                                onClick={() => setModalImg(paymentScreenshot)}
                                className="table-btn table-btn-outline"
                                style={{ fontSize: "11px", padding: "3px 8px" }}
                            >
                                🔍 View
                            </button>
                        </div>
                    ) : (
                        <span style={{ color: "var(--slate-400)", fontStyle: "italic", fontSize: "12px" }}>No Screenshot</span>
                    )}
                </td>

                {/* ASSIGNED QUANTITY */}
                <td>
                    <span className="qty-pill qty-pill-warning">
                        {availableQuantity}
                    </span>
                </td>

                {/* ACCEPT QUANTITY */}
                <td>
                    <div className="qty-stepper" style={{ marginBottom: 0 }}>
                        <button
                            onClick={() => handleQuantityChange(quantity - 1)}
                            disabled={loading || quantity <= 1}
                            className="qty-stepper-btn"
                            style={{ width: "28px", height: "28px", fontSize: "14px" }}
                        >
                            -
                        </button>

                        <span style={{ fontWeight: "700", minWidth: "20px", textAlign: "center" }}>
                            {quantity}
                        </span>

                        <button
                            onClick={() => handleQuantityChange(quantity + 1)}
                            disabled={loading || quantity >= availableQuantity}
                            className="qty-stepper-btn"
                            style={{ width: "28px", height: "28px", fontSize: "14px" }}
                        >
                            +
                        </button>
                    </div>
                </td>

                {/* TEAM CODE */}
                <td>{order.teamCode || "N/A"}</td>

                {/* ACTIONS */}
                <td>
                    <div className="action-btn-group">
                        <button
                            onClick={() => navigate(`/order/${order._id}`)}
                            className="table-btn table-btn-outline"
                        >
                            Details
                        </button>

                        <button
                            onClick={handleAccept}
                            disabled={loading || availableQuantity === 0}
                            className="table-btn table-btn-success"
                        >
                            {loading
                                ? "Accepting..."
                                : `✓ Accept (${quantity})`}
                        </button>
                    </div>
                </td>
            </tr>

            {/* FULL PAYMENT PROOF MODAL */}
            {modalImg && (
                <div
                    onClick={() => setModalImg(null)}
                    className="image-modal-overlay"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="image-modal-content"
                    >
                        <div className="image-modal-header">
                            <div>
                                <h3 style={{ margin: 0, color: "var(--slate-900)", fontSize: "16px", fontWeight: 800 }}>Payment Screenshot Verification</h3>
                                <p style={{ margin: "2px 0 0 0", color: "var(--slate-500)", fontSize: "12px" }}>
                                    {order.productName} (₹{order.price})
                                </p>
                            </div>
                            <button
                                onClick={() => setModalImg(null)}
                                className="image-modal-close-btn"
                            >
                                Close ✕
                            </button>
                        </div>
                        <img
                            src={modalImg}
                            alt="Full Payment SS"
                            className="image-modal-img"
                        />
                    </div>
                </div>
            )}
        </>
    );
}