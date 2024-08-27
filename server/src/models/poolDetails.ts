import mongoose, { Document, Schema } from 'mongoose'

const poolDetailsSchema = new Schema({
  masterAccount: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const poolDetails = mongoose.model('PoolDetails', poolDetailsSchema)

export default poolDetails
