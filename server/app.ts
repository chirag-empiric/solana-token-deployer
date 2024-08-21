import dotenv from 'dotenv'
import express from 'express'
import bodyParser from 'body-parser'
import metadataRoutes from './src/routes/fileupload.routes'
import createMarketsRoutes from './src/routes/pool.routes'
import dexRoutes from './src/routes/dex.routes'
import { connectDb } from './src/utils/connectDb'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

console.log(`hello2`)
console.log(`hello`)

app.use('/api', metadataRoutes)
app.use('/pool', createMarketsRoutes)
app.use('/dex', dexRoutes)

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`)
  await connectDb()
})
