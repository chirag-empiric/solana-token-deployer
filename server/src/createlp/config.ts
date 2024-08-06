import { Connection, Keypair } from '@solana/web3.js'
import { Raydium, TxVersion } from '@raydium-io/raydium-sdk-v2'
import dotenv from 'dotenv'

dotenv.config()

const bs58 = require('bs58')
const txVersion = TxVersion.V0
const cluster = 'devnet'
const connection = new Connection('https://api.devnet.solana.com', {
  commitment: 'confirmed',
})
const owner = Keypair.fromSecretKey(
  bs58.decode(
    process.env.SECRET_KEY,
  ),
)

const initSdk = async () => {
  const raydium = new Raydium({
    connection,
    owner,
    txVersion,
    cluster,
    disableFeatureCheck: true,
    // disableLoadToken: !(params && params.loadToken),
    blockhashCommitment: 'finalized',
  })
  return raydium
}

export { initSdk, txVersion, connection }