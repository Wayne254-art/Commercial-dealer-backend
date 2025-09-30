import { Op, Sequelize, where } from "sequelize";
import { db } from "../../models/index.js";
import { QueryListings } from '../../utils/queryListings.js'
import { QueryProducts } from "../../utils/queryProducts.js"
import { responseReturn } from "../../utils/response.js";
import moment from 'moment'

class homeController {

    formattedListing = (listings) => {
        const listingArray = [];
        for (let i = 0; i < listings.length; i += 3) {
            listingArray.push(listings.slice(i, i + 3));
        }
        return listingArray;
    }

    get_listings = async (req, res) => {
        try {
            const recommendedListings = await db.CarListing.findAll({
                where: {
                    isActive: true,
                    isRecommended: true
                },
                order: [Sequelize.literal('RAND()')],
            });

            const featuredListings = await db.CarListing.findAll({
                where: {
                    isActive: true,
                    isFeatured: true
                },
                order: [Sequelize.literal('RAND()')],
            });

            const popularListings = await db.CarListing.findAll({
                where: {
                    isActive: true,
                    isPopular: true
                },
                order: [Sequelize.literal('RAND()')],
            });

            const sponseredListings = await db.CarListing.findAll({
                where: {
                    isActive: true,
                    isSponsored: true
                },
                order: [Sequelize.literal('RAND()')],
            });

            const listings = await db.CarListing.findAll({
                where: { isActive: true },
                order: [Sequelize.literal('RAND()')],
            });

            const latestListings = await db.CarListing.findAll({
                where: { isActive: true },
                limit: 5,
                order: [['createdAt', 'DESC']]
            });

            const topRatedListings = await db.CarListing.findAll({
                where: { isActive: true },
                limit: 8,
                order: [['rating', 'DESC']]
            });

            responseReturn(res, 200, {
                listings,
                latest_listing: latestListings,
                topRated_listing: this.formattedListing(topRatedListings),
                recommended_listings: recommendedListings,
                featured_listings: featuredListings,
                popular_listings: popularListings,
                sponsered_listings: sponseredListings,
            });

        } catch (error) {
            console.error(error.message);
            responseReturn(res, 500, { error: 'Technical Error' });
        }
    }

    get_listing_details = async (req, res) => {

        const { slug } = req.params
        // const { listingId } = req.params

        try {
            const listing = await db.CarListing.findOne({
                where: { slug },
                include: [
                    {
                        model: db.Seller,
                        attributes: ['sellerId', 'Image', 'name', 'email', 'slug', 'accountType', 'shopInfo', 'createdAt'],
                    }
                ]
            })

            listing.clicks += 1;
            await listing.save();

            const relatedListings = await db.CarListing.findAll({
                where: {
                    listingId: { [Op.ne]: listing.listingId },
                    make: listing.make
                },
                limit: 20
            })

            const moreListings = await db.CarListing.findAll({
                where: {
                    listingId: { [Op.ne]: listing.listingId },
                    sellerId: listing.sellerId
                },
                limit: 20
            })

            responseReturn(res, 200, { listing, relatedListings, moreListings })

        } catch (error) {
            console.error(error.message);
            responseReturn(res, 500, { error: 'Technical Error' });
        }

    }

