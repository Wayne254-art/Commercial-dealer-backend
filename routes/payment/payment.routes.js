import { Router } from 'express'
import paymentController from '../../controllers/payment/payment.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js'

const router = Router()

router.post('/add-banks', authMiddleware, paymentController.add_bank)
router.get('/get-all-banks', paymentController.get_all_banks);
router.post('/create-paystack-sub-account', authMiddleware, paymentController.create_paystack_subaccount)
router.get('/get-all-accounts', authMiddleware, paymentController.get_all_accounts);
router.put('/payment/activate-paystack-sub-account/:activeCode', authMiddleware, paymentController.activate_paystack_subaccount)


router.get('/payment/seller-payment-details/:sellerId', authMiddleware, paymentController.get_seller_payment_details)
router.get('/payment/request', authMiddleware, paymentController.get_payment_request)
router.get('/admin/payment-summary', authMiddleware, paymentController.get_admin_payment_summary);

router.post('/payment/request-confirm', authMiddleware, paymentController.payment_request_confirm)

router.post('/payment/withdrawal-request', authMiddleware, paymentController.withdrawal_request)

// router.get("/seller/:sellerId/payment-details", authMiddleware, paymentController.get_seller_bank_account_details);

export default router