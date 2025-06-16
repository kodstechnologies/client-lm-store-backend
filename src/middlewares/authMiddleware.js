import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authorization token missing or malformed" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Store all relevant details from decoded token in req.store
        req.store = {
            storeId: decoded.storeId,
            phoneNumber: decoded.phoneNumber,
            storeName: decoded.storeName,
            merchantId: decoded.merchantId,
            isActive: decoded.isActive,
        };
        console.log("Decoded Token:", decoded);

        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};