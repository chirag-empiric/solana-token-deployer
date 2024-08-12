import { Schema, Document } from 'mongoose'
import mongoose from 'mongoose'

interface ISwapDetails {
  ammId: string,
  swappedToken: string,
  swappedAmount: number,
  hash: string,
}

const swapDetailsSchema: Schema = new mongoose.Schema({
  ammId: { type: String },
  swappedToken: { type: String },
  swappedAmount: { type: Number },
  hash: { type: String },
})

const swapDetailsModel = mongoose.model<ISwapDetails>('swapDetails', swapDetailsSchema)
export default swapDetailsModel