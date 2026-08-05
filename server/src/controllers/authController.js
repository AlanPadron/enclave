import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import * as Users from '../models/User.js'

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

function sign(user) {
  return jwt.sign({ sub: user.id, username: user.username }, SECRET, { expiresIn: '7d' })
}

const USERNAME_RE = /^[A-Za-z0-9_.-]{3,24}$/

function validUsername(s) {
  return typeof s === 'string' && USERNAME_RE.test(s)
}

function validPassword(s) {
  return typeof s === 'string' && s.length >= 6 && s.length <= 128 && !/\s/.test(s)
}

export async function register(req, res) {
  const username = (req.body?.username ?? '').trim()
  const password = req.body?.password ?? ''
  if (!validUsername(username)) {
    return res.status(400).json({ error: 'username inválido (3-24 chars, letras/números/._-)' })
  }
  if (!validPassword(password)) {
    return res.status(400).json({ error: 'password inválido (6-128 chars, sin espacios)' })
  }
  if (Users.findByUsername(username)) return res.status(409).json({ error: 'username taken' })
  const passwordHash = await bcrypt.hash(password, 10)
  const user = Users.create({ username, passwordHash })
  return res.json({ token: sign(user), user: Users.publicProfile(user) })
}

export async function login(req, res) {
  const username = (req.body?.username ?? '').trim()
  const password = req.body?.password ?? ''
  if (!username || !password) {
    return res.status(400).json({ error: 'username y password requeridos' })
  }
  const user = Users.findByUsername(username)
  if (!user) return res.status(401).json({ error: 'invalid credentials' })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'invalid credentials' })
  return res.json({ token: sign(user), user: Users.publicProfile(user) })
}
