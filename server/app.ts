import dotenv from 'dotenv'
import express from 'express'
import bodyParser from 'body-parser'
import fileRoutes from './src/routes/fileRoutes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/api', fileRoutes)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
