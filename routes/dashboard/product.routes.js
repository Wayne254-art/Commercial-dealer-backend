import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware.js'
import productController from '../../controllers/dashboard/product.controller.js'

const router = Router()

// Seller Routes 
router.post('/add-product', authMiddleware, productController.add_seller_product)
// router.post('/boost-listing', authMiddleware, ListingControllers.verify_and_boost)
router.get('/get-products', authMiddleware, productController.get_seller_products)
router.get('/get-discounted-products', authMiddleware, productController.get_seller_discounted_products)
router.get('/get-product-details/:productId', authMiddleware, productController.get_seller_product_details)
router.post('/update-seller-product', authMiddleware, productController.update_seller_product)
router.put('/remove-product-image', authMiddleware, productController.remove_product_image)
router.post('/update-product-images', authMiddleware, productController.update_product_images)
router.delete('/delete-product/:productId', authMiddleware, productController.delete_product)

// // Customers
// router.post('/create-listing-lead', ListingControllers.create_lead)

router.get('/get-all-products', authMiddleware, productController.get_all_products)
router.post('/product-status-update',authMiddleware, productController.product_status_update)

export default router