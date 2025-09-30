import axios from 'axios';
import moment from 'moment';
import nodemailer from 'nodemailer';
import { db } from "../../models/index.js";
import { responseReturn } from "../../utils/response.js";

class packageController {

    add_package = async (req, res) => {
        const { title, services, price, seltype } = req.body

        try {
            const newPackage = await db.Package.create({ title, services, price, seltype });
            return responseReturn(res, 201, {
                message: 'Package created successfully',
                package: newPackage
            })
        } catch (error) {
            console.error('Error creating package:', error);
            return responseReturn(res, 500, { message: 'Server error', error });
        }
    }

    get_admin_packages = async (req, res) => {
        try {
            if (req.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied!' });
            }

            const packages = await db.Package.findAll({
                order: [['price', 'ASC']],
            });
            res.status(200).json(packages);
        } catch (error) {
            console.error('Error fetching packages:', error);
            res.status(500).json({ message: 'Failed to fetch packages' });
        }
    }

    get_seller_packages = async (req, res) => {
        try {
            const { id: sellerId } = req

            const seller = await db.Seller.findByPk(sellerId)

            if (!seller) {
                return res.status(404).json({ message: 'Seller not found' });
            }

            const packages = await db.Package.findAll({
                where: { seltype: seller.sellerType },
                order: [['price', 'ASC']],
            });
            res.status(200).json(packages);
        } catch (error) {
            console.error('Error fetching packages:', error);
            res.status(500).json({ message: 'Failed to fetch packages' });
        }
    }

    update_package_recommendation = async (req, res) => {
        const { packageId } = req.params;
        const { isRecommended } = req.body;

        try {
            const packageToUpdate = await db.Package.findByPk(packageId);

            packageToUpdate.isRecommended = isRecommended;
            await packageToUpdate.save();

            return responseReturn(res, 200, { message: 'Package recommendation status updated', package: packageToUpdate });
        } catch (error) {
            console.error('Error updating recommendation:', error);
            return responseReturn(res, 500, { message: 'Failed to update recommendation status' });
        }
    }

    update_package = async (req, res) => {
        const { packageId } = req.params;
        const { title, price, seltype, services } = req.body;

        try {
            const pkg = await db.Package.findByPk(packageId);

            pkg.title = title ?? pkg.title;
            pkg.price = price ?? pkg.price;
            pkg.seltype = seltype ?? pkg.seltype;
            pkg.services = services ?? pkg.services;

            await pkg.save();

            return responseReturn(res, 200, {
                message: 'Package updated successfully',
                package: pkg,
            });
        } catch (error) {
            console.error('Error updating package:', error);
            return responseReturn(res, 500, { message: 'Server error' });
        }
    }

    delete_package = async (req, res) => {
        const { packageId } = req.params;

        try {
            const pkg = await db.Package.findByPk(packageId);

            if (!pkg) {
                return res.status(404).json({ message: 'Package not found' });
            }

            await pkg.destroy();

            return responseReturn(res, 200, { message: 'Package deleted successfully', package: pkg });
        } catch (error) {
            console.error('Error deleting package:', error);
            return responseReturn(res, 500, { message: 'Server error' });
        }
    }

