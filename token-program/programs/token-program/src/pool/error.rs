use anchor_lang::prelude::error_code;

#[error_code]
pub enum PoolError {
    #[msg("Pool Details not found")]
    PoolNotFound
}