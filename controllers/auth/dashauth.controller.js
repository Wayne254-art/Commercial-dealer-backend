import bcrypt from "bcrypt"
import crypto from 'crypto'
import { db } from "../../models/index.js";
import { createToken } from "../../utils/create.token.js";
import { sendVerificationEmail } from "../../utils/mails/sendVerificationEmail.js";
import { responseReturn } from "../../utils/response.js";
import { generateSlug } from "../../utils/slugify.js";
import { send_OTP_email } from "../../utils/mails/sendOtp.js";
import { fileURLToPath } from "url";
import fs from 'fs'
import path from 'path';
import formidable from "formidable"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// sanitize image types 
const allowedExtensions = [".jpg", ".jpeg", ".png"];
const allowedMimeTypes = ["image/jpeg", "image/png"];

// Define upload directories
const uploadRoot = path.join(__dirname, '../../uploads');
const profileDir = path.join(uploadRoot, 'profiles');
const logoDir = path.join(uploadRoot, 'logos');

// Ensure directories exist
[uploadRoot, profileDir, logoDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

class dashAuthController {

    admin_login = async (req, res) => {
        const { email, password } = req.body;
        try {
            const admin = await db.Admin.findOne({ where: { email } });
            if (admin && (await bcrypt.compare(password, admin.password))) {
                const token = createToken({ id: admin.adminId, role: admin.role });

                res.cookie("accessToken", token, {
                    httpOnly: true,
                    secure: false,
                    sameSite: "lax",
                    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                });

                return responseReturn(res, 200, { token, message: "Login successful" });
            } else {
                return responseReturn(res, 404, { error: "Invalid Credentials" });
            }
        } catch (error) {
            return responseReturn(res, 500, { error: error.message });
        }
    }

    seller_login = async (req, res) => {
        const { email, password } = req.body;
        try {
            const seller = await db.Seller.findOne({ where: { email } });

            // check if seller is exists 
            if (!seller) {
                return responseReturn(res, 404, { error: "Invalid seller credentials" })
            }

            // check if seller is verified
            if (!seller.isVerified) {
                return responseReturn(res, 403, { error: "Verify your account." })
            }

            if (seller && (await bcrypt.compare(password, seller.password))) {
                const token = createToken({ id: seller.sellerId, role: seller.role });

                res.cookie("accessToken", token, {
                    httpOnly: true,
                    secure: false,
                    sameSite: "lax",
                    path: "/",
                    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                });

                return responseReturn(res, 200, { token, message: "Login successful" });
            } else {
                return responseReturn(res, 404, { error: "Invalid Credentials" });
            }
        } catch (error) {
            return responseReturn(res, 500, { error: error.message || 'server error' });
        }
    }

    seller_register = async (req, res) => {
        const { email, name, password, accountType, sellerType } = req.body;
        try {

            if (!email || !name || !password || !accountType || !sellerType) {
                return responseReturn(res, 400, { error: "All fields are required" });
            }

            const existingSeller = await db.Seller.findOne({ where: { email } });
            if (existingSeller) {
                return responseReturn(res, 404, { error: "seller exists" });
            } else {
                const hashedPassword = await bcrypt.hash(password, 10);
                const verificationToken = crypto.randomBytes(32).toString("hex");

                // Generate a unique slug (you can also use email or a short random string if needed)
                const baseSlug = generateSlug(name);
                const uniqueSuffix = crypto.randomBytes(3).toString("hex");
                const slug = `${baseSlug}-${uniqueSuffix}`;

                const seller = await db.Seller.create({
                    name,
                    slug,
                    email,
                    password: hashedPassword,
                    method: "manual",
                    accountType,
                    sellerType,
                    isVerified: false,
                    verificationToken,
                });

                await db.SellerCustomer.create({ myId: seller.sellerId });

                await sendVerificationEmail(email, verificationToken);

                return responseReturn(res, 201, { message: "Check Your email inbox" });
            }
        } catch (error) {
            // console.log("error", error)
            return responseReturn(res, 500, { error: "server error" });
        }
    }

    verify_email = async (req, res) => {
        try {
            const token = req.query.token;

            if (!token) return responseReturn(res, 400, { error: "Invalid token" });

            const seller = await db.Seller.findOne({ where: { verificationToken: token } });

            if (!seller) {
                return responseReturn(res, 404, { error: "Invalid or expired verification link" });
            }

            seller.isVerified = true;
            seller.verificationToken = null;
            await seller.save();

            const accessToken = createToken({ id: seller.sellerId, role: seller.role });

            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            });

            return responseReturn(res, 200, {
                message: "Verified successfully!",
                token: accessToken,
            });

        } catch (error) {
            console.log("verify_email error", error);
            return responseReturn(res, 500, { error: "Internal server error" });
        }
    }

    request_password_reset = async (req, res) => {
        const { email } = req.body;

        try {
            const seller = await db.Seller.findOne({ where: { email } });

            if (!seller) {
                return responseReturn(res, 404, { message: 'Invalid seller' })
            }

            const otp = Math.floor(100000 + Math.random() * 900000)
            seller.OTP = otp;
            seller.OTPExpires = Date.now() + 10 * 60 * 1000

            await seller.save()
            await send_OTP_email(email, otp)

            return responseReturn(res, 200, { message: 'OTP sent to email' })
        } catch (error) {
            return responseReturn(res, 500, { error: "Internal server error" });
        }
    }

    verify_OTP = async (req, res) => {
        const { email, otp } = req.body;
        try {
            const seller = await db.Seller.findOne({ where: { email } });
            if (!seller || seller.OTP !== parseInt(otp) || seller.OTPExpires < Date.now()) {
                return responseReturn(res, 400, { message: "Invalid or expired OTP" });
            }
            return responseReturn(res, 200, { message: "OTP verified successfully" });
        } catch (error) {
            return responseReturn(res, 500, { message: "Internal server error" });
        }
    }

    reset_password = async (req, res) => {
        const { email, newPassword } = req.body;
        try {
            const seller = await db.Seller.findOne({ where: { email } });
            if (!seller) return responseReturn(res, 404, { message: "Seller not found" });

            seller.password = await bcrypt.hash(newPassword, 10);
            seller.OTP = null;
            seller.OTPExpires = null;
            await seller.save();

            return responseReturn(res, 200, { message: 'Reset successful' })
        } catch (error) {
            return responseReturn(res, 500, { error: "Internal server error" });
        }
    }

    get_user = async (req, res) => {
        const { id, role } = req
        try {
            let user;
            if (role === 'admin') {
                user = await db.Admin.findByPk(id)
            } else {
                user = await db.Seller.findByPk(id)
            }

            if (!user) {
                return responseReturn(res, 404, { error: 'User not found' });
            }

            return responseReturn(res, 200, { userInfo: user });
        } catch (error) {
            return responseReturn(res, 500, { error: 'Internal server error' });
        }
    }

    upload_profile_image = async (req, res) => {
        const { id } = req;
        const form = formidable({ multiples: false, keepExtensions: true });

        form.parse(req, async (err, _, files) => {

            try {
                let image = files.image;
                if (Array.isArray(image)) {
                    image = image[0]; // Get first file if it's an array
                }

                const extension = path.extname(image.originalFilename || "").toLowerCase();
                const mimeType = image.mimetype;

                // File validation
                if (!allowedExtensions.includes(extension) || !allowedMimeTypes.includes(mimeType)) {
                    return responseReturn(res, 400, {
                        error: "Invalid file type. Only JPG and PNG are allowed.",
                    });
                }

                // Generate new file name
                const timestamp = Date.now();
                const safeName = `user-${id}-${timestamp}${extension}`;
                const newFilePath = path.join(profileDir, safeName);
                const fileUrl = `${req.protocol}://${req.get("host")}/uploads/profiles/${safeName}`;

                // Check and delete old image if local
                const seller = await db.Seller.findByPk(id);
                if (seller?.image?.includes("/uploads/profiles/")) {
                    const oldProfilePath = path.join(process.cwd(), seller.image.replace(`${req.protocol}://${req.get("host")}`, ""));
                    if (fs.existsSync(oldProfilePath)) {
                        fs.unlinkSync(oldProfilePath);
                    }
                }

                // Move file from temp location to final destination
                fs.renameSync(image.filepath, newFilePath);

                // Update seller image in the database
                await db.Seller.update({ image: fileUrl }, { where: { sellerId: id } });

                // Fetch updated user info
                const userInfo = await db.Seller.findByPk(id);
                return responseReturn(res, 201, { message: "Image upload successful", userInfo });
            } catch (error) {
                console.log("error", error)
                return responseReturn(res, 500, { error: "Internal server error" });
            }
        });
    }

    upload_logo_image = async (req, res) => {
        const { id } = req;
        const form = formidable({ multiples: false, keepExtensions: true });

        form.parse(req, async (err, _, files) => {

            try {
                let image = files.image;
                if (Array.isArray(image)) {
                    image = image[0]; // Get first file if it's an array
                }

                const extension = path.extname(image.originalFilename || "").toLowerCase();
                const mimeType = image.mimetype;

                // File validation
                if (!allowedExtensions.includes(extension) || !allowedMimeTypes.includes(mimeType)) {
                    return responseReturn(res, 400, {
                        error: "Invalid file type. Only JPG and PNG are allowed.",
                    });
                }

                // Generate new file name
                const timestamp = Date.now();
                const safeName = `logo-${id}-${timestamp}${extension}`;
                const newFilePath = path.join(logoDir, safeName);
                const fileUrl = `${req.protocol}://${req.get("host")}/uploads/logos/${safeName}`;

                // Check and delete old image if local
                const seller = await db.Seller.findByPk(id);
                if (seller?.image?.includes("/uploads/logos/")) {
                    const oldLogoPath = path.join(process.cwd(), seller.image.replace(`${req.protocol}://${req.get("host")}`, ""));
                    if (fs.existsSync(oldLogoPath)) {
                        fs.unlinkSync(oldLogoPath);
                    }
                }

                // Move file from temp location to final destination
                fs.renameSync(image.filepath, newFilePath);

                // Update seller image in the database
                await db.Seller.update({ logo: fileUrl }, { where: { sellerId: id } });

                // Fetch updated user info
                const userInfo = await db.Seller.findByPk(id);
                return responseReturn(res, 201, { message: "Image upload successful", userInfo });
            } catch (error) {
                console.log("error", error)
                return responseReturn(res, 500, { error: "Internal server error" });
            }
        });
    }

    add_profile_info = async (req, res) => {
        const { county, yardLocation, yardTitle, officeNumber, building } = req.body;
        const sellerId = req.id

        try {
            const seller = await db.Seller.findByPk(sellerId);
            let shopInfo = Array.isArray(seller.shopInfo) ? seller.shopInfo : [];
            shopInfo.push({ county, yardLocation, yardTitle, officeNumber, building });
            await db.Seller.update(
                { shopInfo },
                { where: { sellerId } }
            );
            const userInfo = await db.Seller.findByPk(sellerId);
            return responseReturn(res, 201, { message: "Profile info added successfully", userInfo });
        } catch (error) {
            return responseReturn(res, 500, { error: error.message });
        }
    }

    add_payment_info = async (req, res) => {
        const { account_no, settlement_bank } = req.body;
        const sellerId = req.id;

        try {
            const seller = await db.Seller.findByPk(sellerId);

            // Get existing paymentInfo array, or initialize an empty one
            const existingInfo = Array.isArray(seller.paymentInfo) ? seller.paymentInfo : [];

            // Append new entry
            const newEntry = { account_no, settlement_bank };
            const updatedPaymentInfo = [...existingInfo, newEntry];

            // Update seller record
            await db.Seller.update(
                { paymentInfo: updatedPaymentInfo },
                { where: { sellerId } }
            );

            // Fetch updated user info
            const userInfo = await db.Seller.findByPk(sellerId);
            return responseReturn(res, 201, { message: "Info added successfully", userInfo });
        } catch (error) {
            return responseReturn(res, 500, { error: error.message || 'server error' });
        }
    }

    update_social_links = async (req, res) => {
        const sellerId = req.id;
        const { facebook, instagram, twitter, linkedin, tiktok, youtube } = req.body;

        try {
            const seller = await db.Seller.findByPk(sellerId);
            if (!seller) {
                return responseReturn(res, 404, { error: "Seller not found" });
            }

            // Update only provided fields
            if (facebook !== undefined) seller.facebook = facebook;
            if (instagram !== undefined) seller.instagram = instagram;
            if (twitter !== undefined) seller.twitter = twitter;
            if (linkedin !== undefined) seller.linkedin = linkedin;
            if (tiktok !== undefined) seller.tiktok = tiktok;
            if (youtube !== undefined) seller.youtube = youtube;

            await seller.save();

            return responseReturn(res, 200, { message: "Updated successfully", seller });
        } catch (error) {
            return responseReturn(res, 500, { error: error.message || 'server error' });
        }
    }

    logout = async (req, res) => {
        try {
            res.cookie("accessToken", null, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                expires: new Date(Date.now()),
            });

            return responseReturn(res, 200, { message: "Logout successful" });
        } catch (error) {
            return responseReturn(res, 500, { error: error.message });
        }
    }

}

export default new dashAuthController()