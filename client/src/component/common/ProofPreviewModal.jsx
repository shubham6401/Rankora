import React, { useEffect } from "react";
import { isPdfUrl } from "./ProofThumbnail";
import "../../styles/ordersTable.css";

export default function ProofPreviewModal({
    url,
    fileUrl,
    isOpen,
    title = "Proof Preview",
    onClose,
}) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && onClose) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    if (isOpen !== undefined && !isOpen) return null;

    const raw = url || fileUrl;
    if (!raw) return null;

    // Handle object props like { url: "...", title: "..." }
    const actualUrl = typeof raw === "object" ? (raw.url || "") : raw;
    const actualTitle = (typeof raw === "object" && raw.title) ? raw.title : title;

    if (!actualUrl) return null;

    const isPdf = isPdfUrl(actualUrl);

    return (
        <div
            className="image-modal-overlay"
            onClick={onClose}
            style={{
                zIndex: 10000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                className="image-modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: isPdf ? "92vw" : "auto",
                    maxWidth: isPdf ? "1050px" : "90vw",
                    height: isPdf ? "88vh" : "auto",
                    maxHeight: "92vh",
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Header */}
                <div className="image-modal-header" style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "16px" }}>{isPdf ? "📄" : "🖼️"}</span>
                        <span
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--slate-800)",
                            }}
                        >
                            {actualTitle}
                        </span>
                        {isPdf && (
                            <span
                                style={{
                                    fontSize: "10px",
                                    fontWeight: 800,
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    backgroundColor: "#fef2f2",
                                    color: "#dc2626",
                                    border: "1px solid #fecaca",
                                }}
                            >
                                PDF DOCUMENT
                            </span>
                        )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <a
                            href={actualUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="table-btn table-btn-outline"
                            style={{
                                fontSize: "11px",
                                padding: "4px 10px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                textDecoration: "none",
                            }}
                            title="Open in new window"
                        >
                            ↗️ Open in New Tab
                        </a>
                        <button
                            type="button"
                            className="image-modal-close-btn"
                            onClick={onClose}
                        >
                            Close ✕
                        </button>
                    </div>
                </div>

                {/* Body: PDF iframe vs Image */}
                <div
                    style={{
                        flex: 1,
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        backgroundColor: isPdf ? "#f8fafc" : "transparent",
                        borderRadius: "8px",
                    }}
                >
                    {isPdf ? (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <iframe
                                src={actualUrl}
                                title={actualTitle}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    border: "1px solid var(--slate-200)",
                                    borderRadius: "8px",
                                    backgroundColor: "#ffffff",
                                }}
                            />
                        </div>
                    ) : (
                        <img
                            src={actualUrl}
                            alt={actualTitle}
                            className="image-modal-img"
                            style={{
                                maxWidth: "85vw",
                                maxHeight: "75vh",
                                objectFit: "contain",
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
