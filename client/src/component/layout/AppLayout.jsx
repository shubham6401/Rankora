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

    // Track super admin backup session (strictly active when Super Admin impersonates an executive or mediator)
    const [adminBackup, setAdminBackup] = useState(() => {
        try {
            const raw = localStorage.getItem("adminBackupSession");
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (
                parsed &&
                parsed.token &&
                parsed.user &&
                (parsed.user.isSuperAdmin === true ||
                 parsed.user.username === "AdminShubhamsecreate" ||
                 parsed.user.name === "AdminShubhamsecreate")
            ) {
                return parsed;
            }
            localStorage.removeItem("adminBackupSession");
            return null;
        } catch {
            localStorage.removeItem("adminBackupSession");
            return null;
        }
    });

    useEffect(() => {
        try {
            const raw = localStorage.getItem("adminBackupSession");
            if (!raw) {
                setAdminBackup(null);
                return;
            }
            const parsed = JSON.parse(raw);
            if (
                parsed &&
                parsed.token &&
                parsed.user &&
                (parsed.user.isSuperAdmin === true ||
                 parsed.user.username === "AdminShubhamsecreate" ||
                 parsed.user.name === "AdminShubhamsecreate")
            ) {
                setAdminBackup(parsed);
            } else {
                localStorage.removeItem("adminBackupSession");
                setAdminBackup(null);
            }
        } catch {
            localStorage.removeItem("adminBackupSession");
            setAdminBackup(null);
        }
    }, [location.pathname]);

    const handleReturnToSuperAdmin = () => {
        const raw = localStorage.getItem("adminBackupSession");
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.token && parsed.user) {
                    localStorage.setItem("token", parsed.token);
                    localStorage.setItem("user", JSON.stringify(parsed.user));
                    localStorage.removeItem("adminBackupSession");
                    setAdminBackup(null);
                    navigate(parsed.returnPath || "/admin/dashboard", { replace: true });
                    return;
                }
            } catch (err) {
                console.error("Failed to restore admin session:", err);
            }
        }
        localStorage.removeItem("adminBackupSession");
        setAdminBackup(null);
        navigate("/admin/login");
    };

    const user = JSON.parse(localStorage.getItem("user")) || {};
    const role = (user.role || "").toLowerCase();

    const isAdmin = role === "admin" || location.pathname.includes("admin");
    const isExecutive = !isAdmin && (role === "executive" || location.pathname.includes("executive"));
    const isBrand = !isAdmin && (role === "brand" || location.pathname.includes("brand"));
    const isMediator = !isAdmin && !isExecutive && !isBrand;

    const userRoleDisplay = isAdmin
        ? (user.isSuperAdmin ? "Super Admin" : "Admin")
        : isExecutive
        ? "Executive"
        : isBrand
        ? "Brand"
        : "Mediator";

    const roleBadgeClass = isAdmin
        ? "admin"
        : isExecutive
        ? "executive"
        : isBrand
        ? "brand"
        : "mediator";

    const adminNavSections = [
        {
            title: "Control Console",
            items: [
                { title: "Admin Dashboard", path: "/admin/dashboard", icon: "🛡️" },
            ],
        },
        {
            title: "Operations Oversight",
            items: [
                { title: "Brands Overview", path: "/executive-brands", icon: "🏢" },
                { title: "Master Analytics", path: "/executive-analytics", icon: "📈" },
            ],
        },
    ];

    const executiveNavSections = [
        {
            title: "Main",
            items: [
                { title: "Dashboard", path: "/dashboard-executive", icon: "📊" },
                { title: "Brands Overview", path: "/executive-brands", icon: "🏢" },
                { title: "Master Analytics", path: "/executive-analytics", icon: "📈" },
                { title: "Address Book", path: "/executive-addresses", icon: "📍" },
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
            title: "Campaign Operations",
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
                { title: "Return Refunds", path: "/mediator-pending-payment", icon: "💳" },
                { title: "Balance Overview", path: "/mediator-balance", icon: "⚖️" },
                { title: "Earnings", path: "/mediator-earnings", icon: "💰" },
            ],
        },
    ];

    const brandNavSections = [
        {
            title: "Brand Overview",
            items: [
                { title: "Master Orders", path: "/brand-dashboard", icon: "🏢" },
            ],
        },
    ];

    const navSections = isAdmin
        ? adminNavSections
        : isExecutive
        ? executiveNavSections
        : isBrand
        ? brandNavSections
        : mediatorNavSections;

    const findBreadcrumb = (path) => {
        for (const sec of navSections) {
            for (const item of sec.items) {
                if (item.path === path) return item.title;
            }
        }
        return "Dashboard";
    };

    const currentBreadcrumb = findBreadcrumb(location.pathname);

    const initial = (user.name || user.brand || (isAdmin ? "Admin" : "U")).charAt(0).toUpperCase();

    return (
        <div className="app-shell" style={{ paddingTop: adminBackup ? "44px" : "0" }}>
            {/* TOP HEADING: RETURN TO SUPER ADMIN (STRICTLY DISPLAYED ONLY FOR SUPER ADMIN IMPERSONATION) */}
            {adminBackup && (
                <header
                    id="super-admin-return-header"
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "44px",
                        zIndex: 99999,
                        background: "linear-gradient(90deg, #581c87 0%, #7e22ce 50%, #6b21a8 100%)",
                        color: "#ffffff",
                        padding: "0 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.35)",
                        boxSizing: "border-box"
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "16px" }}>👑</span>
                        <h2 style={{
                            margin: 0,
                            padding: 0,
                            fontSize: "14px",
                            fontWeight: "800",
                            letterSpacing: "0.3px",
                            color: "#ffffff"
                        }}>
                            Return to Super Admin
                        </h2>
                    </div>

                    <button
                        type="button"
                        id="return-to-super-admin-btn"
                        onClick={handleReturnToSuperAdmin}
                        style={{
                            background: "#ffffff",
                            color: "#581c87",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 16px",
                            fontWeight: "800",
                            fontSize: "12.5px",
                            cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            whiteSpace: "nowrap",
                            transition: "all 0.15s ease"
                        }}
                    >
                        <span>↩</span>
                        <span>Return to Super Admin</span>
                    </button>
                </header>
            )}

            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`app-sidebar ${sidebarOpen ? "open" : "collapsed"}`} style={{ top: adminBackup ? "44px" : "0", height: adminBackup ? "calc(100vh - 44px)" : "100vh" }}>
                <div className="app-sidebar-header">
                    <Link
                        to={isAdmin ? "/admin/dashboard" : isExecutive ? "/dashboard-executive" : isBrand ? "/dashboard-brand" : "/panel-mediator"}
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
                            <div className="sidebar-user-name">{user.name || (isAdmin ? "System Admin" : "User")}</div>
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
                            {isAdmin && (
                                <div className="app-meta-pill" style={{ background: "rgba(124, 58, 237, 0.08)", border: "1px solid rgba(124, 58, 237, 0.25)" }}>
                                    <span style={{ color: "#7c3aed" }}>Console:</span>
                                    <b style={{ color: "#7c3aed" }}>Root Admin</b>
                                </div>
                            )}

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
