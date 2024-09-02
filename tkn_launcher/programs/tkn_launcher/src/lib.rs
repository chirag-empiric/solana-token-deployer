use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};
use token::program::Token;

declare_id!("2on9UwGnxc76b1K566nXcvivQ1kEHeKtCDmwhGXZDM9y");

#[program]
pub mod tkn_launcher {
    use anchor_spl::token::Transfer;

    use super::*;

    pub fn init(ctx: Context<MainContext>) -> Result<()> {
        ctx.accounts.data.master = ctx.accounts.signer.key().to_string();
        Ok(())
    }

    pub fn create_pool(
        ctx: Context<MainContext>,
        base_token: Pubkey,
        quote_token: Pubkey,
        base_token_amount: f64,
        quote_token_amount: f64,
        pool_constant: f64,
    ) -> Result<()> {
        let new_pool = Pool {
            base_token,
            quote_token,
            base_token_amount,
            quote_token_amount,
            pool_constant,
            token_creator: ctx.accounts.signer.key(),
        };

        ctx.accounts.data.pools.push(new_pool);

        Ok(())
    }

    pub fn swap_token(ctx: Context<SwapContext>, token_name: String, quantity: u64) -> Result<()> {
        let cpi_program = ctx.accounts.token_program.to_account_info();
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

    pub fn get_pool(ctx: Context<MainContext>, quote_token: Pubkey) -> Result<Pool> {
        let data = &ctx.accounts.data;
        let pool_data = data
            .pools
            .iter()
            .find(|pool| pool.quote_token == quote_token)
            .unwrap();

        Ok(pool_data.clone())
    }
}

#[account]
pub struct Data {
    pools: Vec<Pool>,
    master: String,
}

impl Data {
    const SIZE: usize = 8 + (88 * 10 + 8 + 24 + 4);
}

#[derive(Clone, AnchorDeserialize, AnchorSerialize, Debug)]
pub struct Pool {
    base_token: Pubkey,      // 32
    quote_token: Pubkey,     // 32
    token_creator: Pubkey,   // 32
    base_token_amount: f64,  // 8
    quote_token_amount: f64, // 8
    pool_constant: f64,      // 8
}

#[derive(Accounts)]
pub struct MainContext<'info> {
    #[account(init_if_needed, payer= signer,seeds=[b"main"], bump, space= Data::SIZE)]
    data: Account<'info, Data>,
    #[account(mut)]
    signer: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(token_name: String)]
pub struct SwapContext<'info> {
    #[account(mut)]
    data: Account<'info, Data>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(
        mut,
        seeds = [token_name.as_bytes()],
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
    token_program: Program<'info, Token>,
}
