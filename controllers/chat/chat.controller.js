import { db } from "../../models/index.js";
import { responseReturn } from "../../utils/response.js"
import { Op } from "sequelize"

class chatController {

    add_customer_friend = async (req, res) => {
        const { sellerId, userId } = req.body;

        try {
            if (sellerId !== '') {
                const seller = await db.Seller.findByPk(sellerId);
                const user = await db.Customer.findByPk(userId);

                const userRelation = await db.SellerCustomer.findOne({
                    where: { myId: userId },
                });

                const existingSellerFriend = userRelation?.myFriends?.find(f => f.fdId === sellerId);

                if (!existingSellerFriend) {
                    userRelation.myFriends = [
                        ...userRelation.myFriends,
                        {
                            fdId: sellerId,
                            name: seller?.shopInfo?.[0]?.yardTitle,
                            image: seller.image
                        }
                    ];
                    await userRelation.save();
                }

                const sellerRelation = await db.SellerCustomer.findOne({
                    where: { myId: sellerId }
                });

                const existingCustomerFriend = sellerRelation?.myFriends?.find(f => f.fdId === userId);

                if (!existingCustomerFriend) {
                    sellerRelation.myFriends = [
                        ...(Array.isArray(sellerRelation.myFriends) ? sellerRelation.myFriends : []),
                        {
                            fdId: userId,
                            name: user.name,
                            image: ""
                        }
                    ];
                    await sellerRelation.save();
                }

                const messages = await db.SellerCustomerMessage.findAll({
                    where: {
                        [Op.or]: [
                            { senderId: userId, receverId: sellerId },
                            { senderId: sellerId, receverId: userId }
                        ]
                    }
                });

                const MyFriends = await db.SellerCustomer.findOne({ where: { myId: userId } });
                const currentFd = MyFriends.myFriends.find(s => s.fdId === sellerId);

                responseReturn(res, 200, {
                    myFriends: MyFriends.myFriends,
                    currentFd,
                    messages
                });
            } else {
                const MyFriends = await db.SellerCustomer.findOne({ where: { myId: userId } });
                responseReturn(res, 200, {
                    myFriends: MyFriends.myFriends
                });
            }
        } catch (error) {
            console.log(error);
        }
    }

    customer_message_add = async (req, res) => {
        const { userId, text, sellerId, name } = req.body;

        try {
            const message = await db.SellerCustomerMessage.create({
                senderId: userId,
                senderName: name,
                receverId: sellerId,
                message: text
            });

            const updateFriendListOrder = async (ownerId, friendId) => {
                const relation = await db.SellerCustomer.findOne({ where: { myId: ownerId } });
                let friends = [...relation.myFriends];
                let index = friends.findIndex(f => f.fdId === friendId);

                while (index > 0) {
                    [friends[index], friends[index - 1]] = [friends[index - 1], friends[index]];
                    index--;
                }

                relation.myFriends = friends;
                await relation.save();
            };

            await updateFriendListOrder(userId, sellerId);
            await updateFriendListOrder(sellerId, userId);

            responseReturn(res, 201, { message });
        } catch (error) {
            console.log(error);
        }
    };

    get_customers = async (req, res) => {
        const { sellerId } = req.params;

        try {
            const data = await db.SellerCustomer.findOne({ where: { myId: sellerId } });

            const customers = data && Array.isArray(data.myFriends) ? data.myFriends : [];

            responseReturn(res, 200, { customers });
        } catch (error) {
            console.log(error);
            responseReturn(res, 500, { error: 'Server error' });
        }
    };

    get_customer_seller_message = async (req, res) => {
        const { customerId } = req.params;
        const { id } = req;

        try {
            const messages = await db.SellerCustomerMessage.findAll({
                where: {
                    [Op.or]: [
                        { senderId: id, receverId: customerId },
                        { senderId: customerId, receverId: id }
                    ]
                }
            });

            const currentCustomer = await db.Customer.findByPk(customerId);
            responseReturn(res, 200, { messages, currentCustomer });
        } catch (error) {
            console.log(error);
        }
    };

    seller_message_add = async (req, res) => {
        const { senderId, text, receverId, name } = req.body;

        try {
            const message = await db.SellerCustomerMessage.create({
                senderId,
                senderName: name,
                receverId,
                message: text
            });

            const updateFriendListOrder = async (ownerId, friendId) => {
                const relation = await db.SellerCustomer.findOne({ where: { myId: ownerId } });
                const friends = [...relation.myFriends];
                const index = friends.findIndex(f => f.fdId === friendId);

                while (index > 0) {
                    [friends[index], friends[index - 1]] = [friends[index - 1], friends[index]];
                    index--;
                }

                relation.myFriends = friends;
                await relation.save();
            };

            await updateFriendListOrder(senderId, receverId);
            await updateFriendListOrder(receverId, senderId);

            responseReturn(res, 201, { message });
        } catch (error) {
            console.log(error);
        }
    };

    get_sellers = async (req, res) => {
        try {
            const sellers = await db.Seller.findAll();
            responseReturn(res, 200, { sellers });
        } catch (error) {
            console.log(error);
        }
    };

    seller_admin_message_insert = async (req, res) => {
        const { senderId, receverId, message, senderName } = req.body;
        try {
            const messageData = await db.AdminSellerMessage.create({
                senderId,
                receverId,
                senderName,
                message
            });

            responseReturn(res, 200, { message: messageData });
        } catch (error) {
            console.log(error);
        }
    };

    get_admin_messages = async (req, res) => {
        const { receverId } = req.params;
        const id = ""; // Replace with actual admin ID if needed

        try {
            const messages = await db.AdminSellerMessage.findAll({
                where: {
                    [Op.or]: [
                        { senderId: id, receverId },
                        { senderId: receverId, receverId: id }
                    ]
                }
            });

            const currentSeller = receverId ? await db.Seller.findByPk(receverId) : {};
            responseReturn(res, 200, { messages, currentSeller });
        } catch (error) {
            console.log(error);
        }
    };

    get_seller_messages = async (req, res) => {
        const receverId = ""; // Replace with actual admin ID if needed
        const { id } = req;

        try {
            const messages = await db.AdminSellerMessage.findAll({
                where: {
                    [Op.or]: [
                        { senderId: id, receverId },
                        { senderId: receverId, receverId: id }
                    ]
                }
            });

            responseReturn(res, 200, { messages });
        } catch (error) {
            console.log(error);
        }
    };

    get_last_seller_message = async (req, res) => {
        const messages = await db.AdminSellerMessage.findAll({ order: [['createdAt', 'DESC']] });
        const map = {}

        messages.forEach(msg => {
            if (!map[msg.senderId] && msg.senderId !== '') {
                map[msg.senderId] = msg
            }
        })

        res.json(Object.values(map))
    }

    get_seller_unseen_count = async (req, res) => {
        const messages = await db.AdminSellerMessage.findAll({
            where: {
                status: 'unseen',
                receverId: ''
            }
        })

        const map = {}

        messages.forEach(msg => {
            map[msg.senderId] = (map[msg.senderId] || 0) + 1
        })

        res.json(map)
    }

}

export default new chatController()