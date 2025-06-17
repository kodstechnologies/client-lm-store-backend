import { Customer } from "../../models/Customer.model.js";
import OrdersModel from "../../models/Orders.model.js";
const REDIRECTION_URL = process.env.REDIRECTION_URL
console.log("🚀 ~ REDIRECTION_URL:", REDIRECTION_URL)

// export const createOrderForEligibleCustomer = async (req, res) => {
//     try {
//         const { customerId } = req.body;

//         if (!customerId) {
//             return res.status(400).json({ error: 'Customer ID is required' });

//         }

//         const customer = await Customer.findById(customerId);
//         if (!customer) {
//             return res.status(404).json({ error: 'Customer not found' });
//         }

//         const { storeId, merchantId } = req.store || {};
//         console.log("🚀 ~ createOrderForEligibleCustomer ~ merchantId:", merchantId)
//         const now = new Date();

//         // Try to find an existing valid order
//         let order = await OrdersModel.findOne({
//             number: customer.mobileNumber,
//             eligibility_expiry_date: { $gte: now },
//         });

//         // Generate new unique orderId (for updating)
//         const newOrderId = `LMO_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
//         const newQrUrl = `${REDIRECTION_URL}/order/${newOrderId}`;
//         const expiryDate = customer.eligibility_expiry_date || new Date(now.setDate(now.getDate() + 30));

//         if (order) {
//             //  Update existing order instead of creating new one
//             order.orderId = newOrderId;
//             order.qrUrl = newQrUrl;
//             order.eligibleAmount = customer.data?.max_eligibility_amount || null;
//             order.max_amount = customer.data?.max_amount || null;
//             order.eligibility_expiry_date = expiryDate;
//             order.status = 'QR Generated';
//             order.name = `${customer.first_name} ${customer.last_name}`;
//             order.storeId = storeId || null;
//             order.chainStoreId = merchantId || null;

//             await order.save();
//         } else {
//             //  Create new order if none exists
//             order = new OrdersModel({
//                 customerId: customer._id,
//                 name: `${customer.first_name} ${customer.last_name}`,
//                 number: customer.mobileNumber,
//                 eligibleAmount: customer.data?.max_eligibility_amount || null,
//                 max_amount: customer.data?.max_amount || null,
//                 eligibility_expiry_date: expiryDate,
//                 storeId: storeId || null,
//                 chainStoreId: merchantId || null,
//                 orderId: newOrderId,
//                 qrUrl: newQrUrl,
//                 status: 'QR Generated',
//             });

//             await order.save();
//         }

//         return res.status(200).json({
//             message: 'Order created or updated successfully',
//             order,
//         });

//     } catch (err) {
//         console.error('Order creation error:', err);
//         return res.status(500).json({ error: 'Something went wrong' });
//     }
// };
////seperation/////

// export const createOrderForEligibleCustomer = async (req, res) => {
//     try {
//         const { customerId } = req.body;

//         if (!customerId) {
//             return res.status(400).json({ error: ' ID is required' });
//         }

//         const customer = await Customer.findById(customerId);
//         if (!customer) {
//             return res.status(404).json({ error: 'Customer not found' });
//         }

//         const { storeId, merchantId } = req.store || {};
//         console.log("🚀 ~ createOrderForEligibleCustomer ~ merchantId:", merchantId);

//         const now = new Date();

//         // Check if there's an existing COMPLETED order — if yes, treat this as new user (do NOT reuse existing order)
//         const completedOrder = await OrdersModel.findOne({
//             customerId,
//             status: 'Completed'
//         });

//         let order = null;
//         const newOrderId = `LMO_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
//         const newQrUrl = `${REDIRECTION_URL}/order/${newOrderId}`;
//         const expiryDate = customer.eligibility_expiry_date || new Date(now.setDate(now.getDate() + 30));

//         if (completedOrder) {
//             // Create new order for returning user with completed status (fresh order)
//             order = new OrdersModel({
//                 customerId: customer._id,
//                 name: `${customer.first_name} ${customer.last_name}`,
//                 number: customer.mobileNumber,
//                 eligibleAmount: customer.data?.max_eligibility_amount || null,
//                 max_amount: customer.data?.max_amount || null,
//                 eligibility_expiry_date: expiryDate,
//                 storeId: storeId || null,
//                 chainStoreId: merchantId || null,
//                 orderId: newOrderId,
//                 qrUrl: newQrUrl,
//                 status: 'QR Generated',
//             });

//             await order.save();
//         } else {
//             // No completed order — check if an existing *active* order can be updated
//             order = await OrdersModel.findOne({
//                 number: customer.mobileNumber,
//                 eligibility_expiry_date: { $gte: now },
//             });

