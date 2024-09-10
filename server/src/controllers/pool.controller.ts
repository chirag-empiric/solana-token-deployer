import mongoose from 'mongoose'
import * as anchor from '@project-serum/anchor'
import { NextFunction, Request, Response } from 'express'
import { wallet } from '../config/getPoolPrograms'
import { poolProgram } from '../config/getPoolPrograms'
import { web3, BN } from '@project-serum/anchor'
import { PublicKey } from '@solana/web3.js'
import { getProgramAccounts } from '../utils/getSolanaAccounts'
import rootMasterAccountModel from '../models/rootMasterAccount.model'
import poolDetailsModel from '../models/poolDetails.model'
import { getAssociateAccount } from '../config/getAssociateAccount'
import { getUserBalance } from '../utils/getBalance'

const { TOKEN_PROGRAM_ID } = require('@solana/spl-token')

export const createMasterAccount = async (req: Request, res: Response, next: NextFunction) => {
  console.log('------------ Initiating Master Account Creation ------------')
  try {
    console.log(poolProgram.programId)
    const { rootMasterAddress } = req.body

    if (!rootMasterAddress) {
      return res.status(400).json({
        success: false,
        message: 'Root master address is required',
      })
    }
    const masterAddressFromSeed = await getProgramAccounts.getMasterAccount()
    console.log(`Master address derived: ${masterAddressFromSeed}`)

    const txHash = await poolProgram.methods.initMasterAccount(
      new PublicKey(req.body.rootMasterAddress),
    ).accounts({
      master: masterAddressFromSeed,
      payer: wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
    }).rpc()

    console.log(`Transaction hash: ${txHash}`)
    const txStatus = await getProgramAccounts.confirmTransactions(txHash)

    const poolDetails = new rootMasterAccountModel({ masterAccount: masterAddressFromSeed })
    try {
      const savedDetails = await poolDetails.save()
      console.log(`Master account is stored to the db`, savedDetails)
    } catch (err: any) {
      console.log(`Error while storing the master account in the db`, err)
    }

    res.status(200).json({
      success: true,
      message: 'Master account created successfully',
      transactionHash: txHash,
      masterAccountAddress: masterAddressFromSeed,
    })
  } catch (err: any) {
    console.error(`Error during master account creation: ${err}`)
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the master account',
      error: err,
    })
  }
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

export const createPool = async (req: Request, res: Response) => {
  console.log(`------------ Initiating pool creation ------------`)

  try {
    let { baseTokenAccount, quoteTokenAccount, baseTokenAmount, quoteTokenAmount } = req.body

    if (!baseTokenAccount || !quoteTokenAccount || !baseTokenAmount || !quoteTokenAccount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      })
    }

    const masterAccountAddress = await getProgramAccounts.getMasterAccount()
    const masterAccountDetails = await poolProgram.account.master.fetch(masterAccountAddress!)
    console.log(`Master account details fetched:`, typeof masterAccountDetails.currentPoolId)

    const currentPoolId = masterAccountDetails?.currentPoolId
    const poolAddress = await getProgramAccounts.getPoolAccount(currentPoolId, 'createPool')
    console.log(`Derived pool address: ${poolAddress}`)

    const txHash = await poolProgram.methods.createPool(
      new PublicKey(req.body.baseTokenAccount),
      new PublicKey(req.body.quoteTokenAccount),
      new BN(req.body.baseTokenAmount),
      new BN(req.body.quoteTokenAmount),
    ).accounts({
      pool: poolAddress,
      signer: wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
      master: masterAccountAddress,
    }).signers([wallet.payer]).rpc()

    console.log(`Pool creation transaction hash: ${txHash}`)
    const txStatus = await getProgramAccounts.confirmTransactions(txHash)
    console.log(`Transaction status: ${txStatus}`)

    const poolConstant = Number(baseTokenAmount) * Number(quoteTokenAmount)
    try {
      const poolData = new poolDetailsModel({
        poolAddress: poolAddress,
        poolId: currentPoolId,
        baseTokenAccount: baseTokenAccount,
        quoteTokenAccount: quoteTokenAccount,
        baseTokenAmount: baseTokenAmount,
        quoteTokenAmount: quoteTokenAmount,
        poolConstant: new mongoose.Types.Decimal128(poolConstant.toString()),
        poolCreationTxHash: txHash,
      })
      await poolData.save()
    } catch (err: any) {
      console.error(`Error while storing the details to the db`, err)
    }

    const data = {
      poolAddress: poolAddress,
      transactionHash: txHash,
      url: `https://solscan.io/tx/${txHash}`,
    }

    res.status(200).json({
      success: true,
      message: 'Pool created successfully',
      data: data,
    })
  } catch (err: any) {
    console.error(`error`, err)
    return res.status(400).json({
      success: false,
      message: 'An error occurred while creating the pool. Check logs for details.',
      error: err.message || err,
    })
  }
}

