import base58 from 'bs58'
import { Raydium, TxVersion } from '@raydium-io/raydium-sdk-v2'
import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js'
import dotenv from 'dotenv'

dotenv.config()

export const owner: Keypair = Keypair.fromSecretKey(base58.decode(process.env.SECRET_KEY as string))

export const connection = new Connection('https://api.devnet.solana.com')
export const txVersion = TxVersion.V0
const cluster = 'devnet'

let raydium: Raydium | undefined
export const initSdk = async (params?: { loadToken?: boolean }) => {
  if (raydium) return raydium
  console.log(`connect to rpc ${connection.rpcEndpoint} in ${cluster}`)
  raydium = await Raydium.load({
    owner,
    connection,
    cluster,
    disableFeatureCheck: true,
    disableLoadToken: !params?.loadToken,
    blockhashCommitment: 'finalized',
  })

  return raydium
}