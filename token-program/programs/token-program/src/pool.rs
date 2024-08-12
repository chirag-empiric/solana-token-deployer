use anchor_lang::prelude::*;
mod constants;

use crate::{constants::*};

#[program]
pub mod pool_program {
    use super::*;

    pub fn create_pool(ctx: Context<CreatePool>, base_account: String, quote_account: String, base_token_amount: u64, qoute_token_amount: u64) -> Result<()> {

    }
}

#[derive(Accounts)]
pub struct CreatePool<'info> {
    #[account(
        init,
        seeds = [token_name.as_bytes()],
        bump,
        payer = payer,
        mint::decimals = 0,
        mint::authority = mint,
    )]
    pub pool: Account<'info, Pool>,
}

#[account]
pub struct MasterAccount {
    pub pools:
    // pub owner: Pubkey,
}
