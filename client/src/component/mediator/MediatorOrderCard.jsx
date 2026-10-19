import { useEffect, useState } from "react";
import { AcceptOrderByMediator } from "../../services/mediator/orders";
import ProofThumbnail from "../common/ProofThumbnail";
import ProofPreviewModal from "../common/ProofPreviewModal";
import "../../styles/ordersTable.css";

export default function MediatorOrderCard({ order }) {

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
                            <ProofThumbnail
                                url={paymentScreenshot}
                                alt="Payment Proof"
                                size={32}
                                onClick={() => setModalImg(paymentScreenshot)}
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
                        {order.productLink ? (
                            <a
                                href={order.productLink.startsWith("http") ? order.productLink : `https://${order.productLink}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="table-btn table-btn-outline"
                                title="Open product link in new tab"
                            >
                                🛍️ View Product ↗
                            </a>
                        ) : (
                            <span style={{ fontSize: "11px", color: "var(--slate-400)", fontStyle: "italic" }}>No link</span>
                        )}

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

            {/* FULL PAYMENT PROOF MODAL (Supports Image & PDF) */}
            {modalImg && (
                <ProofPreviewModal
                    url={modalImg}
                    title={`Payment Proof: ${order.productName} (₹${order.price})`}
                    onClose={() => setModalImg(null)}
                />
            )}
        </>
    );
}