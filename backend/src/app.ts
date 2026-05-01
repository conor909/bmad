import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { healthRouter } from './routes/health'
import { errorHandler } from './middleware/errorHandler'

export const app = express()

app.use(express.json())
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || false }))

app.use('/api', healthRouter)

app.use(errorHandler)
