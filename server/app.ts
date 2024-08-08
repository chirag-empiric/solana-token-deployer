import dotenv from 'dotenv'
import express from 'express'
import bodyParser from 'body-parser'
import metadataRoutes from './src/routes/fileupload.routes'
import createMarkets from './src/routes/pool.routes'
import { connectDB } from './src/utils/connectDB'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/api', metadataRoutes)
app.use('/create', createMarkets)

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`)

  await connectDB()
})