    get_all_listings_by_seller = async (req, res) => {
        try {
            const { slug } = req.params;

            // const userAgent = req.get('User-Agent') || '';

            // const botUserAgents = [
            //     /bot/i,
            //     /crawl/i,
            //     /spider/i,
            //     /slurp/i,
            //     /google/i,
            //     /bing/i,
            //     /yandex/i,
            //     /duckduckgo/i,
            // ]

            // const isBot = botUserAgents.some((pattern) => pattern.test(userAgent))

            // if (!isBot) {
            //     await Seller.increment('views', { by: 1, where: { slug: slug } })
            // }

            const seller = await db.Seller.findOne({
                where: { slug },
                attributes: ['sellerId', 'Image', 'name', 'slug', 'email', 'sellerType', 'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'createdAt', 'shopInfo']
            });

            if (!seller) {
                return responseReturn(res, 404, { message: 'Seller not found' });
            }

            const listings = await db.CarListing.findAll({
                where: { sellerId: seller.sellerId },
                order: [['createdAt', 'DESC']],
            });

            res.status(200).json({
                seller,
                listings,
            });
        } catch (err) {
            console.error('Error fetching seller listings:', err);
            res.status(500).json({ error: 'Failed to fetch listings' });
        }
    }

    query_listings = async (req, res) => {
        const perPage = 30;
        req.query.perPage = perPage;

        try {
            const queryHandler = new QueryListings(req.query)
                .makeQuery()
                .searchQuery()
                .conditionQuery()
                .makeQueryFilter()
                .modelQuery()
                .typeQuery()
                .yearQuery()
                .transmissionQuery()
                .fuelQuery()
                .mileageQuery()
                .engineQuery()
                .cylinderQuery()
                .priceQuery()
                .ratingQuery()
                .sortByPrice()
                .skip()
                .limit();
            const listings = await queryHandler.getListings()

            const totalListings = await queryHandler.countListings()

            responseReturn(res, 200, {
                listings,
                totalListings,
                perPage,
            })

        } catch (error) {
            console.log(error.message);
            responseReturn(res, 500, { error: 'Technical error' });
        }
    }

    price_range_listing = async (req, res) => {
        try {
            const listings = await db.CarListing.findAll({
                order: [['createdAt', 'DESC']],
                limit: 9,
            })

            const minPrice = await db.CarListing.min('price')
            const maxPrice = await db.CarListing.max('price')

            const priceRange = {
                low: minPrice || 0,
                high: maxPrice || 0,
            }

            const latest_listing = this.formattedListing(listings)

            const getForPrice = await db.CarListing.findAll({
                order: [['price', 'ASC']]
            })

            if (getForPrice.length > 0) {
                priceRange.high = getForPrice[getForPrice.length - 1].price
                priceRange.low = getForPrice[0].price
            }

            responseReturn(res, 200, { latest_listing, priceRange })
        } catch (error) {
            console.log(error.message)
            responseReturn(res, 500, { error: 'Technical error' })
        }
    }

    compare_listings = async (req, res) => {
        try {
            let { listingIds } = req.body

            if (typeof listingIds === 'string') {
                listingIds = listingIds.split(',').map(id => id.trim());
            }

            const listings = await db.CarListing.findAll({
                where: { listingId: { [Op.in]: listingIds } },
                attributes: ['listingId', 'title', 'make', 'model', 'year', 'price', 'mileage', 'condition', 'fueltype', 'enginesize', 'drivetype', 'type', 'vin', 'transmission', 'images'],
            })

            res.status(200).json({ success: true, listings });
        } catch (error) {
            console.error('Compare Listings Error:', error);
            res.status(500).json({ error: 'Technical error' });
        }
    }

    hero_listing_images = async (req, res) => {
        try {
            const listings = await db.CarListing.findAll({
                attributes: ['listingId', 'images'],
                limit: 20,
            })

            const listing_images = listings.map((listing) => ({
                listingId: listing.listingId,
                first_image: Array.isArray(listing.images)
                    ? listing.images[0]
                    : listing.images.split(',')[0],
            }))

            responseReturn(res, 200, {
                success: true,
                hero_images: listing_images,
            })

        } catch (error) {
            console.log(error.message)
            responseReturn(res, 500, { error: 'Technical error' })
        }
    }

    get_filters = async (req, res) => {
        try {
            const conditions = await db.CarListing.findAll({
                attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("condition")), "condition"]],
                raw: true,
            });

