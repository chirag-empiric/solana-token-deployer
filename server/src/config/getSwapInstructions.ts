import BN from 'bn.js'
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js'
import {
  Liquidity,
  LiquidityPoolInfo,
  LiquidityPoolKeys,
  Percent,
  Token,
  TOKEN_PROGRAM_ID,
  TokenAmount,
  WSOL,
} from '@raydium-io/raydium-sdk'

const {
  getOrCreateAssociatedTokenAccount,
  NATIVE_MINT,
} = require('@solana/spl-token')

const calculateAmountOut = async (
  poolKeys: LiquidityPoolKeys,
  poolInfo: LiquidityPoolInfo,
  tokenToBuy: string,
  amountIn: number,
  rawSlippage: number,
) => {
  let tokenOutMint = new PublicKey(tokenToBuy)
  let tokenOutDecimals = poolKeys.baseMint.equals(tokenOutMint)
    ? poolInfo.baseDecimals
    : poolKeys.quoteDecimals
  let tokenInMint = poolKeys.baseMint.equals(tokenOutMint)
    ? poolKeys.quoteMint
    : poolKeys.baseMint
  let tokenInDecimals = poolKeys.baseMint.equals(tokenOutMint)
    ? poolInfo.quoteDecimals
    : poolInfo.baseDecimals

  const tokenIn = new Token(TOKEN_PROGRAM_ID, tokenInMint, tokenInDecimals)
  const tknAmountIn = new TokenAmount(tokenIn, amountIn, false)
  const tokenOut = new Token(TOKEN_PROGRAM_ID, tokenOutMint, tokenOutDecimals)
  const slippage = new Percent(rawSlippage, 100)

  console.log(`slippage`, slippage)

  return {
    amountIn: tknAmountIn,
    tokenIn: tokenInMint,
    tokenOut: tokenOutMint,
    ...Liquidity.computeAmountOut({
      poolKeys,
      poolInfo,
      amountIn: tknAmountIn,
      currencyOut: tokenOut,
      slippage,
    }),
  }
}

export const getSwapInstructions = async (
  connection: Connection,
  tokenToBuy: string,
  rawAmountIn: number,
  slippage: number,
  poolKeys: LiquidityPoolKeys,
  poolInfo: LiquidityPoolInfo,
  keyPair: Keypair,
) => {
  while (true) {
    try {
      console.log(`in makeSwapInstruction`)
      const { amountIn, tokenIn, tokenOut, minAmountOut } = await calculateAmountOut(
        poolKeys,
        poolInfo,
        tokenToBuy,
        rawAmountIn,
        slippage,
      )
      let tokenInAccount: PublicKey
      let tokenOutAccount: PublicKey

      if (tokenIn.toString() == WSOL.mint) {
        tokenInAccount = (
          await getOrCreateAssociatedTokenAccount(
            connection,
            keyPair,
            NATIVE_MINT,
            keyPair.publicKey,
          )
        ).address

        tokenOutAccount = (
          await getOrCreateAssociatedTokenAccount(
            connection,
            keyPair,
            tokenOut,
            keyPair.publicKey,
          )
        ).address
      } else {
        tokenOutAccount = (
          await getOrCreateAssociatedTokenAccount(
            connection,
            keyPair,
            NATIVE_MINT,
            keyPair.publicKey,
          )
        ).address
        tokenInAccount = (
          await getOrCreateAssociatedTokenAccount(
            connection,
            keyPair,
            tokenIn,
            keyPair.publicKey,
          )
        ).address
      }

      const ix = new TransactionInstruction({
        programId: new PublicKey(poolKeys.programId),
        keys: [
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: poolKeys.id, isSigner: false, isWritable: true },
          { pubkey: poolKeys.authority, isSigner: false, isWritable: false },
          { pubkey: poolKeys.openOrders, isSigner: false, isWritable: true },
          { pubkey: poolKeys.baseVault, isSigner: false, isWritable: true },
          { pubkey: poolKeys.quoteVault, isSigner: false, isWritable: true },
          { pubkey: poolKeys.marketProgramId, isSigner: false, isWritable: false },
          { pubkey: poolKeys.marketId, isSigner: false, isWritable: true },
          { pubkey: poolKeys.marketBids, isSigner: false, isWritable: true },
          { pubkey: poolKeys.marketAsks, isSigner: false, isWritable: true },
          { pubkey: poolKeys.marketEventQueue, isSigner: false, isWritable: true },
          { pubkey: poolKeys.marketBaseVault, isSigner: false, isWritable: true },
          { pubkey: poolKeys.marketQuoteVault, isSigner: false, isWritable: true },
          { pubkey: poolKeys.marketAuthority, isSigner: false, isWritable: false },
          { pubkey: tokenInAccount, isSigner: false, isWritable: true },
          { pubkey: tokenOutAccount, isSigner: false, isWritable: true },
          { pubkey: keyPair.publicKey, isSigner: true, isWritable: false },
        ],
        data: Buffer.from(
          Uint8Array.of(
            9,
            ...new BN(amountIn.raw).toArray('le', 8),
            ...new BN(minAmountOut.raw).toArray('le', 8),
          ),
        ),
      })

      return {
        swapIX: ix,
        tokenInAccount: tokenInAccount,
        tokenOutAccount: tokenOutAccount,
        tokenIn,
        tokenOut,
        amountIn,
        minAmountOut,
      }
    } catch (e: any) {
      console.error(`Error in makeSwapInstruction:`, e)
      console.log(`Retrying...`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}