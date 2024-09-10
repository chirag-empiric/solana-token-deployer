import { connection, wallet } from '../config/getPoolPrograms'
import { PublicKey } from '@solana/web3.js'

export const getUserBalance = async (walletPublicKey: PublicKey): Promise<number | any> => {
  try {
    const userAddress = wallet.publicKey
    const userBalance = await connection.getBalance(walletPublicKey)
    console.log(`user balance`, userBalance)
    return userBalance
  } catch (err: any) {
    console.error(`Error`, err)
    return err
  }
}