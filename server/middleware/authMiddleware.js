const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    try {
        let authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authorization token is missing",
            });
        }

        let token = authHeader;
        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Malformed authorization token",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret");
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
            error: err.message,
        });
    }
};

module.exports = verifyToken;