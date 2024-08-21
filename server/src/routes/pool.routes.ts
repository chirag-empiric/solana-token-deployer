import { Router } from 'express'
import { createMasterAccount, createPool } from '../controllers/pool.controller'
import { createMarket } from '../createlp/marketCreation'
import { createAmmPool } from '../createlp/poolCreation'

const router = Router()

router.post('/create-master-account', createMasterAccount)
router.post('/pool2', createPool)
router.post('/market', createMarket)
router.post('/amm', createAmmPool)

export default router