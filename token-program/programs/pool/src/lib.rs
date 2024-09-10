use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as SplTransfer};

mod constants;
mod error;

use crate::{constants::*, error::*};

declare_id!("DtaiArZWpxECk7mw9cM5ccsstWTxc8XKDoxZDTfJjz2z");

#[program]
pub mod pool {
    use super::*;

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
        let current_pool_id = master.current_pool_id + 1;

        let pool_data = Pool {
            pool_id: current_pool_id,
            base_token: base_token_account,
            quote_token: quote_token_account,
            token_creator: signer,
            base_token_amount,
            quote_token_amount,
            pool_constant: base_token_amount * quote_token_amount,
        };
        pool.pools.push(pool_data);
        master.current_pool_id += 1;

        // Log creation
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
        let destination = &ctx.accounts.to_ata;
        let source = &ctx.accounts.from_ata;
        let token_program = &ctx.accounts.token_program;
        let authority = &ctx.accounts.signer;
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

        let cpi_accounts = SplTransfer {
            from: source.to_account_info().clone(),
            to: destination.to_account_info().clone(),
            authority: authority.to_account_info().clone(),
        };
        let cpi_program = token_program.to_account_info();

        token::transfer(
            CpiContext::new(cpi_program, cpi_accounts),
            quote_tkn_to_recieve as u64)?;
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
    #[account(mut)]
    pub from_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(token_name: String)]
pub struct TransferTokens<'info> {
    #[account(
        mut,
        seeds = [token_name.as_bytes()],
        bump,
    )]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub source: Account<'info, TokenAccount>,
    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Clone, AnchorDeserialize, AnchorSerialize, Debug)]
pub struct Pool {
    pool_id: u64,
    base_token: Pubkey,
    quote_token: Pubkey,
    token_creator: Pubkey,
    base_token_amount: u64,
    quote_token_amount: u64,
    pool_constant: u64,
}