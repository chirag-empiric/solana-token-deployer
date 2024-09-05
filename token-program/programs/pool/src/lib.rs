use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as SplTransfer};
use solana_program::system_instruction;

mod constants;
mod error;

use crate::{constants::*, error::*};

declare_id!("8xHGEAniVQrdM2VAmSYQmmBbXcx4HpGNc188AtjU7H12");

#[program]
pub mod pool {
    use super::*;
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
        base_token_amount: u64,
        quote_token_amount: u64,
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
        master.current_pool_id += 1;
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

    pub fn swap(
        ctx: Context<SwapContext>,
        token_out_address: Pubkey,
        amount_in: u64,
    ) -> Result<()> {
        let master = &mut ctx.accounts.master;
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.signer.to_account_info(),
                to: ctx.accounts.recipient.to_account_info(),
            },
        );
        let res = system_program::transfer(cpi_context, amount_in as u64);
        if res.is_ok() {
            msg!("Solana transferred successfully");
        } else {
            return err!(SolanaTransferError::SolanaNotTransferred);
        }
        let pool_info = &mut ctx.accounts.pool;
        let mut pool_data_opt: Option<&mut Pool> = None;
        for pool in &mut pool_info.pools {
            if pool.quote_token == token_out_address {
                pool_data_opt = Some(pool);
                break;
            }
        }
        let pool_data = pool_data_opt.ok_or(PoolError::PoolNotFound)?;
        let new_base_token_value = pool_data.base_token_amount + amount_in;
        let new_quote_token_value = pool_data.pool_constant / new_base_token_value;
        let quote_tkn_to_recieve = pool_data.quote_token_amount - new_quote_token_value;
        pool_data.base_token_amount = new_base_token_value;
        pool_data.quote_token_amount = new_quote_token_value;
        master.current_pool_id += 1;

        Ok(())
    }
}

#[account]
pub struct Master {
    pub master_address: Pubkey,
    pub current_swap_id: u64,
    pub current_pool_id: u64,
}

#[account]
pub struct PoolDetails {
    pub pools: Vec<Pool>,
}

#[account]
pub struct SwapDetails {
    pub pool_address: Pubkey,
    pub base_token: Pubkey,
    pub quote_token: Pubkey,
    pub swapped_amount: u64,
    pub signer: Pubkey,
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
        seeds = [POOL_SEED.as_bytes(), &(master.current_pool_id + 1).to_le_bytes()],
        bump,
        payer = signer,
    )]
    pub pool: Account<'info, PoolDetails>,
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub master: Account<'info, Master>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SwapContext<'info> {
    #[account(mut)]
    signer: Signer<'info>,
    /// CHECK: we do not read or write the data of this account
    #[account(mut)]
    recipient: UncheckedAccount<'info>,
    #[account(mut)]
    pool: Account<'info, PoolDetails>,
    system_program: Program<'info, System>,
    #[account(mut)]
    pub master: Account<'info, Master>,
}

#[derive(Clone, AnchorDeserialize, AnchorSerialize, Debug)]
pub struct Pool {
    base_token: Pubkey,
    quote_token: Pubkey,
    token_creator: Pubkey,
    base_token_amount: u64,
    quote_token_amount: u64,
    pool_constant: u64,
}
