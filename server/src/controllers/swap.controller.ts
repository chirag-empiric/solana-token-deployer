import { Request, Response } from 'express'
import dotenv from 'dotenv'
import { connection } from '../config/solana.connection'
import base58 from 'bs58'
import { ComputeBudgetProgram, Keypair, sendAndConfirmTransaction, SystemProgram, Transaction } from '@solana/web3.js'
import { getPoolKeys } from '../config/poolKeys'
import { Liquidity, WSOL, TOKEN_PROGRAM_ID } from '@raydium-io/raydium-sdk'
import { getSwapInstructions } from '../config/getSwapInstructions'
import swapDetailsModel from '../models/swapDetails'

const { createSyncNativeInstruction } = require('@solana/spl-token')

dotenv.config()

export const swapSplTokens = async (req: Request, res: Response) => {
  try {
    const { ammId, tokenToBuy, swapAmountIn } = req.body
    const privateKey = new Uint8Array(base58.decode(process.env.PRIVATE_KEY || '2Eip5Av2Q5vM9ft6DnHPpoaXvyJvszMyHMY2tz77ZN9DkTSdVd9MNZmNgESrZu9H3J5b6uXzZ3ugC8UR7qDAojVD'))
    const keyPair = Keypair.fromSecretKey(privateKey)
    const userAddress = keyPair.publicKey
    console.log(`userAddress is`, userAddress)
    console.log(`user's SOLANA balance`, await connection.getBalance(userAddress))
    const slippage = 5 // 5% slippage tolerance

    let poolKeys = await getPoolKeys(ammId, connection)
    console.log(`pool keys are`, poolKeys)

    if (poolKeys) {
      try {
        const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys })
        const { swapIX, tokenInAccount, tokenIn, amountIn, tokenOutAccount } =
          await getSwapInstructions(
            connection,
            tokenToBuy,
            swapAmountIn,
            slippage,
            poolKeys!,
            poolInfo,
            keyPair,
          )
        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
          units: 4000000,
        })
        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: 200000,
        })
        const recentBlockhash = await connection.getLatestBlockhash()

        const txn = new Transaction({
          recentBlockhash: recentBlockhash.blockhash,
        }).add(modifyComputeUnits).add(addPriorityFee)
        if (tokenIn.toString() == WSOL.mint) {
          const txnData = txn.add(
            SystemProgram.transfer({
              // fromPubkey: keyPair.publicKey,
              fromPubkey: keyPair.publicKey,
              toPubkey: tokenInAccount,
              lamports: amountIn.raw.toNumber(),
            }),
            createSyncNativeInstruction(tokenInAccount, TOKEN_PROGRAM_ID),
          )
        }
        console.log(`txn is`, txn)
        txn.add(swapIX)

        const hash = await sendAndConfirmTransaction(
          connection,
          txn,
          [keyPair],
          {
            skipPreflight: true,
            preflightCommitment: 'confirmed',
          },
        )
        console.log('Transaction Completed Successfully.')
        console.log(`Explorer URL: https://solscan.io/tx/${hash}`)
        const response = {
          success: true,
          message: 'Transaction Completed Successfully',
          url: `https://solscan.io/tx/${hash}`,
        }
        console.log('Response', response)

        const swapDetails = new swapDetailsModel({
          ammId,
          swappedToken: tokenToBuy,
          swappedAmount: swapAmountIn,
          hash,
        })
        const savedDetails = await swapDetails.save()
        console.log(`Saved details: ${savedDetails}`)

        return res.status(200).json({
          success: true,
          message: 'Transaction Completed Successfully',
          data: { url: `https://solscan.io/tx/${hash}` },
        })
      } catch (err: any) {
        console.error(`error`, err)
      }
    } else {
      console.log(`Not get the pool keys`)
    }
  } catch (err: any) {
    console.log(`error`, err)
    res.status(400).json({
      success: false,
      message: err.message,
    })
  }
}