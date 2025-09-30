import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware.js'
import sellerController from '../../controllers/dashboard/seller.controller.js'

const router = Router()

router.get('/get-seller-request', authMiddleware, sellerController.get_seller_request)

router.get('/get-sellers', authMiddleware, sellerController.get_sellers)

router.get('/get-seller/:sellerId', authMiddleware, sellerController.get_seller)
router.get('/home/get-seller/:sellerId', sellerController.get_seller)
router.post('/seller-status-update', authMiddleware, sellerController.seller_status_update)

export default router