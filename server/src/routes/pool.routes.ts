import { Router } from 'express'
import {
  createMasterAccount,
  createPool,
  masterAccountDetails,
  poolDetails,
  swapSplTokens,
} from '../controllers/pool.controller'
import { createMarket } from '../createlp/marketCreation'
import { createAmmPool } from '../createlp/poolCreation'

const router = Router()


router.post('/create-master-account', createMasterAccount)
router.post('/create-pool', createPool)
router.post('/get-pool-details', poolDetails)
router.get('/master-account-details', masterAccountDetails)
router.post('/market', createMarket)
router.post('/amm', createAmmPool)
router.post('/swap-spl-tokens', swapSplTokens)

export default router