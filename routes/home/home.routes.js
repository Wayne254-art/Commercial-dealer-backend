import { Router } from 'express'
import homeController from '../../controllers/home/home.controller.js'

const router = Router()

router.get('/home/get-listings', homeController.get_listings)
router.get('/home/get-listing-details/:slug', homeController.get_listing_details)
router.get('/home/get-all-listing-by-seller/:slug', homeController.get_all_listings_by_seller)
router.get('/home/query-listings', homeController.query_listings)
router.get('/home/price-range-latest-listing', homeController.price_range_listing)
router.post('/home/compare', homeController.compare_listings)
router.get('/home/hero-listing-images', homeController.hero_listing_images)
router.get("/home/get-filters", homeController.get_filters);
router.get('/filter-listings', homeController.filter_listings);
// router.get('/listing', homeController.hero_listing_filter)
router.post('/add-to-favorite', homeController.add_favorite)
router.get('/get-favorite-listing/:customerId', homeController.get_favorites)
router.post('/newsletter/subscribe', homeController.newsletter_subscription)
router.get("/home/get-all-faqs", homeController.get_all_FAQs);

router.get('/home/get-all-categorys', homeController.get_categorys)
router.get('/home/query-products', homeController.query_products)
router.get('/home/price-range-latest-products', homeController.price_range_products)
router.get('/home/get-product/:slug', homeController.get_product)
router.get('/home/:slug/products', homeController.get_seller_product_ads);

router.post('/home/customer/submit-review', homeController.submit_review)
router.get('/home/customer/get-reviews/:productId', homeController.get_reviews)
router.post("/home/customer/contact", homeController.create_contact_query)
router.get("/home/all-dealers", homeController.get_all_dealers)

export default router