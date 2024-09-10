import dotenv from 'dotenv'
import express, { Application } from 'express'
import bodyParser from 'body-parser'
import metadataRoutes from './src/routes/fileupload.routes'
import createMarketsRoutes from './src/routes/pool.routes'
import dexRoutes from './src/routes/dex.routes'
import { connectDb } from './src/utils/connectDb'

dotenv.config()

const app: Application = express()
const PORT: number = parseInt(process.env.PORT as string, 10) || 9090

// Middlewares
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Routes
app.use('/pool/v1', createMarketsRoutes)
app.use('/api/v1', metadataRoutes)
app.use('/dex/v1', dexRoutes)

app.listen(PORT, async () => {
  try {
    console.log(`Server is running on port ${PORT}`)
    await connectDb()
  } catch (err: any) {
    console.error('Failed to connect to the database:', err)
    process.exit(1)
  }
})