import { Op } from 'sequelize';
import { db } from '../models/index.js';

export class QueryListings {
    query = {}
    whereClause = {}
    order = []
    offset = 0
    limitValue = 10

    constructor(query) {
        this.query = query
    }

    makeQuery = () => {
        return this;
    };

    ratingQuery = () => {
        if (this.query.rating) {
            this.whereClause.rating = {
                [Op.gte]: parseInt(this.query.rating),
                [Op.lt]: parseInt(this.query.rating) + 1,
            }
        }
        return this
    };

    priceQuery = () => {
        const low = this.query.lowPrice ? parseInt(this.query.lowPrice) : null;
        const high = this.query.highPrice ? parseInt(this.query.highPrice) : null;

        if (low !== null && !isNaN(low) && high !== null && !isNaN(high)) {
            this.whereClause.price = { [Op.between]: [low, high] };
        } else if (low !== null && !isNaN(low)) {
            this.whereClause.price = { [Op.gte]: low };
        } else if (high !== null && !isNaN(high)) {
            this.whereClause.price = { [Op.lte]: high };
        }

        return this;
    };

    searchQuery = () => {
        if (this.query.searchValue) {
            this.whereClause.title = { [Op.like]: `%${this.query.searchValue}%` };
        }
        return this;
    };

    conditionQuery = () => {
        if (this.query.condition) {
            const condition = this.query.condition.toLowerCase();
            const validConditions = ['new', 'foreignused', 'localused'];

            if (condition === 'all') {
                // do not restrict -> return all
            } else if (validConditions.includes(condition)) {
                this.whereClause.condition = condition;
            }
        }
        return this;
    };

    makeQueryFilter = () => {
        if (this.query.make) {
            this.whereClause.make = this.query.make;
        }
        return this;
    };

    modelQuery = () => {
        if (this.query.model) {
            this.whereClause.model = this.query.model;
        }
        return this;
    };

    typeQuery = () => {
        if (this.query.type) {
            this.whereClause.type = this.query.type;
        }
        return this;
    };

    yearQuery = () => {
        if (this.query.year) {
            this.whereClause.year = this.query.year;
        }
        return this;
    };

    transmissionQuery = () => {
        if (this.query.transmission) {
            this.whereClause.transmission = this.query.transmission;
        }
        return this;
    };

    fuelQuery = () => {
        if (this.query.fuelType) {
            this.whereClause.fuelType = this.query.fuelType;
        }
        return this;
    };

    mileageQuery = () => {
        const low = this.query.lowMileage ? parseInt(this.query.lowMileage) : null;
        const high = this.query.highMileage ? parseInt(this.query.highMileage) : null;

        if (low !== null && !isNaN(low) && high !== null && !isNaN(high)) {
            this.whereClause.mileage = { [Op.between]: [low, high] };
        } else if (low !== null && !isNaN(low)) {
            this.whereClause.mileage = { [Op.gte]: low };
        } else if (high !== null && !isNaN(high)) {
            this.whereClause.mileage = { [Op.lte]: high };
        }

        return this;
    };

    engineQuery = () => {
        if (this.query.engineSize) {
            this.whereClause.engineSize = this.query.engineSize;
        }
        return this;
    };

    cylinderQuery = () => {
        if (this.query.cylinders) {
            this.whereClause.cylinders = this.query.cylinders;
        }
        return this;
    };

    sortByPrice = () => {
        if (this.query.sortPrice) {
            this.order.push(['price', this.query.sortPrice === 'low-to-high' ? 'ASC' : 'DESC']);
        }
        return this
    };

    skip = () => {
        if (this.query.pageNumber) {
            this.offset = (parseInt(this.query.pageNumber) - 1) * this.query.perPage;
        }
        return this
    };

    limit = () => {
        if (this.query.perPage) {
            this.limitValue = parseInt(this.query.perPage);
        }
        return this
    };

    getListings = async () => {
        return await db.CarListing.findAll({
            where: this.whereClause,
            order: this.order,
            offset: this.offset,
            limit: this.limitValue,
        });
    };

    countListings = async () => {
        return await db.CarListing.count({
            where: this.whereClause,
        });
    };
}
