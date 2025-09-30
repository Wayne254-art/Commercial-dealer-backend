import { sequelize } from "../../config/db.js";
import { db } from "../../models/index.js";
import moment from 'moment';
import axios from 'axios';
import { responseReturn } from "../../utils/response.js";

import { Paystack } from 'paystack-sdk';
import { sendEmail } from "../../utils/mails/orderEmail.js";
const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY);

class orderController {

    payment_check = async (id) => {
        try {
            // Fetch the order by primary key
            const order = await db.CustomerOrder.findByPk(id);

            if (order && order.payment_status === "unpaid") {
                // Update delivery_status of the customer order
                await db.CustomerOrder.update(
                    { delivery_status: "cancelled" },
                    { where: { id } }
                );

                // Update delivery_status of all related auth orders
                await db.AuthOrder.update(
                    { delivery_status: "cancelled" },
                    { where: { orderId: id } }
                );
            }

            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    place_order = async (req, res) => {
        const { price, products, shipping_fee, vat, subtotal, total, shippingInfo, userId } = req.body;
        let authorOrderData = [];
        let cartId = [];
        const tempDate = moment(Date.now()).format('LLL');
        let customerOrderProduct = [];

        const t = await sequelize.transaction();

        try {
            // 1. Validate product stock and collect cart IDs
            for (let i = 0; i < products.length; i++) {
                const pro = products[i].products;

                for (let j = 0; j < pro.length; j++) {
                    let tempCusPro = { ...pro[j].productInfo };
                    tempCusPro.quantity = pro[j].quantity;
                    customerOrderProduct.push(tempCusPro);

                    if (pro[j].id) {
                        cartId.push(pro[j].id);
                    }

                    const product = await db.Product.findByPk(tempCusPro.id, { transaction: t });

                    if (product) {
                        if (product.stock < tempCusPro.quantity) {
                            await t.rollback();
                            return res.status(400).json({ message: 'Not enough stock available' });
                        }

                        product.stock -= tempCusPro.quantity;
                        await product.save({ transaction: t });
                    }
                }
            }

            // 2. Create main customer order
            const order = await db.CustomerOrder.create({
                customerId: userId,
                shippingInfo,
                products: customerOrderProduct,
                price, // base price (before shipping and VAT)
                shipping_fee,
                subtotal, // price + shipping_fee
                vat,
                total, // subtotal + vat
                delivery_status: 'pending',
                payment_status: 'unpaid',
                date: tempDate,
            }, { transaction: t });

            // 3. Build sub-orders data for sellers
            for (let i = 0; i < products.length; i++) {
                const pro = products[i].products;
                const pri = products[i].price;
                const sellerId = products[i].sellerId;
                let storePro = [];

                for (let j = 0; j < pro.length; j++) {
                    let tempPro = { ...pro[j].productInfo };
                    tempPro.quantity = pro[j].quantity;
                    storePro.push(tempPro);
                }

                authorOrderData.push({
                    orderId: order.id,
                    sellerId,
                    products: storePro,
                    price: pri,
                    payment_status: 'unpaid',
                    shippingInfo: 'wayne_auto_sales Warehouse',
                    delivery_status: 'pending',
                    date: tempDate,
                });
            }

            // 4. Bulk insert sub-orders
            await db.AuthOrder.bulkCreate(authorOrderData, { transaction: t });

            // 5. Delete cart items
            if (cartId.length > 0) {
                await db.Cart.destroy({
                    where: { id: cartId },
                    transaction: t
                });
            }

            await t.commit();

            // 6. Schedule payment check after 15 seconds
            setTimeout(() => {
                if (typeof paymentCheck === 'function') {
                    paymentCheck(order.id);
                }
            }, 15000);

            return responseReturn(res, 201, {
                message: 'order placed successfully',
                orderId: order.id,
            });

        } catch (error) {
            if (!t.finished) {
                await t.rollback();
            }
            console.error(error.message);
            return res.status(500).json({ message: 'Order placement failed' });
        }
    }

    get_customer_dashboard_data = async (req, res) => {
        const { userId } = req.params;

        try {
            // 1. Recent 5 orders
            const recentOrders = await db.CustomerOrder.findAll({
                where: { customerId: userId },
                order: [['createdAt', 'DESC']],
                limit: 5
            });

            // 2. Count pending orders
            const pendingOrder = await db.CustomerOrder.count({
                where: {
                    customerId: userId,
                    delivery_status: 'pending'
                }
            });

            // 3. Count total orders
            const totalOrder = await db.CustomerOrder.count({
                where: { customerId: userId }
            });

            // 4. Count cancelled orders
            const cancelledOrder = await db.CustomerOrder.count({
                where: {
                    customerId: userId,
                    delivery_status: 'cancelled'
                }
            });

            // Return all data
            responseReturn(res, 200, {
                recentOrders,
                pendingOrder,
                cancelledOrder,
                totalOrder
            });

        } catch (error) {
            console.error(error.message);
            res.status(500).json({ message: 'Failed to fetch dashboard data' });
        }
    }

    get_orders = async (req, res) => {
        const { customerId, status } = req.params;

        try {
            let orders = [];

            if (status !== 'all') {
                orders = await db.CustomerOrder.findAll({
                    where: {
                        customerId,
                        delivery_status: status,
                    },
                    order: [['createdAt', 'DESC']],
                });
            } else {
                orders = await db.CustomerOrder.findAll({
                    where: {
                        customerId,
                    },
                    order: [['createdAt', 'DESC']],
                });
            }

            responseReturn(res, 200, {
                orders,
            });
        } catch (error) {
            console.error(error.message);
            res.status(500).json({ message: 'Failed to fetch orders' });
        }
    }

    get_order = async (req, res) => {
        const { orderId } = req.params;

        try {
            const order = await db.CustomerOrder.findByPk(orderId);

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            responseReturn(res, 200, {
                order,
            });
        } catch (error) {
            console.error(error.message);
            res.status(500).json({ message: 'Failed to fetch order' });
        }
    }

    create_payment = async (req, res) => {
        try {
            const { total, email, orderId } = req.body;

            if (!total || !email || !orderId) {
                return responseReturn(res, 400, { message: 'all fields are required' });
            }

            // 🔍 Optional: Verify order exists in your DB
            const order = await db.CustomerOrder.findByPk(orderId);
            if (!order) {
                return responseReturn(res, 404, { message: 'Order not found' });
            }

            // 🧾 Initialize Paystack payment
            const payment = await paystack.transaction.initialize({
                amount: total * 100, // Paystack expects amount in kobo/cents
                email,
                currency: "KES",
                callback_url: `${process.env.FRONTEND_URL}/payment/success`,
                metadata: {
                    order_id: orderId,
                },
            });

            // Optional: Save transaction reference in DB (if you have a Payment model)
            await db.Payment.create({
                orderId,
                email,
                amount: total,
                reference: payment.data.reference,
                status: 'pending'
            });

            return responseReturn(res, 200, {
                authorizationUrl: payment.data.authorization_url,
                email,
                reference: payment.data.reference,
                orderId,
            });
        } catch (error) {
            console.error('Error creating payment:', error.message);
            return responseReturn(res, 500, { message: 'Internal server error' });
        }
    }

    verify_payment = async (req, res) => {
        const { reference } = req.params;

        try {
            const response = await axios.get(
                `https://api.paystack.co/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    },
                }
            );

            const paymentData = response.data.data;
            const orderId = paymentData.metadata.order_id;

            // Find the payment record
            const payment = await db.Payment.findOne({ where: { reference } });

            if (!payment) {
                return responseReturn(res, 404, {
                    status: 'failed',
                    message: 'Payment record not found',
                });
            }

            if (paymentData.status === 'success') {
                // Update Payment status
                await payment.update({ status: 'success' });

                // Update customer order payment_status
                await db.CustomerOrder.update(
                    { payment_status: 'paid' },
                    { where: { id: orderId } }
                );

                return responseReturn(res, 200, {
                    status: 'success',
                    orderId,
                    message: 'Payment verified successfully',
                });
            } else if (paymentData.status === 'abandoned' || paymentData.status === 'failed') {
                await payment.update({ status: 'failed' });

                return responseReturn(res, 400, {
                    status: 'failed',
                    message: 'Payment verification failed or was abandoned',
                });
            } else {
                // Still pending or processing
                return responseReturn(res, 202, {
                    status: 'processing',
                    message: 'Payment is still processing',
                });
            }
        } catch (error) {
            console.error('Error verifying payment:', error?.response?.data || error.message);

            return responseReturn(res, 500, {
                status: 'failed',
                message: 'An error occurred during payment verification',
            });
        }
    }

    order_confirm = async (req, res) => {
        const { orderId } = req.params;
        const { reference } = req.body;

        if (!reference) {
            return responseReturn(res, 400, { error: "Reference is required." });
        }

        const transaction = await db.sequelize.transaction();

        try {
            // 1. Verify payment with Paystack
            const paystackResponse = await axios.get(
                `https://api.paystack.co/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    },
                }
            );

            if (
                !paystackResponse.data.status ||
                paystackResponse.data.data.status !== 'success'
            ) {
                await transaction.rollback();
                return responseReturn(res, 400, { error: 'Payment verification failed.' });
            }

            // 2. Update customer order
            const [affectedCount] = await db.CustomerOrder.update(
                {
                    payment_status: "paid",
                    delivery_status: "pending",
                },
                {
                    where: { id: orderId },
                    transaction,
                }
            );

            // Double-check existence
            const updatedOrder = await db.CustomerOrder.findOne({
                where: { id: orderId },
                transaction,
            });

            if (!updatedOrder) {
                await transaction.rollback();
                return responseReturn(res, 404, { error: "Order not found." });
            }

            // 3. Update auth orders
            await db.AuthOrder.update(
                {
                    payment_status: "paid",
                    delivery_status: "pending",
                },
                {
                    where: { orderId },
                    transaction,
                }
            );

            // 4. Wallet entries
            const now = moment();
            const month = now.format("M");
            const year = now.format("YYYY");

            await db.ShopWallet.create({
                amount: updatedOrder.total,
                month,
                year,
            }, { transaction });

            const auOrders = await db.AuthOrder.findAll({
                where: { orderId },
                transaction,
            });

            for (const order of auOrders) {
                await db.SellerWallet.create({
                    sellerId: order.sellerId.toString(),
                    amount: order.price,
                    month,
                    year,
                }, { transaction });
            }

            await transaction.commit();
            responseReturn(res, 200, { message: "Order confirmed successfully." });

        } catch (error) {
            console.error("Error confirming order:", error.response?.data || error.message);
            await transaction.rollback();
            responseReturn(res, 500, { message: "Internal server error." });
        }
    }

    get_admin_orders = async (req, res) => {
        let { page = 1, perPage = 10, searchValue = '' } = req.query;
        page = parseInt(page);
        perPage = parseInt(perPage);
        const offset = perPage * (page - 1);

        try {
            const whereCondition = {};

            // Optional: Implement search logic later
            if (searchValue) {
                // Example: search by shipping address or customer ID (adjust based on your schema)
                whereCondition[Op.or] = [
                    { customerId: { [Op.like]: `%${searchValue}%` } },
                    // { 'shippingInfo.address': { [Op.like]: `%${searchValue}%` } }, // requires custom field handling
                ];
            }

            // Fetch paginated orders with suborders
            const { rows: orders, count: totalOrder } = await db.CustomerOrder.findAndCountAll({
                where: whereCondition,
                include: [
                    {
                        model: db.AuthOrder,
                        as: 'suborder',
                    },
                ],
                limit: perPage,
                offset,
                order: [['createdAt', 'DESC']],
            });

            responseReturn(res, 200, {
                orders,
                totalOrder,
            });
        } catch (error) {
            console.error('get_admin_orders error:', error.message);
            res.status(500).json({ message: 'Failed to fetch admin orders' });
        }
    }

    get_admin_order = async (req, res) => {
        const { orderId } = req.params;

        try {
            const order = await db.CustomerOrder.findOne({
                where: { id: orderId },
                include: [
                    {
                        model: db.AuthOrder,
                        as: 'suborder',
                    },
                ],
            });

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            responseReturn(res, 200, { order });
        } catch (error) {
            console.error('get_admin_order error:', error.message);
            res.status(500).json({ message: 'Failed to fetch admin order' });
        }
    }

    admin_order_status_update = async (req, res) => {
        const { orderId } = req.params;
        const { status } = req.body;

        try {
            // 1. Find the main customer order
            const order = await db.CustomerOrder.findByPk(orderId);

            if (!order) {
                return responseReturn(res, 404, { message: 'Order not found' });
            }

            // 2. Update main order delivery status
            order.delivery_status = status;
            await order.save();

            // 3. Update all AuthOrders related to this order
            await db.AuthOrder.update(
                { delivery_status: status },
                { where: { orderId } }
            );

            // 4. Notify the customer
            const customer = await db.Customer.findByPk(order.customerId);
            if (customer && customer.email) {
                await sendEmail({
                    to: customer.email,
                    subject: `Your order #${order.id} status has been updated`,
                    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
          <div style="background-color: #283046; padding: 20px; color: #ffffff; text-align: center;">
            <h2>Wayne Auto Sales</h2>
          </div>
          <div style="padding: 30px; color: #333;">
            <h3>Hello ${customer.name || 'Customer'},</h3>
            <p style="font-size: 16px; line-height: 1.6;">
              This is to notify you that your order under orderId <strong>#${order.id}</strong> status has been updated to:
            </p>
            <p style="font-size: 18px; font-weight: bold; color: #4caf50; margin: 20px 0;">
              ${status.toUpperCase()}
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              You can view your order status in your dashboard for more details.
            </p>
            <p style="margin-top: 30px; font-size: 14px; color: #777;">
              Thank you for shopping with us!<br />
              <em>- Wayne Auto Sales Team</em>
            </p>
          </div>
          <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            &copy; ${new Date().getFullYear()} Wayne Auto Sales. All rights reserved.
          </div>
        </div>
      </div>
    `,
                });
            }

            // 5. Fetch AuthOrders with Seller Info
            const authOrders = await db.AuthOrder.findAll({
                where: { orderId },
                include: [{ model: db.Seller, as: 'seller', attributes: ['email', 'name'] }]
            });

            // 6. Notify each seller
            for (const ao of authOrders) {
                const seller = ao.seller;
                if (seller && seller.email) {
                    await sendEmail({
                        to: seller.email,
                        subject: `Order #${order.id} Status Updated`,
                        html: `
                      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
                          <div style="background-color: #283046; padding: 20px; color: #ffffff; text-align: center;">
                            <h2>Wayne Auto Sales</h2>
                          </div>
                          <div style="padding: 30px; color: #333;">
                            <h3>Hello ${seller.name || 'Seller'},</h3>
                            <p style="font-size: 16px; line-height: 1.6;">
                              A status update has been made to one of your suborders under order <strong>#${order.id}</strong>.
                            </p>
                            <p style="font-size: 18px; font-weight: bold; color: #2196f3; margin: 20px 0;">
                              ${status.toUpperCase()}
                            </p>
                            <p style="font-size: 16px; line-height: 1.6;">
                              Please log in to your seller dashboard to view more details and manage the order accordingly.
                            </p>
                            <div style="margin: 30px 0;">
                              <a href="https://yourdomain.com/seller/login" style="background-color: #283046; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                                Go to Seller Dashboard
                              </a>
                            </div>
                            <p style="margin-top: 30px; font-size: 14px; color: #777;">
                              Thank you for being a valued seller on our platform.<br />
                              <em>- Wayne Auto Sales Team</em>
                            </p>
                          </div>
                          <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
                            &copy; ${new Date().getFullYear()} Wayne Auto Sales. All rights reserved.
                          </div>
                        </div>
                      </div>
                    `,
                    });
                }
            }

            responseReturn(res, 200, { message: 'Status updated successfully' });
        } catch (error) {
            console.error('Admin order status update error:', error.message);
            responseReturn(res, 500, { message: 'Internal server error' });
        }
    }

