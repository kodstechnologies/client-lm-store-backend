import express from "express";
import { mobileVerify, verifyOtp } from "../controllers/store/AuthController.js";
import { checkCustomerEligibility, sendOtpEligibilityCheck, verifyOtpEligibilityCheck } from "../controllers/Merchant/createOrder.controller.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createOrderForEligibleCustomer, fetchAllOrders, getOrdersByStoreId, searchOrderByNumber, updateOrderById } from "../controllers/Merchant/OrderManagement.controller.js";
import { getMonthlyOrderStats, getOrderStatusCounts } from "../controllers/Merchant/dashboard.controller.js";
const router = express.Router();

router.post("/mobile-verification", mobileVerify);
router.post("/otp-verify", verifyOtp)
router.use(authenticateToken)
//create order
router.post('/send-otp-eligibility-check', sendOtpEligibilityCheck)
router.post('/otp-verify-eligible-check', verifyOtpEligibilityCheck)
router.post('/check-customer-eligibility', checkCustomerEligibility)
router.post('/create-order', createOrderForEligibleCustomer)
router.get("/order/:orderId", (req, res) => {
    return res.redirect(
        "https://web.fatakpay.com/authentication/login?utm_source=556_JQG70&utm_medium="
    );
});
// router.use()
//order management
router.get('/all-orders', fetchAllOrders)
router.get('/orders-by-store', getOrdersByStoreId)
router.put('/update-order-by-id/:orderId', updateOrderById)
router.get('/search-by-number', searchOrderByNumber)


//dashboard
router.get('/status-counts', getOrderStatusCounts)
router.get('/monthly-stats', getMonthlyOrderStats)


export default router;
