use anchor_lang::{
    prelude::*,
    solana_program::{clock::Clock, hash::hash, program::invoke},
};
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as SplTransfer};
use std::collections::HashMap;

mod constants;
mod error;

use crate::{constants::*, error::*};
// use crate::program::Pool;

declare_id!("CgeQdEqXnFafzo9qm6BtMMZ4HirKboxxDHDqee7yDNTu");

#[program]
pub mod pool {
    use super::*;
    use anchor_lang::solana_program::system_instruction::transfer;
    use anchor_spl::token::Transfer;

    pub fn init_master_account(
        ctx: Context<InitMasterAccount>,
        master_account: Pubkey,
    ) -> Result<()> {
        let master_account_info = &mut ctx.accounts.master;
        master_account_info.master_address = master_account;
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
        let master = &mut ctx.accounts.master;

        let pool_data = Pool {
            base_token: base_token_account,
            quote_token: quote_token_account,
            token_creator: signer,
            base_token_amount,
            quote_token_amount,
            pool_constant: base_token_amount * quote_token_amount,
        };

        pool.pools.push(pool_data);
        master.current_id += 1;
        msg!("Pool created");

        Ok(())
    }

    pub fn get_pool_details(ctx: Context<CreatePool>, quote_token_account: Pubkey) -> Result<Pool> {
        let pool = &ctx.accounts.pool;
        let pool_data = pool
            .pools
            .iter()
            .find(|p| p.quote_token == quote_token_account)
            .ok_or(PoolError::PoolNotFound)?;
        Ok(pool_data.clone())
    }

    pub fn swap_token(ctx: Context<SwapContext>, token_name: String, quantity: u64) -> Result<()> {
        let cpi_program = ctx.accounts.token_program.to_account_info();

        invoke(
            &transfer(
                &ctx.accounts.signer.key(),
                &ctx.accounts.master.key(),
                10000,
            ),
            &[
                ctx.accounts.signer.to_account_info(),
                ctx.accounts.master.to_account_info(),
            ],
        )?;

        let cpi_accounts = Transfer {
            from: ctx.accounts.source.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };

        let token_name_bytes = token_name.as_bytes();
        let seeds = &[token_name_bytes, &[ctx.bumps.mint]];
        let signer = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        anchor_spl::token::transfer(cpi_context, quantity)?;

        Ok(())
    }
}

#[account]
pub struct Master {
    pub current_id: u64,
    pub master_address: Pubkey,
}

#[account]
pub struct PoolDetails {
    pub pools: Vec<Pool>,
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
        init,
        space = 4 + 4 + 32 + 32 + 32 + 32 + 32 + 32,
        seeds = [POOL_SEED.as_bytes(), &(master.current_id + 1).to_le_bytes()],
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
#[instruction(current_id:u64)]
pub struct SwapContext<'info> {
    #[account(mut)]
    data: Account<'info, PoolDetails>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(
        mut,
        seeds = [SWAP_SEED.as_bytes(), &(master.current_id + 1).to_le_bytes()],
        bump,
    )]
    mint: Account<'info, Mint>,
    #[account(mut)]
    source: Account<'info, TokenAccount>,
    #[account(mut)]
    destination: Account<'info, TokenAccount>,
    #[account(mut)]
    authority: Signer<'info>,
    rent: Sysvar<'info, Rent>,
    #[account(mut)]
    pub master: Account<'info, Master>,
    token_program: Program<'info, Token>,
}

#[derive(Clone, AnchorDeserialize, AnchorSerialize, Debug)]
pub struct Pool {
    base_token: Pubkey,
    quote_token: Pubkey,
    token_creator: Pubkey,
    base_token_amount: f64,
    quote_token_amount: f64,
    pool_constant: f64,
}

// #[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
// pub struct PoolData {
//     pub base_token_account: String,
//     pub quote_token_account: String,
//     pub owner: Pubkey,
//     pub base_token_amount: f64,
//     pub quote_token_amount: f64,
//     pub pool_constant: f64,
// }
