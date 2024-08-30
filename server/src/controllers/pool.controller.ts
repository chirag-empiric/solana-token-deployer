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
const { getAssociatedTokenAddressSync } = require('@solana/spl-token');
import * as anchor from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  NATIVE_MINT,
} from '@solana/spl-token'

const MASTER_ACCOUNT_SEED = 'master'
const POOL_SEED = 'pool'
const SWAP_SEED = 'swapping'

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

const SOLANA_MINT = new PublicKey("So11111111111111111111111111111111111111112")
// const SOLANA_MINT = new PublicKey('DzEJ2GdqJ7QdkxepJv6nqFX65seR465NUDUNo8wVpBiT')

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

export const getPoolAddress = async (id: any) => {
  try {
    console.log(`currentId is ${id}`);
    const newId = id.add(new BN(1));
    const idBuffer = newId.toArrayLike(Buffer, 'le', 8); // u64 is 8 bytes
    const [poolAddress] = await PublicKey.findProgramAddressSync(
      [Buffer.from(POOL_SEED), idBuffer],
      PROGRAM_ID
    );

    return poolAddress;
  } catch (err: any) {
    console.error('Error:', err);
  }
};

export const getSwapAccount = async () => {
  try {
    console.log(`MASTER_SEED is here`, PROGRAM_ID)
    return (
      await PublicKey.findProgramAddressSync([Buffer.from(SWAP_SEED)], PROGRAM_ID)
    )[0]
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

    const masterAccountDetails = await poolProgram.account.master.fetch(masterAccountAddress)
    console.log(`Master details are`, masterAccountDetails)
    console.log(`masterAccountDetails currentId:`, masterAccountDetails?.currentId)
    console.log(`masterAccountDetails are as:`, masterAccountDetails?.masterAddress)

    const currentId = await masterAccountDetails?.currentId

    const poolAddress = await getPoolAddress(currentId)

    console.log(`poolAddress is`, poolAddress)

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

// TODO GET POOL DETAILS
export const poolDetails = async (req:Request, res: Response, next: NextFunction): Promise<any> => {
  let poolId;
  try {
    // poolId = "6iThDaRtMfxrmhxnQo9rWQFCLBNjK1LaNfwLevur4Pq4";
    const poolId = req.body.poolId
    // const poolAccountAddress = await getPoolAddress(poolId, 'poolData')
    // console.log(`poolAccountAddress is`, poolAccountAddress, typeof poolAccountAddress)
    const poolDetails = await poolProgram.account.poolDetails.fetch(new PublicKey(poolId!))
    // const poolDetails = await poolProgram.account.poolDetails.fetch(new PublicKey(poolId!))
    console.log(`pooLDetails is`, poolDetails)
    res.status(200).json({
      success: true,
      message: "Successfully fetched the pool details",
      data: poolDetails
    })
  } catch (err: any) {
    console.error(`err`, err)
    res.status(200).json({
      success: false,
      error: err
    })
  }
}

// // TODO SWAPTOKENS
// export const poolDetails = async (req:Request, res: Response, next: NextFunction): Promise<any> => {
//   let poolId;
//   try {
//     // const poolId = req.body.poolId
//     poolId = "BARgQ3LywBcE3E6FdD3vZawyGKsWbs6EaHG2d5qC2QhX";
//     // const poolAccountAddress = await getPoolAddress(poolId, 'poolData')
//     // console.log(`poolAccountAddress is`, poolAccountAddress, typeof poolAccountAddress)
//     const poolDetails = await poolProgram.account.poolDetails.fetch(new PublicKey(poolId!))
//     // const poolDetails = await poolProgram.account.poolDetails.fetch(new PublicKey(poolId!))
//     console.log(`pooLDetails is`, poolDetails)
//     res.status(200).json({
//       success: true,
//       message: "Successfully fetched the pool details",
//       data: poolDetails
//     })
//   } catch (err: any) {
//     console.error(`err`, err)
//     res.status(200).json({
//       success: false,
//       error: err
//     })
//   }
// }

// TODO SWAP
export const swapSplTokens = async (req: Request, res: Response) => {
  try {
    const poolAccountAddress = "5UaLh9NrNrPVvj7Hb8iEtTGLBeWrs3cwfnPsYDSi16Gd"
    let {baseInAccount, quoteOutAccount, tokenInAmount} = req.body
    const swapAccount = await getSwapAccount();

    const poolInfo = await poolProgram.account.poolDetails.fetch(new PublicKey(poolAccountAddress!))
    console.log(`poolInfo is`, poolInfo)

    const masterAccountAddress = await getMasterAddress();
    const masterAccountDetails = await poolProgram.account.master.fetch(masterAccountAddress)

    const fromAtaAddress = await anchor.utils.token.associatedAddress({
      mint: SOLANA_MINT,
      owner: wallet.publicKey,
    });
    console.log(`fromAta is`, fromAtaAddress)

    const toAtaAddress = await anchor.utils.token.associatedAddress({
      mint: SOLANA_MINT,
      owner: new PublicKey(masterAccountDetails?.masterAddress),
    });
    console.log(`toAta is`, toAtaAddress)
    console.log(`toAta is`,swapAccount)

    const txHash = await poolProgram.methods.swap(
      baseInAccount,
      quoteOutAccount,
      tokenInAmount
    ).accounts({
      swap: swapAccount,
      fromAta: fromAtaAddress,
      toAta: toAtaAddress,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      signer: wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
      pool: new PublicKey(poolAccountAddress)
    }).rpc()

    console.log(`txHash is:`, txHash)

    // console.log(`getSwapAccount is`, swapAccount)
    //
    //
    //
    // const fromAddress = wallet.publicKey
    // console.log(`wallet.publicKey is:`, wallet.publicKey)
    //
    // const toAddress = new PublicKey(masterAccountDetails?.masterAddress)
    //
    // const fromAtaAccount = (
    //   await getOrCreateAssociatedTokenAccount(
    //     connection,
    //     wallet.payer,
    //     NATIVE_MINT,
    //     wallet.publicKey,
    //   )
    // ).address
    //
    // const toAtaAccount = (
    //   await getOrCreateAssociatedTokenAccount(
    //     connection,
    //     wallet.payer,
    //     NATIVE_MINT,
    //     toAddress,
    //   )
    // ).address
    //
    // console.log(`fromAta account`, fromAtaAccount)
    // console.log(`toAta account`, toAtaAccount)

    // return

    // const marketAuthority = PublicKey.createProgramAddressSync(
    //   [
    //     marketState.ownAddress.toBuffer(),
    //     marketState.vaultSignerNonce.toArrayLike(Buffer, "le", 8),
    //   ],
    //   MAINNET_PROGRAM_ID.OPENBOOK_MARKET
    // );

    // const [fromAtaAccount] = PublicKey.findProgramAddressSync(
    //   [fromAddress.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), SOLANA_MINT.toBuffer()],
    //   ASSOCIATED_TOKEN_PROGRAM_ID
    // );
    // console.log(`fromAtaAccount is`, fromAtaAccount)
    //
    // const [toAtaAccount] = PublicKey.findProgramAddressSync(
    //   [toAddress.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), SOLANA_MINT.toBuffer()],
    //   ASSOCIATED_TOKEN_PROGRAM_ID
    // );

    // return


    res.status(200).json({
      success: true,
      message: 'Swap successful',
    });
  } catch (err: any) {
    console.error(`error`, err)
    res.status(400).json({
      success: false,
      message: 'Error occurred during token swap',
      error: err.message,
    });
  }
};