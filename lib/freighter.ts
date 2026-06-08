// lib/freighter.ts
// Freighter wallet integration — testnet only

export interface FreighterState {
  connected: boolean
  publicKey: string | null
  networkPassphrase: string | null
  error: string | null
}

// Check if Freighter extension is installed
export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const { isConnected } = await import('@stellar/freighter-api')
    const result = await isConnected()
    return result.isConnected
  } catch {
    return false
  }
}

// Request connection and get public key
export async function connectFreighter(): Promise<{ publicKey: string | null; error: string | null }> {
  try {
    const { requestAccess, getPublicKey } = await import('@stellar/freighter-api')

    const accessResult = await requestAccess()
    if (accessResult.error) {
      return { publicKey: null, error: accessResult.error }
    }

    const keyResult = await getPublicKey()
    if (keyResult.error) {
      return { publicKey: null, error: keyResult.error }
    }

    return { publicKey: keyResult.publicKey, error: null }
  } catch (err: any) {
    return { publicKey: null, error: err?.message || 'Failed to connect Freighter' }
  }
}

// Get network from Freighter
export async function getFreighterNetwork(): Promise<string | null> {
  try {
    const { getNetworkDetails } = await import('@stellar/freighter-api')
    const result = await getNetworkDetails()
    if (result.error) return null
    return result.networkPassphrase
  } catch {
    return null
  }
}

// Sign and submit a transaction via Freighter
// Returns { success, error }
export async function signAndSubmitWithFreighter(
  transactionXdr: string,
  networkPassphrase: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { signTransaction } = await import('@stellar/freighter-api')

    const signResult = await signTransaction(transactionXdr, {
      networkPassphrase,
    })

    if (signResult.error) {
      return { success: false, error: signResult.error }
    }

    // Submit signed XDR to Horizon
    const { TransactionBuilder } = await import('@stellar/stellar-sdk')
    const signedTx = TransactionBuilder.fromXDR(signResult.signedTxXdr, networkPassphrase)

    const res = await fetch('https://horizon-testnet.stellar.org/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `tx=${encodeURIComponent(signResult.signedTxXdr)}`,
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      const detail = errData?.extras?.result_codes?.transaction || 'Submission failed'
      return { success: false, error: detail }
    }

    return { success: true, error: null }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Signing failed' }
  }
}
