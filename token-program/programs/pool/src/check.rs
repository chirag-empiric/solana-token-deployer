// pub fn swap_tokens(
//     ctx: Context<SwapContext>,
//     input_amount: u64, // The amount of the input token provided by the user
// ) -> Result<()> {
//     let pool = &mut ctx.accounts.data;
//     let source_account = &ctx.accounts.source;
//     let destination_account = &ctx.accounts.destination;
//     let authority = &ctx.accounts.authority;
//     let token_program = &ctx.accounts.token_program;

//     let mut pool_data = pool
//         .pools
//         .iter_mut()
//         .find(|p| p.base_token == source_account.key() || p.quote_token == source_account.key())
//         .ok_or(PoolError::PoolNotFound)?;

//     // Determine whether the swap is from base -> quote or quote -> base
//     let (input_token, output_token, mut input_amount, mut output_amount) =
//         if pool_data.base_token == source_account.key() {
//             (
//                 &mut pool_data.base_token_amount,
//                 &mut pool_data.quote_token_amount,
//                 pool_data.base_token_amount,
//                 pool_data.quote_token_amount,
//             )
//         } else {
//             (
//                 &mut pool_data.quote_token_amount,
//                 &mut pool_data.base_token_amount,
//                 pool_data.quote_token_amount,
//                 pool_data.base_token_amount,
//             )
//         };

//     // Calculate new output amount based on the constant product formula
//     let new_output_amount = pool_data.pool_constant / (input_amount + *input_token);
//     let output_amount_to_transfer = *output_amount - new_output_amount;

//     // Update the pool state
//     *input_token += input_amount;
//     *output_amount = new_output_amount;

//     // Save updated pool details back into the account
//     pool_data.pool_constant = *input_token * *output_amount;
//     pool.pools.iter_mut().for_each(|p| {
//         if p.base_token == pool_data.base_token && p.quote_token == pool_data.quote_token {
//             *p = pool_data.clone();
//         }
//     });

//     // Transfer the tokens
//     let transfer_ix = SplTransfer {
//         from: source_account.to_account_info(),
//         to: destination_account.to_account_info(),
//         authority: authority.to_account_info(),
//     };

//     token::transfer(
//         CpiContext::new(token_program.to_account_info(), transfer_ix),
//         output_amount_to_transfer as u64,
//     )?;

//     // Update the Solana accounts with the new balances (already done by `token::transfer`)
//     // You might want to log or handle additional data if required

//     Ok(())
// }

// pub fn swap(
//     ctx: Context<CreatePool>,
//     base_in_account: Pubkey,
//     quote_out_account: Pubkey,
//     token_in_amount: f64,
// ) -> Result<()> {
//     let pool_info = &mut ctx.accounts.pool;
//     let mut pool_data_opt: Option<&mut PoolData> = None;

//     for pool in &mut pool_info.pools {
//         if pool.base_token_account == base_in_account {
//             pool_data_opt = Some(pool);
//             break;
//         }
//     }

//     let pool_data = pool_data_opt.ok_or(PoolError::PoolNotFound)?;

//     // Calculate new quote token amount using the constant product formula
//     let new_base_token_value = pool_data.base_token_amount + token_in_amount;
//     let new_quote_token_value = pool_data.pool_constant / new_base_token_value;

//     let quote_out_amount = pool_data.quote_token_amount - new_quote_token_value;

//     // Update pool data with new token values
//     pool_data.base_token_amount = new_base_token_value;
//     pool_data.quote_token_amount = new_quote_token_value;

//     // Transfer base tokens from the user to the pool
//     let cpi_base_accounts = SplTransfer {
//         from: ctx.accounts.from_ata.to_account_info(),
//         to: ctx.accounts.to_ata.to_account_info(),
//         authority: ctx.accounts.signer.to_account_info(),
//     };
//     let cpi_base_program = ctx.accounts.token_program.to_account_info();
//     token::transfer(
//         CpiContext::new(cpi_base_program, cpi_base_accounts),
//         token_in_amount as u64,
//     )?;

//     // Transfer quote tokens from the pool to the user
//     let cpi_quote_accounts = SplTransfer {
//         from: ctx.accounts.to_ata.to_account_info(),
//         to: ctx.accounts.from_ata.to_account_info(),
//         authority: ctx.accounts.master.to_account_info(), // Assuming pool_signer is the pool's authority
//     };
//     let cpi_quote_program = ctx.accounts.token_program.to_account_info();
//     token::transfer(
//         CpiContext::new(cpi_quote_program, cpi_quote_accounts),
//         quote_out_amount as u64,
//     )?;

//     Ok(())
// }

// pub fn swap_token(ctx: Context<SwapContext>, token_name: String, quantity: u64) -> Result<()> {

//     // let cpi_program = ctx.accounts.token_program.to_account_info();
//     // let cpi_accounts = Transfer {
//     //     from: ctx.accounts.source.to_account_info(),
//     //     to: ctx.accounts.destination.to_account_info(),
//     //     authority: ctx.accounts.authority.to_account_info(),
//     // };

//     // let token_name_bytes = token_name.as_bytes();
//     // let seeds = &[token_name_bytes, &[ctx.bumps.mint]];
//     // let signer = &[&seeds[..]];

//     // let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

//     // anchor_spl::token::transfer(cpi_context, quantity)?;

//     // Ok(())
// }
