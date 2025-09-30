import './config/env.js';
import express from 'express';
import cors from 'cors';
import { sequelize } from './config/db.js';
import { db } from './models/index.js';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io'
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';


const app = express();
const server = http.createServer(app)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOptions = {
    origin: [process.env.FRONTEND_URL, process.env.DASHBOARD_URL],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));

const io = new Server(server, {
    cors: {
        origin: [process.env.FRONTEND_URL, process.env.DASHBOARD_URL],
        credentials: true
    }
})


var allCustomer = []
var allSeller = []

const addUser = (customerId, socketId, userInfo) => {
    const checkUser = allCustomer.some(u => u.customerId === customerId)
    if (!checkUser) {
        allCustomer.push({
            customerId,
            socketId,
            userInfo
        })
    }
}


const addSeller = (sellerId, socketId, userInfo) => {
    const chaeckSeller = allSeller.some(u => u.sellerId === sellerId)
    if (!chaeckSeller) {
        allSeller.push({
            sellerId,
            socketId,
            userInfo
        })
    }
}

const findCustomer = (customerId) => {
    return allCustomer.find(c => c.customerId === customerId)
}
const findSeller = (sellerId) => {
    return allSeller.find(c => c.sellerId === sellerId)
}

const remove = (socketId) => {
    allCustomer = allCustomer.filter(c => c.socketId !== socketId)
    allSeller = allSeller.filter(c => c.socketId !== socketId)
}

let admin = {}

const removeAdmin = (socketId) => {
    if (admin.socketId === socketId) {
        admin = {}
    }
}

io.on('connection', (soc) => {
    // console.log('socket server is connected...')

    soc.on('add_user', (customerId, userInfo) => {
        addUser(customerId, soc.id, userInfo)
        io.emit('activeSeller', allSeller)
        io.emit('activeCustomer', allCustomer)
    })

    soc.on('add_seller', (sellerId, userInfo) => {
        addSeller(sellerId, soc.id, userInfo)
        io.emit('activeSeller', allSeller)
        io.emit('activeCustomer', allCustomer)
        io.emit('activeAdmin', { status: true })

    })

    soc.on('add_admin', (adminInfo) => {
        const sanitizedAdmin = { ...adminInfo };
        delete sanitizedAdmin.email;
        sanitizedAdmin.socketId = soc.id;

        admin = sanitizedAdmin;

        io.emit('activeSeller', allSeller);
        io.emit('activeAdmin', { status: true });
    })

    soc.on('send_seller_message', (msg) => {
        const customer = findCustomer(msg.receverId)
        if (customer !== undefined) {
            soc.to(customer.socketId).emit('seller_message', msg)
        }
    })

    soc.on('send_customer_message', (msg) => {
        const seller = findSeller(msg.receverId)
        if (seller !== undefined) {
            soc.to(seller.socketId).emit('customer_message', msg)
        }
    })

    soc.on('send_message_admin_to_seller', msg => {
        const seller = findSeller(msg.receverId)
        if (seller !== undefined) {
            soc.to(seller.socketId).emit('receved_admin_message', msg)
        }
    })


    soc.on('send_message_seller_to_admin', msg => {
        msg.status = 'unseen'
        if (admin.socketId) {
            soc.to(admin.socketId).emit('receved_seller_message', msg)
        }
    })

    soc.on('mark_customer_messages_seen', async ({ customerId, sellerId }) => {
        try {
            await db.SellerCustomerMessage.update(
                { status: 'seen' },
                {
                    where: {
                        senderId: sellerId,
                        receverId: customerId,
                        status: 'unseen'
                    }
                }
            );
            const seller = findSeller(sellerId);
            if (seller) {
                soc.to(seller.socketId).emit('customer_read_your_messages', {
                    by: customerId
                });
            }
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
                        status: 'unseen'
                    }
                }
            );

            const customer = findCustomer(customerId);
            if (customer) {
                soc.to(customer.socketId).emit('seller_read_your_messages', {
                    by: sellerId
                });
            }
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
                        status: 'unseen'
                    }
                }
            );

            const seller = findSeller(sellerId);
            if (seller) {
                soc.to(seller.socketId).emit('admin_read_your_messages', {
                    by: adminId
                });
            }
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
                        status: 'unseen'
                    },
                    transaction: t,
                    raw: true,
                }
            );

            await t.commit();

            const seller = findSeller(sellerId);
            if (seller) {
                soc.to(seller.socketId).emit('admin_read_your_messages', {
                    by: adminId
                });
            }
        } catch (err) {
            console.error('Error marking seller messages as seen by admin:', err);
        }
    });

    soc.on('disconnect', () => {
        // console.log('user disconnect')
        remove(soc.id)
        removeAdmin(soc.id)
        io.emit('activeAdmin', { status: false })
        io.emit('activeSeller', allSeller)
        io.emit('activeCustomer', allCustomer)

    })
})

// importing routes 
import dashAuthRoutes from './routes/auth/dashauth.routes.js'
import paymentRoutes from './routes/payment/payment.routes.js'
import chatRoutes from './routes/chat/chat.routes.js'
import packageRoutes from './routes/packages/package.routes.js'
import categoryRoutes from './routes/dashboard/category.routes.js'
import productRoutes from './routes/dashboard/product.routes.js'
import homeRoutes from './routes/home/home.routes.js'
import blogRoutes from './routes/dashboard/blog.routes.js'
import customerRoutes from './routes/auth/customer.routes.js'
import orderRoutes from './routes/order/order.routes.js'
import cartRoutes from './routes/home/cart.routes.js'
import sellerRoutes from './routes/dashboard/seller.routes.js'
import FAQRoutes from './routes/dashboard/faq.routes.js'
import teamRoutes from './routes/dashboard/team.routes.js'
import makeRoutes from './routes/dashboard/makes.routes.js'
import listingRoutes from './routes/dashboard/listing.routes.js';

app.use('/api', dashAuthRoutes);
app.use('/api', paymentRoutes);
app.use('/api', chatRoutes);
app.use('/api', blogRoutes);
app.use('/api', packageRoutes)
app.use('/api', categoryRoutes);
app.use('/api', productRoutes);
app.use('/api', homeRoutes);
app.use('/api', customerRoutes);
app.use('/api', orderRoutes);
app.use('/api', cartRoutes);
app.use('/api', sellerRoutes);
app.use('/api', teamRoutes);
app.use('/api', FAQRoutes);
app.use('/api', makeRoutes);
app.use('/api', listingRoutes);

sequelize.sync()
    .then(() => {
        console.log('Models Synced To Database');
    })
    .catch((err) => {
        console.error('Error Syncing Models', err);
    });

const PORT = process.env.PORT || 8081;
const HOST = process.env.HOST
server.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
});