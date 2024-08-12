import Router from 'express'
import { swapSplTokens } from '../controllers/swap.controller'

const router = Router()

router.post('/swap', swapSplTokens)

export default router