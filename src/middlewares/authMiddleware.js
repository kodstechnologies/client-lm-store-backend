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
            email: decoded.email,
            state: decoded.state,
            gstin: decoded.gstin,
            groupId: decoded.groupId,
            affiliateId: decoded.affiliateId,
            accountId: decoded.accountId,
            merchantId: decoded.ChainStoreId || decoded.ChainStoreId,
            pinCode: decoded.pinCode,
            ifscCode: decoded.ifscCode,
            isActive: decoded.isActive,
            // you can add more fields if included in JWT
        };

        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};