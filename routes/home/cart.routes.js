import { Router } from 'express'
import cartController from '../../controllers/home/cart.controller.js'
// import { authMiddleware } from '../../middlewares/auth.middleware.js'

const router = Router()

router.post('/home/product/add-to-cart', cartController.add_to_cart)
router.get('/home/product/get-cart-product/:userId', cartController.get_cart_products)
router.get('/user/cart-wishlist-counts/:userId', cartController.get_cart_and_wishlist_counts);
router.delete('/home/product/delete-cart-product/:cart_id', cartController.delete_cart_product)
router.put('/home/product/quantity-inc/:cart_id', cartController.quantity_inc)
router.put('/home/product/quantity-dec/:cart_id', cartController.quantity_dec)

router.post('/home/product/add-to-wishlist', cartController.add_wishlist)
router.get('/home/product/get-wishlist-products/:userId', cartController.get_wishlist)
router.delete('/home/product/delete-wishlist-product/:wishlistId', cartController.delete_wishlist)

export default router