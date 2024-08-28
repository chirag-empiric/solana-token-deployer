import { NextFunction, Request, Response } from 'express'
import { PROGRAM_ID, wallet } from '../config/getPoolPrograms'
import { connection } from '../config/getPoolPrograms'
import { poolProgram } from '../config/getPoolPrograms'
import {AnchorProvider, BN, Program, web3} from "@project-serum/anchor"
import { Keypair, PublicKey } from '@solana/web3.js'
import { connectDb } from '../utils/connectDb'
import { getUserBalance } from '../utils/getBalance'
import rootMasterAccountModel from '../models/rootMasterAccount.model'
import poolDetailsModel from '../models/poolDetails.model'
import mongoose from 'mongoose'

const MASTER_ACCOUNT_SEED = 'master'
const POOL_SEED = 'pool'
const SWAP_SEED = 'swapping'

export const confirmTx = async (txHash: any) => {
  const blockhashInfo = await connection.getLatestBlockhash()
  console.log(`blockHashInfo`, blockhashInfo)

  console.log(`here`)
  await connection.confirmTransaction({
    blockhash: await blockhashInfo.blockhash,
    lastValidBlockHeight: await blockhashInfo.lastValidBlockHeight,
    signature: txHash,
  })
  console.log(`here2`)
}

export const getPoolAddress = async () => {
  try {
    // console.log(`currentId is ${id}`);
    // const newId = id.add(new BN(1));
    // const idBuffer = newId.toArrayLike(Buffer, 'le', 8); // u64 is 8 bytes

    // Derive the program address
    const [poolAddress] = await PublicKey.findProgramAddressSync(
      [Buffer.from(POOL_SEED)],
      PROGRAM_ID
    );

    return poolAddress;
  } catch (err: any) {
    console.error('Error:', err);
  }
};


export const getMasterAccountInfos = async (masterAccountAddress: Keypair) => {
  try {
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
      success: false,
      error: err,
    })
  }
}

export const poolDetails = async (poolAccountAddress: String): Promise<any> => {
  try {
    // const poolId
    const poolAccountAddress = await getPoolAddress(1)
    console.log(`Accounts are`, poolProgram)
    console.log(`Accounts are here----------------------`, poolProgram.account)
    const poolDetails = await poolProgram.account.poolDetails.fetch(new PublicKey(poolAccountAddress))
    res.status(200).json({
      success: true,
      message: 'Pool Details',
      data: poolDetails,
    })
  } catch (err: any) {
    console.error(`Error`, err)
    res.status(400).json({
      success: false,
      error: err,
    })
  }
}

// TODO CreateMasterAccount
export const createMasterAccount = async (req: Request, res: Response, next: NextFunction): Promise<number | any> => {
  console.log(`------------ Creating the master account..... -----------------`)
  try {
    const rootMasterAddress = req.body.masterAddress;
    console.log('User Balance before master account creation')
    await getUserBalance()
    const randomAccount = Keypair.generate()

    const masterAddress = await getMasterAddress()
    console.log(`MasterAddress is:`, masterAddress)

    const createMasterTxnHash = await poolProgram.methods.initMasterAccount(
      rootMasterAddress
    ).accounts({
      master: masterAddress,
      payer: wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
    }).rpc()

    console.log(`Master Account Creation transaction`, createMasterTxnHash)
    const txStatus = await confirmTx(createMasterTxnHash)

    console.log(`txStatus`, txStatus)

    const poolDetails = new rootMasterAccountModel({
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
    // console.log(`quoteAccount ${req.body.quoteTokenAccount}`)
    // const masterAccountDetails = await poolProgram.account.master.fetch(masterAccountAddress)
    // console.log(`Master details are`, masterAccountDetails)
    // console.log(`masterAccountDetails currentId:`, masterAccountDetails?.currentId)
    // console.log(`masterAccountDetails are as:`, masterAccountDetails?.masterAddress)
    //
    // const currentId = await masterAccountDetails?.currentId
    //
    const poolAddress = await getPoolAddress()
    console.log(`pool address is`, poolAddress)

    // return

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

    const totalValue = baseTokenAmount * quoteTokenAmount;
    try {
      const newPoolDetails = new poolDetailsModel({
        poolId: poolAddress,
        baseTokenAccount: baseTokenAccount,
        quoteTokenAccount: quoteTokenAccount,
        baseTokenAmount: baseTokenAmount,
        quoteTokenAmount: quoteTokenAmount,
        totalValue: new mongoose.Types.Decimal128(totalValue.toString()), // Ensure correct type
      });
      await newPoolDetails.save();

    } catch(err: any) {
      console.error(`Error while storing the details to the db`, err)
    }
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
