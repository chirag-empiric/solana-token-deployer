import { Router } from 'express'
import { uploadFile } from '../controllers/fileController'
import { fileUpload } from '../middlewares/multer'

const router = Router()

router.post('/upload', fileUpload.single('image'), uploadFile)

export default router