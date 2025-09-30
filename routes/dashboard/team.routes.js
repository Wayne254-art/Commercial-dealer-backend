import { Router } from 'express'
// import { authMiddleware } from '../../middlewares/auth.middleware.js'
import teamControllers from '../../controllers/dashboard/team.controller.js'

const router = Router()

router.get('/get-all-team-members', teamControllers.get_all_team_members);
router.get('/get-member/:memberId', teamControllers.get_team_member_by_memberId);
router.post('/create-team-member', teamControllers.create_team_member);
router.patch('/update/:memberId/member', teamControllers.update_team_member);
router.delete('/delete/:memberId/member', teamControllers.delete_team_member);

export default router