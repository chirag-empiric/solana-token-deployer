import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import * as assert from "node:assert";
import { PoolProgram } from "../target/types/pool_program";

const { SystemProgram } = anchor.web3;

// anchor run test --tests tests/pool_tests.ts

console.log(`hello`);

describe("pool", () => {
  const program = anchor.workspace.poolProgram as Program<PoolProgram>;
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  console.log(`program is`, program);

  return;

  async function fetchMasterAccount() {
    const masterAccount = await program.account.master.fetch(master.publicKey);

    return masterAccount;
  }

  it("Create the master account", async () => {
    const poolAccount = anchor.web3.Keypair.generate();
    console.log(`calculator`, poolAccount);
    console.log(`random account here`, poolAccount.publicKey);

    console.log(`balance of calculator`);
    console.log(`provider.wallet.publicKey is`, provider.wallet.publicKey);

    await program.rpc.initMasterAccount({
      accounts: {
        master: poolAccount.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [poolAccount],
    });
    const masterAccount = await fetchMasterAccount();
  });
});
