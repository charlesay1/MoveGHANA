# MoveGH Payments Fraud Controls

## Risk Signals
- Velocity per rider (per minute, per day)
- Velocity per device (per day)
- Velocity per phone (per day)
- Amount threshold
- Geo mismatch
- Blocked accounts

## Risk Outcomes
- clear: payment proceeds
- review: payment held for manual review
- blocked: payment rejected

## Data Model
- payment_intents.risk_score
- payment_intents.risk_status
- payment_intents.risk_reason
- fraud_flags
- risk_profiles
- blocked_accounts

## Manual Review
- Set blocked_accounts for riders/devices/phones
- Review flagged intents before capture

## Defaults
- FRAUD_MAX_AMOUNT=500
- FRAUD_RIDER_PER_MIN=3
- FRAUD_RIDER_PER_DAY=20
- FRAUD_DEVICE_PER_DAY=10
- FRAUD_PHONE_PER_DAY=10
- FRAUD_HOLD_SCORE=70
- FRAUD_BLOCK_SCORE=90
