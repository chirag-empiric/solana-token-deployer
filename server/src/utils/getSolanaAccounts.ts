import { PublicKey } from '@solana/web3.js'
import { BN, web3 } from '@project-serum/anchor'
import { connection, PROGRAM_ID } from '../config/getPoolPrograms'
import { MASTER_ACCOUNT_SEED, SWAP_SEED, POOL_SEED } from './seedConstant'

let newId: BN

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

  public static async getPoolAccount(poolId: BN, txType: String): Promise<PublicKey | undefined> {
    console.log(`fetching the pool account`)
    console.log(`id is`, typeof poolId)

    try {
      if (txType !== 'swap') {
        newId = poolId.add(new BN(1))
      } else {
        newId = poolId
      }
      console.log(`new Id is: ${newId}`)
      console.log(`new Id is: ${newId}`, typeof newId)

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

  public static async confirmTransaction(
    signature: web3.TransactionSignature,
    desiredConfirmationStatus: web3.TransactionConfirmationStatus = 'confirmed',
    timeout: number = 30000,
    pollInterval: number = 1000,
    searchTransactionHistory: boolean = false,
  ): Promise<web3.SignatureStatus | undefined | Error> {
    try {
      const start = Date.now()

      while (Date.now() - start < timeout) {
        const { value: statuses } = await connection.getSignatureStatuses([signature], { searchTransactionHistory })

        if (!statuses || statuses.length === 0) {
          return new Error('Failed to get signature status')
        }

        const status = statuses[0]

        if (status === null) {
          await new Promise(resolve => setTimeout(resolve, pollInterval))
          continue
        }

        if (status.err) {
          return new Error(`Transaction failed: ${JSON.stringify(status.err)}`)
        }
        if (status.confirmationStatus && status.confirmationStatus === desiredConfirmationStatus) {
          return status
        }

        if (status.confirmationStatus === 'finalized') {
          return status
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval))
      }

      return new Error(`Transaction confirmation timeout after ${timeout}ms`)
    } catch (err: any) {
      console.log(`error while send and confirm the transactions`, err)
      return err
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