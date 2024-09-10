import mongoose, { Document, Schema, model } from 'mongoose'

interface IPoolDetails extends Document {
  poolAddress: string;
  poolId: number;
  baseTokenAccount: string;
  quoteTokenAccount: string;
  baseTokenAmount: mongoose.Types.Decimal128;
  quoteTokenAmount: mongoose.Types.Decimal128;
  poolConstant: mongoose.Types.Decimal128;
  createdAt: Date;
}

const poolDetailsSchema: Schema<IPoolDetails> = new Schema<IPoolDetails>({
  poolAddress: {
    type: String,
    required: true,
    trim: true,
  },
  poolId: {
    type: Number,
    required: true,
    min: 0,
  },
  baseTokenAccount: {
    type: String,
    required: true,
    trim: true,
  },
  quoteTokenAccount: {
    type: String,
    required: true,
    trim: true,
  },
  baseTokenAmount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
  quoteTokenAmount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
  poolConstant: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
  poolCreationTxHash: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
})

const PoolDetailsModel = model<IPoolDetails>('PoolDetails', poolDetailsSchema)

export default PoolDetailsModel
