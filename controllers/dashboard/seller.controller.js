import { db } from '../../models/index.js'
import { Op } from 'sequelize'
import { responseReturn } from "../../utils/response.js"

class sellerController {

    get_seller_request = async (req, res) => {
        const { page, searchValue, perPage } = req.query;
        const skipPage = parseInt(perPage) * (parseInt(page) - 1);

        try {
            if (searchValue) {
                // You can add search functionality here if needed
            } else {
                const sellers = await db.Seller.findAll({
                    where: { status: 'pending' },
                    offset: skipPage,
                    limit: parseInt(perPage),
                    order: [['createdAt', 'DESC']]
                });

                const totalSeller = await db.Seller.count({
                    where: { status: 'pending' }
                });

                responseReturn(res, 200, { totalSeller, sellers });
            }
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };

    get_seller = async (req, res) => {
        const { sellerId } = req.params;

        try {
            const seller = await db.Seller.findByPk(sellerId);
            responseReturn(res, 200, { seller });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };

    seller_status_update = async (req, res) => {
        const { sellerId, status } = req.body;

        try {
            await db.Seller.update({ status }, { where: { sellerId: sellerId } });

            const seller = await db.Seller.findByPk(sellerId);
            responseReturn(res, 200, { seller, message: 'Updated successfully' });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };

    get_sellers = async (req, res) => {
        let { page = 1, perPage = 10, searchValue = '' } = req.query;
        page = parseInt(page);
        perPage = parseInt(perPage);
        const offset = perPage * (page - 1);

        try {
            // Common search condition
            const searchCondition = searchValue
                ? {
                    [Op.or]: [
                        { name: { [Op.like]: `%${searchValue}%` } },
                        { email: { [Op.like]: `%${searchValue}%` } },
                    ],
                }
                : {};

            // Fetch sellers by status
            const [active_sellers, inactive_sellers, suspended_sellers] = await Promise.all([
                db.Seller.findAll({
                    where: {
                        status: 'active',
                        ...searchCondition,
                    },
                    offset,
                    limit: perPage,
                    order: [['createdAt', 'DESC']],
                }),
                db.Seller.findAll({
                    where: {
                        status: 'inactive',
                        ...searchCondition,
                    },
                    offset,
                    limit: perPage,
                    order: [['createdAt', 'DESC']],
                }),
                db.Seller.findAll({
                    where: {
                        status: 'suspended',
                        ...searchCondition,
                    },
                    offset,
                    limit: perPage,
                    order: [['createdAt', 'DESC']],
                }),
            ]);

            // Get counts (optional)
            const [totalActive, totalInactive, totalSuspended] = await Promise.all([
                db.Seller.count({ where: { status: 'active', ...searchCondition } }),
                db.Seller.count({ where: { status: 'inactive', ...searchCondition } }),
                db.Seller.count({ where: { status: 'suspended', ...searchCondition } }),
            ]);

            responseReturn(res, 200, {
                active_sellers,
                inactive_sellers,
                suspended_sellers,
                totalActive,
                totalInactive,
                totalSuspended,
            });
        } catch (error) {
            console.log('Error fetching sellers:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

}

export default new sellerController();