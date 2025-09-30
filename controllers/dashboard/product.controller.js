import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import formidable from "formidable";
import { responseReturn } from "../../utils/response.js";
import { generateSlug } from "../../utils/slugify.js";
import { db } from "../../models/index.js";
import { Op } from "sequelize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define upload directories
const uploadRoot = path.join(__dirname, '../../uploads');
const imageDir = path.join(uploadRoot, 'products');

// Ensure directories exist
[uploadRoot, imageDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

class productController {

    add_seller_product = async (req, res) => {
        const form = formidable({ multiples: true, keepExtensions: true });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(400).json({ error: 'Error parsing data' });
            }

            try {
                const getFieldValue = (value) => Array.isArray(value) ? value[0] : value;
                const sellerId = getFieldValue(fields.sellerId);
                const shopname = getFieldValue(fields.shopname).trim() || '';
                const title = getFieldValue(fields.title).trim();
                const condition = getFieldValue(fields.condition).trim();
                const category = getFieldValue(fields.category).trim();
                const brand = getFieldValue(fields.brand).trim();
                const color = getFieldValue(fields.color)?.trim() || '';
                const compatibleCars = getFieldValue(fields.compatiblecars)?.trim() || '';
                const size = getFieldValue(fields.size)?.trim() || '';
                const stock = parseInt(getFieldValue(fields.stock));
                const price = parseFloat(getFieldValue(fields.price));
                const discount = parseFloat(getFieldValue(fields.discount));
                const description = getFieldValue(fields.description)?.trim() || '';

                const generateSKU = (brand, title) => {
                    const pad = (str, len) => str ? str.substring(0, len).toUpperCase().replace(/\s/g, '') : 'XXX';
                    const brandCode = pad(brand, 3);
                    const titleCode = pad(title, 4);
                    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
                    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
                    return `SP-${brandCode}-${titleCode}-${timestamp}-${randomStr}`;
                };

                const sku = generateSKU(brand, title);

                const rawSlug = `${title}-${category}-${brand}`; // or category, up to you
                const slug = generateSlug(rawSlug);

                let allImageUrl = [];
                const serverUrl = `${req.protocol}://${req.get("host")}`;

                Object.keys(files)
                    .filter(key => key.startsWith('products'))
                    .forEach(key => {
                        let fileList = files[key];
                        if (!Array.isArray(fileList)) fileList = [fileList];

                        fileList.forEach(file => {
                            if (!file || !file.filepath) return;

                            const timestamp = Date.now();
                            const extension = path.extname(file.originalFilename);
                            const safeName = `${title}-${timestamp}${extension}`.replace(/\s+/g, '-');
                            const newFilePath = path.join(imageDir, safeName);
                            const fileUrl = `${serverUrl}/uploads/products/${safeName}`;

                            fs.renameSync(file.filepath, newFilePath);
                            allImageUrl.push(fileUrl);
                        });
                    });

                const newProduct = await db.Product.create({
                    sellerId,
                    shopname,
                    title,
                    sku,
                    slug,
                    condition,
                    category,
                    brand,
                    color,
                    compatibleCars,
                    size,
                    stock,
                    price,
                    discount,
                    description,
                    images: allImageUrl
                });

                responseReturn(res, 201, {
                    message: 'added successfully',
                    Product: newProduct,
                    uploadedImages: allImageUrl,
                });

            } catch (error) {
                responseReturn(res, 500, { error: error.message });
            }
        });
    }

    get_seller_products = async (req, res) => {
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

            const products = await db.Product.findAll({
                where: whereCondition,
                offset,
                limit,
                order: [['createdAt', 'DESC']]
            })

            const totalProducts = await db.Product.count({ where: whereCondition })

            responseReturn(res, 200, { totalProducts, products })

        } catch (error) {
            console.error(error.message)
            responseReturn(res, 500, { error: 'Technical error' })
        }

    }

    get_seller_discounted_products = async (req, res) => {
        const { page = 1, searchValue, perPage = 10 } = req.query;
        const { id: sellerId } = req;

        const offset = parseInt(perPage) * (parseInt(page) - 1);
        const limit = parseInt(perPage);

        try {
            let whereCondition = {
                sellerId,
                discount: { [Op.gt]: 0 } // only products with discount > 0
            };

            if (searchValue) {
                whereCondition.title = { [Op.like]: `%${searchValue}%` };
            }

            const discountedProducts = await db.Product.findAll({
                where: whereCondition,
                offset,
                limit,
                order: [['createdAt', 'DESC']]
            });

            const totalDiscountedProducts = await db.Product.count({ where: whereCondition });

            responseReturn(res, 200, { totalDiscountedProducts, discountedProducts });
        } catch (error) {
            console.error(error.message);
            responseReturn(res, 500, { error: 'Technical error' });
        }
    }

    get_seller_product_details = async (req, res) => {
        const { productId } = req.params

        try {
            const product = await db.Product.findByPk(productId)
            responseReturn(res, 200, { product })
        } catch (error) {
            console.error(error.message);
            responseReturn(res, 500, { error: 'Technical error' });
        }

    }

    update_seller_product = async (req, res) => {
        let { productId, title, condition, category, brand, price, discount, stock, compatiblecars, size, color, description } = req.body;

        try {
            let slug;
            if (title) {
                title = title.trim();
                slug = `${title.toLowerCase().replace(/ /g, "-")}-${Math.random().toString(36).substring(2, 6)}`;
            }

            await db.Product.update({ title, slug, condition, category, brand, price, discount, stock, compatiblecars, size, color, description }, { where: { productId: productId } });

            const updatedProduct = await db.Product.findByPk(productId);

            responseReturn(res, 200, { product: updatedProduct, message: "updated successfully" });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    }

    update_product_images = async (req, res) => {
        const form = formidable({ multiples: false, keepExtensions: true });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return responseReturn(res, 400, { error: err.message });
            }

            const productId = Array.isArray(fields.productId) ? fields.productId[0] : fields.productId;
            const oldImage = Array.isArray(fields.oldImage) ? fields.oldImage[0] : fields.oldImage;
            const newImage = Array.isArray(files.newImage) ? files.newImage[0] : files.newImage;

            try {
                const product = await db.Product.findByPk(productId);

                const title = product?.title;
                const category = product?.category;
                const brand = product?.brand;

                const serverUrl = `${req.protocol}://${req.get("host")}`;
                const timestamp = Date.now();
                const filename = newImage?.originalFilename || "";
                const extension = path.extname(filename);
                const safeName = `${title}-${category}-${brand}-${timestamp}${extension}`.replace(/\s+/g, '-');
                const newFilePath = path.join(imageDir, safeName);
                const imageUrl = `${serverUrl}/uploads/products/${safeName}`;

                fs.renameSync(newImage.filepath, newFilePath);

                let images = product.images || [];
                const index = images.findIndex(img => path.basename(img) === path.basename(oldImage));
                if (index !== -1) {
                    images[index] = imageUrl;
                } else {
                    images.push(imageUrl);
                }

                await db.Product.update({ images }, { where: { productId } });

                if (oldImage) {
                    const oldImagePath = path.join(imageDir, path.basename(oldImage));
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }

                const updatedProduct = await db.Product.findByPk(productId);
                responseReturn(res, 200, { message: 'updated successfully', product: updatedProduct });
            } catch (err) {
                responseReturn(res, 500, { error: err.message });
            }
        });
    }

    remove_product_image = async (req, res) => {
        const { productId, imageUrl } = req.body;

        try {
            const product = await db.Product.findByPk(productId);

            if (!product) {
                return responseReturn(res, 404, { error: 'Product not found' });
            }

            let updatedImages = product.images.filter(img => img !== imageUrl);

            // Delete the actual file from storage
            const imagePath = path.join(imageDir, path.basename(imageUrl));
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }

            await db.Product.update({ images: updatedImages }, { where: { productId } });

            const updatedProduct = await db.Product.findByPk(productId); // return updated product
            return responseReturn(res, 200, { message: 'Image removed successfully', product: updatedProduct });

        } catch (err) {
            console.error(err);
            return responseReturn(res, 500, { error: 'Server error' });
        }
    }

    delete_product = async (req, res) => {
        try {
            const { productId } = req.params

            const product = await db.Product.findByPk(productId)

            await product.destroy()

            responseReturn(res, 200, { message: 'deleted succesfully' })
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    }

    get_all_products = async (req, res) => {
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

            const products = await db.Product.findAll({
                where: whereCondition,
                offset,
                limit,
                order: [['createdAt', 'DESC']]
            })

            const totalProducts = await db.Product.count({ where: whereCondition })

            responseReturn(res, 200, { totalProducts, products })

        } catch (error) {
            console.error(error.message)
            responseReturn(res, 500, { error: 'Technical error' })
        }

    }

    product_status_update = async (req, res) => {
        const { productId, isActive } = req.body;

        const isActiveBoolean = isActive === 'true';

        try {
            const product = await db.Product.findByPk(productId);

            if (!product) {
                return responseReturn(res, 404, { message: 'Product not found.' });
            }

            product.isActive = isActiveBoolean;
            await product.save();

            responseReturn(res, 200, {
                product,
                message: 'updated successfully',
            });
        } catch (error) {
            console.error('Error updating product:', error.message);
            responseReturn(res, 500, { error: error.message });
        }
    }

}



export default new productController();
