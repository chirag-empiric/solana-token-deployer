use std::collections::HashMap;
use anchor_lang::prelude::*;
mod constants;
mod error;

use crate::{constants::*, error::*};

#[program]
pub mod pool_program {
    use super::*;
    use ::std::collections::HashMap;
    use crate::pool::error::PoolError;

    pub fn init_master_account(ctx: Context<InitMasterAccount>, master_account: String) -> Result<()> {
        let master = &mut ctx.accounts.master;
        master.master_address = master_account;
        Ok(())
    }

    pub fn create_pool(
        ctx: Context<CreatePool>,
        base_account: String,
        quote_account: String,
        base_token_amount: u64,
        quote_token_amount: u64,
    ) -> Result<()> {
        let mut pool_details = HashMap::new();
        let signer: Pubkey = ctx.accounts.signer.key();
        let pool: &mut Account<PoolDetails> = &mut ctx.accounts.pool;

        // let pool_data = PoolData {
        //     owner: signer,
        //     base_account: base_account.clone(),
        //     quote_account: quote_account.clone(),
        //     base_token_amount,
        //     quote_token_amount,
        //     pool_constant: base_token_amount * quote_token_amount,
        // };

        // pool.pool_id = pool.pool_id + 1;
        // pool.owner = signer;
        // pool.base_account = base_account;
        // pool.quote_account = quote_account;
        // pool.base_token_amount = base_token_amount;
        // pool.quote_token_amount = base_token_amount;
        // pool.pool_constant = base_token_amount * quote_token_amount;

        let pool_data = PoolData {
            owner: signer,
            base_account: base_account.clone(),
            quote_account: quote_account.clone(),
            base_token_amount,
            quote_token_amount,
            pool_constant: base_token_amount * quote_token_amount,
        };

        pool.pools.insert(pool.pool_id + 1, pool_data); // Store in the HashMap
        msg!("Pool created");

        Ok(())
    }
    pub fn get_pool_details(
        ctx: Context<CreatePool>,
        pool_id: u64,
    ) -> Result<(PoolData)> {
        let pool = &ctx.accounts.pool;
        let pool_data = pool.pools.get(&pool_id).ok_or(PoolError::PoolNotFound)?;
        Ok(pool_data.clone())
    }
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct PoolData {
    pub owner: Pubkey,
    pub base_account: String,
    pub quote_account: String,
    pub base_token_amount: u64,
    pub quote_token_amount: u64,
    pub pool_constant: u64,
}

#[account]
pub struct Master {
    pub master_address: String,
}

#[account]
pub struct PoolDetails {
    pub pool_id: u64,
    pub pools: HashMap<u64, PoolData>, // Add this field to store multiple pools
}

#[account]
#[derive(Accounts)]
pub struct InitMasterAccount<'info> {
    #[account(
        init,
        payer = payer,
        space = 4 + 8,
        seeds = [MASTER_ACCOUNT_SEED.as_bytes()],
        bump
    )]
    pub master: Account<'info, Master>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreatePool<'info> {
    #[account(
        init,
        seeds = [token_name.as_bytes()],
        bump,
        payer = payer,
    )]
    pub pool: Account<'info, PoolDetails>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub master: Account<'info, Master>,
}