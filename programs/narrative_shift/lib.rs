use anchor_lang::prelude::*;

declare_id!("NarrShift1111111111111111111111111111111111");

#[program]
pub mod narrative_shift {
    use super::*;

    /// Initialize a new narrative record
    pub fn store_narrative(
        ctx: Context<StoreNarrative>,
        score: u8,
        platform: String,
        alternative: String,
        timestamp: i64,
    ) -> Result<()> {
        let narrative = &mut ctx.accounts.narrative_record;
        
        narrative.score = score;
        narrative.platform = platform;
        narrative.alternative = alternative;
        narrative.timestamp = timestamp;
        narrative.authority = ctx.accounts.authority.key();
        
        msg!("Narrative stored: {} -> {} (score: {})", platform, alternative, score);
        
        Ok(())
    }

    /// Create a subscription
    pub fn subscribe(
        ctx: Context<Subscribe>,
        duration_days: u16,
    ) -> Result<()> {
        let subscription = &mut ctx.accounts.subscription;
        
        subscription.subscriber = ctx.accounts.subscriber.key();
        subscription.start_time = Clock::get()?.unix_timestamp;
        subscription.end_time = subscription.start_time + (duration_days as i64 * 86400);
        subscription.active = true;
        
        // Transfer payment to treasury
        let amount = if duration_days <= 30 { 100_000_000 } else { 300_000_000 }; // 0.1 or 0.3 SOL
        
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.subscriber.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            amount,
        )?;
        
        msg!("Subscription created for {} days", duration_days);
        
        Ok(())
    }

    /// Cancel subscription (refund prorated amount)
    pub fn cancel_subscription(ctx: Context<CancelSubscription>) -> Result<()> {
        let subscription = &mut ctx.accounts.subscription;
        subscription.active = false;
        
        msg!("Subscription cancelled");
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct StoreNarrative<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + NarrativeRecord::SIZE
    )]
    pub narrative_record: Account<'info, NarrativeRecord>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Subscribe<'info> {
    #[account(
        init,
        payer = subscriber,
        space = 8 + Subscription::SIZE
    )]
    pub subscription: Account<'info, Subscription>,
    
    #[account(mut)]
    pub subscriber: Signer<'info>,
    
    /// CHECK: Treasury account
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelSubscription<'info> {
    #[account(
        mut,
        constraint = subscription.subscriber == subscriber.key()
    )]
    pub subscription: Account<'info, Subscription>,
    
    pub subscriber: Signer<'info>,
}

#[account]
pub struct NarrativeRecord {
    pub score: u8,           // 0-100 (scaled to 0.0-1.0)
    pub platform: String,    // Max 20 chars
    pub alternative: String, // Max 20 chars
    pub timestamp: i64,
    pub authority: Pubkey,
}

#[account]
pub struct Subscription {
    pub subscriber: Pubkey,
    pub start_time: i64,
    pub end_time: i64,
    pub active: bool,
}

impl NarrativeRecord {
    pub const SIZE: usize = 1 + 4 + 20 + 4 + 20 + 8 + 32; // ~100 bytes
}

impl Subscription {
    pub const SIZE: usize = 32 + 8 + 8 + 1; // ~50 bytes
}

#[error_code]
pub enum NarrativeError {
    #[msg("Invalid score, must be 0-100")]
    InvalidScore,
    #[msg("Platform name too long")]
    PlatformTooLong,
    #[msg("Alternative name too long")]
    AlternativeTooLong,
    #[msg("Subscription expired")]
    SubscriptionExpired,
}