    get_seller_orders = async (req, res) => {
        const { sellerId } = req.params;
        let { page = 1, perPage = 10, searchValue = '' } = req.query;
        page = parseInt(page);
        perPage = parseInt(perPage);
        const offset = perPage * (page - 1);

        try {
            const whereCondition = { sellerId };

            // Optional: Add searchable fields logic here
            if (searchValue) {
                whereCondition[Op.or] = [
                    { shippingInfo: { [Op.like]: `%${searchValue}%` } },
                    // Add more searchable fields as needed
                ];
            }

            const { rows: orders, count: totalOrder } = await db.AuthOrder.findAndCountAll({
                where: whereCondition,
                offset,
                limit: perPage,
                order: [['createdAt', 'DESC']],
            });

            responseReturn(res, 200, { orders, totalOrder });
        } catch (error) {
            console.log('get seller order error:', error.message);
            responseReturn(res, 500, { message: 'Internal server error' });
        }
    }

    get_seller_order = async (req, res) => {
        const { orderId } = req.params;

        try {
            const order = await db.AuthOrder.findByPk(orderId);

            if (!order) {
                return responseReturn(res, 404, { message: 'Order not found' });
            }

            responseReturn(res, 200, { order });
        } catch (error) {
            console.log('get seller order error:', error.message);
            responseReturn(res, 500, { message: 'Internal server error' });
        }
    }