    verify_package_payment = async (req, res) => {
        const { reference, sellerId, email, pkg, amount } = req.body;

        try {
            const paystackResponse = await axios.get(
                `https://api.paystack.co/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    },
                }
            );

            const transaction = paystackResponse.data.data;

            if (!transaction || transaction.status !== 'success') {
                return res.status(400).json({ error: "Transaction verification failed" });
            }

            // 1. Save the transaction
            const newPayment = await db.Transaction.create({
                sellerId,
                email,
                package: pkg,
                amount,
                reference,
                status: 'success',
                paymentMethod: 'Paystack',
                isActive: true,
            });

            // 3. Handle the subscription
            const existingSubscription = await db.Subscriptions.findOne({
                where: { sellerId: sellerId }
            });

            const startDate = new Date();
            const expiryDate = new Date();
            expiryDate.setDate(startDate.getDate() + 30); // 30 days from now

            if (existingSubscription) {
                // If subscription exists, update it
                await existingSubscription.update({
                    sellerEmail: email,
                    pkgTitle: pkg,
                    price: amount,
                    isActive: true,
                    startDate: startDate,
                    expiryDate: expiryDate,
                    paymentReference: reference,
                });
            } else {
                // If no subscription, create new one
                await db.Subscriptions.create({
                    sellerId: sellerId,
                    sellerEmail: email,
                    pkgTitle: pkg,
                    price: amount,
                    isActive: true,
                    startDate: startDate,
                    expiryDate: expiryDate,
                    paymentReference: reference,
                });
            }

            // 2. Update Seller status to active
            await db.Seller.update({ status: "active" }, { where: { sellerId: sellerId } });
            await db.CarListing.update({ isActive: true }, { where: { sellerId: sellerId } });

            // await notificationControllers.create_notification({
            //     type: "new_transaction",
            //     title: "New Package Payment",
            //     message: `Seller with email '${email}' purchased '${pkg}' package for Ksh ${amount}.`,
            // });


            return responseReturn(res, 200, { message: "Payment and Subscription successful", payment: newPayment });

        } catch (error) {
            console.error("Payment verification error:", error);
            return responseReturn(res, 500, { status: false, message: error.message });
        }
    }

    get_seller_active_package = async (req, res) => {
        try {
            const { sellerId } = req.params;

            const sellerPackage = await db.Subscriptions.findAll({
                where: { sellerId },
                order: [['createdAt', 'DESC']]
            })

            if (sellerPackage.length === 0) {
                return responseReturn(res, 404, { status: false, message: "No packages found for this seller" });
            }

            res.status(200).json({ data: sellerPackage });
        } catch (error) {
            console.error("Error fetching seller package details:", error);
            responseReturn(res, 500, { status: false, message: "Server error" });
        }
    }

    get_active_subscriptions = async (req, res) => {
        try {
            const activeSubscriptions = await db.Subscriptions.findAll({
                where: { isActive: true },
                order: [['createdAt', 'DESC']],
            });

            if (activeSubscriptions.length === 0) {
                return responseReturn(res, 404, { message: "No active subscriptions found." });
            }

            res.status(200).json({ activeSubscriptions });
        } catch (error) {
            console.error("Error fetching active subscriptions:", error);
            responseReturn(res, 500, { status: false, message: "Server error" });
        }
    }

    get_expired_subscriptions = async (req, res) => {
        try {
            const expiredSubscriptions = await db.Subscriptions.findAll({
                where: { isActive: false },
                order: [['createdAt', 'DESC']],
            });

            if (expiredSubscriptions.length === 0) {
                return responseReturn(res, 404, { message: "No expired subscriptions found." });
            }

            res.status(200).json({ expiredSubscriptions });
        } catch (error) {
            console.error("Error fetching expired subscriptions:", error);
            responseReturn(res, 500, { status: false, message: "Server error" });
        }
    }

    send_reminder_email = async (req, res) => {
        try {
            const { userEmail, packageTitle, expiryDate } = req.body;

            const formattedExpiryDate = moment(expiryDate).format('Do MMMM YYYY');
            // Example output: 14th June 2021

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: '"Wayne Auto Sales" <yourcompany@gmail.com>',
                to: userEmail,
                subject: 'Package Renewal Reminder',
                html: `
              <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="text-align: center; padding-bottom: 20px;">
                  <h2 style="color: #4CAF50;">Wayne Auto Sales</h2>
                  <p style="color: #555;">Let's Make It Happen</p>
                </div>
      
                <div style="background: #ffffff; padding: 20px; border-radius: 6px;">
                  <p style="font-size: 16px; color: #333;">Dear Valued Customer,</p>
      
                  <p style="font-size: 15px; color: #333;">
                    We wanted to remind you that your <strong style="color: #4CAF50;">${packageTitle}</strong> package is set to expire on <strong style="color: #FF5722;">${formattedExpiryDate}</strong>.
                  </p>
      
                  <p style="font-size: 15px; color: #333;">
                    To continue enjoying premium benefits and maximize your vehicle listings, please renew your package on time!
                  </p>
      
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://your-website.com/renew-package" style="background-color: #4CAF50; color: #fff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold;">
                      Renew Now
                    </a>
                  </div>
      
                  <p style="font-size: 14px; color: #888; text-align: center;">Thank you for choosing Wayne Auto Sales!</p>
                </div>
      
                <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #aaa;">
                  © ${new Date().getFullYear()} Wayne Auto Sales. All rights reserved.
                </div>
              </div>
            `,
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({ message: 'Reminder email sent successfully.' });
        } catch (error) {
            console.error('Failed to send reminder email:', error);
            res.status(500).json({ message: 'Failed to send reminder email.', error });
        }
    }

    send_invoice_email = async (req, res) => {
        try {
            const { userEmail, packageTitle, expiryDate } = req.body;

            const expiredOn = moment(expiryDate).format('Do MMMM YYYY');
            const expiredDays = moment().diff(moment(expiryDate), 'days');

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: '"Wayne Auto Sales" <yourcompany@gmail.com>',
                to: userEmail,
                subject: 'Your Package Has Expired - Renew Now',
                html: `
              <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="text-align: center; padding-bottom: 20px;">
                  <h2 style="color: #E53935;">Wayne Auto Sales</h2>
                  <p style="color: #555;">Don't Let Your Listings Go Cold</p>
                </div>
      
                <div style="background: #ffffff; padding: 20px; border-radius: 6px;">
                  <p style="font-size: 16px; color: #333;">Hello,</p>
      
                  <p style="font-size: 15px; color: #333;">
                    Your <strong>${packageTitle}</strong> package expired on <strong style="color: #E53935;">${expiredOn}</strong> 
                    (${expiredDays} day${expiredDays === 1 ? '' : 's'} ago).
                  </p>
      
                  <p style="font-size: 15px; color: #333;">
                    To avoid missing leads and exposure, we recommend renewing your subscription immediately.
                  </p>
      
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://your-website.com/renew-package" style="background-color: #E53935; color: #fff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold;">
                      Renew Your Package
                    </a>
                  </div>
      
                  <p style="font-size: 14px; color: #888; text-align: center;">We're here to help your business grow.</p>
                </div>
      
                <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #aaa;">
                  © ${new Date().getFullYear()} Wayne Auto Sales. All rights reserved.
                </div>
              </div>
            `,
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({ message: 'Invoice email sent successfully.' });
        } catch (error) {
            console.error('Failed to send invoice email:', error);
            res.status(500).json({ message: 'Failed to send invoice email.', error });
        }
    }

    get_seller_transactions = async (req, res) => {
        try {
            const { id: sellerId } = req

            const transactions = await db.Transaction.findAll({
                where: { sellerId },
                order: [['createdAt', 'DESC']]
            })

            if (transactions.length === 0) {
                return res.status(404).json({ status: false, message: "No transactions found for this seller" });
            }

            res.status(200).json({ data: transactions });
        } catch (error) {
            console.error("Error fetching seller package details:", error);
            res.status(500).json({ status: false, message: "Server error" });
        }
    }

    get_all_transactions = async (req, res) => {
        try {
            if (req.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied!' });
            }

            const transactions = await db.Transaction.findAll({
                order: [['createdAt', 'DESC']],
            });

            const totalAmount = await db.Transaction.sum('amount');

            res.status(200).json({
                success: true,
                count: transactions.length,
                totalAmount,
                data: transactions,
            });
        } catch (error) {
            console.error('Error fetching transactions:', error);
            res.status(500).json({
                success: false,
                message: 'Server Error. Unable to fetch transactions.',
            });
        }
    }

    // deactivate_expired_seller_packages = async () => {
    //     const now = new Date();

    //     try {
    //         // 1. Get all expired subscriptions
    //         const expiredSubscriptions = await pkgSubscriptions.findAll({
    //             where: {
    //                 expiryDate: { [Op.lt]: now },
    //                 isActive: true
    //             },
    //             attributes: ['sellerId'],
    //             raw: true
    //         });

    //         const sellerIds = [...new Set(expiredSubscriptions.map(sub => sub.sellerId))];
    //         if (sellerIds.length === 0) {
    //             console.log('✅ No expired subscriptions found.');
    //             return;
    //         }

    //         // 2. Filter sellers who have *no other active subscriptions*
    //         const stillActiveSubs = await pkgSubscriptions.findAll({
    //             where: {
    //                 isActive: true,
    //                 expiryDate: { [Op.gt]: now },
    //                 sellerId: sellerIds
    //             },
    //             attributes: ['sellerId'],
    //             raw: true
    //         });

    //         const stillActiveSellerIds = new Set(stillActiveSubs.map(s => s.sellerId));
    //         const toDeactivate = sellerIds.filter(id => !stillActiveSellerIds.has(id));

    //         if (toDeactivate.length === 0) {
    //             console.log('✅ Expired subscriptions found, but sellers still have active packages.');
    //             return;
    //         }

    //         // 3. Use transaction to deactivate everything consistently
    //         const transaction = await db.sequelize.transaction();

    //         try {
    //             await pkgSubscriptions.update(
    //                 { isActive: false },
    //                 { where: { sellerId: toDeactivate, isActive: true }, transaction }
    //             );

    //             await Seller.update(
    //                 { status: 'inactive' },
    //                 { where: { sellerId: toDeactivate }, transaction }
    //             );

    //             await CarListing.update(
    //                 { isActive: false },
    //                 { where: { sellerId: toDeactivate }, transaction }
    //             );

    //             await transaction.commit();

    //             console.log(`✅ ${toDeactivate.length} seller(s) deactivated due to expired subscriptions.`);

    //             // Optional: send notification
    //             await notificationControllers.create_notification({
    //                 type: "expired_subscription",
    //                 title: "Expired Seller Subscriptions",
    //                 message: `${toDeactivate.length} seller(s) and their listings have been deactivated due to expired packages.`
    //             });

    //         } catch (err) {
    //             await transaction.rollback();
    //             console.error('❌ Transaction failed:', err.message);
    //         }

    //     } catch (error) {
    //         console.error('❌ Error deactivating expired packages:', error.message);
    //     }
    // };

}

export default new packageController();