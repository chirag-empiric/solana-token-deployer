import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const mongoURI: string = process.env.MONGO_URI || ''

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(mongoURI)
    console.log(`Database connected with ${connection.connection.host}`)
  } catch (err: any) {
    console.log('in catch block')
    console.log('err', err.message)
    setTimeout(connectDB, 1000)
  }
}

export { connectDB }
