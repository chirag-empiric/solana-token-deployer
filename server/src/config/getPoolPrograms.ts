import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import base58 from 'bs58'
import { AnchorProvider, BN, Program, web3 } from '@project-serum/anchor'
import { Wallet } from '@project-serum/anchor'
import poolIdl from '../../../token-program/target/idl/pool.json'
// import tokenIdl from '../../../token-program/target/idl/token_program.json'
import userWalletJsons from '/home/hp/.config/solana/solana_account1.json'
import { PoolProgram } from '../interfaces/pool_program'

// const rpcUrl = process.env.RPC || 'http://127.0.0.1:8899'

// const rpcUrl = process.env.RPC || 'https://api.devnet.solana.com'

const rpcUrl = "https://solana-devnet.g.alchemy.com/v2/xJ3fsIAg3uAbz7rRmVQl1QGM-SwtzFB8"

const commitmentLevel = 'confirmed'
const programInterfacesIDL = JSON.parse(JSON.stringify(poolIdl))
const PRIVATE_KEY_JSON = base58.encode(Uint8Array.from(userWalletJsons))
console.log(`private key is `, PRIVATE_KEY_JSON)
const PRIVATE_KEY = '2YFK1AHmNvShk9t1iBLsDbcyUwTfQNBvPqB8xPCAJBejgfmXy19qcz6snEFntSx8ZMDzjz3LUauBAkzMwUUPGx4j'
const privateKey = new Uint8Array(base58.decode(PRIVATE_KEY))
const userWallet = Keypair.fromSecretKey(privateKey)

export const wallet = new Wallet(userWallet)

export const connection = new Connection(rpcUrl, commitmentLevel)

export const PROGRAM_ID = new PublicKey(poolIdl.metadata.address)

export const provider = new AnchorProvider(connection, wallet, {
  commitment: 'confirmed',
})

export const poolProgram = new Program(programInterfacesIDL, PROGRAM_ID, provider) as Program<PoolProgram>
