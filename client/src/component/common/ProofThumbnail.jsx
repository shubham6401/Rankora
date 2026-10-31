import React from "react";

export const isPdfUrl = (urlOrFile, fileName = "") => {
    if (fileName && fileName.toLowerCase().endsWith(".pdf")) return true;
    if (!urlOrFile) return false;
    if (typeof urlOrFile === "object") {
        if (urlOrFile.type === "application/pdf") return true;
        if (urlOrFile.name && urlOrFile.name.toLowerCase().endsWith(".pdf")) return true;
        if (urlOrFile.url) return isPdfUrl(urlOrFile.url);
    }
    if (typeof urlOrFile === "string") {
        const clean = urlOrFile.toLowerCase().split("?")[0].split("#")[0];
        if (clean.endsWith(".pdf")) return true;
        if (urlOrFile.includes(".pdf")) return true;
        if (urlOrFile.startsWith("data:application/pdf")) return true;
    }
    return false;
};

export default function ProofThumbnail({
    url,
    src,
    fileName = "",
    alt = "Proof",
    onClick,
    className = "",
    style = {},
    size = 40,
}) {
    const raw = url || src;
    if (!raw) return null;

    const targetUrl =
        typeof raw === "object"
            ? (raw.url || (typeof window !== "undefined" && (raw instanceof File || raw instanceof Blob) ? URL.createObjectURL(raw) : ""))
            : raw;
    const isPdf = isPdfUrl(raw, fileName);

    if (isPdf) {
        return (
            <div
                onClick={onClick}
                className={`proof-thumbnail-pdf ${className}`}
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: typeof size === "number" ? `${size}px` : size,
                    height: typeof size === "number" ? `${size}px` : size,
                    backgroundColor: "#fef2f2",
                    border: "1.5px solid #fca5a5",
                    borderRadius: "6px",
                    cursor: onClick ? "pointer" : "default",
                    color: "#dc2626",
                    fontWeight: 700,
                    lineHeight: 1,
                    transition: "all 0.15s ease",
                    boxShadow: "0 1px 2px rgba(220, 38, 38, 0.1)",
                    userSelect: "none",
                    ...style,
                }}
                title="View PDF Document"
            >
                <span style={{ fontSize: typeof size === "number" ? `${Math.round(size * 0.42)}px` : "16px" }}>📄</span>
                <span
                    style={{
                        fontSize: typeof size === "number" ? `${Math.max(8, Math.round(size * 0.22))}px` : "9px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginTop: "2px",
                    }}
                >
                    PDF
                </span>
            </div>
        );
    }

    return (
        <img
            src={targetUrl}
            alt={alt}
            onClick={onClick}
            className={`proof-thumbnail-img ${className}`}
            style={{
                width: typeof size === "number" ? `${size}px` : size,
                height: typeof size === "number" ? `${size}px` : size,
                objectFit: "cover",
                borderRadius: "6px",
                border: "1px solid var(--slate-200)",
                cursor: onClick ? "pointer" : "default",
                transition: "all 0.15s ease",
                ...style,
            }}
        />
    );
}
