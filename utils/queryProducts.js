import { Op } from 'sequelize';
import { db } from '../models/index.js';

export class QueryProducts {
    constructor(query) {
        this.query = query;
        this.options = {
            where: {},
            order: [],
            offset: 0,
            limit: parseInt(query.perPage) || 10,
        };
    }

    categoryQuery() {
        if (this.query.category) {
            this.options.where.category = this.query.category;
        }
        return this;
    }

    ratingQuery() {
        if (this.query.rating) {
            const rating = parseInt(this.query.rating);
            this.options.where.rating = {
                [Op.gte]: rating,
                [Op.lt]: rating + 1,
            };
        }
        return this;
    }

    priceQuery() {
        const { lowPrice, highPrice } = this.query;
        if (lowPrice && highPrice) {
            this.options.where.price = {
                [Op.between]: [parseFloat(lowPrice), parseFloat(highPrice)],
            };
        }
        return this;
    }

    searchQuery() {
        if (this.query.searchValue) {
            this.options.where.name = {
                [Op.iLike]: `%${this.query.searchValue}%`, // case-insensitive LIKE
            };
        }
        return this;
    }

    sortByPrice() {
        if (this.query.sortPrice === 'low-to-high') {
            this.options.order.push(['price', 'ASC']);
        } else if (this.query.sortPrice === 'high-to-low') {
            this.options.order.push(['price', 'DESC']);
        }
        return this;
    }

    paginate() {
        const page = parseInt(this.query.pageNumber) || 1;
        const limit = parseInt(this.query.perPage) || 10;
        const offset = (page - 1) * limit;

        this.options.limit = limit;
        this.options.offset = offset;

        return this;
    }

    async getProducts() {
        const { rows, count } = await db.Product.findAndCountAll(this.options);
        return {
            products: rows,
            totalProducts: count,
        };
    }
}
