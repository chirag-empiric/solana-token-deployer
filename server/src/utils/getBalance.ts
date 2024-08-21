import { connection, wallet } from '../config/getPoolPrograms'
import { PublicKey } from '@solana/web3.js'

export const getUserBalance = async (): Promise<number | any> => {
  try {
    const userAddress = wallet.publicKey
    const userBalance = await connection.getBalance(new PublicKey('HeTRnuCxq6SELVD4thqHVatXN3cwu2P57mw5h4WFhRCF'))
    console.log(`user balance`, userBalance)
    return userBalance
  } catch (err: any) {
    console.error(`Error`, err)
    return err
  }
}