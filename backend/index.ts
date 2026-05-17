import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import connectDB from './src/config/db'
import authRoutes from './src/routes/authRoutes'
import leadsRoutes from './src/routes/leadsRoutes'
import { notFound, globalErrorHandler } from './src/middleware/errorMiddleware'

// ─── Connect to MongoDB ───────────────────────────────────────────────────────

connectDB()

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express()

// Security headers
app.use(helmet())

// CORS — in development allow all origins; in production restrict to allow-list
const isDev = process.env.NODE_ENV !== 'production'

const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())

app.use(
  cors({
    origin: (origin, callback) => {
      // Always allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true)
      // In development, allow any origin
      if (isDev) return callback(null, true)
      // In production, restrict to the configured allow-list
      if (allowedOrigins.includes(origin)) return callback(null, true)
      callback(new Error(`CORS: origin ${origin} not allowed`))
    },
    credentials: true,
  })
)

// Request logging (compact in production, colorised in development)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Body parsers
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Smart Leads API is running', timestamp: new Date().toISOString() })
})

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes)
app.use('/api/leads', leadsRoutes)

// ─── Error Handling ───────────────────────────────────────────────────────────

app.use(notFound)
app.use(globalErrorHandler)

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '5000', 10)

app.listen(PORT, () => {
  console.log(`🚀  Server running in ${process.env.NODE_ENV ?? 'development'} mode on port ${PORT}`)
})

export default app