            const makes = await db.CarListing.findAll({
                attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("make")), "make"]],
                raw: true,
            });

            const models = await db.CarListing.findAll({
                attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("model")), "model"]],
                raw: true,
            });

            const types = await db.CarListing.findAll({
                attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("type")), "type"]],
                raw: true,
            });

            const years = await db.CarListing.findAll({
                attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("year")), "year"]],
                raw: true,
            });

            const transmissions = await db.CarListing.findAll({
                attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("transmission")), "transmission"]],
                raw: true,
            });

            const fuels = await db.CarListing.findAll({
                attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("fuelType")), "fuelType"]],
                raw: true,
            });

            const mileages = await db.CarListing.findAll({
                attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("mileage")), "mileage"]],
                raw: true,
            });

            const engines = await db.CarListing.findAll({
                attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("engineSize")), "engineSize"]],
                raw: true,
            });

            const cylinders = await db.CarListing.findAll({
                attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("cylinders")), "cylinders"]],
                raw: true,
            });

            res.status(200).json({
                conditions: conditions.map(c => c.condition),
                makes: makes.map(m => m.make),
                models: models.map(m => m.model),
                types: types.map(t => t.type),
                years: years.map(y => y.year),
                transmissions: transmissions.map(t => t.transmission),
                fuels: fuels.map(f => f.fuelType),
                mileages: mileages.map(m => m.mileage),
                engines: engines.map(e => e.engineSize),
                cylinders: cylinders.map(c => c.cylinders),
            });
        } catch (error) {
            console.error("Error fetching filter options:", error);
            res.status(500).json({ error: "Error fetching filter options" });
        }
    };

    filter_listings = async (req, res) => {
        const perPage = 12;
        req.query.perPage = perPage;

        try {
            const queryHandler = new QueryListings(req.query)
                .searchQuery()
                .conditionQuery()
                .priceQuery()
                .ratingQuery();

            const listings = await queryHandler.sortByPrice().skip().limit().getListings();

            const totalFilteredListings = await queryHandler.countListings();

            const totalNewListings = await new QueryListings({ ...req.query, condition: 'new' }).conditionQuery().countListings();
            const totalForeignUsedListings = await new QueryListings({ ...req.query, condition: 'foreignused' }).conditionQuery().countListings();
            const totalLocalUsedListings = await new QueryListings({ ...req.query, condition: 'localused' }).conditionQuery().countListings();

            responseReturn(res, 200, {
                listings,
                totalFilteredListings,
                totalNewListings,
                totalForeignUsedListings,
                totalLocalUsedListings,
                perPage,
            });

        } catch (error) {
            console.error(error.message);
            responseReturn(res, 500, { error: 'Technical error' });
        }
    }

    add_favorite = async (req, res) => {
        const { slug, customerId } = req.body;

        try {
            const existingListing = await db.Favorite.findOne({
                where: { slug, customerId }
            })
            if (existingListing) {
                await Favorite.destroy({ where: { slug, customerId } });
                responseReturn(res, 200, { message: 'removed from favorites' });
            } else {
                const newFavoriteItem = await db.Favorite.create(req.body);
                responseReturn(res, 201, {
                    message: 'added successfully',
                    favoriteItem: newFavoriteItem,
                })
            }
        } catch (error) {
            // console.log(error.message);
            responseReturn(res, 500, { error: 'Technical error' })
        }
    }

    get_favorites = async (req, res) => {
        const { customerId } = req.params

        try {
            const favorites = await db.Favorite.findAll({
                where: { customerId }
            })

            responseReturn(res, 200, {
                favorite_count: favorites.length,
                favorites,
            })

        } catch (error) {
            // console.log(error.message);
            responseReturn(res, 500, { error: 'Technical error' })
        }
    }

    newsletter_subscription = async (req, res) => {
        const { email } = req.body;
        // const ipAddress = req.ip;
        const ipAddress = req.ip;

        try {
            const [subscriber, created] = await db.Subscribers.findOrCreate({
                where: { email },
                defaults: { ipAddress }
            });

            if (!created) {
                return res.status(409).json({ message: 'Email is already subscribed.' });
            }

            res.status(201).json({ message: 'Successfully subscribed!', subscriber });
        } catch (err) {
            console.log(err.message)
            res.status(500).json({ message: 'Internal server error', error: err.message });
        }
    }

    get_all_FAQs = async (req, res) => {
        try {
            const faqs = await db.FAQ.findAll({ order: [['createdAt', 'DESC']] });
            res.json(faqs);
        } catch (err) {
            res.status(500).json({ error: "Failed to fetch FAQs", details: err.message });
        }
    }

    get_categorys = async (req, res) => {
        try {
            const categorys = await db.Category.findAll({})
            responseReturn(res, 200, { categorys })
        } catch (error) {
            console.log(error.message)
        }
    }

    formattedProducts = (products) => {
        const productArray = [];
        for (let i = 0; i < products.length; i += 3) {
            productArray.push(products.slice(i, i + 3));
        }
        return productArray;
    }

    price_range_products = async (req, res) => {
        try {
            const products = await db.Product.findAll({
                order: [['createdAt', 'DESC']],
                limit: 9,
            })

            const minPrice = await db.Product.min('price')
            const maxPrice = await db.Product.max('price')

            const priceRange = {
                low: minPrice || 0,
                high: maxPrice || 0,
            }

            const latest_products = this.formattedProducts(products)

            const getForPrice = await db.Product.findAll({
                order: [['price', 'ASC']]
            })

            if (getForPrice.length > 0) {
                priceRange.high = getForPrice[getForPrice.length - 1].price
                priceRange.low = getForPrice[0].price
            }

            responseReturn(res, 200, { latest_products, priceRange })
        } catch (error) {
            console.log(error.message)
            responseReturn(res, 500, { error: 'Technical error' })
        }
    }

    query_products = async (req, res) => {
        const perPage = 30;
        req.query.perPage = perPage;

        try {
            const queryHandler = new QueryProducts(req.query)
                .categoryQuery()
                .searchQuery()
                .priceQuery()
                .ratingQuery()
                .sortByPrice()
                .paginate();

            const { products, totalProducts } = await queryHandler.getProducts();

            responseReturn(res, 200, {
                products,
                totalProducts,
                perPage,
            });

        } catch (error) {
            console.error(error.message);
            responseReturn(res, 500, { error: 'Technical error' });
        }
    }

    get_product = async (req, res) => {
        const { slug } = req.params;

        try {
            const product = await db.Product.findOne({
                where: { slug },
                include: [
                    {
                        model: db.Seller,
                        attributes: ['sellerId', 'Image', 'name', 'email', 'slug', 'accountType', 'shopInfo', 'createdAt'],
                    }
                ]
            });

            if (!product) {
                return responseReturn(res, 404, { message: 'Product not found' });
            }

            // Fetch related products (same category, different ID)
            const relatedProducts = await db.Product.findAll({
                where: {
                    productId: { [Op.ne]: product.productId },
                    category: product.category
                },
                limit: 20
            });

            responseReturn(res, 200, {
                product,
                relatedProducts,
            });

        } catch (error) {
            console.error('Error fetching product:', error.message);
            responseReturn(res, 500, { message: 'Server Error' });
        }
    }

    get_seller_product_ads = async (req, res) => {
        const { slug } = req.params;

        try {
            const seller = await db.Seller.findOne({
                where: { slug },
                attributes: ['sellerId', 'Image', 'name', 'slug', 'sellerType', 'email', 'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'createdAt', 'shopInfo']
            });

            if (!seller) {
                return responseReturn(res, 404, { message: 'Seller not found' });
            }

            const products = await db.Product.findAll({
                where: { sellerId: seller.sellerId },
                order: [['createdAt', 'DESC']]
            });

            return responseReturn(res, 200, {
                seller,
                products,
            });

        } catch (error) {
            console.error('Error fetching seller products:', error.message);
            return responseReturn(res, 500, { message: 'Server Error' });
        }
    }

    submit_review = async (req, res) => {
        const { name, rating, review, productId } = req.body;

        try {
            // Create review
            await db.Reviews.create({
                productId,
                name,
                rating,
                review,
                date: moment(Date.now()).format("LL"),
            });

            // Fetch all reviews for this product
            const reviews = await db.Reviews.findAll({ where: { productId } });

            // Calculate average rating
            const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
            const productRating =
                reviews.length !== 0 ? (totalRatings / reviews.length).toFixed(1) : 0;

            // Update product rating
            await db.Product.update(
                { rating: productRating },
                { where: { productId: productId } }
            );

            responseReturn(res, 201, {
                message: "Review Successful",
            });
        } catch (error) {
            console.error(error);
            responseReturn(res, 500, {
                message: "Something went wrong",
                error: error.message,
            });
        }
    }

    get_reviews = async (req, res) => {
        const { productId } = req.params;
        let { pageNo } = req.query;

        pageNo = parseInt(pageNo) || 1;
        const limit = 5;
        const offset = limit * (pageNo - 1);

        try {
            // 1️⃣ Group ratings and count how many for each
            const getRating = await db.Reviews.findAll({
                attributes: [
                    "rating",
                    [db.Reviews.sequelize.fn("COUNT", db.Reviews.sequelize.col("rating")), "count"],
                ],
                where: { productId },
                group: ["rating"],
            });

            // 2️⃣ Build rating_review array (5 → 1)
            const rating_review = [5, 4, 3, 2, 1].map((r) => {
                const found = getRating.find((g) => g.rating === r);
                return {
                    rating: r,
                    sum: found ? parseInt(found.get("count")) : 0,
                };
            });

            // 3️⃣ Total number of reviews
            const totalReview = await db.Reviews.count({ where: { productId } });

            // 4️⃣ Paginated reviews (newest first)
            const reviews = await db.Reviews.findAll({
                where: { productId },
                limit,
                offset,
                order: [["createdAt", "DESC"]],
            });

            responseReturn(res, 200, {
                reviews,
                totalReview,
                rating_review,
            });
        } catch (error) {
            console.error(error);
            responseReturn(res, 500, {
                message: "Something went wrong",
                error: error.message,
            });
        }
    }

    create_contact_query = async (req, res) => {
        try {
            const { name, email, phone, message, privacyPolicyAccepted } = req.body;

            if (!privacyPolicyAccepted) {
                return res.status(400).json({ error: "Privacy policy must be accepted." });
            }

            const contact = await db.Contact.create({
                name,
                email,
                phone,
                message,
                privacyPolicyAccepted,
            });

            res.status(201).json({ message: "Query saved successfully", contact });
        } catch (error) {
            console.error("Error saving contact:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    get_all_dealers = async (req, res) => {
        try {
            // Fetch all sellers
            const sellers = await db.Seller.findAll({
                where: { status: "active" },
                attributes: ["sellerId", "slug", "sellerType", "views", "shopInfo", "logo"],
            });

            // Map and add car counts
            const sellersWithCars = await Promise.all(
                sellers.map(async (seller) => {
                    const [carCount, productCount] = await Promise.all([
                        db.CarListing.count({ where: { sellerId: seller.sellerId } }),
                        db.Product.count({ where: { sellerId: seller.sellerId } }),
                    ]);

                    return {
                        id: seller.sellerId,
                        slug: seller.slug,
                        seltype: seller.sellerType,
                        views: seller.views || 0,
                        cars: carCount,
                        products: productCount,
                        shopInfo: seller.shopInfo || [],
                        logo:
                            seller.logo ||
                            `https://via.placeholder.com/100x50?text=${encodeURIComponent(
                                seller.slug || "No+Name"
                            )}`,
                    };
                })
            );

            return responseReturn(res, 200, sellersWithCars);
        } catch (error) {
            console.error("getAllSellersWithCars error:", error);
            return responseReturn(res, 500, { error: "Internal server error" });
        }
    };

}

export default new homeController();