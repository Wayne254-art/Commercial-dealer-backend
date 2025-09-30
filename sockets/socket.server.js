// sockets/socket.server.js
import { Server } from 'socket.io';
import { db } from "../../models/index.js";

let allCustomer = [];
let allSeller = [];
let admin = {};

const addUser = (customerId, socketId, userInfo) => {
    if (!allCustomer.some(u => u.customerId === customerId)) {
        allCustomer.push({ customerId, socketId, userInfo });
    }
};

const addSeller = (sellerId, socketId, userInfo) => {
    if (!allSeller.some(u => u.sellerId === sellerId)) {
        allSeller.push({ sellerId, socketId, userInfo });
    }
};

const findCustomer = (customerId) => allCustomer.find(c => c.customerId === customerId);
const findSeller = (sellerId) => allSeller.find(c => c.sellerId === sellerId);

const remove = (socketId) => {
    allCustomer = allCustomer.filter(c => c.socketId !== socketId);
    allSeller = allSeller.filter(c => c.socketId !== socketId);
};

const removeAdmin = (socketId) => {
    if (admin.socketId === socketId) admin = {};
};

export const setupSocketServer = (server) => {
    const io = new Server(server, {
        cors: {
            origin: ['http://localhost:3000', 'http://localhost:3001'],
            credentials: true,
        },
    });

    io.on('connection', (soc) => {
        soc.on('add_user', (customerId, userInfo) => {
            addUser(customerId, soc.id, userInfo);
            io.emit('activeSeller', allSeller);
            io.emit('activeCustomer', allCustomer);
        });

        soc.on('add_seller', (sellerId, userInfo) => {
            addSeller(sellerId, soc.id, userInfo);
            io.emit('activeSeller', allSeller);
            io.emit('activeCustomer', allCustomer);
            io.emit('activeAdmin', { status: true });
        });

        soc.on('add_admin', (adminInfo) => {
            const sanitizedAdmin = { ...adminInfo };
            delete sanitizedAdmin.email;
            sanitizedAdmin.socketId = soc.id;
            admin = sanitizedAdmin;
            io.emit('activeSeller', allSeller);
            io.emit('activeAdmin', { status: true });
        });

        soc.on('send_seller_message', (msg) => {
            const customer = findCustomer(msg.receverId);
            if (customer) soc.to(customer.socketId).emit('seller_message', msg);
        });

        soc.on('send_customer_message', (msg) => {
            const seller = findSeller(msg.receverId);
            if (seller) soc.to(seller.socketId).emit('customer_message', msg);
        });

        soc.on('send_message_admin_to_seller', (msg) => {
            const seller = findSeller(msg.receverId);
            if (seller) soc.to(seller.socketId).emit('receved_admin_message', msg);
        });

        soc.on('send_message_seller_to_admin', (msg) => {
            msg.status = 'unseen';
            if (admin.socketId) soc.to(admin.socketId).emit('receved_seller_message', msg);
        });

        soc.on('mark_customer_messages_seen', async ({ customerId, sellerId }) => {
            try {
                await db.SellerCustomerMessage.update(
                    { status: 'seen' },
                    {
                        where: {
                            senderId: sellerId,
                            receverId: customerId,
                            status: 'unseen',
                        },
                    }
                );
                const seller = findSeller(sellerId);
                if (seller) soc.to(seller.socketId).emit('customer_read_your_messages', { by: customerId });
            } catch (err) {
                console.error('Error marking customer messages seen:', err);
            }
        });

        soc.on('mark_seller_messages_seen', async ({ sellerId, customerId }) => {
            try {
                await db.SellerCustomerMessage.update(
                    { status: 'seen' },
                    {
                        where: {
                            senderId: customerId,
                            receverId: sellerId,
                            status: 'unseen',
                        },
                    }
                );
                const customer = findCustomer(customerId);
                if (customer) soc.to(customer.socketId).emit('seller_read_your_messages', { by: sellerId });
            } catch (err) {
                console.error('Error marking seller messages seen:', err);
            }
        });

        soc.on('mark_seller_admin_messages_seen', async ({ sellerId, adminId }) => {
            try {
                await db.AdminSellerMessage.update(
                    { status: 'seen' },
                    {
                        where: {
                            senderId: adminId,
                            receverId: sellerId,
                            status: 'unseen',
                        },
                    }
                );
                const seller = findSeller(sellerId);
                if (seller) soc.to(seller.socketId).emit('admin_read_your_messages', { by: adminId });
            } catch (err) {
                console.error('Error marking admin messages as seen by seller:', err);
            }
        });

        soc.on('mark_admin_seller_messages_seen', async ({ adminId, sellerId }) => {
            const t = await sequelize.transaction();
            try {
                await db.AdminSellerMessage.update(
                    { status: 'seen' },
                    {
                        where: {
                            senderId: sellerId,
                            receverId: '',
                            status: 'unseen',
                        },
                        transaction: t,
                    }
                );
                await t.commit();
                const seller = findSeller(sellerId);
                if (seller) soc.to(seller.socketId).emit('admin_read_your_messages', { by: adminId });
            } catch (err) {
                console.error('Error marking seller messages as seen by admin:', err);
            }
        });

        soc.on('disconnect', () => {
            remove(soc.id);
            removeAdmin(soc.id);
            io.emit('activeAdmin', { status: false });
            io.emit('activeSeller', allSeller);
            io.emit('activeCustomer', allCustomer);
        });
    });
};
