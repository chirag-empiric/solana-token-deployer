import { NextFunction, Request, Response } from 'express'
import { PROGRAM_ID, wallet } from '../config/getPoolPrograms'
import { connection } from '../config/getPoolPrograms'
import { poolProgram } from '../config/getPoolPrograms'
import { Keypair } from '@solana/web3.js'
import { web3 } from '@project-serum/anchor'
import { connectDb } from '../utils/connectDb'
import { getUserBalance } from '../utils/getBalance'

export const getMasterAccountInfos = async (masterAccountAddress: Keypair) => {
  try {
    const getMasterAccountInfo = await poolProgram.account.master.fetch(masterAccountAddress.publicKey)
    console.log(`Master Account Information:`, getMasterAccountInfo)
  } catch (err: any) {
    console.error(`Error`, err)
  }
}

export const createMasterAccount = async (req: Request, res: Response, next: NextFunction): Promise<number | any> => {
  try {
    console.log(`program interface is:`, poolProgram)
    console.log(`ProgramId is:`, PROGRAM_ID)
    console.log('User Balance before master account creation')
    await getUserBalance()
    const randomAccount = Keypair.generate()
    const createMaster = await poolProgram.rpc.initMasterAccount({
      accounts: {
        master: randomAccount.publicKey,
        payer: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      },
      signers: [wallet.payer],
    })
    console.log(`Master Account Creation transaction`, createMaster)
    console.log(`Master account is: ${randomAccount.publicKey}`)
    console.log('User Balance after master account creation')
    await getUserBalance()
    await getMasterAccountInfos(randomAccount)
    res.status(200).json({
      success: true,
      message: 'Master account created',
    })
  } catch (err: any) {
    console.error(`Error`, err)
    res.status(400).json({
      success: false,
      error: err,
    })
    return err
  }

}

export const createPool = async (req: Request, res: Response): Promise<void> => {
  try {
    // some code thing
    res.status(200).json({
      success: true,
      message: 'LP Created successfully',
    })
  } catch (err) {
    console.error('Error uploading file:', err)
    res.status(500).json({ message: (err as Error).message })
  }
}