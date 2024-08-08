import { Router } from 'express'
import { createPool } from '../controllers/pool.controller'
import { createMarket } from '../createlp/marketCreation'
import { createAmmPool } from '../createlp/poolCreation'

const router = Router()

router.post('/pool', createPool)
router.post('/market', createMarket)
router.post('/amm', createAmmPool)

export default router