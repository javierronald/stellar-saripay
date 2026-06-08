# CLAUDE.md — SariPay v2 Project Context

## What This Is

SariPay is a mobile-first point-of-sale app for Filipino sari-sari store owners built on Stellar Testnet.
It is a submission for StellarX Philippines Hackathon — Track 2: Financial Inclusion & Everyday Payments.

**v2 adds Freighter wallet integration** — merchants can now connect their own non-custodial Stellar wallet
instead of relying on an auto-generated testnet keypair.

## Wallet Modes

### 1. Freighter Wallet (preferred)
- Uses `@stellar/freighter-api` to connect, read public key, and sign transactions
- Merchant's private key NEVER leaves their browser extension
- On "Simulate Payment", builds an unsigned transaction XDR and calls `freighter.signTransaction()`
- Freighter pops up asking user to approve — user signs, dapp submits to Horizon

### 2. Testnet Wallet (fallback / demo)
- Auto-generates a `Keypair.random()` and funds via Friendbot (original v1 behavior)
- Secret key stored in localStorage — acceptable for demo only
- Kept for hackathon judges who may not have Freighter installed

## Key Rules

- **TESTNET ONLY** — never use mainnet. Always use `Networks.TESTNET` and `https://horizon-testnet.stellar.org`
- **No backend** — all Stellar calls go directly to Horizon REST API from the client
- **localStorage** for persistence — sales log and wallet keypair/pubkey
- **Mobile-first** — design for 390px width, large touch targets, readable in sunlight

## Freighter API Used

```ts
import { isConnected, requestAccess, getPublicKey, getNetworkDetails, signTransaction }
  from '@stellar/freighter-api'

// Check if extension installed
await isConnected() → { isConnected: boolean }

// Connect + get pubkey
await requestAccess()
await getPublicKey() → { publicKey: string }

// Sign transaction (pops Freighter UI)
await signTransaction(txXdr, { networkPassphrase }) → { signedTxXdr: string }
```

## File Map

```
app/
  page.tsx          → Dashboard: wallet connect (Freighter or Testnet), balance, sales log
  new-sale/page.tsx → Sale form → QR → polling → Freighter sign or testnet simulate
  confirmed/page.tsx → Bayad Na! screen (unchanged)
  globals.css       → Design tokens, animations
  layout.tsx        → Root layout with fonts
lib/
  stellar.ts        → All Stellar/Horizon calls (unchanged)
  freighter.ts      → NEW: Freighter wallet connect + signAndSubmit helpers
  store.ts          → localStorage helpers; WalletData now has useFreighter flag
```

## UI Language

- Use Filipino strings for user-facing text: "Bagong Benta", "Mga Benta", "Bayad Na!", "Bumalik"
- Use English for technical labels and code comments
- Color palette: navy (#060d1f bg), gold (#f59e0b accent), green (#4ade80 confirmed)

## What NOT to Change

- Network: always TESTNET
- Polling interval: 3 seconds
- Exchange rate: ₱56 = $1, $1 = 10 XLM (hardcoded for demo)
- Font stack: Syne (display) + DM Sans (body)
