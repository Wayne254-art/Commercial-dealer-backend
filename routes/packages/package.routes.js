import { Router } from 'express'
import packageController from '../../controllers/packages/package.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router()

router.post('/package/add-package', packageController.add_package);
router.get('/package/get-seller-packages', authMiddleware, packageController.get_seller_packages);
router.get('/package/get-admin-packages', authMiddleware, packageController.get_admin_packages);
router.delete('/package/:packageId/delete', packageController.delete_package);
router.put('/package/:packageId/update', packageController.update_package);
router.patch('/package/:packageId/recommend', packageController.update_package_recommendation);
router.post('/package/verify-payment', packageController.verify_package_payment);
router.get("/active-package-subscriptions",  packageController.get_active_subscriptions);
router.get("/expired-package-subscriptions",  packageController.get_expired_subscriptions);
router.get("/package-details/:sellerId", authMiddleware, packageController.get_seller_active_package);
router.get("/package-transactions/:sellerId", authMiddleware, packageController.get_seller_transactions);
router.get("/all-transactions", authMiddleware, packageController.get_all_transactions);
router.post('/package/send-reminder', packageController.send_reminder_email);
router.post('/package/send-invoice', packageController.send_invoice_email);

export default router