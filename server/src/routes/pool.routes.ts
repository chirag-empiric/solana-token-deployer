
import { Router } from 'express'
import { createPool } from '../controllers/pool.controller'

const router = Router()

router.post('/create-pool', createPool)

export default router