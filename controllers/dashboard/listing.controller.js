import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp'
import { fileURLToPath } from 'url';
import { responseReturn } from '../../utils/response.js';
import { Op } from 'sequelize';
import axios from 'axios';
import nodemailer from 'nodemailer'
import { db } from '../../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define upload directories
const uploadRoot = path.join(__dirname, '../../uploads');
const imageDir = path.join(uploadRoot, 'images');
const documentDir = path.join(uploadRoot, 'documents');

// Ensure directories exist
[uploadRoot, imageDir, documentDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

class ListingControllers {

    // Seller Controllers 
    add_seller_listing = async (req, res) => {

        const form = formidable({ multiples: true, keepExtensions: true });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(400).json({ error: 'Error parsing form data' });
            }

            try {
                const getFieldValue = (value) => Array.isArray(value) ? value[0] : value;
                const sellerId = getFieldValue(fields.sellerId);

                let title = getFieldValue(fields.title).trim();
                let condition = getFieldValue(fields.condition).trim();
                let type = getFieldValue(fields.type).trim();
                let make = getFieldValue(fields.make).trim();
                let model = getFieldValue(fields.model).trim();
                let price = parseInt(getFieldValue(fields.price));
                let year = parseInt(getFieldValue(fields.year));
                let drivetype = getFieldValue(fields.drivetype).trim();
                let transmission = getFieldValue(fields.transmission).trim();
                let fueltype = getFieldValue(fields.fueltype).trim();
                let mileage = parseInt(getFieldValue(fields.mileage));
                let horsepower = parseInt(getFieldValue(fields.horsepower));
                let torque = parseInt(getFieldValue(fields.torque));
                let enginesize = parseInt(getFieldValue(fields.enginesize));
                let cylinders = parseInt(getFieldValue(fields.cylinders));
                let color = getFieldValue(fields.color).trim();
                let availability = getFieldValue(fields.availability).trim();
                let doors = parseInt(getFieldValue(fields.doors));
                let vin = getFieldValue(fields.vin).trim();
                let description = getFieldValue(fields.description).trim();
                let videolink = fields.videolink ? getFieldValue(fields.videolink).trim() : null;
                let comfortfeatures = fields.comfortfeatures ? JSON.parse(getFieldValue(fields.comfortfeatures)) : [];
                let safetyfeatures = fields.safetyfeatures ? JSON.parse(getFieldValue(fields.safetyfeatures)) : [];

                const generateUniqueSlug = (title) => {
                    const randomCode = Math.random().toString(36).substring(2, 6)
                    return `${title.toLowerCase().replace(/ /g, '-')}-${randomCode}`
                }

                const slug = generateUniqueSlug(title)

                let allImageUrl = [];
                let allDocumentUrl = [];

                const serverUrl = `${req.protocol}://${req.get("host")}`;

                Object.keys(files).forEach((key, index) => {
                    let fileList = files[key];

                    if (!Array.isArray(fileList)) {
                        fileList = [fileList]; // Ensure it's an array
                    }

                    fileList.forEach(async (file) => {
                        if (!file || !file.filepath) return; // Skip if file is missing

                        const timestamp = Date.now();
                        const extension = path.extname(file.originalFilename);
                        const safeName = `${year}-${make}-${model}-${timestamp}${extension}`.replace(/\s+/g, '-');

                        let newFilePath;
                        let fileUrl;

                        if (key.startsWith('images')) {
                            newFilePath = path.join(imageDir, safeName);
                            fileUrl = `${serverUrl}/uploads/images/${safeName}`;
                            allImageUrl.push(fileUrl);

                            const logoPath = path.join(process.cwd(), "assets", "logo.png");

                            try {
                                await sharp(file.filepath)
                                    .composite([
                                        {
                                            input: logoPath,
                                            gravity: "center",
                                            blend: "over",
                                            opacity: 0.6
                                        }
                                    ])
                                    .toFile(newFilePath);

                                // ✅ Delete after Sharp is completely done
                                // fs.unlink(file.filepath, (err) => {
                                //     if (err) console.error("Failed to delete temp file:", err);
                                // });
                            } catch (err) {
                                console.error("Sharp processing failed:", err);
                            }
                        }
                        else if (key.startsWith('documents')) {
                            newFilePath = path.join(documentDir, safeName);
                            fileUrl = `${serverUrl}/uploads/documents/${safeName}`;
                            allDocumentUrl.push(fileUrl);

                            // For documents, just move without sharp
                            fs.renameSync(file.filepath, newFilePath);
                        }
                    });
                });

                // Define package limits
                const PACKAGE_LISTING_LIMITS = {
                    Eco: 30,
                    Supercharged: 100,
                    Turbo: Infinity
                };

                // Fetch the seller's active package
                const subscription = await db.Subscriptions.findOne({
                    where: {
                        sellerId,
                        isActive: true
                    }
                });

                if (!subscription || !subscription.pkgTitle) {
                    return res.status(403).json({ error: 'No active package found for this seller' });
                }

                const pkgTitle = subscription.pkgTitle;
                const limit = PACKAGE_LISTING_LIMITS[pkgTitle];

                const currentCount = await db.CarListing.count({ where: { sellerId } });

                if (limit !== Infinity && currentCount >= limit) {
                    return res.status(403).json({
                        error: `You have reached your listing limit!`
                    });
                }

                const newListing = await db.CarListing.create({
                    sellerId,
                    title,
                    slug,
                    type,
                    condition,
                    make,
                    model,
                    price,
                    year,
                    drivetype,
                    transmission,
                    fueltype,
                    mileage,
                    horsepower,
                    torque,
                    enginesize,
                    cylinders,
                    color,
                    availability,
                    doors,
                    vin,
                    description,
                    videolink,
                    images: allImageUrl,
                    documents: allDocumentUrl,
                    comfortfeatures,
                    safetyfeatures,
                });

                responseReturn(res, 201, {
                    message: 'Listing added successfully',
                    listing: newListing,
                    uploadedImages: allImageUrl,
                    uploadedDocuments: allDocumentUrl
                });

            } catch (error) {
                responseReturn(res, 500, { error: error.message });
            }
        });
    }

    get_seller_listings = async (req, res) => {
        const { page = 1, searchValue, perPage = 10 } = req.query
        const { id: sellerId } = req

        const offset = parseInt(perPage) * (parseInt(page) - 1)
        const limit = parseInt(perPage)

        try {
            let whereCondition = { sellerId }

            if (searchValue) {
                whereCondition = {
                    ...whereCondition,
                    title: { [Op.like]: `%${searchValue}%` },
                }
            }

            const listings = await db.CarListing.findAll({
                where: whereCondition,
                offset,
                limit,
                order: [['createdAt', 'DESC']]
            })

            const totalListing = await db.CarListing.count({ where: whereCondition })

            responseReturn(res, 200, { totalListing, listings })

        } catch (error) {
            console.error(error.message)
            responseReturn(res, 500, { error: 'Technical error' })
        }

    }

    get_seller_listing_details = async (req, res) => {
        const { listingId } = req.params

        try {
            const listing = await db.CarListing.findByPk(listingId)
            responseReturn(res, 200, { listing })
        } catch (error) {
            console.error(error.message);
            responseReturn(res, 500, { error: 'Technical error' });
        }

    }

    update_seller_listing = async (req, res) => {
        let { listingId, title, condition, type, make, model, price, year, drivetype, transmission, fueltype, mileage, enginesize, cylinders, color, doors, vin, description, videolink, comfortfeatures, safetyfeatures } = req.body;

        try {
            let slug;
            if (title) {
                title = title.trim();
                slug = `${title.toLowerCase().replace(/ /g, "-")}-${Math.random().toString(36).substring(2, 6)}`;
            }

            comfortfeatures = comfortfeatures ? JSON.parse(comfortfeatures) : undefined;
            safetyfeatures = safetyfeatures ? JSON.parse(safetyfeatures) : undefined;

            await db.CarListing.update({ title, slug, condition, type, make, model, price, year, drivetype, transmission, fueltype, mileage, enginesize, cylinders, color, doors, vin, description, videolink, comfortfeatures, safetyfeatures }, { where: { listingId: listingId } });

            const updatedListing = await db.CarListing.findByPk(listingId);

            responseReturn(res, 200, { listing: updatedListing, message: "Listing updated successfully" });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    }

    update_listing_images = async (req, res) => {
        const form = formidable({ multiples: false, keepExtensions: true });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return responseReturn(res, 400, { error: err.message });
            }

            const listingId = Array.isArray(fields.listingId) ? fields.listingId[0] : fields.listingId;
            const oldImage = Array.isArray(fields.oldImage) ? fields.oldImage[0] : fields.oldImage;
            const newImage = Array.isArray(files.newImage) ? files.newImage[0] : files.newImage;

            try {
                const listing = await db.CarListing.findByPk(listingId);

                const year = listing.year;
                const make = listing.make;
                const model = listing.model;

                const serverUrl = `${req.protocol}://${req.get("host")}`;
                const timestamp = Date.now();
                const filename = newImage?.originalFilename || "";
                const extension = path.extname(filename);
                const safeName = `${year}-${make}-${model}-${timestamp}${extension}`.replace(/\s+/g, '-');
                const newFilePath = path.join(imageDir, safeName);
                const imageUrl = `${serverUrl}/uploads/images/${safeName}`;

                fs.renameSync(newImage.filepath, newFilePath);

                let images = listing.images || [];
                const index = images.indexOf(oldImage);
                if (index !== -1) {
                    images[index] = imageUrl;
                } else {
                    images.push(imageUrl);
                }

                await listing.update({ images });

                if (oldImage) {
                    const oldImagePath = path.join(imageDir, path.basename(oldImage));
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }

                responseReturn(res, 200, { listing, message: 'Listing images updated successfully' });
            } catch (err) {
                responseReturn(res, 500, { error: err.message });
            }
        });
    }

    delete_listing = async (req, res) => {
        try {
            const { listingId } = req.params

            const listing = await db.CarListing.findByPk(listingId)

            await listing.destroy()

            responseReturn(res, 200, { message: 'Listing deleted succesfully' })
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    }

    create_lead = async (req, res) => {
        const { listing_id, seller_id, lead_type } = req.body;
        const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const user_agent = req.headers['user-agent'];

        try {
            const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

            const existingLead = await db.Leads.findOne({
                where: {
                    listing_id,
                    seller_id,
                    lead_type,
                    ip_address,
                    user_agent,
                    createdAt: { [Op.gt]: twentyMinutesAgo }
                }
            });

            if (!existingLead) {
                await db.Leads.create({
                    listing_id,
                    seller_id,
                    lead_type,
                    ip_address,
                    user_agent
                });
            }

            return res.status(200).json({ message: 'Lead recorded' });
        } catch (error) {
            console.error('Error creating lead:', error);
            res.status(500).json({ message: 'Failed to record lead', error: error.message });
        }
    }

    // Admin Controllers
    get_all_listings = async (req, res) => {
        const { page = 1, searchValue, perPage = 10 } = req.query

        const offset = parseInt(perPage) * (parseInt(page) - 1)
        const limit = parseInt(perPage)

        try {
            let whereCondition = {}

            if (searchValue) {
                whereCondition = {
                    ...whereCondition,
                    title: { [Op.like]: `%${searchValue}%` },
                }
            }

            const listings = await db.CarListing.findAll({
                where: whereCondition,
                offset,
                limit,
                order: [['createdAt', 'DESC']]
            })

            const totalListing = await db.CarListing.count({ where: whereCondition })

            responseReturn(res, 200, { totalListing, listings })

        } catch (error) {
            console.error(error.message)
            responseReturn(res, 500, { error: 'Technical error' })
        }

    }

    get_admin_listing_details = async (req, res) => {
        const { listingId } = req.params

        try {
            const listing = await db.CarListing.findByPk(listingId)
            responseReturn(res, 200, { listing })
        } catch (error) {
            console.error(error.message);
            responseReturn(res, 500, { error: 'Technical error' });
        }

    }

    update_admin_listing = async (req, res) => {
        let { listingId, title, condition, type, make, model, price, year, drivetype, transmission, fueltype, mileage, enginesize, cylinders, color, doors, vin, description, videolink, comfortfeatures, safetyfeatures } = req.body;

        try {
            let slug;
            if (title) {
                title = title.trim();
                slug = `${title.toLowerCase().replace(/ /g, "-")}-${Math.random().toString(36).substring(2, 6)}`;
            }

            comfortfeatures = comfortfeatures ? JSON.parse(comfortfeatures) : undefined;
            safetyfeatures = safetyfeatures ? JSON.parse(safetyfeatures) : undefined;

            await db.CarListing.update({ title, slug, condition, type, make, model, price, year, drivetype, transmission, fueltype, mileage, enginesize, cylinders, color, doors, vin, description, videolink, comfortfeatures, safetyfeatures }, { where: { listingId: listingId } });

            const updatedListing = await db.CarListing.findByPk(listingId);

            responseReturn(res, 200, { listing: updatedListing, message: "Listing updated successfully" });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    }

    update_listing_status = async (req, res) => {
        try {
            const { listingId } = req.params;

            // Find the listing
            const listing = await db.CarListing.findByPk(listingId, {
                include: [
                    {
                        model: db.Seller,
                        attributes: ["email", "shopInfo"], // assuming Seller has email
                    },
                ],
            });

            if (!listing) {
                return res.status(404).json({ message: "Listing not found" });
            }

            // Toggle status
            listing.isActive = !listing.isActive;
            await listing.save();

            // Send email notification
            if (listing.Seller && listing.Seller.email) {
                const transporter = nodemailer.createTransport({
                    service: "gmail", // Or use your SMTP provider
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });

                const mailOptions = {
                    from: `"Wayne_Auto_Sales" <${process.env.EMAIL_USER}>`,
                    to: listing.Seller.email,
                    subject: `Your Listing Status Has Been Updated`,
                    html: `
          <h2>Hello ${listing.Seller.shopInfo?.[0]?.yardTitle || "Seller"},</h2>
          <p>Your listing <strong>${listing.title}</strong> has been ${listing.isActive ? "activated ✅" : "deactivated ❌"
                        }.</p>
          <p>If you have any questions, please contact support.</p>
          <br>
          <p>Regards,<br/>Wayne_Auto_Sales Team</p>
        `,
                };

                await transporter.sendMail(mailOptions);
            }

            return res.status(200).json({
                message: `status updated to ${listing.isActive}`,
                listing,
            });
        } catch (error) {
            console.error("Error updating listing status:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Boosted listings 
    verify_and_boost = async (req, res) => {
        const { reference, listingId } = req.body;

        try {
            const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
                }
            });

            if (response.data.data.status === 'success') {
                await db.CarListing.update(
                    {
                        isSponsored: true,
                        sponsoredExpiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                    },
                    { where: { listingId } }
                );
                return res.status(200).json({ success: true, message: 'Listing boosted!' });
            }

            return res.status(400).json({ success: false, message: 'Payment not verified.' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Server error during verification.' });
        }
    }

}

export default new ListingControllers();
