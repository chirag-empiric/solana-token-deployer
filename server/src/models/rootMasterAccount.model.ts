import mongoose, { Document, Schema } from 'mongoose'

const rootMasterAccountSchema = new Schema({
  masterAccount: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const rootMasterAccountModel = mongoose.model('RootMasterAccount', rootMasterAccountSchema)

export default rootMasterAccountModel
