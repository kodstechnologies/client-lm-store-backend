import OrdersModel from "../../models/Orders.model.js";

export const getOrderStatusCounts = async (req, res) => {
    try {
        const storeId = req.store?.storeId;

        if (!storeId) {
            return res.status(400).json({ message: 'Store ID is missing from token' });
        }

        const qrGeneratedCount = await OrdersModel.countDocuments({
            status: 'QR Generated',
            storeId: storeId,
        });

        const completedCount = await OrdersModel.countDocuments({
            status: 'Completed',
            storeId: storeId,
        });

        res.status(200).json({
            qrGenerated: qrGeneratedCount,
            completed: completedCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};


//stats of orders
export const getMonthlyOrderStats = async (req, res) => {
    try {
        const storeId = req.store?.storeId;

        if (!storeId) {
            return res.status(400).json({ message: 'Store ID is missing from token' });
        }

        const stats = await OrdersModel.aggregate([
            {
                $match: {
                    createdAt: { $exists: true },
                    status: { $in: ['QR Generated', 'Completed'] },
                    storeId: storeId, // match specific store
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        status: '$status'
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const chartData = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            qrGenerated: 0,
            completed: 0,
        }));

        stats.forEach(stat => {
            const monthIndex = stat._id.month - 1;
            if (stat._id.status === 'QR Generated') {
                chartData[monthIndex].qrGenerated = stat.count;
            } else if (stat._id.status === 'Completed') {
                chartData[monthIndex].completed = stat.count;
            }
        });

        res.status(200).json(chartData);
    } catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
