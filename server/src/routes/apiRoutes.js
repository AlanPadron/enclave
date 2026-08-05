import { Router } from 'express'
import * as Auth from '../controllers/authController.js'
import { authRequired } from '../middlewares/authMiddleware.js'
import * as Users from '../models/User.js'
import { listChannels, listMessages } from '../models/Message.js'

const router = Router()

router.post('/auth/register', Auth.register)
router.post('/auth/login', Auth.login)

router.get('/me', authRequired, (req, res) => {
  res.json({ user: Users.publicProfile(req.user) })
})

router.get('/channels', authRequired, (_req, res) => {
  res.json({ channels: listChannels() })
})

router.get('/channels/:id/messages', authRequired, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200)
  res.json({ messages: listMessages(req.params.id, limit) })
})

router.get('/friends', authRequired, (req, res) => {
  const me = req.user
  res.json({
    friends: Users.findManyByIds(me.friends).map(Users.publicProfile),
    incoming: Users.findManyByIds(me.incoming).map(Users.publicProfile),
    outgoing: Users.findManyByIds(me.outgoing).map(Users.publicProfile),
  })
})

router.post('/friends/request', authRequired, (req, res) => {
  const { username } = req.body || {}
  const target = Users.findByUsername(username || '')
  if (!target) return res.status(404).json({ error: 'user not found' })
  if (target.id === req.user.id) return res.status(400).json({ error: 'self' })
  const result = Users.sendRequest(req.user.id, target.id)
  res.json({ result })
})

router.post('/friends/accept', authRequired, (req, res) => {
  const { userId } = req.body || {}
  const result = Users.acceptRequest(req.user.id, userId)
  res.json({ result })
})

router.post('/friends/reject', authRequired, (req, res) => {
  const { userId } = req.body || {}
  const result = Users.rejectRequest(req.user.id, userId)
  res.json({ result })
})

export default router