    seller_order_status_update = async (req, res) => {
        const { orderId } = req.params;
        const { status } = req.body;

        try {
            const order = await db.AuthOrder.findByPk(orderId, {
                include: [
                    {
                        model: db.CustomerOrder,
                        as: 'order' // Only included for orderId reference
                    },
                    {
                        model: db.Seller,
                        as: 'seller'
                    },
                ],
            });

            if (!order) return responseReturn(res, 404, { message: 'Order not found' });

            const previousStatus = order.delivery_status;

            // Update status
            order.delivery_status = status;
            await order.save();

            // Notify company (admin) about status change
            await sendEmail({
                to: 'marwawayne1@gmail.com',
                subject: `Order status updated by ${order.products?.[0]?.Seller?.name || 'Unknown Seller'}`,
                html: `
                  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 20px; border: 1px solid #ddd;">
                      <h2 style="color: #333;">Wayne Auto Sales - Order Status Update</h2>
                      <p style="font-size: 16px; color: #555;">
                        <strong>Seller:</strong> ${order.products?.[0]?.Seller?.name || 'Unknown'}<br />
                        <strong>Suborder ID:</strong> #${order.id}
                      </p>
                      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                      <p style="font-size: 16px; color: #555;">
                        The order status has been updated.
                      </p>
                      <p style="font-size: 16px; color: #555;">
                        <strong>Previous Status:</strong> <span style="color: #ff9800;">${previousStatus.toUpperCase()}</span><br />
                        <strong>New Status:</strong> <span style="color: #4caf50;">${status.toUpperCase()}</span><br />
                        <strong>Customer Order ID:</strong> #${order.order?.orderId || orderId}
                      </p>
                      <a href="https://your-admin-dashboard-link.com" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #283046; color: #ffffff; text-decoration: none; border-radius: 4px;">
                        Review Order in Dashboard
                      </a>
                      <p style="margin-top: 40px; font-size: 14px; color: #999;">
                        This is an automated notification from the Wayne_Auto_Sales system.
                      </p>
                    </div>
                  </div>
                `,
            });

            responseReturn(res, 200, { message: 'Status updated successfully' });
        } catch (error) {
            console.error('Error updating status:', error.message);
            responseReturn(res, 500, { message: 'Internal server error' });
        }
    };


}

export default new orderController();