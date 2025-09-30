import jwt from 'jsonwebtoken';

export const authMiddleware = async (req, res, next) => {
    const { accessToken } = req.cookies
    if (!accessToken) {
        return res.status(409).json({ error: 'Please Login first' })
    } else {
        try {
            const deCodeToken = await jwt.verify(accessToken, process.env.JWT_SECRET)
            // console.log("Decoded Token:", deCodeToken)
            req.role = deCodeToken.role
            req.id = deCodeToken.id
            next()
        } catch (error) {
            return res.status(503).json({ error: 'Invalid or Expired token' })
        }
    }
}
