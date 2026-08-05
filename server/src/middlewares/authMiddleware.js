import jwt from 'jsonwebtoken'
import * as Users from '../models/User.js'

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'no token' })
  try {
    const payload = jwt.verify(token, SECRET)
    const user = Users.findById(payload.sub)
    if (!user) return res.status(401).json({ error: 'invalid user' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'bad token' })
  }
}
