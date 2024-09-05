import { Document, Schema, model } from 'mongoose'

interface IRootMasterAccount extends Document {
  masterAccount: string;
  createdAt: Date;
}

const rootMasterAccountSchema: Schema<IRootMasterAccount> = new Schema<IRootMasterAccount>({
  masterAccount: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
})
const RootMasterAccountModel = model<IRootMasterAccount>('RootMasterAccount', rootMasterAccountSchema)

export default RootMasterAccountModel
