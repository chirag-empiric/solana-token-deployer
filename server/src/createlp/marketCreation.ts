import axios from 'axios'
import { PublicKey } from '@solana/web3.js'
import { DEVNET_PROGRAM_ID } from '@raydium-io/raydium-sdk-v2'
import { initSdk, txVersion, connection } from './config'
import { Request, Response } from 'express'
import ammDetailsModel from '../models/token.model'

const { getMint } = require('@solana/spl-token')

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface IAmmDetails {
  ammId: String | null | undefined,
  baseTokenAddress: String | null,
  quoteTokenAddress: String | null,
  tickSize: Number | null,
  lotAmount: Number | null,
  marketId: String | null,
  lpMintAddress: String | null,
}

export const createMarket = async (req: Request, res: Response) => {
  try {
    const baseTokenAddress = '8J5wQEdLo2mAJcCuiKjW8M2LkgzDPCTsy8VdVPXVjrVZ'
    const quoteTokenAddress = 'So11111111111111111111111111111111111111112'
    // const { baseToken, quoteToken } = req.body
    const raydium = await initSdk()
    const baseMintInfo = await getMint(connection, new PublicKey(baseTokenAddress))
    const quoteMintInfo = await getMint(connection, new PublicKey(quoteTokenAddress))

    const { execute, extInfo, transactions } = await raydium.marketV2.create({
      baseInfo: {
        mint: new PublicKey(baseTokenAddress),
        decimals: baseMintInfo.decimals,
      },
      quoteInfo: {
        mint: new PublicKey(quoteTokenAddress),
        decimals: quoteMintInfo.decimals,
      },
      lotSize: 1,
      tickSize: 0.01,
      dexProgramId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET,
      txVersion,
    })

    const txIds = await execute({
      sequentially: true,
    })

    const txHash = txIds?.txIds[1]
    console.log(`https://solscan.io/tx/${txHash}?cluster=devnet`)

    const marketData: any = Object.keys(extInfo.address).reduce(
      (acc, cur) => ({
        ...acc,
        [cur]: extInfo.address[cur as keyof typeof extInfo.address].toBase58(),
      }),
      {},
    )
    const marketId = marketData.marketId
    console.log(`marketId is`, marketId)

    if (marketId !== undefined || marketId !== null) {
      // const createAmmId = await createAmmPool(marketId)
      const createAmmId = await axios.post('http://localhost:9000/create/create-amm', { marketId })
      console.log(`AMM pool created: ${createAmmId}`, createAmmId)
      res.status(200).json({
        success: true,
        message: 'Market created successfully',
        ammId: createAmmId.data.ammId,
        lpMint: createAmmId.data.lpMint,
        marketId: createAmmId.data.marketId,
      })
      try {
        const poolDetails = new ammDetailsModel({
          ammId: 'DUMMY',
          baseTokenAddress: 'DUMMY',
          quoteTokenAddress: 'DUMMY',
          tickSize: 12,
          lotAmount: 12,
          marketId: 'DUMMY',
          lpMintAddress: 'DUMMY',
        } as IAmmDetails)

        await poolDetails.save()
      } catch (err: any) {
        console.error(`Error while saving amm details`, err)
      }
    } else {
      console.error(`Error finding marketId`)
      return null
    }
  } catch (err: any) {
    console.error('Error creating market', err)
    if (err.transactionLogs) {
      console.log('Transaction logs:', err.transactionLogs)
    }
  }
  res.status(404).json({
    success: false,
    message: 'Failed to create market',
  })
}
