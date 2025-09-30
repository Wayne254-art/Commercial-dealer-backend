import { Router } from 'express'
// import { authMiddleware } from '../../middlewares/auth.middleware.js'
import blogControllers from '../../controllers/dashboard/blog.controller.js'

const router = Router()

router.get("/get-all-blogs", blogControllers.get_all_blogs);
router.post("/create-blog", blogControllers.create_blog);
router.get("/home/get-blog-details/:slug", blogControllers.get_blog_details);
router.put("/update/:blogId/blog", blogControllers.update_blog);
router.delete("/delete/:blogId/blog", blogControllers.delete_blog);

export default router