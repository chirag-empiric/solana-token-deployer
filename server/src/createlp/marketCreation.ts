import { PublicKey } from '@solana/web3.js'
import { DEVNET_PROGRAM_ID } from '@raydium-io/raydium-sdk-v2'
import { initSdk, txVersion, connection } from './config'

const { getMint } = require('@solana/spl-token')

export const createMarket = async (baseToken: string, quoteToken: string) => {
  try {
    const raydium = await initSdk()
    const baseMintInfo = await getMint(connection, new PublicKey(baseToken))
    const quoteMintInfo = await getMint(connection, new PublicKey(quoteToken))

    const { execute, extInfo, transactions } = await raydium.marketV2.create({
      baseInfo: {
        mint: new PublicKey(baseToken),
        decimals: baseMintInfo.decimals,
      },
      quoteInfo: {
        mint: new PublicKey(quoteToken),
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

    let txHash = txIds?.txIds[1]
    console.log(`https://solscan.io/tx/${txHash}?cluster=devnet`)

    const marketData: any = Object.keys(extInfo.address).reduce(
      (acc, cur) => ({
        ...acc,
        [cur]: extInfo.address[cur as keyof typeof extInfo.address].toBase58(),
      }),
      {},
    );

    const marketId = marketData.marketId;

    return marketId
  } catch (err: any) {
    console.error('Error creating market:', err)
    if (err.transactionLogs) {
      console.log('Transaction logs:', err.transactionLogs)
    }
  }
}
