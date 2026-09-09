import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Logout from "../Logout";
import "../../styles/appLayout.css";

export default function AppLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== "undefined") {
            return window.innerWidth > 1024;
        }
        return true;
    });

    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth <= 1024) {
            setSidebarOpen(false);
        }
    }, [location.pathname]);

    const user = JSON.parse(localStorage.getItem("user")) || {};
    const role = (user.role || "").toLowerCase();

    const isExecutive = role === "executive" || location.pathname.includes("executive");
    const isBrand = role === "brand" || location.pathname.includes("brand");
    const isMediator = !isExecutive && !isBrand;

    const userRoleDisplay = isExecutive
        ? "Executive"
        : isBrand
        ? "Brand"
        : "Mediator";

    const roleBadgeClass = isExecutive
        ? "executive"
        : isBrand
        ? "brand"
        : "mediator";

    const executiveNavSections = [
        {
            title: "Main",
            items: [
                { title: "Dashboard", path: "/dashboard-executive", icon: "📊" },
            ],
        },
        {
            title: "Order Pipeline",
            items: [
                { title: "Unassigned", path: "/executive-pending-order", icon: "📦" },
                { title: "Advance Payment", path: "/executive-pending-payment", icon: "💳" },
                { title: "Assigned", path: "/executive-assigned-order", icon: "📤" },
                { title: "In Progress", path: "/executive-in_progress-order", icon: "🚀" },
                { title: "Pending Refund", path: "/executive-pending_refund-order", icon: "🔄" },
                { title: "Verify Deliveries", path: "/executive-verify-orders", icon: "🔍" },
                { title: "Completed", path: "/executive-completed-order", icon: "✅" },
            ],
        },
        {
            title: "Finance",
            items: [
                { title: "Verify Refunds", path: "/executive-mediator-sent-payment", icon: "📥" },
                { title: "Balance Settlement", path: "/executive-balance", icon: "⚖️" },
            ],
        },
        {
            title: "Team",
            items: [
                { title: "New Order", path: "/executive-add-order", icon: "➕" },
                { title: "Mediators", path: "/executive-mediators", icon: "👥" },
                { title: "Add Mediator", path: "/signup-mediator", icon: "👤" },
                { title: "Add Brand", path: "/signup-brand", icon: "🏷️" },
            ],
        },
    ];

    const mediatorNavSections = [
        {
            title: "Main",
            items: [
                { title: "Dashboard", path: "/panel-mediator", icon: "📊" },
            ],
        },
        {
            title: "Order Pipeline",
            items: [
                { title: "New Offers", path: "/mediator-neworders", icon: "📥" },
                { title: "In Progress", path: "/mediator-pending-orders", icon: "🚀" },
                { title: "Pending Refund", path: "/mediator-refund_pending-orders", icon: "🔄" },
                { title: "Pending Verification", path: "/mediator-pending-verification", icon: "⏳" },
                { title: "Completed", path: "/mediator-completed-orders", icon: "✅" },
            ],
        },
        {
            title: "Finance & Returns",
            items: [
                { title: "Return Refunds", path: "/mediator-pending-payment", icon: "↩️" },
                { title: "Earnings", path: "/mediator-earnings", icon: "💰" },
                { title: "Balance", path: "/mediator-balance", icon: "⚖️" },
                { title: "Order Breakdown", path: "/mediator-detailed-orders", icon: "📋" },
            ],
        },
    ];

    const brandNavSections = [
        {
            title: "Main",
            items: [
                { title: "Dashboard", path: "/dashboard-brand", icon: "📊" },
            ],
        },
    ];

    const navSections = isExecutive
        ? executiveNavSections
        : isBrand
        ? brandNavSections
        : mediatorNavSections;

    let currentBreadcrumb = "Dashboard";
    for (const sec of navSections) {
        for (const item of sec.items) {
            if (location.pathname === item.path) {
                currentBreadcrumb = item.title;
                break;
            }
        }
    }
    if (location.pathname.startsWith("/order/")) {
        currentBreadcrumb = "Order Details";
    }

    const initial = (user.name || user.brand || "U").charAt(0).toUpperCase();

    return (
        <div className="app-shell">
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`app-sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
                <div className="app-sidebar-header">
                    <Link
                        to={isExecutive ? "/dashboard-executive" : isBrand ? "/dashboard-brand" : "/panel-mediator"}
                        className="app-brand"
                    >
                        <div className="app-brand-icon">R</div>
                        <span className="app-brand-text">Rankora</span>
                    </Link>
                    <button
                        type="button"
                        className="sidebar-close-btn"
                        onClick={() => setSidebarOpen(false)}
                        title="Close Sidebar"
                        aria-label="Close Sidebar"
                    >
                        ✕
                    </button>
                </div>

                <div className={`app-sidebar-role-badge ${roleBadgeClass}`}>
                    {userRoleDisplay}
                </div>

                <nav className="app-sidebar-nav">
                    {navSections.map((sec, sIdx) => (
                        <div key={sIdx} className="nav-section">
                            <div className="nav-section-title">{sec.title}</div>
                            {sec.items.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => {
                                            if (window.innerWidth <= 1024) setSidebarOpen(false);
                                        }}
                                        className={`nav-item ${isActive ? "active" : ""}`}
                                    >
                                        <span className="nav-item-icon">{item.icon}</span>
                                        <span className="nav-item-text">{item.title}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className="app-sidebar-footer">
                    <div className="sidebar-user-info">
                        <div className="sidebar-avatar">{initial}</div>
                        <div className="sidebar-user-details">
                            <div className="sidebar-user-name">{user.name || "User"}</div>
                            <div className="sidebar-user-meta">
                                {user.teamCode ? `Team: ${user.teamCode}` : userRoleDisplay}
                            </div>
                        </div>
                    </div>
                    <Logout className="sidebar-logout-btn" />
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className={`app-main ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
                <header className="app-topbar">
                    <div className="app-topbar-inner">
                        <div className="app-topbar-left">
                            <button
                                type="button"
                                className="hamburger-btn"
                                onClick={() => setSidebarOpen((prev) => !prev)}
                                title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                                aria-label="Toggle navigation sidebar"
                            >
                                <span className="hamburger-bar"></span>
                                <span className="hamburger-bar"></span>
                                <span className="hamburger-bar"></span>
                            </button>

                            <div className="app-breadcrumbs">
                                <span className="breadcrumb-root">Rankora</span>
                                <span className="breadcrumb-sep">/</span>
                                <span className="breadcrumb-current">{currentBreadcrumb}</span>
                            </div>
                        </div>

                        <div className="app-topbar-right">
                            {user.teamCode && (
                                <div className="app-meta-pill">
                                    <span>Team:</span>
                                    <b>{user.teamCode}</b>
                                </div>
                            )}

                            {user.mediatorCode && (
                                <div className="app-meta-pill">
                                    <span>Code:</span>
                                    <b style={{ color: "#2563eb" }}>{user.mediatorCode}</b>
                                </div>
                            )}

                            {isExecutive && (
                                <button
                                    type="button"
                                    onClick={() => navigate("/executive-add-order")}
                                    className="app-btn app-btn-primary app-btn-sm"
                                >
                                    ➕ New Order
                                </button>
                            )}

                            {isMediator && (
                                <button
                                    type="button"
                                    onClick={() => navigate("/mediator-earnings")}
                                    className="app-btn app-btn-primary app-btn-sm"
                                >
                                    💰 Earnings
                                </button>
                            )}

                            {/* LOGOUT BUTTON PERMANENTLY IN TOP TITLE BAR */}
                            <Logout className="topbar-logout-btn" />
                        </div>
                    </div>
                </header>

                <main className="app-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
