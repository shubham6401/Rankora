import React from "react";

/**
 * Reusable Price Display Component with Price Hike Detection
 * Displays both base price and actual purchase price if mediator entered a higher price.
 */
export default function PriceDisplay({
    basePrice,
    actualPrice,
    deliveryFee = 0,
    layout = "inline", // "inline" | "stack" | "compact" | "badge"
    showHikeBadge = true,
    style = {},
    className = "",
}) {
    const base = Number(basePrice) || 0;
    const actual =
        actualPrice !== undefined && actualPrice !== null && actualPrice !== ""
            ? Number(actualPrice)
            : null;

    const isHiked = actual !== null && actual > base;
    const hikeDiff = isHiked ? actual - base : 0;
    const hikePercent = isHiked && base > 0 ? Math.round((hikeDiff / base) * 100) : 0;

    if (!isHiked) {
        const displayVal = actual !== null ? actual : base;
        return (
            <span
                className={`price-display-normal ${className}`}
                style={{
                    fontWeight: 700,
                    color: "var(--slate-800, #1e293b)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    ...style,
                }}
            >
                ₹{displayVal.toLocaleString()}
            </span>
        );
    }

    // When price is hiked:
    if (layout === "stack") {
        return (
            <div
                className={`price-display-hiked price-display-stack ${className}`}
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "3px",
                    lineHeight: 1.2,
                    ...style,
                }}
                title={`Price Hike Detected: Fixed Base Price was ₹${base.toLocaleString()}, mediator entered actual purchase price ₹${actual.toLocaleString()} (+₹${hikeDiff.toLocaleString()})`}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 800, color: "#b91c1c", fontSize: "14px" }}>
                        ₹{actual.toLocaleString()}
                    </span>
                    {showHikeBadge && (
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "2px",
                                background: "#fef2f2",
                                color: "#dc2626",
                                border: "1px solid #fecaca",
                                borderRadius: "4px",
                                padding: "1px 6px",
                                fontSize: "10.5px",
                                fontWeight: 800,
                                letterSpacing: "0.2px",
                            }}
                        >
                            ▲ +₹{hikeDiff.toLocaleString()} ({hikePercent}%)
                        </span>
                    )}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                    Fixed Base: <span style={{ textDecoration: "line-through", color: "#94a3b8" }}>₹{base.toLocaleString()}</span>
                </div>
            </div>
        );
    }

    if (layout === "compact") {
        return (
            <span
                className={`price-display-hiked price-display-compact ${className}`}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    flexWrap: "wrap",
                    ...style,
                }}
                title={`Price Hike: Base ₹${base} → Actual ₹${actual} (+₹${hikeDiff})`}
            >
                <span style={{ fontWeight: 800, color: "#b91c1c" }}>₹{actual.toLocaleString()}</span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>(Base: ₹{base})</span>
                {showHikeBadge && (
                    <span
                        style={{
                            background: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            borderRadius: "4px",
                            padding: "0 4px",
                            fontSize: "10px",
                            fontWeight: 700,
                        }}
                    >
                        +₹{hikeDiff}
                    </span>
                )}
            </span>
        );
    }

    // Default: "inline"
    return (
        <span
            className={`price-display-hiked ${className}`}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                flexWrap: "wrap",
                ...style,
            }}
            title={`Price Hike Detected: Base Price ₹${base.toLocaleString()} → Entered ₹${actual.toLocaleString()} (+₹${hikeDiff.toLocaleString()})`}
        >
            <span style={{ fontWeight: 800, color: "#b91c1c", fontSize: "13.5px" }}>
                ₹{actual.toLocaleString()}
            </span>
            <span
                style={{
                    fontSize: "11px",
                    color: "#64748b",
                    fontWeight: 500,
                    textDecoration: "line-through",
                }}
            >
                ₹{base.toLocaleString()}
            </span>
            {showHikeBadge && (
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px",
                        background: "#fef2f2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                        borderRadius: "4px",
                        padding: "1px 5px",
                        fontSize: "10px",
                        fontWeight: 800,
                    }}
                >
                    ▲ +₹{hikeDiff.toLocaleString()} Hiked
                </span>
            )}
        </span>
    );
}
