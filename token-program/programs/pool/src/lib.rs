use anchor_lang::{
    prelude::*,
    solana_program::{clock::Clock, hash::hash, program::invoke},
};
use anchor_spl::token::{self, Token, TokenAccount, Transfer as SplTransfer};
use std::collections::HashMap;

mod constants;
mod error;

use crate::{constants::*, error::*};
use crate::program::Pool;

declare_id!("mptJpRVYorCevUHLnMEUTcz7XfH4c5Tx1b9ETDujFoZ");

#[program]
pub mod pool {
    use super::*;

    pub fn init_master_account(ctx: Context<InitMasterAccount>, master_account:String) -> Result<()> {
        let master_account_info = &mut ctx.accounts.master;
        master_account_info.master_address = master_account;
        Ok(())
    }

    pub fn create_pool(
        ctx: Context<CreatePool>,
        base_token_account: String,
        quote_token_account: String,
        base_token_amount: f64,
        quote_token_amount: f64,
    ) -> Result<()> {
        let signer = ctx.accounts.signer.key();
        let pool = &mut ctx.accounts.pool;
        let master = &mut ctx.accounts.master;

        let pool_data = PoolData {
            base_token_account: base_token_account,
            quote_token_account: quote_token_account,
            owner: signer,
            base_token_amount,
            quote_token_amount,
            pool_constant: base_token_amount * quote_token_amount,
        };

        pool.pools.push(pool_data);
        master.current_id += 1;
        msg!("Pool created");

        Ok(())
    }

    pub fn get_pool_details(
        ctx: Context<CreatePool>,
        quote_token_account: String,
    ) -> Result<PoolData> {
        let pool = &ctx.accounts.pool;
        let pool_data = pool
            .pools
            .iter()
            .find(|p| p.quote_token_account == quote_token_account)
            .ok_or(PoolError::PoolNotFound)?;
        Ok(pool_data.clone())
    }

    pub fn swap(
        ctx: Context<SwapTokens>,
        base_in_account: String,
        quote_out_account: String,
        token_in_amount: f64,
    ) -> Result<()> {
        let pool_info = &mut ctx.accounts.pool;
        let mut pool_data_opt: Option<&mut PoolData> = None;

        for pool in &mut pool_info.pools {
            if pool.base_token_account == base_in_account {
                pool_data_opt = Some(pool);
                break;
            }
        }

        let pool_data = pool_data_opt.ok_or(PoolError::PoolNotFound)?;

        // Calculate new quote token amount using the constant product formula
        let new_base_token_value = pool_data.base_token_amount + token_in_amount;
        let new_quote_token_value = pool_data.pool_constant / new_base_token_value;

        let quote_out_amount = pool_data.quote_token_amount - new_quote_token_value;

        // Update pool data with new token values
        pool_data.base_token_amount = new_base_token_value;
        pool_data.quote_token_amount = new_quote_token_value;

        // Transfer base tokens from the user to the pool
        let cpi_base_accounts = SplTransfer {
            from: ctx.accounts.from_ata.to_account_info(),
            to: ctx.accounts.to_ata.to_account_info(),
            authority: ctx.accounts.signer.to_account_info(),
        };
        let cpi_base_program = ctx.accounts.token_program.to_account_info();
        token::transfer(
            CpiContext::new(cpi_base_program, cpi_base_accounts),
            token_in_amount as u64,
        )?;

        // Transfer quote tokens from the pool to the user
        let cpi_quote_accounts = SplTransfer {
            from: ctx.accounts.to_ata.to_account_info(),
            to: ctx.accounts.from_ata.to_account_info(),
            authority: ctx.accounts.signer.to_account_info(), // Assuming pool_signer is the pool's authority
        };
        let cpi_quote_program = ctx.accounts.token_program.to_account_info();
        token::transfer(
            CpiContext::new(cpi_quote_program, cpi_quote_accounts),
            quote_out_amount as u64,
        )?;

        Ok(())
    }
}

#[account]
pub struct Master {
    pub current_id: u64,
    pub master_address: String,
}

#[account]
pub struct PoolDetails {
    pub pools: Vec<PoolData>,
}

#[account]
pub struct SwapDetails {
    pub pool_address: String,
    pub base_token: String,
    pub quote_token: String,
    pub swapped_amount: u64,
    pub signer: String,
}

#[derive(Accounts)]
pub struct InitMasterAccount<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 64,
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
        init_if_needed,
        space = 8 + 192,
        seeds = [POOL_SEED.as_bytes()],
        bump,
        payer = signer,
    )]
    pub pool: Account<'info, PoolDetails>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub master: Account<'info, Master>,
}

#[derive(Accounts)]
#[instruction(quote_token_account: String)]
pub struct SwapTokens<'info> {
    #[account(
        init,
        payer = signer,
        space = 4 + 32 + 32 + 32 + 8 + 32,
        seeds = [SWAP_SEED.as_bytes()],
        bump,
    )]
    pub swap: Account<'info, SwapDetails>,
    #[account(mut)]
    pub from_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub pool: Account<'info, PoolDetails>,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct PoolData {
    pub base_token_account: String,
    pub quote_token_account: String,
    pub owner: Pubkey,
    pub base_token_amount: f64,
    pub quote_token_amount: f64,
    pub pool_constant: f64,
}
