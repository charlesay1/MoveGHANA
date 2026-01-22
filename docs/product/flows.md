# moveGH Product Flows

## Rider Auth Flow
1. Welcome
2. Phone login
3. OTP (6-digit)
4. Profile setup (first-time)
5. Location permission
6. Home map

Routing is centralized in `SessionProvider` based on token, profile completeness, and location readiness.

## Rider Where-to Flow (Phase 2)
1. Home map
2. Tap “Where to?”
3. Destination search + filters (landmarks)
4. Vehicle selection + fare estimate
5. Fare preview
6. Request ride (searching stub)

## Errors & Recovery
- Network errors show toast/snackbar.
- OTP lockout after 5 attempts; 60s cooldown.
- Session expiry triggers logout and reroute to login.
