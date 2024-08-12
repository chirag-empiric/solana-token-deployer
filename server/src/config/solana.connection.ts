import { Connection } from '@solana/web3.js'

export const connection = new Connection(
  process.env.QN_MAINNET_ENDPOINT! || 'https://api.mainnet-beta.solana.com',
  'confirmed',
)
