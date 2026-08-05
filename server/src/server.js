import 'dotenv/config'
import express from 'express'
import http from 'http'
import cors from 'cors'
import { Server } from 'socket.io'
import apiRoutes from './routes/apiRoutes.js'
import { setupSockets } from './sockets/connection.js'

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'enclave' }))
app.use('/api', apiRoutes)

setupSockets(io)

const PORT = process.env.PORT || 4000
server.listen(PORT, () => console.log(`enclave server :${PORT}`))
