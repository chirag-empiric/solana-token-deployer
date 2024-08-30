use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
        Metadata as Metaplex,
    },
    token::{mint_to, transfer, Mint, MintTo, Token, TokenAccount, Transfer},
};

declare_id!("23KNtpFrfCnvGKXF6NjL1wnoNrsoCr59s359RJziQXsA");

#[program]
pub mod token {
    use super::*;

    pub fn initiate_token(
        ctx: Context<InitToken>,
        token_name: String,
        token_symbol: String,
        token_uri: String,
        token_tax: u16,
    ) -> Result<()> {
        let token_name_bytes = token_name.as_bytes();
        let seeds = &[token_name_bytes, &[ctx.bumps.mint]];
        let signer = [&seeds[..]];
        let token_data: DataV2 = DataV2 {
            name: token_name.clone(),
            symbol: token_symbol,
            uri: token_uri,
            seller_fee_basis_points: token_tax,
            creators: None,
            collection: None,
            uses: None,
        };

        let metadatactx = CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                payer: ctx.accounts.payer.to_account_info(),
                update_authority: ctx.accounts.mint.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                metadata: ctx.accounts.metadata.to_account_info(),
                mint_authority: ctx.accounts.mint.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
            &signer,
        );

        create_metadata_accounts_v3(metadatactx, token_data, false, true, None)?;

        msg!("Token mint created successfully.");
        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, token_name: String, quantity: u64) -> Result<()> {
        let token_name_bytes = token_name.as_bytes();
        let seeds = &[token_name_bytes, &[ctx.bumps.mint]];
        let signer = [&seeds[..]];
        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    authority: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                },
                &signer,
            ),
            quantity,
        )?;

        Ok(())
    }

    pub fn transfer_tokens(
        ctx: Context<TransferTokens>,
        token_name: String,
        quantity: u64,
    ) -> Result<()> {
        let token_name_bytes = token_name.as_bytes();
        let seeds = &[token_name_bytes, &[ctx.bumps.mint]];
        let signer = [&seeds[..]];

        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.source.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
                &signer,
            ),
            quantity,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(token_name: String)]
pub struct InitToken<'info> {
    #[account(mut)]
    /// CHECK: UncheckedAccount
    pub metadata: UncheckedAccount<'info>,
    #[account(
        init,
        seeds = [token_name.as_bytes()],
        bump,
        payer = payer,
        mint::decimals = 0,
        mint::authority = mint,
    )]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metaplex>,
}

#[derive(Accounts)]
#[instruction(token_name: String)]
pub struct MintTokens<'info> {
    #[account(
        mut,
        seeds = [token_name.as_bytes()],
        bump,
        mint::authority = mint,
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub destination: Account<'info, TokenAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
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

#[error_code]
pub enum TransferError {
    #[msg("Quantity must be exactly 69.")]
    InvalidQuantity,
}
