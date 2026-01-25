# Financial OS Flows

## Rider Payment
1. Create payment_intent
2. Funds captured to platform escrow
3. Commission captured to revenue wallet
4. Net credited to driver wallet

## Driver Payout
1. Driver requests payout
2. Funds moved to treasury pending
3. Provider payout initiated
4. Payout settled

## Refund
1. Create refund request
2. Release escrow to rider
3. Provider refund executed

## Dispute
1. Dispute opened
2. Funds moved to disputes wallet
3. Resolution triggers refund or release
