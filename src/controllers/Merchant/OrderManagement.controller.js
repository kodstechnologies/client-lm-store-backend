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

        if (!customer.eligibility_status) {
            return res.status(403).json({ error: 'Customer is not eligible' });
        }

        // Extract storeId and chainStoreId from JWT token (req.user)
        const { storeId, merchantId } = req.store;
        // console.log("🚀 ~ createOrderForEligibleCustomer ~ storeId:", storeId)
        // console.log("🚀 ~ createOrderForEligibleCustomer ~ ChainStoreId:", merchantId)

        // Create order without qrUrl first (orderId will be auto-generated in pre-save)
        const order = new OrdersModel({
            customerId: customer._id,
            name: `${customer.first_name} ${customer.last_name}`,
            number: customer.mobileNumber,
            eligibleAmount: customer.data.max_eligibility_amount,
            storeId: storeId || null,
            chainStoreId: merchantId || null,
        });

        await order.save();

        // Now orderId is generated, update qrUrl accordingly
        order.qrUrl = `https://store.littlemoney.co.in/order/${order.orderId}`;
        await order.save();

        return res.status(201).json({
            message: 'Order created successfully',
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

        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store ID is missing from token',
            });
        }

        // Direct match because storeId is saved as a string in DB
        const orders = await OrdersModel.find({ storeId: storeId });

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
