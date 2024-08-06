import { PublicKey } from "@solana/web3.js";
import { DEVNET_PROGRAM_ID } from "@raydium-io/raydium-sdk-v2";
import { initSdk, txVersion, connection } from "./config.js";
import { getMint } from "@solana/spl-token";

export const createMarket = async (baseToken, quoteToken) => {
  try {
    const raydium = await initSdk();

    const baseMintInfo = await getMint(connection, new PublicKey(baseToken));
    const quoteMintInfo = await getMint(connection, new PublicKey(quoteToken));

    const { execute, extInfo, transactions } = await raydium.marketV2.create({
      baseInfo: {
        mint: new PublicKey(baseToken), // Base token mint address
        decimals: baseMintInfo.decimals, // Decimal places for base token - probably can be tried by fetching the info dynamically as we can't know decimals for all the tokens
      },
      quoteInfo: {
        mint: new PublicKey(quoteToken), // Quote token mint address
        decimals: quoteMintInfo.decimals, // Decimal places for quote token - same as base token - fetch decimals dynamically somehow
      },
      // lotSize/orderSize means smallest amount of token you can buy or sell
      lotSize: 1, // Lot size/Order Size - what exactly is this? 
      //smallest amount by which price move
      tickSize: 0.0001, // Tick size - impact? what it is? general best value?
      dexProgramId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET, // Devnet Program ID
      txVersion, // from config
    });


    const txIds = await execute({
      sequentially: true, // Send transactions sequentially
    });

    let txHash = txIds?.txIds[1];
    console.log(`https://solscan.io/tx/${txHash}?cluster=devnet`)

    const marketId = Object.keys(extInfo.address).reduce(
      (acc, cur) => ({
        ...acc,
        [cur]: extInfo.address[cur].toBase58(),
      }),
      {}
    ).marketId;

    return marketId;

  } catch (error) {
    console.error("Error creating market:", error);
    if (error.transactionLogs) {
      console.log("Transaction logs:", error.transactionLogs);
    }
  }
};