export const getPoolDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { poolId } = req.body
    if (!poolId) {
      return res.status(400).json({
        success: false,
        message: 'poolId is required to fetch pool details',
      })
    }
    const poolPublicKey = new PublicKey(poolId)
    const poolData = await poolProgram.account.poolDetails.fetch(poolPublicKey)
    // const poolData = await poolProgram.account.poolDetails.

    // console.log(`Fetched pool details:`, Number(poolData.pools[0].baseTokenAmount))
    // console.log(`Fetched pool details:`, poolData.pools[0].baseTokenAmount)
    // console.log(`Fetched pool details poolConstant :`, Number(poolData.pools[0].poolConstant))

    console.log(`pool data`, poolData)

    res.status(200).json({
      success: true,
      message: 'Successfully fetched the pool details',
      data: poolData,
    })
  } catch (error: any) {
    console.error(`Error fetching pool details:`, error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pool details',
      error: error.message || error,
    })
  }
}

export const swapTokens = async (req: Request, res: Response) => {
  try {
    await getUserBalance(wallet.publicKey)
    await getUserBalance(new PublicKey(req.body.recipientAddress))

    const { poolId, tokenToBuy, swapAmountInSol } = req.body
    if (!tokenToBuy || !swapAmountInSol) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      })
    }

    const masterAccount = await getProgramAccounts.getMasterAccount()
    const masterAccountData = await poolProgram.account.master.fetch(masterAccount!)

    if (!masterAccount) {
      return res.status(404).json({
        success: false,
        message: 'Master account data not found.',
      })
    }

    const { masterAddress, currentPoolId } = masterAccountData
    const fromAta = await getAssociateAccount(wallet, wallet.publicKey, new PublicKey(tokenToBuy))
    const toAta = await getAssociateAccount(wallet, masterAddress, new PublicKey(tokenToBuy))
    const poolCurrentId = new BN(poolId)
    const amountInLamports = new anchor.BN(swapAmountInSol * anchor.web3.LAMPORTS_PER_SOL)
    const recipientPublicKey = new PublicKey(masterAddress)
    console.log(`current pool id`, currentPoolId)
    console.log(`poolCurrentId`, typeof poolCurrentId)

    const poolAccountPublicKey = await getProgramAccounts.getPoolAccount(poolCurrentId, 'swap')
    console.log(`pool account is: ${poolAccountPublicKey}`)
    console.log(`masterAddress is`, masterAddress)

    //On-chain transaction to transfer SOL
    const txHash = await poolProgram.methods.swap(
      new PublicKey(tokenToBuy),
      amountInLamports as any,
    ).accounts({
      signer: wallet.publicKey,
      recipient: recipientPublicKey,
      pool: poolAccountPublicKey,
      master: masterAccount,
      fromAta: fromAta.address,
      toAta: toAta!.address,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([wallet.payer])
      .rpc()

    console.log(`https://explorer.solana.com/tx/${txHash}?cluster=devnet`)
    await getProgramAccounts.confirmTransactions(txHash)
    const updatedPoolDetails = await poolProgram.account.poolDetails.fetch(poolAccountPublicKey!)
    console.log(`Updated pool details:`, updatedPoolDetails)
    await getUserBalance(wallet.publicKey)
    await getUserBalance(new PublicKey(req.body.recipientAddress))
    const data = {
      txHash: txHash,
      url: `https://explorer.solana.com/tx/${txHash}?cluster=devnet`,
    }
    res.status(200).json({
      success: true,
      message: 'Token swap completed successfully',
      data: data,
    })
  } catch (err: any) {
    console.error('Error during token swap:', err)
    res.status(500).json({
      success: false,
      message: 'An error occurred during the token swap.',
      error: err.message || 'Unknown error',
    })
  }
}