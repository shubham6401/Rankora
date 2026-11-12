const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                message: "Access forbidden: Role not recognized",
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied: role '${req.user.role}' is not authorized to access this resource`,
            });
        }

        next();
    };
};

const requireSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin" || !req.user.isSuperAdmin) {
        return res.status(403).json({
            success: false,
            message: "Access denied: This high-level action is strictly reserved for Secret Admin (AdminShubhamsecreate)",
        });
    }
    next();
};

// Guard for actions strictly permitted only when authenticated directly or via impersonation through Super Admin (AdminShubhamsecreate)
const requireSuperAdminSession = (req, res, next) => {
    const isSuper = Boolean(
        req.user?.isSuperAdmin ||
        req.user?.isSuperAdminSession ||
        req.user?.impersonatedBy === "AdminShubhamsecreate" ||
        req.user?.username === "AdminShubhamsecreate" ||
        req.user?.name === "AdminShubhamsecreate"
    );

    if (!isSuper) {
        return res.status(403).json({
            success: false,
            message: "Access denied: Field edits and proof overrides are strictly reserved for Super Admin (AdminShubhamsecreate) session",
        });
    }
    next();
};

module.exports = { authorizeRoles, requireSuperAdmin, requireSuperAdminSession };
