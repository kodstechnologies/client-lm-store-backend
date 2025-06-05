import { Customer } from "../../models/Customer.model.js";
import OrdersModel from "../../models/Orders.model.js";
const REDIRECTION_URL = process.env.REDIRECTION_URL

export const createOrderForEligibleCustomer = async (req, res) => {
    try {
        const { customerId } = req.body;

        if (!customerId) {
            return res.status(400).json({ error: 'Customer ID is required' });
        }

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const { storeId, merchantId } = req.store || {};
        const now = new Date();

        // Try to find an existing valid order
        let order = await OrdersModel.findOne({
            number: customer.mobileNumber,
            eligibility_expiry_date: { $gte: now },
        });

        // Generate new unique orderId (for updating)
        const newOrderId = `LMO_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        const newQrUrl = `${REDIRECTION_URL}/order/${newOrderId}`;
        const expiryDate = customer.eligibility_expiry_date || new Date(now.setDate(now.getDate() + 30));

        if (order) {
            //  Update existing order instead of creating new one
            order.orderId = newOrderId;
            order.qrUrl = newQrUrl;
            order.eligibleAmount = customer.data?.max_eligibility_amount || null;
            order.max_amount = customer.data?.max_amount || null;
            order.eligibility_expiry_date = expiryDate;
            order.status = 'QR Generated';
            order.name = `${customer.first_name} ${customer.last_name}`;
            order.storeId = storeId || null;
            order.chainStoreId = merchantId || null;

            await order.save();
        } else {
            //  Create new order if none exists
            order = new OrdersModel({
                customerId: customer._id,
                name: `${customer.first_name} ${customer.last_name}`,
                number: customer.mobileNumber,
                eligibleAmount: customer.data?.max_eligibility_amount || null,
                max_amount: customer.data?.max_amount || null,
                eligibility_expiry_date: expiryDate,
                storeId: storeId || null,
                chainStoreId: merchantId || null,
                orderId: newOrderId,
                qrUrl: newQrUrl,
                status: 'QR Generated',
            });

            await order.save();
        }

        return res.status(200).json({
            message: 'Order created or updated successfully',
            order,
        });

    } catch (err) {
        console.error('Order creation error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};




export const fetchAllOrders = async (req, res) => {
    try {
        // Fetch all orders from the database
        const orders = await OrdersModel.find();

        // Send orders as JSON response
        return res.status(200).json({
            success: true,
            data: orders,
        });
    } catch (error) {
        console.error('Error fetching orders:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message,
        });
    }
};

export const getOrdersByStoreId = async (req, res) => {
    try {
        const { storeId } = req.store;
        console.log("🚀 ~ getOrdersByStoreId ~ storeId:", storeId)

        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store ID is missing from token',
            });
        }

        const now = new Date();

        // Find orders and sort by createdAt descending (latest first)
        const orders = await OrdersModel.find({
            storeId: storeId,
            eligibility_expiry_date: { $gte: now }
        }).sort({ createdAt: -1 }); // -1 for descending order
        console.log("🚀 ~ getOrdersByStoreId ~ orders:", orders)

        return res.status(200).json({
            success: true,
            data: orders,
        });
    } catch (error) {
        console.error('Error fetching orders by storeId:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch orders by storeId',
            error: error.message,
        });
    }
};


export const updateOrderById = async (req, res) => {
    const { orderId } = req.params;
    try {
        await OrdersModel.findOneAndUpdate({ orderId }, { status: "Completed" });
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: "Failed to update order." });
    }
};

export const searchOrderByNumber = async (req, res) => {
    try {
        const { number } = req.query;
        const { storeId } = req.store;

        if (!number) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        if (!storeId) {
            return res.status(400).json({ message: 'Store ID is missing from token' });
        }

        const now = new Date();

        const orders = await OrdersModel.find({
            number,
            storeId,
            eligibility_expiry_date: { $gte: now },
        }).sort({ createdAt: -1 });

        if (orders.length === 0) {
            return res.status(404).json({ message: 'No orders found for this number in this store' });
        }

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error('Search Order Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};



export const getOrdersByDate = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const filter = {};
        const { storeId } = req.store;
        console.log("🚀 ~ getOrdersByStoreId ~ storeId:", storeId)

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start) || isNaN(end)) {
                return res.status(400).json({ message: "Invalid start or end date" });
            }

            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            filter.createdAt = {
                $gte: start,
                $lte: end,
            };
        }

        const orders = await OrdersModel.find(filter).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders by date:", error);
        res.status(500).json({ message: "Server error" });
    }
};

