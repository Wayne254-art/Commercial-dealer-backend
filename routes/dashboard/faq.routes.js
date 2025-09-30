import { Router } from 'express'
import FAQControllers from '../../controllers/dashboard/faq.controller.js';
// import { authMiddleware } from '../../middlewares/auth.middleware.js'

const router = Router()

router.post("/create-faq", FAQControllers.create_FAQ);
router.get("/get-all-faqs", FAQControllers.get_all_FAQs);
router.get("/get-faq/:faqId", FAQControllers.get_FAQ_by_Id);
router.put("/update-faq/:faqId", FAQControllers.update_FAQ);
router.delete("/delete-faq/:faqId", FAQControllers.delete_FAQ);

export default router