//             if (order) {
//                 // Update existing valid order
//                 order.orderId = newOrderId;
//                 order.qrUrl = newQrUrl;
//                 order.eligibleAmount = customer.data?.max_eligibility_amount || null;
//                 order.max_amount = customer.data?.max_amount || null;
//                 order.eligibility_expiry_date = expiryDate;
//                 order.status = 'QR Generated';
//                 order.name = `${customer.first_name} ${customer.last_name}`;
//                 order.storeId = storeId || null;
//                 order.chainStoreId = merchantId || null;

//                 await order.save();
//             } else {
//                 // No valid active order — create a fresh one
//                 order = new OrdersModel({
//                     customerId: customer._id,
//                     name: `${customer.first_name} ${customer.last_name}`,
//                     number: customer.mobileNumber,
//                     eligibleAmount: customer.data?.max_eligibility_amount || null,
//                     max_amount: customer.data?.max_amount || null,
//                     eligibility_expiry_date: expiryDate,
//                     storeId: storeId || null,
//                     chainStoreId: merchantId || null,
//                     orderId: newOrderId,
//                     qrUrl: newQrUrl,
//                     status: 'QR Generated',
//                 });

//                 await order.save();
//             }
//         }

//         return res.status(200).json({
//             message: 'Order created or updated successfully',
//             order,
//         });

//     } catch (err) {
//         console.error('Order creation error:', err);
//         return res.status(500).json({ error: 'Something went wrong' });
//     }
// };


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
        console.log("🚀 ~ createOrderForEligibleCustomer ~ req.store:", req.store)

        const now = new Date();
        const newOrderId = `LMO_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        const newQrUrl = `${REDIRECTION_URL}/order/${newOrderId}`;
        const expiryDate = customer.eligibility_expiry_date || new Date(now.setDate(now.getDate() + 30));
        console.log("🚀 ~ createOrderForEligibleCustomer ~ expiryDate:", expiryDate)

        //  Check for existing 'QR Generated' order
        let existingOrder = await OrdersModel.findOne({
            number: String(customer.mobileNumber),
            status: 'QR Generated',
            eligibility_expiry_date: { $gte: new Date(new Date().toISOString()) },
            storeId:storeId  
        });

        if (existingOrder) {
            // Update the existing order
            existingOrder.orderId = newOrderId;
            existingOrder.qrUrl = newQrUrl;
            existingOrder.eligibleAmount = customer.data?.max_eligibility_amount || null;
            existingOrder.max_amount = customer.data?.max_amount || null;
            existingOrder.eligibility_expiry_date = expiryDate;
            existingOrder.name = `${customer.first_name} ${customer.last_name}`;
            existingOrder.storeId = storeId || null;
            existingOrder.chainStoreId = merchantId || null;

            await existingOrder.save();

            await Customer.findByIdAndUpdate(customer._id, { status: 'QR Generated' });

            return res.status(200).json({
                message: 'Existing QR order updated successfully',
                order: existingOrder,
                customerId: customer._id,

            });
        }

        // No 'QR Generated' order, so create new
        const newOrder = new OrdersModel({
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

        await newOrder.save();
        await Customer.findByIdAndUpdate(customer._id, { status: 'QR Generated' });

        return res.status(200).json({
            message: 'New QR order created successfully',
            order: newOrder,
        });

    } catch (err) {
        console.error('Order creation error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};


export const updateOrderById = async (req, res) => {
    const { orderId } = req.params;

    try {
        // Step 1: Find the order to get customerId
        const order = await OrdersModel.findOneAndUpdate(
            { orderId },
            { status: "Completed" },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ error: "Order not found." });
        }

        // Step 2: Update the related customer document's status
        await Customer.findByIdAndUpdate(order.customerId, {
            status: "Completed",
        });

        return res.status(200).json({ success: true, message: "Order and customer updated" });

    } catch (err) {
        console.error("Error updating order or customer:", err);
        return res.status(500).json({ error: "Failed to update order and customer." });
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
        }).sort({ updatedAt: -1 }); // -1 for descending order
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

export const fetchCustomerDetailsByStoreId = async (req, res) => {
    try {
        const { storeId } = req.store; // from token middleware
        console.log("🚀 ~ fetchCustomerDetailsByStoreId ~ storeId:", storeId)
        const { id } = req.params;     // customer ID from URL
        console.log("🚀 ~ fetchCustomerDetailsByStoreId ~ id:", id)

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Customer ID is required",
            });
        }

        const customer = await Customer.find({ _id: id})

        console.log("🚀 ~ fetchCustomerDetailsByStoreId ~ customer:", customer)


        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found or does not belong to this store",
            });
        }

        return res.status(200).json({
            success: true,
            data: customer,
        });

    } catch (error) {
        console.error("Error fetching customer:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching customer details",
        });
    }
}

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
        }).sort({ updatedAt: -1 });

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
