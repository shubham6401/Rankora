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

module.exports = { authorizeRoles, requireSuperAdmin };
