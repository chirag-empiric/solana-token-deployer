import * as anchor from "@coral-xyz/anchor";
import { web3 } from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TokenProgram } from "../target/types/token_program";
import { assert } from "chai";
import { BN } from "bn.js";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

describe("TESTING TOKEN CREATION", () => {
  // const myKeypair = Keypair.fromSecretKey(Uint8Array.from([129, 66, 188, 237, 45, 153, 77, 40, 148, 67, 90, 123, 31, 246, 178, 113, 131, 162, 186, 180, 212, 186, 105, 143, 10, 56, 188, 63, 211, 56, 161, 38, 74, 45, 234, 236, 131, 169, 174, 25, 123, 33, 209, 201, 63, 95, 93, 40, 231, 90, 225, 62, 157, 204, 122, 52, 93, 138, 199, 40, 34, 136, 104, 129]))
  const myKeypair = Keypair.fromSecretKey(
    Uint8Array.from([
      76, 246, 134, 181, 247, 98, 32, 241, 56, 161, 145, 159, 214, 208, 27, 218,
      172, 56, 129, 6, 147, 218, 221, 242, 149, 201, 167, 109, 3, 32, 42, 174,
      247, 83, 92, 195, 99, 66, 43, 145, 121, 110, 53, 22, 162, 155, 140, 32,
      114, 245, 50, 84, 55, 158, 135, 7, 243, 166, 48, 14, 157, 31, 148, 236,
    ])
  );

  const myWallet = new anchor.Wallet(myKeypair);

  const rpcConnection = new Connection(clusterApiUrl("devnet"), {
    commitment: "confirmed",
  });

  const newProvider = new anchor.AnchorProvider(rpcConnection, myWallet, {
    commitment: "confirmed",
  });

  anchor.setProvider(newProvider);

  const program = anchor.workspace.TokenProgram as Program<TokenProgram>;

  const METADATA_SEED = "metadata";
  const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  const payer = program.provider.publicKey;

  // set the total amount here - 100 Million
  const mintAmount = 100;

  // set the toke decimals - 0 for example - MAKE SURE IT MATCHES THE ONE IN THE ```lib.rs``` file
  const TOKEN_DECIMALS = 0;

  const TOKEN_NAME = "Batman";
  const TOKEN_SYMBOL = "VENGENCE";
  const TOKEN_URI =
    "https://arweave.net/Xjqaj_rYYQGrsiTk9JRqpguA813w6NGPikcRyA1vAHM";
  const TOKEN_TAX = 100; // 100 = 1%

  const [mintWithSeed] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from(TOKEN_NAME)],
    program.programId
  );

  console.log("Mint is: ", mintWithSeed);

  const [metadataAddress] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from(METADATA_SEED),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintWithSeed.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  it("Initialize", async () => {
    const info = await program.provider.connection.getAccountInfo(mintWithSeed);
    if (info) {
      return; // Do not attempt to initialize if already initialized
    }
    console.log("  Mint not found. Initializing Program...");

    const context = {
      metadata: metadataAddress,
      mint: mintWithSeed,
      payer,
      rent: web3.SYSVAR_RENT_PUBKEY,
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    };

    let fundTx = new Transaction();
    fundTx.add(
      SystemProgram.transfer({
        fromPubkey: myKeypair.publicKey,
        toPubkey: mintWithSeed,
        lamports: 0.001 * LAMPORTS_PER_SOL,
      })
    );

    await rpcConnection.sendTransaction(fundTx, [myWallet.payer]);

    const txHash = await program.methods
      .initiateToken(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_URI, TOKEN_TAX)
      .accounts(context)
      .rpc();

    await program.provider.connection.confirmTransaction(txHash, "finalized");
    console.log(`  https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
    const newInfo = await program.provider.connection.getAccountInfo(
      mintWithSeed
    );
    assert(newInfo, "  Mint should be initialized.");
  });

  it("mint tokens", async () => {
    const destination = await anchor.utils.token.associatedAddress({
      mint: mintWithSeed,
      owner: payer,
    });

    let initialBalance: number;

    try {
      const balance = await program.provider.connection.getTokenAccountBalance(
        destination
      );
      initialBalance = balance.value.uiAmount;
    } catch {
      // Token account not yet initiated has 0 balance
      initialBalance = 0;
    }

    const context = {
      mint: mintWithSeed,
      destination,
      payer,
      rent: web3.SYSVAR_RENT_PUBKEY,
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    };

    const txHash = await program.methods
      .mintTokens(TOKEN_NAME, new BN(mintAmount * 10 ** TOKEN_DECIMALS))
      .accounts(context)
      .rpc();
    await program.provider.connection.confirmTransaction(txHash);
    console.log(`  https://explorer.solana.com/tx/${txHash}?cluster=devnet`);

    const postBalance = (
      await program.provider.connection.getTokenAccountBalance(destination)
    ).value.uiAmount;
    assert.equal(
      initialBalance + mintAmount,
      postBalance,
      "Compare balances, it must be equal"
    );
  });

  // return;
  it("transfer tokens", async () => {
    // Get the associated token account addresses for source and destination
    const source = await anchor.utils.token.associatedAddress({
      mint: mintWithSeed,
      owner: payer,
    });

    const destination = await anchor.utils.token.associatedAddress({
      mint: mintWithSeed,
      owner: payer,
    });

    // Initialize or ensure the source account has enough tokens
    await initializeSourceAccount(source, mintWithSeed);

    // Mint some tokens to the source account
    await mintTokensToSourceAccount(
      source,
      mintWithSeed,
      new anchor.BN(1000 * 10 ** TOKEN_DECIMALS)
    );

    // Set up the context for the transferTokens function
    const context = {
      mint: mintWithSeed,
      source: source,
      destination: destination,
      authority: payer,
      rent: web3.SYSVAR_RENT_PUBKEY,
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    };

    // Invoke the transferTokens function with the required quantity
    const txHash = await program.methods
      .transferTokens(TOKEN_NAME, new anchor.BN(69 * 10 ** TOKEN_DECIMALS)) // Transfer 100 tokens
      .accounts(context)
      .rpc();

    // Confirm the transaction on the blockchain
    await program.provider.connection.confirmTransaction(txHash);
    console.log(`https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
  });

  // Helper function to initialize the source account if needed
  async function initializeSourceAccount(source, mint) {
    const sourceAccount = await program.provider.connection.getAccountInfo(
      source
    );
    if (!sourceAccount) {
      const tx = new web3.Transaction().add(
        anchor.utils.token.createAssociatedTokenAccountInstruction(
          // anchor.utils.token.createA
          payer,
          source,
          payer,
          mint
        )
      );
      await program.provider.sendAndConfirm(tx, [], {
        commitment: "confirmed",
      });
    }
  }

  // Helper function to mint tokens to the source account
  async function mintTokensToSourceAccount(source, mint, amount) {
    const context = {
      mint: mint,
      destination: source,
      payer,
      rent: web3.SYSVAR_RENT_PUBKEY,
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    };

    const txHash = await program.methods
      .mintTokens(TOKEN_NAME, new BN(amount * 10 ** TOKEN_DECIMALS))
      .accounts(context)
      .rpc();
    await program.provider.connection.confirmTransaction(txHash);
    console.log("Tokens minted to source account:", txHash);
  }
});


// 