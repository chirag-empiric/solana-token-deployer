// config.js

import { Connection, Keypair } from "@solana/web3.js";
import { Raydium, TxVersion } from "@raydium-io/raydium-sdk-v2";
import bs58 from "bs58";


// Define the connection to Solana devnet
const connection = new Connection("https://api.devnet.solana.com", {
  commitment: "confirmed",
});

const owner = Keypair.fromSecretKey(
  bs58.decode(
    "Q2HfaHdcZuQXqkBGPBghNyW4mz4RwZQqJQqQpafpMyKZuWfaxe6sGgHBMFZ8oH8j6MehZxXgUgqVDryD2suyeWA"
  )
);

//define txVersion and cluster
const txVersion = TxVersion.V0;
const cluster = "devnet";

// Initialize Raydium SDK
const initSdk = async (params) => {
  const raydium = new Raydium({
    connection,
    owner,
    txVersion,
    cluster,
    disableFeatureCheck: true,
    disableLoadToken: !(params && params.loadToken),
    blockhashCommitment: "finalized",
  });

  return raydium;
};

// Export configurations
export { initSdk, txVersion, connection };