import {
  MARKET_STATE_LAYOUT_V3,
  DEVNET_PROGRAM_ID,
  AMM_V4, // SAME AS DEVNET PROGRAM ID BUT FOR MAINNET
} from '@raydium-io/raydium-sdk-v2'
import { initSdk, txVersion, connection } from './config'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { createMarket } from './marketCreation'

const TOKEN_PROGRAM_ID = require('@solana/spl-token')
const { getMint } = require('@solana/spl-token')


const baseTokenAddress = '8J5wQEdLo2mAJcCuiKjW8M2LkgzDPCTsy8VdVPXVjrVZ'
const quoteTokenAddress = 'So11111111111111111111111111111111111111112'
const quoteTokenAmount = 0.1
const baseTokenAmount = 100

const createAmmPool = async (baseTokenAddress: string, quoteTokenAddress: string) => {
  const raydium = await initSdk()
  const marketAccount = await createMarket(baseTokenAddress, quoteTokenAddress)
  console.log('Market Account:', marketAccount)

  const marketId = new PublicKey(
    marketAccount,
  )
  const marketBufferInfo = await raydium.connection.getAccountInfo(marketId);
  const marketBufferInfo2: any = raydium.connection.getAccountInfo(marketId);
  let p1 = Promise.all([marketBufferInfo2]);
  let d = await p1;
  console.log('Market Buf Info before:', d)
  if (!d.length) {
    console.log("In If")
    console.log('Market Buf Info:', d)
    return;
  }

  console.log('Market Buf Info after:', d)
  return;
  const { baseMint, quoteMint } = MARKET_STATE_LAYOUT_V3.decode(
    marketBufferInfo!.data,
  )
  const baseMintProgramId = await raydium.connection.getAccountInfo(baseMint)
  const quoteMintProgramId = await raydium.connection.getAccountInfo(quoteMint)
  const baseMintInfo = await getMint(connection, baseMint)
  const quoteMintInfo = await getMint(connection, quoteMint)

  /*  if (
     baseMintProgramId!.owner.toString() !== TOKEN_PROGRAM_ID.toString() ||
     quoteMintProgramId!.owner.toString() !== TOKEN_PROGRAM_ID.toString()
   ) {
     throw new Error(
       'AMM pools with OpenBook market only support TOKEN_PROGRAM_ID mints. If you want to create a pool with token-2022, please create a CPMM pool instead.',
     )
   }
*/
  const { execute, extInfo } = await raydium.liquidity.createPoolV4({
    programId: DEVNET_PROGRAM_ID.AmmV4,
    marketInfo: {
      marketId,
      programId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET,
    },
    baseMintInfo: {
      mint: baseMint,
      decimals: baseMintInfo.decimals,
    },
    quoteMintInfo: {
      mint: quoteMint,
      decimals: quoteMintInfo.decimals,
    },
    baseAmount: new BN(baseTokenAmount),
    quoteAmount: new BN(quoteTokenAmount),
    startTime: new BN(0),
    ownerInfo: {
      useSOLBalance: true,
    },
    associatedOnly: false,
    txVersion,
    feeDestinationId: DEVNET_PROGRAM_ID.FEE_DESTINATION_ID,
  })

  // Don't want to wait for confirmation, set sendAndConfirm to false or don't pass any params to execute
  const { txId } = await execute({ sendAndConfirm: true })
  console.log('AMM pool created! txId: ', txId)
  console.log(`https://solscan.io/tx/${txId}?cluster=devnet`)

  const poolDetails: any = Object.keys(extInfo.address).reduce(
    (acc, cur) => ({
      ...acc,
      [cur]: extInfo.address[cur as keyof typeof extInfo.address].toBase58(),
    }),
    {},
  )

  console.log(
    'amm pool created! txId: ',
    txId,
    ', poolKeys:',
    Object.keys(extInfo.address).reduce(
      (acc, cur) => ({
        ...acc,
        [cur]: extInfo.address[cur as keyof typeof extInfo.address].toBase58(),
      }),
      {}
    )
  )

  return ({
    ammId: poolDetails.ammId,
    lpMint: poolDetails.lpMint,
    marketId: poolDetails.marketId,
  })
}

// let poolInfo = await createAmmPool(baseTokenAddress, quoteTokenAddress)
createAmmPool(baseTokenAddress, quoteTokenAddress)
  .then((res) => {
    console.log('Pool Created Successfully', res)
  })
  .catch((err) => {
    console.log('Pool Creation Failed', err)
  })