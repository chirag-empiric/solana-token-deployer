import { Router } from 'express'
import {
  createMasterAccount,
  createPool,
  masterAccountDetails,
  getPoolDetails,
  swapTokens,
} from '../controllers/pool.controller'

const router = Router()

router.get('/master-account-details', masterAccountDetails)
router.post('/create-master-account', createMasterAccount)
router.post('/create-pool', createPool)
router.post('/get-pool-details', getPoolDetails)
router.post('/swap-spl-tokens', swapTokens)

export default router
