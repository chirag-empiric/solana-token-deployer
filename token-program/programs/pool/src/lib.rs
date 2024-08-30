use anchor_lang::{
    prelude::*,
    prelude::CpiContext,
    ToAccountInfos,
    solana_program::{clock::Clock, hash::hash, program::invoke},
};

use anchor_spl::token::{self, Token,spl_token, TokenAccount, Transfer as SplTransfer, Mint, TokenAccount, Token};
use anchor_lang::system_program;
use std::collections::HashMap;
use anchor_spl::token_interface::Mint;

// use anchor_spl::{
//     token,
//     token::spl_token,
//     associated_token,
// };

mod constants;
mod error;

use crate::{constants::*, error::*};
// use token_program::program::token_program;

use token_program::program::TokenProgram;
use token_program::accounts::TransferTokens;
use token_program::token_program::transfer_tokens;

declare_id!("2w7YpkzHHEUvGLh1GAou8VDr9Zcn6CWhRUvGjCUdcaPB");

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
        base_in_account: Pubkey,
        quote_out_account: Pubkey,
        token_in_amount: u64,
        token_name: String,
    ) -> Result<()> {
        let seeds = &[token_name.as_bytes(), &[ctx.bumps.mint]];
        let signer_seeds = &[&seeds[..]];

        // Create a CPI context for the transfer_tokens function in the token_program
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferTokens {
                mint: ctx.accounts.mint.to_account_info(),
                source: ctx.accounts.from_ata.to_account_info(),
                destination: ctx.accounts.to_ata.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(), // Include the token_program
                rent: ctx.accounts.rent.to_account_info(), // Include rent
            },
            signer_seeds,
        );

        // Call the transfer_tokens function with the desired quantity
        token_program::transfer_tokens(cpi_ctx, token_name, token_in_amount)?;

        // Log the successful transfer
        msg!("Tokens transferred successfully.");

        Ok(())
    }


    // pub fn swap(
    //     ctx: Context<SwapTokens>,
    //     base_in_account: Pubkey,
    //     quote_out_account: Pubkey,
    //     token_in_amount: f64,
    // ) -> Result<()> {
    //
    //    /* // Define the CPI context for the transfer_tokens call
    //     let seeds = &[token_name.as_bytes(), &[ctx.bumps.mint]];
    //     let signer_seeds = &[&seeds[..]];
    //

    //     );*/

        /*let cpi_ctx = token_program(
            from_ata: ctx.accounts.source.clone(),
            to_ata: ctx.accounts.destination.clone(),
            authority: ctx.accounts.signer.clone(),
        );

        let cpi_context = CpiContext::new(ctx.accounts.program.to_account_info(), cpi_ctx);
        token_program::transfer_tokens(cpi_context, base_in_account, token_in_amount)?;*/


        /*let is_native_and_base_token = base_in_account == spl_token::native_mint::id();

        if is_native_and_base_token {
            system_program::transfer (
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.from_ata.to_account_info(),
                        to: ctx.accounts.to_ata.to_account_info(),
                    },
                ),
                token_in_amount as u64,
            )?
        } else {
            // case SPL token
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    token::Transfer {
                        from: ctx.accounts.from_ata.to_account_info(),
                        to: ctx.accounts.to_ata.to_account_info(),
                        authority: ctx.accounts.from_ata.to_account_info(),
                    },
                ),
                token_in_amount as u64,
            )?
        }*/

        // let pool_info = &mut ctx.accounts.pool;
        // let mut pool_data_opt: Option<&mut PoolData> = None;
        //
        //
        // let pool_data = pool_data_opt.ok_or(PoolError::PoolNotFound)?;
        //
        // let new_base_token_value = pool_data.base_token_amount + token_in_amount;
        // let new_quote_token_value = pool_data.pool_constant / new_base_token_value;
        //
        // let quote_out_amount = pool_data.quote_token_amount - new_quote_token_value;
        //
        // pool_data.base_token_amount = new_base_token_value;
        // pool_data.quote_token_amount = new_quote_token_value;
        //
        // // Transfer base tokens from the user to the pool
        // let cpi_base_accounts = SplTransfer {
        //     from: ctx.accounts.from_ata.to_account_info(),
        //     to: ctx.accounts.to_ata.to_account_info(),
        //     authority: ctx.accounts.signer.to_account_info(),
        // };
        // let cpi_base_program = ctx.accounts.token_program.to_account_info();
        // token::transfer(
        //     CpiContext::new(cpi_base_program, cpi_base_accounts),
        //     token_in_amount as u64,
        // )?;
        //
        // // Transfer quote tokens from the pool to the user
        // let cpi_quote_accounts = SplTransfer {
        //     from: ctx.accounts.to_ata.to_account_info(),
        //     to: ctx.accounts.from_ata.to_account_info(),
        //     authority: ctx.accounts.signer.to_account_info(), // Assuming pool_signer is the pool's authority
        // };
        // let cpi_quote_program = ctx.accounts.token_program.to_account_info();
        // token::transfer(
        //     CpiContext::new(cpi_quote_program, cpi_quote_accounts),
        //     quote_out_amount as u64,
        // )?;

    //     Ok(())
    // }
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
    #[account(
        mut,
        seeds = [token_name.as_bytes()],
        bump,
    )]
    pub mint: Account<'info, Mint>,
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
