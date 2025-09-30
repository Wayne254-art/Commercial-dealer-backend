import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware.js'
import ListingControllers from '../../controllers/dashboard/listing.controller.js'

const router = Router()

// Seller Routes 
router.post('/add-listing', authMiddleware, ListingControllers.add_seller_listing)
router.post('/boost-listing', authMiddleware, ListingControllers.verify_and_boost)
router.get('/get-listings', authMiddleware, ListingControllers.get_seller_listings)
router.get('/get-listing-details/:listingId', authMiddleware, ListingControllers.get_seller_listing_details)
router.post('/update-seller-listing', authMiddleware, ListingControllers.update_seller_listing)
router.post('/update-listing-image', authMiddleware, ListingControllers.update_listing_images)
router.delete('/delete-listing/:listingId', authMiddleware, ListingControllers.delete_listing)

// Customers
router.post('/create-listing-lead', ListingControllers.create_lead)

// Admin Routes 
router.get('/get-site-listings', authMiddleware, ListingControllers.get_all_listings)
router.get('/get-admin-listing-details/:listingId', authMiddleware, ListingControllers.get_admin_listing_details)
router.post('/update-admin-listing', authMiddleware, ListingControllers.update_admin_listing)
router.put("/:listingId/status", authMiddleware, ListingControllers.update_listing_status);

export default router