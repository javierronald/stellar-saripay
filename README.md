# SariPay 🏪

> **Stellar POS para sa Sari-Sari Stores** — mobile point-of-sale for Filipino street vendors on Stellar Testnet

**StellarX Philippines · Track 2: Financial Inclusion & Everyday Payments**

---

## The Problem

70% of Filipinos are unbanked or underbanked. Sari-sari store owners and street vendors handle thousands of pesos daily in cash — no digital trail, no savings, no access to financial services. Existing POS systems require a bank account and expensive hardware.

## The Solution

SariPay lets any vendor accept Stellar (XLM/USDC) payments with nothing but a phone and a browser. No bank account. No hardware. No fees beyond Stellar's near-zero transaction cost.

**Core flow:**
1. Merchant enters item name + price in PHP
2. App converts PHP → XLM at a live rate
3. QR code generated with Stellar payment URI
4. Customer scans and pays from any Stellar wallet
5. App polls Horizon API for confirmation
6. **"Bayad Na!"** — instant confirmation screen

---

## Stellar Integration

- **Network:** Stellar Testnet (Horizon: `https://horizon-testnet.stellar.org`)
- **Wallet:** Auto-generated Stellar keypair, funded via Friendbot
- **Payment detection:** Polls `/accounts/{publicKey}/payments` every 3 seconds
- **Asset:** XLM native (USDC-ready)
- **QR format:** `web+stellar:pay?destination=...&amount=...&asset_code=XLM`

Stellar is the **core** of this app — every payment flows through the blockchain, not a centralized ledger.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Stellar | `@stellar/stellar-sdk` v12 |
| QR Code | `qrcode.react` |
| Storage | localStorage (sales log) |
| Language | TypeScript |

---

## Running Locally

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open on mobile or browser
# http://localhost:3000
```

**No `.env` needed** — uses Stellar Testnet (public, free).

---

## Demo Flow

1. Open app → auto-generates merchant wallet
2. Tap **Fund Testnet Wallet** (Friendbot gives free XLM)
3. Tap **Bagong Benta** → enter item + price
4. QR code appears → tap **Naghihintay sa Bayad**
5. Tap **Simulate Payment** (demo mode)
6. App detects payment via Horizon → **Bayad Na!** screen
7. Sale logged in dashboard with today's total

---

## Impact

- **Target users:** ~3M sari-sari stores across the Philippines
- **No bank account required** — just a phone
- **Near-zero fees** — Stellar's base fee is ~0.00001 XLM ($0.000001)
- **Instant settlement** — Stellar confirms in ~5 seconds
- Filipino-language UI — accessible to non-English speakers

---

## Track 2 Fit

This project directly addresses **Financial Inclusion & Everyday Payments**:
- Digitizes a cash workflow for the unbanked
- No KYC required for basic use
- Micropayment-ready (₱5 transactions are viable)
- Brings street vendors into the Stellar ecosystem

---

*Built for StellarX Philippines Hackathon — 90-minute vibe-coded demo*
