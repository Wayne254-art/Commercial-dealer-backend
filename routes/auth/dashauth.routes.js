
import { Router } from 'express'
import dashauthController from '../../controllers/auth/dashauth.controller.js'
import { authMiddleware } from '../../middlewares/auth.middleware.js'

const router = Router()

router.post('/admin-login', dashauthController.admin_login)
router.post('/seller-login', dashauthController.seller_login)
router.post('/seller-register', dashauthController.seller_register)
router.get('/verify-email', dashauthController.verify_email)
router.post('/seller-forgot-password', dashauthController.request_password_reset)
router.post('/seller-verify-otp', dashauthController.verify_OTP)
router.post('/seller-reset-password', dashauthController.reset_password)
router.get('/get-user', authMiddleware, dashauthController.get_user)
router.post('/upload-profile-image', authMiddleware, dashauthController.upload_profile_image)
router.post('/upload-logo-image', authMiddleware, dashauthController.upload_logo_image)
router.post('/add-profile-info', authMiddleware, dashauthController.add_profile_info)
router.post('/add-payment-info', authMiddleware, dashauthController.add_payment_info)
router.put('/update-social-links', authMiddleware, dashauthController.update_social_links)
router.get('/logout', authMiddleware, dashauthController.logout)

export default router
