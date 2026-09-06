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

module.exports = { authorizeRoles };
