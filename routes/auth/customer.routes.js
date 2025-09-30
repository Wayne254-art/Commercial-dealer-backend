import { Router } from 'express'
import customerControllers from '../../controllers/auth/customer.controller.js'

const router = Router()

router.post('/customer/customer-register', customerControllers.customer_register)
router.post('/customer/customer-login', customerControllers.customer_login)
router.get('/customer/logout', customerControllers.customer_logout)
router.post("/customer/forgot-password", customerControllers.request_password_reset)
router.post("/customer/verify-otp", customerControllers.verify_OTP)
router.post("/customer/reset-password", customerControllers.reset_password)

export default router