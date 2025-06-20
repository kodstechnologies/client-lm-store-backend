import express from "express";
import { mobileVerify, verifyOtp } from "../controllers/store/AuthController.js";
import { checkCustomerEligibility, sendOtpEligibilityCheck, verifyOtpEligibilityCheck } from "../controllers/Merchant/createOrder.controller.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createOrderForEligibleCustomer, fetchAllOrders, fetchCustomerDetailsByStoreId, getOrdersByDate, getOrdersByStoreId, searchOrderByNumber, updateOrderById } from "../controllers/Merchant/OrderManagement.controller.js";
import { getMonthlyOrderStats, getOrderStatusCounts } from "../controllers/Merchant/dashboard.controller.js";
const router = express.Router();

router.get("/test", (req, res) => {
    console.log("✅ Test route hit: /api/test");
    res.status(200).json({ message: "Merchant test route working!" });
});
router.post("/mobile-verification", mobileVerify);
router.post("/otp-verify", verifyOtp)
router.get("/order/:orderId", (req, res) => {
    // const { orderId } = req.params;
    // console.log("Redirecting order:", orderId);
    return res.redirect(
        "https://web.fatakpay.com/authentication/login?utm_source=556_JQG70&utm_medium="
    );
});
// router.get('/get-orders-by-date', getOrdersByDate)
router.use(authenticateToken)
//create order
router.post('/send-otp-eligibility-check', sendOtpEligibilityCheck)
router.post('/otp-verify-eligible-check', verifyOtpEligibilityCheck)
router.post('/check-customer-eligibility', checkCustomerEligibility)
router.post('/create-order', createOrderForEligibleCustomer)

// router.use()
//order management
router.get('/all-orders', fetchAllOrders)
router.get('/orders-by-store', getOrdersByStoreId)
router.put('/update-order-by-id/:orderId', updateOrderById)
router.get('/search-by-number', searchOrderByNumber)
router.get('/get-orders-by-date', getOrdersByDate)
router.get('/get-customer-details/:id', fetchCustomerDetailsByStoreId)
//dashboard
router.get('/status-counts', getOrderStatusCounts)
router.get('/monthly-stats', getMonthlyOrderStats)


export default router;
//testing