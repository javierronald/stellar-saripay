// lib/store.ts
// Simple localStorage-based persistence for demo

export interface Sale {
  id: string
  item: string
  phpAmount: number
  usdcAmount: number
  asset: string
  timestamp: string
  txFrom?: string
}

export interface WalletData {
  publicKey: string
  secretKey: string  // kept for self-funded demo wallet fallback
  funded: boolean
  useFreighter?: boolean  // new: wallet mode
}

const SALES_KEY = 'saripay_sales'
const WALLET_KEY = 'saripay_wallet'

export function getSales(): Sale[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(SALES_KEY) || '[]')
  } catch {
    return []
  }
}

export function addSale(sale: Sale): void {
  const sales = getSales()
  sales.unshift(sale)
  localStorage.setItem(SALES_KEY, JSON.stringify(sales.slice(0, 50)))
}

export function getWallet(): WalletData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(WALLET_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveWallet(wallet: WalletData): void {
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallet))
}

export function clearWallet(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(WALLET_KEY)
}

export function getTodaySales(): Sale[] {
  const today = new Date().toDateString()
  return getSales().filter(
    (s) => new Date(s.timestamp).toDateString() === today
  )
}

export function getTodayTotal(): number {
  return getTodaySales().reduce((sum, s) => sum + s.phpAmount, 0)
}
