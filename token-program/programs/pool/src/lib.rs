use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

mod constants;
mod error;

use crate::{constants::*, error::*};

use token_program::accounts::TransferTokens;
use token_program::program::TokenProgram;

declare_id!("2w7YpkzHHEUvGLh1GAou8VDr9Zcn6CWhRUvGjCUdcaPB");

#[program]
pub mod pool {
    use super::*;

    pub fn init_master_account(
        ctx: Context<InitMasterAccount>,
        master_account: String,
    ) -> Result<()> {
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
        _ctx: Context<SwapTokens>,
        _base_in_account: Pubkey,
        _quote_out_account: Pubkey,
        _token_in_amount: u64,
        _token_name: String,
    ) -> Result<()> {
        // let seeds = &[token_name.as_bytes(), &[ctx.bumps.mint]];
        // let signer_seeds = &[&seeds[..]];
        // let cpi_program = ctx.accounts.token_program.to_account_info();

        // Log the successful transfer
        msg!("Tokens transferred successfully.");

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
#[instruction(token_name: String)]
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
    pub token_program: Program<'info, TokenProgram>,
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
