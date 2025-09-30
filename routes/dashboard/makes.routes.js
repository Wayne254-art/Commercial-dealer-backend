import { Router } from 'express'
import listingMakes from '../../controllers/dashboard/makes.controller.js'
// import { authMiddleware } from '../../middlewares/auth.middleware.js'

const router = Router()

router.get('/get-all-makes', listingMakes.get_all_makes);
router.post('/create-make', listingMakes.create_make);
router.delete('/delete-make/:makeId', listingMakes.delete_make);

router.post('/create-model', listingMakes.create_model);
router.delete('/delete-model/:modelId', listingMakes.delete_model);

export default router