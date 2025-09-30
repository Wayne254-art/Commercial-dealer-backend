import { sequelize } from "../../config/db.js";
import { db } from "../../models/index.js";

class categoryController {
    // Create a new category
    create_category = async (req, res) => {
        const { name } = req.body;
        try {
            const category = await db.Category.create({ name });
            res.status(201).json(category);
        } catch (err) {
            res.status(400).json({ error: "Category exists or invalid data", details: err.message });
        }
    }

    // Get all categorys with associated brands
    get_all_categorys = async (req, res) => {
        try {
            const categorys = await db.Category.findAll({
                include: {
                    model: db.Brand,
                    as: "brands"
                },
                order: [
                    ['name', 'ASC']
                ]
            });
            res.json(categorys);
        } catch (err) {
            res.status(500).json({ error: "Failed to fetch categorys", details: err.message });
        }
    };

    // Delete a category by its UUID
    delete_category = async (req, res) => {
        const { categoryId } = req.params;
        try {
            await db.Category.destroy({ where: { categoryId } });
            res.json({ message: "Category deleted" });
        } catch (err) {
            res.status(500).json({ error: "Error deleting category", details: err.message });
        }
    };

    // Create a brand under a specific category
    create_brand = async (req, res) => {
        let { name, categoryId } = req.body;

        // Normalize input
        name = name?.trim();
        if (!name || !categoryId) {
            return res.status(400).json({ error: "Brand name and categoryId are required" });
        }

        try {
            // Case-insensitive duplicate check
            const existingBrand = await db.Brand.findOne({
                where: {
                    name: sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('name')),
                        name.toLowerCase()
                    ),
                    categoryId,
                }
            });

            if (existingBrand) {
                return res.status(409).json({ error: "Brand exists for this category" });
            }

            // Create the brand
            const brand = await db.Brand.create({ name, categoryId });
            res.status(201).json(brand);

        } catch (err) {
            res.status(400).json({ error: "Invalid brand data", details: err.message });
        }
    };

    // Delete a model by its UUID
    delete_brand = async (req, res) => {
        const { brandId } = req.params;
        try {
            await db.Brand.destroy({ where: { brandId } });
            res.json({ message: "Brand deleted" });
        } catch (err) {
            res.status(500).json({ error: "Error deleting brand", details: err.message });
        }
    };
}

export default new categoryController();
