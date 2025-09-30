import { db } from "../../models/index.js";
import { responseReturn } from "../../utils/response.js";
import axios from 'axios';
import nodemailer from 'nodemailer'

class paymentController {

    add_bank = async (req, res) => {
        try {
            const { label, value } = req.body;

            if (!label || !value) {
                responseReturn(res, 400, { message: 'all fields are required' });
            }

            const existing = await db.Banks.findOne({ where: { value } });

            if (existing) {
                responseReturn(res, 409, { message: 'Bank exists' });
            }

            const newBank = await db.Banks.create({ label, value });

            responseReturn(res, 201, {
                message: 'account created successfully',
                bank: newBank
            });
        } catch (err) {
            // console.error('Error adding bank account:', err);
            responseReturn(res, 500, { message: 'Server error' });
        }
    }

    get_all_banks = async (req, res) => {
        try {
            const banks = await db.Banks.findAll({ order: [['label', 'ASC']] });

            responseReturn(res, 200, {
                success: true,
                banks,
            });
        } catch (error) {
            // console.error('Error fetching banks:', error);
            responseReturn(res, 500, {
                message: 'Failed to fetch banks',
            });
        }
    }

    create_paystack_subaccount = async (req, res) => {
        const { id } = req

        try {
            // Check if subaccount already exists
            const existingSubAccount = await db.Paystack.findOne({ where: { sellerId: id } });

            if (existingSubAccount) { return responseReturn(res, 200, { message: 'Account already exists', subAccount: existingSubAccount, }) }

            // Fetch seller details
            const seller = await db.Seller.findByPk(id)
            if (!seller) { return responseReturn(res, 404, { message: 'Seller not found' }) }

            const yardTitle = seller?.shopInfo?.[0]?.yardTitle;
            const settlementBank = seller?.paymentInfo?.[0]?.settlement_bank;
            const accountNumber = seller?.paymentInfo?.[0]?.account_no;

            if (!yardTitle || !settlementBank || !accountNumber) {
                return responseReturn(res, 400, {
                    message: 'Missing payment details',
                });
            }

            const params = {
                business_name: yardTitle,
                settlement_bank: settlementBank,
                account_number: accountNumber,
                percentage_charge: 20,
            };

            let result;

            try {
                const response = await axios.post(
                    "https://api.paystack.co/subaccount",
                    params,
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                result = response.data;
            } catch (error) {
                console.error("Paystack API error:", error.response?.data || error.message);
                if (error.response) {
                    return res.status(error.response.status).json({
                        message: "Paystack API error",
                        error: error.response.data,
                    });
                }
                return responseReturn(res, 500, {
                    message: "No response from Paystack",
                    error: error.message,
                });
            }

            // If successful, save subaccount data
            if (result && result.status) {
                const subData = result.data;

                await db.Paystack.create({
                    sellerId: id,
                    paystackId: subData.id,
                    status: result.status,
                    message: result.message,
                    businessName: subData.business_name,
                    accountNumber: subData.account_number,
                    percentageCharge: subData.percentage_charge,
                    settlementBank: subData.settlement_bank,
                    currency: subData.currency,
                    bank: subData.bank,
                    integration: subData.integration,
                    domain: subData.domain,
                    product: subData.product,
                    managedByIntegration: subData.managed_by_integration,
                    subaccountCode: subData.subaccount_code,
                    isVerified: subData.is_verified,
                    settlementSchedule: subData.settlement_schedule,
                    active: subData.active,
                    migrate: subData.migrate,
                    paystackOriginalId: subData.id,
                });

                await db.Account.create({
                    sellerId: id,
                    businessName: subData.business_name,
                    accountNumber: subData.account_number,
                    bank: subData.settlement_bank,
                    status: result.status,
                });

                await db.Seller.update(
                    { payment: 'active' },
                    { where: { sellerId: id } }
                );

                return responseReturn(res, 201, {
                    message: "Subaccount created successfully",
                    subaccount: subData,
                });
            } else {
                return responseReturn(res, 400, {
                    message: "Failed to create subaccount",
                    error: result?.message || "Unknown error",
                });
            }

        } catch (error) {
            console.error("Internal server error:", error);
            return responseReturn(res, 500, {
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    activate_paystack_subaccount = async (req, res) => {
        const { activeCode } = req.params;
        const { id } = req;

        try {
            const userPaystackInfo = await db.Paystack.findOne({
                where: { subaccountCode: activeCode },
            });

            if (userPaystackInfo) {
                await Seller.update(
                    { payment: 'active' },
                    { where: { sellerId: id } }
                );

                return res.status(200).json({
                    message: "Payment activated successfully",
                });
            } else {
                return res.status(404).json({
                    message: "Payment activation failed. Invalid code.",
                });
            }
        } catch (error) {
            console.error("Error activating Paystack subaccount:", error.message);
            return res.status(500).json({
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    get_all_accounts = async (req, res) => {
        try {
            const accounts = await db.Account.findAll({ order: [['createdAt', 'DESC']] }
            );

            return responseReturn(res, 200, {
                success: true,
                accounts,
            });
        } catch (error) {
            console.error('Error fetching accounts:', error);
            return responseReturn(res, 500, {
                message: 'Failed to fetch accounts',
            });
        }
    }

    get_seller_payment_details = async (req, res) => {
        const { sellerId } = req.params;

        // Sum helper
        const sumAmount = (data) => {
            return data.reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);
        };

        try {
            const payments = await db.SellerWallet.findAll({
                where: { sellerId },
            });

            const pendingWithdrawals = await db.WithdrawalRequest.findAll({
                where: { sellerId, status: 'pending' },
            });

            const successfulWithdrawals = await db.WithdrawalRequest.findAll({
                where: { sellerId, status: 'success' },
            });

            const pendingAmount = sumAmount(pendingWithdrawals);
            const withdrawnAmount = sumAmount(successfulWithdrawals);
            const totalAmount = sumAmount(payments);

            let availableAmount = 0;
            if (totalAmount > 0) {
                availableAmount = totalAmount - (pendingAmount + withdrawnAmount);
            }

            return res.status(200).json({
                totalAmount,
                pendingAmount,
                withdrawnAmount,
                availableAmount,
                successfulWithdrawals,
                pendingWithdrawals,
            });

        } catch (error) {
            console.error('Error fetching seller payment details:', error.message);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    get_admin_payment_summary = async (req, res) => {
        // Helper to sum amounts from list of transactions
        const sumAmount = (records) => {
            return records.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        };

        try {
            // Get all seller payments
            const payments = await db.ShopWallet.findAll();

            // Get all pending withdrawal requests
            const pendingWithdrawals = await db.WithdrawalRequest.findAll({
                where: { status: 'pending' }
            });

            // Get all successful withdrawal requests
            const successfulWithdrawals = await db.WithdrawalRequest.findAll({
                where: { status: 'success' }
            });

            // Sum values
            const totalRevenue = sumAmount(payments);
            const pendingWithdrawal = sumAmount(pendingWithdrawals);
            const totalWithdrawn = sumAmount(successfulWithdrawals);

            const remainingAmount = totalRevenue - (totalWithdrawn + pendingWithdrawal);

            return res.status(200).json({
                totalRevenue,
                totalWithdrawn,
                pendingWithdrawal,
                remainingAmount
            });
        } catch (error) {
            console.error('Error fetching admin payment summary:', error.message);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    withdrawal_request = async (req, res) => {
        const { amount, sellerId } = req.body;

        try {
            if (!amount || amount <= 0) {
                return res.status(400).json({ message: 'Invalid withdrawal amount' });
            }

            const seller = await db.Seller.findByPk(sellerId);
            if (!seller) {
                return res.status(404).json({ message: "Seller not found" });
            }

            const sellerSubaccount = await db.Paystack.findOne({
                where: { sellerId },
            });

            if (!sellerSubaccount) {
                return res.status(404).json({ message: 'Invalid Seller subAccount' });
            }

            const withdrawal = await db.WithdrawalRequest.create({
                sellerId,
                amount: parseInt(amount),
                status: 'pending',
            });

            const wmailHTML = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Withdrawal Request Confirmation</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f8f9fa;
                margin: 0;
                padding: 0;
              }
              .card {
                background-color: #ffffff;
                width: 90%;
                max-width: 500px;
                margin: 20px auto;
                border:2px black solid;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                padding: 20px;
                box-sizing: border-box;
              }
              .card h2 {
                font-size: 1.5rem;
                margin: 0;
                color: #333;
              }
              .card p {
                font-size: 1rem;
                line-height: 1.6;
                color: #555;
                margin: 10px 0;
              }
              .card-footer {
                margin-top: 20px;
                text-align: right;
              }
              .card-footer span {
                font-size: 0.9rem;
                color: #888;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>Withdrawal Request Successful</h2>
              <p>
                Dear <strong>${seller.name}</strong>,<br><br>
                Your withdrawal request of <strong>KES.${amount}</strong> has been received successfully. It is currently under review and will be processed within 24hrs.<br><br>
                Thank you,<br>
                Wayne Marwa
              </p>
              <div class="card-footer">
                <span>Powered by Wayne_Auto_Sales</span>
              </div>
            </div>
          </body>
          </html>
        `;

            const transporter = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: '"Wayne_Auto_Sales" <waynegiyabe6@gmail.com>',
                to: seller.email,
                subject: "Withdrawal Request Confirmation",
                html: wmailHTML,
            };

            await transporter.sendMail(mailOptions);

            return res.status(200).json({
                withdrawal,
                message: 'Withdrawal request submitted successfully',
            });

        } catch (error) {
            console.error('Error in withdrawal request:', error.message);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    get_payment_request = async (req, res) => {
        try {
            const pendingWithdrawalRequests = await db.WithdrawalRequest.findAll({
                where: { status: 'pending' },
                order: [['createdAt', 'ASC']],
            });

            return res.status(200).json({ pendingWithdrawalRequests });
        } catch (error) {
            console.error('Error fetching pending withdrawal requests:', error.message);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    payment_request_confirm = async (req, res) => {
        const { paymentId } = req.body;

        try {
            const payment = await db.WithdrawalRequest.findByPk(paymentId);

            if (!payment) {
                return res.status(404).json({ message: 'Payment request not found' });
            }

            let sellerAccount = await db.Paystack.findOne({
                where: { sellerId: payment.sellerId },
            });

            if (!sellerAccount) {
                return res.status(404).json({ message: 'Seller account not found' });
            }

            const seller = await db.Seller.findByPk(payment.sellerId);

            if (!seller) {
                return res.status(404).json({ message: 'Seller not found' });
            }

            // Create recipient if not exists
            if (!sellerAccount.paystackRecipientCode) {
                const recipientResponse = await axios.post(
                    'https://api.paystack.co/transferrecipient',
                    {
                        type: 'nuban',
                        name: seller.shopInfo?.[0]?.yardTitle,
                        account_number: seller.paymentInfo?.[0]?.account_no,
                        bank_code: seller.paymentInfo?.[0]?.settlement_bank,
                        currency: 'KES',
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                const recipientCode = recipientResponse.data.data.recipient_code;

                // Update Paystack record with recipient code
                await db.Paystack.update(
                    { paystackRecipientCode: recipientCode },
                    { where: { sellerId: payment.sellerId } }
                );

                // Reload updated record
                sellerAccount = await db.Paystack.findOne({ where: { sellerId: payment.sellerId } });
            }

            // Initiate Paystack transfer
            const transfer = await axios.post(
                'https://api.paystack.co/transfer',
                {
                    source: 'balance',
                    reason: `Payment for ${paymentId}`,
                    amount: payment.amount * 100, // Paystack uses kobo
                    recipient: sellerAccount.paystackRecipientCode,
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            // Update payment status
            await db.WithdrawalRequest.update(
                { status: 'success' },
                { where: { requestId: paymentId } }
            );

            // --------------------
            // ✉️ Email Confirmation
            // --------------------
            const emailHTML =
                `<html>
                    <body style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>Payment Transfer Successful</h2>
                        <p>Hello <strong>${seller.name}</strong>,</p>
                        <p>Your withdrawal of <strong>KES ${payment.amount}</strong> has been successfully processed and transferred to your account.</p>
                        <p>Details:</p>
                        <ul>
                            <li><strong>Bank:</strong> ${sellerAccount.bank}</li>
                            <li><strong>Account Number:</strong> ${sellerAccount.accountNumber}</li>
                            <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
                        </ul>
                        <p>Thank you for using Wayne Auto Sales.</p>
                        <p style="color: gray; font-size: 12px;">Powered by Duka Mall</p>
                    </body>
                </html>`;

            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            await transporter.sendMail({
                from: '"Wayne Auto Sales" <no-reply@dukamall.com>',
                to: seller.email,
                subject: 'Withdrawal Confirmation - Wayne Auto Sales',
                html: emailHTML,
            });

            // --------------------
            // ✅ Final Response
            // --------------------
            return res.status(200).json({
                payment,
                transfer: transfer.data.data,
                message: 'Payment request confirmed successfully',
            });
        } catch (error) {
            console.error(
                'Error confirming payment request:',
                error.response?.data || error.message
            );
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

}

export default new paymentController()