import mongoose, { Document, Schema } from 'mongoose'

const poolDetailsSchema = new Schema({
  poolId: {
    type: String
  },
  baseTokenAccount: {
    type: String,
  },
  quoteTokenAccount: {
    type: String,
  },
  baseTokenAmount: mongoose.Schema.Types.Decimal128, // Or another appropriate type
  quoteTokenAmount: mongoose.Schema.Types.Decimal128, // Or another appropriate type
  totalValue: mongoose.Schema.Types.Decimal128,
  createdAt: {
    type: Date,
    default: Date.now,
  }
})

const poolDetailsModel = mongoose.model('PoolDetails', poolDetailsSchema)

export default poolDetailsModel
