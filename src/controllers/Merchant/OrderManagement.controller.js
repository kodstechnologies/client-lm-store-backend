import { Customer } from "../../models/Customer.model.js";
import OrdersModel from "../../models/Orders.model.js";

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
        console.log("🚀 ~ createOrderForEligibleCustomer ~ merchantId:", merchantId);

        const now = new Date();

        // Check for existing valid order
        const existingOrder = await OrdersModel.findOne({
            number: customer.mobileNumber,
            eligibility_expiry_date: { $gte: now },
        });

        if (existingOrder) {
            return res.status(200).json({
                message: 'Order already exists for this customer',
                order: existingOrder,
            });
        }

        // 🧠 If eligible, proceed as usual
        if (customer.eligibility_status) {
            const order = new OrdersModel({
                customerId: customer._id,
                name: `${customer.first_name} ${customer.last_name}`,
                number: customer.mobileNumber,
                eligibleAmount: customer.data?.max_eligibility_amount || null,
                eligibility_expiry_date: customer.eligibility_expiry_date,
                storeId: storeId || null,
                chainStoreId: merchantId || null,
                status: 'QR Generated',
            });

            await order.save();

            order.qrUrl = `https://store.littlemoney.co.in/order/${order.orderId}`;
            await order.save();

            return res.status(201).json({
                message: 'Order created successfully',
                order,
            });
        }

        // Fallback case: if not eligible, but still want to create order (simulate "user already exists" case)
        const createdAt = new Date();
        const fallbackExpiry = new Date(createdAt);
        fallbackExpiry.setDate(fallbackExpiry.getDate() + 30);

        const fallbackOrder = new OrdersModel({
            customerId: customer._id,
            name: `${customer.first_name} ${customer.last_name}`,
            number: customer.mobileNumber,
            storeId: storeId || null,
            chainStoreId: merchantId || null,
            status: 'QR Generated',
            eligibility_expiry_date: fallbackExpiry,
        });

        await fallbackOrder.save();

        fallbackOrder.qrUrl = `https://store.littlemoney.co.in/order/${fallbackOrder.orderId}`;
        await fallbackOrder.save();

        return res.status(201).json({
            message: 'User already exists or fallback triggered, order created',
            order: fallbackOrder,
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

