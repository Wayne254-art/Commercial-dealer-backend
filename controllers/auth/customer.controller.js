
import bcrypt from "bcrypt"
import { responseReturn } from "../../utils/response.js"
import { createToken } from "../../utils/create.token.js"
import cron from "node-cron"
import { Op } from "sequelize"
import { db } from "../../models/index.js"
import { send_OTP_email } from "../../utils/mails/sendOtp.js"

class customerControllers {

    customer_register = async (req, res) => {
        const { name, email, password } = req.body;
        try {
            const customer = await db.Customer.findOne({ where: { email } });
            if (customer) {
                return responseReturn(res, 404, { error: 'User Exist! Please Login' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const createCustomer = await db.Customer.create({
                name: name.trim(),
                email: email.trim(),
                password: hashedPassword,
                method: 'manualy'
            });

            await db.SellerCustomer.create({ myId: createCustomer.customerId });

            const token = await createToken({
                id: createCustomer.customerId,
                name: createCustomer.name,
                email: createCustomer.email,
                method: createCustomer.method
            });

            res.cookie('accessToken', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/',
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });

            responseReturn(res, 201, { message: 'Registration successful', token });
        } catch (error) {
            console.error(error.message);
        }
    }

    customer_login = async (req, res) => {
        const { email, password } = req.body;
        try {
            const customer = await db.Customer.findOne({
                where: { email },
                attributes: ['customerId', 'name', 'email', 'method', 'password']
            })
            if (!customer) {
                return responseReturn(res, 404, { error: 'Invalid customer credentials' });
            }

            // console.log('body coming', customer)

            const match = await bcrypt.compare(password, customer.password);
            if (!match) {
                return responseReturn(res, 404, { error: "Invalid Credentials" });
            }

            const token = await createToken({
                id: customer.customerId,
                name: customer.name,
                email: customer.email,
                method: customer.method
            });

            res.cookie('accessToken', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/',
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });

            responseReturn(res, 201, { message: 'Login successful', token });
        } catch (error) {
            console.error(error.message);
        }
    }

    customer_logout = async (req, res) => {
        res.cookie('accessToken', "", {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            expires: new Date(Date.now())
        });
        responseReturn(res, 200, { message: 'Logout successful' });
    }

    request_password_reset = async (req, res) => {
        const { email } = req.body;
        try {
            const user = await db.Customer.findOne({ where: { email } });
            if (!user) {
                return responseReturn(res, 404, { message: 'Invalid user' });
            }

            const otp = Math.floor(100000 + Math.random() * 900000);
            user.OTP = otp;
            user.OTPExpires = Date.now() + 10 * 60 * 1000;

            await user.save();
            await send_OTP_email(email, otp);

            responseReturn(res, 200, { message: 'OTP sent to email' });
        } catch (error) {
            console.error("Error in request_password_reset:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    verify_OTP = async (req, res) => {
        const { email, otp } = req.body;
        try {
            const user = await db.Customer.findOne({ where: { email } });
            if (!user || user.OTP !== parseInt(otp) || user.OTPExpires < Date.now()) {
                return res.status(400).json({ message: "Invalid or expired OTP" });
            }

            res.json({ message: "OTP verified successfully" });
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    reset_password = async (req, res) => {
        const { email, newPassword } = req.body;
        try {
            const user = await db.Customer.findOne({ where: { email } });
            if (!user) return res.status(404).json({ message: "User not found" });

            user.password = await bcrypt.hash(newPassword, 10);
            user.OTP = null;
            user.OTPExpires = null;

            await user.save();

            res.json({ message: "Password reset successfully" });
        } catch (error) {
            console.error('error:', error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

// 🔄 Cron job for clearing expired OTPs every 5 minutes
cron.schedule("*/5 * * * *", async () => {
    console.log("🕒 Cron job started: Clearing expired OTPs");

    try {
        const now = new Date();

        const [affectedRows] = await db.Customer.update(
            { OTP: null, OTPExpires: null },
            { where: { OTPExpires: { [Op.lt]: now } } }
        );

        if (affectedRows > 0) {
            console.log(`✅ Cleared ${affectedRows} expired OTP(s) at ${now.toISOString()}`);
        } else {
            console.log("ℹ️ No expired OTPs found.");
        }
    } catch (error) {
        console.error("❌ Error clearing expired OTPs:", error);
    }
});

export default new customerControllers()