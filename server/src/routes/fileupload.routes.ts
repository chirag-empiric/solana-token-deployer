import { Router } from 'express'
import { uploadFile } from '../controllers/fileupload.controller'
import { fileUpload } from '../middlewares/multer'

const router = Router()

router.post('/create-metadata', fileUpload.single('image'), uploadFile)

export default router