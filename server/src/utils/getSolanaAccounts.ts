import { PublicKey } from '@solana/web3.js'
import { BN } from '@project-serum/anchor'
import { connection, PROGRAM_ID } from '../config/getPoolPrograms'
import { MASTER_ACCOUNT_SEED, SWAP_SEED, POOL_SEED } from './seedConstant'

export class getProgramAccounts {
  public static async getMasterAccount(): Promise<PublicKey | undefined> {
    try {
      return (
        PublicKey.findProgramAddressSync([Buffer.from(MASTER_ACCOUNT_SEED)], PROGRAM_ID)
      )[0]
    } catch (err: any) {
      console.error('error while fetching the master account address')
      return undefined
    }
  }

  public static async confirmTransactions(txHash: any) {
    const blockHashInfo = await connection.getLatestBlockhash()
    try {
      await connection.confirmTransaction({
        blockhash: blockHashInfo.blockhash,
        lastValidBlockHeight: blockHashInfo.lastValidBlockHeight,
        signature: txHash,
      })
    } catch (err: any) {
      console.error(`error while confirming the transaction`)
    }
  }

  public static async getPoolAccount(id: BN): Promise<PublicKey | undefined> {
    console.log(`fetching the pool account for the id: ${id}`)
    try {
      const newId = id.add(new BN(1))
      const idBuffer = newId.toArrayLike(Buffer, 'le', 8)
      const [poolAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from(POOL_SEED), idBuffer],
        PROGRAM_ID,
      )
      return poolAddress
    } catch (err: any) {
      console.error('error while fetching the pool account', err)
      return undefined
    }
  }

  public static async getSwapAccount(id: BN): Promise<PublicKey | undefined> {
    try {
      const newId: BN = id.add(new BN(1))
      const idBuffer: Buffer = newId.toArrayLike(Buffer, 'le', 8)
      return (
        PublicKey.findProgramAddressSync(
          [Buffer.from(SWAP_SEED), idBuffer],
          PROGRAM_ID,
        )[0]
      )
    } catch (err: any) {
      console.error('error while fetching the swap account', err)
      return undefined
    }
  }
}