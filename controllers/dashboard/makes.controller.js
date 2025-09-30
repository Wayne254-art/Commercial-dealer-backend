import { sequelize } from "../../config/db.js";
import { db } from "../../models/index.js";

class ListingMakes {
    // Create a new car make
    create_make = async (req, res) => {
        const { name } = req.body;
        try {
            const make = await db.Make.create({ name });
            res.status(201).json(make);
        } catch (err) {
            res.status(400).json({ error: "Make already exists or invalid data", details: err.message });
        }
    }

    // Get all car makes with associated models
    get_all_makes = async (req, res) => {
        try {
            const makes = await db.Make.findAll({
                include: {
                    model: db.CarBrand,
                    as: "models"
                },
                order: [
                    ['name', 'ASC']
                ]
            });
            res.json(makes);
        } catch (err) {
            res.status(500).json({ error: "Failed to fetch makes", details: err.message });
        }
    };

    // Delete a make by its UUID
    delete_make = async (req, res) => {
        const { makeId } = req.params;
        try {
            await db.Make.destroy({ where: { makeId } });
            res.json({ message: "Make deleted" });
        } catch (err) {
            res.status(500).json({ error: "Error deleting make", details: err.message });
        }
    };

    // Create a model under a specific make
    create_model = async (req, res) => {
        let { name, makeId } = req.body;

        // Normalize input
        name = name?.trim();
        if (!name || !makeId) {
            return res.status(400).json({ error: "Model name and makeId are required" });
        }

        try {
            // Case-insensitive duplicate check
            const existingModel = await db.CarBrand.findOne({
                where: {
                    name: sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('name')),
                        name.toLowerCase()
                    ),
                    makeId,
                }
            });

            if (existingModel) {
                return res.status(409).json({ error: "Model already exists for this make" });
            }

            // Create the model
            const model = await db.CarBrand.create({ name, makeId });
            res.status(201).json(model);

        } catch (err) {
            res.status(400).json({ error: "Invalid make ID or model data", details: err.message });
        }
    };

    // Delete a model by its UUID
    delete_model = async (req, res) => {
        const { modelId } = req.params;
        try {
            await db.CarBrand.destroy({ where: { modelId } });
            res.json({ message: "Model deleted" });
        } catch (err) {
            res.status(500).json({ error: "Error deleting model", details: err.message });
        }
    };
}

export default new ListingMakes();
