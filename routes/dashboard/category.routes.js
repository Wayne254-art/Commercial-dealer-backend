import { Router } from 'express'
import categoryController from '../../controllers/dashboard/categorys.controller.js';
// import { authMiddleware } from '../../middlewares/auth.middleware.js'

const router = Router()

router.get('/get-all-categorys', categoryController.get_all_categorys);
router.post('/create-category', categoryController.create_category);
router.delete('/delete-category/:categoryId', categoryController.delete_category);

router.post('/create-brand', categoryController.create_brand);
router.delete('/delete-brand/:brandId', categoryController.delete_brand);

export default router