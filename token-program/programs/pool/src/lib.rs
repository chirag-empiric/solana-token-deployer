use anchor_lang::{
    prelude::*,
    solana_program::{clock::Clock, hash::hash, program::invoke},
};
use anchor_spl::token::{self, Token, TokenAccount, Transfer as SplTransfer};
use std::collections::HashMap;

mod constants;
mod error;

use crate::{constants::*, error::*};

declare_id!("2aRxvJVKXEb4mMaWrZCyHnPZS4d3BFKbUz93SfgHjUB2");

#[program]
pub mod pool {
    use super::*;

    pub fn init_master_account(ctx: Context<InitMasterAccount>) -> Result<()> {
        let master = &mut ctx.accounts.master;
        Ok(())
    }

    pub fn create_pool(
        ctx: Context<CreatePool>,
        base_token_account: Pubkey,
        quote_token_account: Pubkey,
        base_token_amount: f64,
        quote_token_amount: f64,
    ) -> Result<()> {
        let signer = ctx.accounts.signer.key();
        let pool = &mut ctx.accounts.pool;

        let pool_data = PoolData {
            base_token_account: base_token_account.key(),
            quote_token_account: quote_token_account.key(),
            owner: signer,
            base_token_amount,
            quote_token_amount,
            pool_constant: base_token_amount * quote_token_amount,
        };

        pool.pools.push(pool_data); // Push to Vec
        msg!("Pool created");

        Ok(())
    }

    pub fn get_pool_details(
        ctx: Context<CreatePool>,
        base_token_account: Pubkey,
    ) -> Result<PoolData> {
        let pool = &ctx.accounts.pool;
        let pool_data = pool
            .pools
            .iter()
            .find(|p| p.base_token_account == base_token_account)
            .ok_or(PoolError::PoolNotFound)?;
        Ok(pool_data.clone())
    }

    pub fn swap(
        ctx: Context<CreatePool>,
        base_in_account: Pubkey,
        quote_out_account: Pubkey,
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
            authority: ctx.accounts.master.to_account_info(), // Assuming pool_signer is the pool's authority
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
    pub master_address: String,
}

#[account]
pub struct PoolDetails {
    pub pools: Vec<PoolData>,
}

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
        space = 4 + 4 + 32 + 32 + 32 + 32 + 32 + 32,
        seeds = [POOL_SEED.as_bytes()],
        bump,
        payer = signer,
    )]
    pub pool: Account<'info, PoolDetails>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub from_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub master: Account<'info, Master>,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct PoolData {
    pub base_token_account: Pubkey,
    pub quote_token_account: Pubkey,
    pub owner: Pubkey,
    pub base_token_amount: f64,
    pub quote_token_amount: f64,
    pub pool_constant: f64,
}
