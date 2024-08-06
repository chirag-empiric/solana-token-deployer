import dotenv from 'dotenv'
import express from 'express'
import bodyParser from 'body-parser'
import metadataRoutes from './src/routes/fileupload.routes.js'
import { connectDB } from './src/utils/connectDB'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/api', metadataRoutes)

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`)
  await connectDB()
})
