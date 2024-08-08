import mongoose, { Schema, Document } from 'mongoose'

interface IAmmDetails extends Document {
  name: string | null,
  symbol: string | null,
  price: number | null,
  tokenAddress: string | null,
  twitter: string | null,
  website: string | null,
  telegram: string | null,
  tokenUri: string | null,
  creator: string | null,
  ammId: string | null,
  baseTokenAddress: string | null,
  quoteTokenAddress: string | null,
  tickSize: number | null,
  lotAmount: number | null,
  marketId: string | null,
  lpMintAddress: string | null,
}

const ammDetailsSchema: Schema = new mongoose.Schema({
  name: {
    type: String,
  },
  symbol: {
    type: String,
  },
  price: {
    type: Number,
  },
  tokenAddress: {
    type: String,
  },
  twitter: {
    type: String,
  },
  website: {
    type: String,
  },
  telegram: {
    type: String,
  },
  tokenUri: {
    type: String,
  },
  creator: {
    type: String,
  },
  ammId: {
    type: String,
  },
  baseTokenAddress: {
    type: String,
  },
  quoteTokenAddress: {
    type: String,
  },
  tickSize: {
    type: Number,
  },
  lotAmount: {
    type: Number,
  },
  marketId: {
    type: String,
  },
  lpMintAddress: {
    type: String,
  },
})

const ammDetailsModel = mongoose.model<IAmmDetails>('ammDetails', ammDetailsSchema)
export default ammDetailsModel
