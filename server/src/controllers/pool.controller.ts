import { NextFunction, Request, Response } from 'express'
import { PROGRAM_ID, wallet } from '../config/getPoolPrograms'
import { connection } from '../config/getPoolPrograms'
import { poolProgram } from '../config/getPoolPrograms'
import {AnchorProvider, BN, Program, web3} from "@project-serum/anchor"
import { Keypair, PublicKey } from '@solana/web3.js'
import { connectDb } from '../utils/connectDb'
import { getUserBalance } from '../utils/getBalance'
import poolDetailsModel from '../models/poolDetails'

const MASTER_ACCOUNT_SEED = 'master'
const POOL_SEED = 'pool'
const SWAP_SEED = 'swapping'

export const confirmTx = async (txHash: any) => {
  const blockhashInfo = await connection.getLatestBlockhash()
  console.log(`blockHashInfo`, blockhashInfo)

  // return
  // const signature = connection.sendRawTransaction(txHash.serialize())

  console.log(`here`)
  await connection.confirmTransaction({
    blockhash: await blockhashInfo.blockhash,
    lastValidBlockHeight: await blockhashInfo.lastValidBlockHeight,
    signature: txHash,
  })
  console.log(`here2`)
}

export const getPoolAddress = async (id: number): Promise<any> => {
  try {
    return (
      await PublicKey.findProgramAddressSync(
        [Buffer.from(POOL_SEED), new BN(id).toArrayLike(Buffer, "le", id)],
        PROGRAM_ID
      )
    )[0];
  } catch (err: any) {
    console.error(`Error`, err)
  }
}

export const getMasterAccountInfos = async (masterAccountAddress: Keypair) => {
  try {
    console.log(`------------ Creating the master account..... -----------------`)
    const getMasterAccountInfo = await poolProgram.account.master.fetch(masterAccountAddress.publicKey)
    console.log(`Master Account Information:`, getMasterAccountInfo)
  } catch (err: any) {
    console.error(`Error`, err)
  }
}

const getMasterAddress = async (): Promise<PublicKey> => {
  console.log(`MASTER_SEED is here`, PROGRAM_ID)
  return (
    await PublicKey.findProgramAddressSync([Buffer.from(MASTER_ACCOUNT_SEED)], PROGRAM_ID)
  )[0]
}

export const masterAccountDetails = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const masterAccountAddress = req.body.masterAccountAddress
    const masterAccountInfo = await poolProgram.account.master.fetch(masterAccountAddress)
    console.log(`Master Account Details are`, masterAccountInfo)
    res.status(200).json({
      success: true,
      message: 'Master Account Details',
      data: masterAccountInfo,
    })
  } catch (err: any) {
    console.error(`Error`, err)
    res.status(400).json({
      sucess: false,
      error: err,
    })
  }
}

// TODO CreateMasterAccount
export const createMasterAccount = async (req: Request, res: Response, next: NextFunction): Promise<number | any> => {
  try {
    console.log('User Balance before master account creation')
    await getUserBalance()
    const randomAccount = Keypair.generate()

    const masterAddress = await getMasterAddress()
    console.log(`MasterAddress is:`, masterAddress)

    const createMasterTXnHash = await poolProgram.methods.initMasterAccount().accounts({
      master: masterAddress,
      payer: wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
    }).signers([wallet.payer]).rpc()

    console.log(`Master Account Creation transaction`, createMasterTXnHash)
    const txStatus = await confirmTx(createMasterTXnHash)

    console.log(`txStatus`, txStatus)

    const poolDetails = new poolDetailsModel({
      masterAccount: randomAccount.publicKey,
    })
    console.log(`Master account is: ${randomAccount.publicKey}`)
    console.log('User Balance after master account creation')
    await getUserBalance()
    await getMasterAccountInfos(randomAccount)

    try {
      const savedDetails = await poolDetails.save()
      console.log(`Master account is stored to the db`, savedDetails)
    } catch (err: any) {
      console.log(`Error storing the master account`, err)
    }

    res.status(200).json({
      success: true,
      message: 'Master account created',
      masterAccountAddress: randomAccount.publicKey
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
    console.log(`------------ Creating the POOL..... ------------------`)
    let { baseTokenAccount, quoteTokenAccount, baseTokenAmount, quoteTokenAmount } = req.body
    const masterAccountAddress = await getMasterAddress();
    console.log(`quoteAccount ${req.body.quoteTokenAccount}`)
    const masterAccountDetails = await poolProgram.account.master.fetch(masterAccountAddress)
    console.log(`masterAccountDetails are as:`, masterAccountDetails?.currentId)
    const currentId = Number(masterAccountDetails?.currentId)
    console.log(`currentId is:`, currentId)

    // const quoteAccount = new PublicKey(quoteTokenAccount)

    const poolAddress = await getPoolAddress(currentId +1)
    console.log(`current PoolAddress is`, poolAddress)

    const createPoolAccountTxn = await poolProgram.methods.createPool(
      req.body.baseTokenAccount,
      req.body.quoteTokenAccount,
      req.body.baseTokenAmount,
      req.body.quoteTokenAmount,
    ).accounts({
      pool: poolAddress,
      signer: wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
      master: masterAccountAddress,
    }).signers([wallet.payer]).rpc()

    console.log(`Master Account Creation transaction`, createPoolAccountTxn)
    const txStatus = await confirmTx(createPoolAccountTxn)
    res.status(200).json({
      success: true,
      message: 'LP Created successfully',
      data: txStatus,
    })
  } catch (err: any) {
    console.error('Error uploading file:', err)
    res.status(400).json({
      success: false,
      message: 'Something went wrong while creating the LP Account, check errorLogs for more details',
      error: err,
    })
  }
}
