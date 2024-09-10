import dotenv from 'dotenv'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import base58 from 'bs58'
import { AnchorProvider, Program } from '@project-serum/anchor'
import { Wallet } from '@project-serum/anchor'
import poolIdl from '../../../token-program/target/idl/pool.json'
import { Pool } from '../../../token-program/target/types/pool'

dotenv.config()

interface IRpcUrl {
  RPC_CLUSTER?: string;
  RPC_URL_MAINNET?: string;
  RPC_URL_DEVNET?: string;
}

const { RPC_CLUSTER, RPC_URL_MAINNET, RPC_URL_DEVNET } = process.env as unknown as IRpcUrl

const rpcUrl: string | undefined = (() => {
  switch (RPC_CLUSTER) {
    case 'mainnet':
      return RPC_URL_MAINNET
    case 'devnet':
      return RPC_URL_DEVNET ?? 'https://api.devnet.solana.com'
    default:
      return 'http://127.0.0.1:8899'
  }
})()

if (!rpcUrl) {
  throw new Error('RPC url is required')
}

if (!process.env.PRIVATE_KEY) {
  throw new Error('Private key is required')
}

const commitmentLevel = 'confirmed'
const programInterfacesIDL = JSON.parse(JSON.stringify(poolIdl))
const privateKey = new Uint8Array(base58.decode(process.env.PRIVATE_KEY!))
const userWallet = Keypair.fromSecretKey(privateKey)

export const wallet = new Wallet(userWallet)
export const connection = new Connection(rpcUrl!, commitmentLevel)
export const PROGRAM_ID = new PublicKey(poolIdl.metadata.address)
export const provider = new AnchorProvider(connection, wallet, {
  commitment: 'confirmed',
})
export const poolProgram = new Program(programInterfacesIDL, PROGRAM_ID, provider) as Program<Pool>
