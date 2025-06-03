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
        console.log("🚀 ~ createOrderForEligibleCustomer ~ merchantId:", merchantId)
        console.log("🚀 ~ createOrderForEligibleCustomer ~ req.store:", req.store)

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

        //  If not eligible, try some fallback logic
        // This simulates a check where some other logic throws the "user already exists" message
        // In real cases, this would come from a prior call or catch
        const userAlreadyExists = true; // Simulate your condition check here

        if (!customer.eligibility_status && userAlreadyExists) {
            const createdAt = new Date();
            const eligibility_expiry_date = new Date(createdAt);
            eligibility_expiry_date.setDate(eligibility_expiry_date.getDate() + 30); // add 30 days

            const fallbackOrder = new OrdersModel({
                customerId: customer._id,
                name: `${customer.first_name} ${customer.last_name}`,
                number: customer.mobileNumber,
                storeId: storeId || null,
                chainStoreId: merchantId || null,
                status: 'QR Generated',
                eligibility_expiry_date, // calculated 30-day expiry
            });

            await fallbackOrder.save();

            fallbackOrder.qrUrl = `https://store.littlemoney.co.in/order/${fallbackOrder.orderId}`;
            await fallbackOrder.save();

            console.log("🚀 ~ createOrderForEligibleCustomer ~ fallbackOrder:", fallbackOrder);

            return res.status(201).json({
                message: 'User already exists, order created anyway',
                order: fallbackOrder,
            });
        }


        // If not eligible and not "already exists"
        return res.status(403).json({ error: 'Customer is not eligible' });

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

        if (!number) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        const orders = await OrdersModel.find({ number });

        if (orders.length === 0) {
            return res.status(404).json({ message: 'No orders found with this phone number' });
        }

        res.status(200).json(orders);
    } catch (error) {
        console.error('Search Order Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};


export const getOrdersByDate = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const filter = {};

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

