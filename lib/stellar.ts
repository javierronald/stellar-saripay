// lib/stellar.ts
// All Stellar blockchain interactions — testnet only

export const HORIZON_URL = 'https://horizon-testnet.stellar.org'
export const FRIENDBOT_URL = 'https://friendbot.stellar.org'
export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'

// Testnet USDC issuer (Circle)
export const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'

// Fixed exchange rate for demo: 1 USD = 56 PHP
export const PHP_TO_USD_RATE = 56

export function phpToUsdc(phpAmount: number): number {
  return parseFloat((phpAmount / PHP_TO_USD_RATE).toFixed(7))
}

export function phpToXlm(phpAmount: number, xlmPrice = 0.1): number {
  const usd = phpAmount / PHP_TO_USD_RATE
  return parseFloat((usd / xlmPrice).toFixed(7))
}

export function shortenKey(key: string): string {
  return `${key.slice(0, 6)}...${key.slice(-4)}`
}

// Generate a new Stellar keypair
export async function generateKeypair() {
  const { Keypair } = await import('@stellar/stellar-sdk')
  return Keypair.random()
}

// Fund a testnet account via Friendbot
export async function fundTestnetAccount(publicKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`)
    return res.ok
  } catch {
    return false
  }
}

// Get account balances from Horizon
export async function getAccountBalances(publicKey: string) {
  try {
    const res = await fetch(`${HORIZON_URL}/accounts/${publicKey}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.balances as Array<{
      asset_type: string
      asset_code?: string
      asset_issuer?: string
      balance: string
    }>
  } catch {
    return null
  }
}

// Poll for recent incoming payments
export async function getRecentPayments(publicKey: string) {
  try {
    const res = await fetch(
      `${HORIZON_URL}/accounts/${publicKey}/payments?order=desc&limit=5`
    )
    if (!res.ok) return []
    const data = await res.json()
    return data._embedded?.records ?? []
  } catch {
    return []
  }
}

// Check if a new payment arrived after a given timestamp
export async function checkPaymentReceived(
  publicKey: string,
  afterTimestamp: string,
  expectedAmount?: number
): Promise<{ received: boolean; amount?: string; asset?: string; from?: string }> {
  const payments = await getRecentPayments(publicKey)

  for (const payment of payments) {
    if (
      payment.type === 'payment' &&
      payment.to === publicKey &&
      new Date(payment.created_at) > new Date(afterTimestamp)
    ) {
      return {
        received: true,
        amount: payment.amount,
        asset: payment.asset_type === 'native' ? 'XLM' : payment.asset_code,
        from: payment.from,
      }
    }
  }

  return { received: false }
}

// Simulate a payment on testnet (for demo purposes)
// In production, the customer would use their own wallet
export async function simulatePayment(
  fromSecret: string,
  toPublicKey: string,
  amount: string
): Promise<boolean> {
  try {
    const { Keypair, Server, TransactionBuilder, Networks, Operation, Asset, BASE_FEE } =
      await import('@stellar/stellar-sdk')

    const server = new Server(HORIZON_URL)
    const sourceKeypair = Keypair.fromSecret(fromSecret)
    const sourceAccount = await server.loadAccount(sourceKeypair.publicKey())

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination: toPublicKey,
          asset: Asset.native(),
          amount: amount,
        })
      )
      .setTimeout(30)
      .build()

    transaction.sign(sourceKeypair)
    await server.submitTransaction(transaction)
    return true
  } catch (err) {
    console.error('Payment failed:', err)
    return false
  }
}
