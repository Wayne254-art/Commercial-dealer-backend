import jwt from 'jsonwebtoken'

export const createToken = (data) => {
    return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: '7d' });
}
