use anchor_lang::{prelude::error_code, solana_program::message};

#[error_code]
pub enum PoolError {
    #[msg("Pool Details not found")]
    PoolNotFound,
}

#[error_code]
pub enum SolanaTransferError {
    #[msg("Solana Not Transferred")]
    SolanaNotTransferred,
}
