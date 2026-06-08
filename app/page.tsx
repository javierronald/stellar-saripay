'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  generateKeypair,
  fundTestnetAccount,
  getAccountBalances,
  shortenKey,
} from '@/lib/stellar'
import {
  getWallet,
  saveWallet,
  clearWallet,
  getTodaySales,
  getTodayTotal,
  WalletData,
  Sale,
} from '@/lib/store'
import { isFreighterInstalled, connectFreighter } from '@/lib/freighter'

type WalletMode = 'none' | 'freighter' | 'testnet'

export default function Dashboard() {
  const router = useRouter()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [walletMode, setWalletMode] = useState<WalletMode>('none')
  const [balance, setBalance] = useState<string>('—')
  const [sales, setSales] = useState<Sale[]>([])
  const [todayTotal, setTodayTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [funding, setFunding] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [freighterAvailable, setFreighterAvailable] = useState(false)
  const [freighterError, setFreighterError] = useState<string | null>(null)
  const [showWalletMenu, setShowWalletMenu] = useState(false)

  const refreshBalance = useCallback(async (publicKey: string) => {
    const balances = await getAccountBalances(publicKey)
    if (balances) {
      const xlm = balances.find((b) => b.asset_type === 'native')
      setBalance(xlm ? parseFloat(xlm.balance).toFixed(2) : '0.00')
    }
  }, [])

  useEffect(() => {
    init()
  }, [])

  async function init() {
    setLoading(true)
    const hasFreighter = await isFreighterInstalled()
    setFreighterAvailable(hasFreighter)

    const w = getWallet()
    if (w) {
      setWallet(w)
      setWalletMode(w.useFreighter ? 'freighter' : 'testnet')
      if (w.funded || w.useFreighter) {
        await refreshBalance(w.publicKey)
      }
    }

    setSales(getTodaySales())
    setTodayTotal(getTodayTotal())
    setLoading(false)
  }

  async function handleConnectFreighter() {
    setConnecting(true)
    setFreighterError(null)

    const { publicKey, error } = await connectFreighter()
    if (error || !publicKey) {
      setFreighterError(error || 'Could not connect')
      setConnecting(false)
      return
    }

    const w: WalletData = {
      publicKey,
      secretKey: '',
      funded: true,
      useFreighter: true,
    }
    saveWallet(w)
    setWallet(w)
    setWalletMode('freighter')
    await refreshBalance(publicKey)
    setConnecting(false)
    setShowWalletMenu(false)
  }

  async function handleGenerateTestnet() {
    setConnecting(true)
    const keypair = await generateKeypair()
    const w: WalletData = {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
      funded: false,
      useFreighter: false,
    }
    saveWallet(w)
    setWallet(w)
    setWalletMode('testnet')
    setConnecting(false)
    setShowWalletMenu(false)
  }

  async function handleFundTestnet() {
    if (!wallet) return
    setFunding(true)
    const ok = await fundTestnetAccount(wallet.publicKey)
    if (ok) {
      const updated = { ...wallet, funded: true }
      saveWallet(updated)
      setWallet(updated)
      await refreshBalance(wallet.publicKey)
    }
    setFunding(false)
  }

  function handleDisconnect() {
    clearWallet()
    setWallet(null)
    setWalletMode('none')
    setBalance('—')
    setSales([])
    setTodayTotal(0)
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isReady =
    walletMode === 'freighter' ||
    (walletMode === 'testnet' && wallet?.funded)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🏪</div>
          <p className="text-slate-400 font-body">Loading store...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-5 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 slide-up">
        <div>
          <h1
            className="gold-text text-3xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            SariPay
          </h1>
          <p className="text-slate-400 text-sm">Stellar Testnet · Track 2</p>
        </div>

        {/* Wallet Info + Menu */}
        <div className="relative">
          {wallet ? (
            <button
              onClick={() => setShowWalletMenu(!showWalletMenu)}
              className="text-right"
            >
              <div className="flex items-center gap-2 justify-end">
                {walletMode === 'freighter' && (
                  <span className="text-xs bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-400/30">
                    Freighter
                  </span>
                )}
                {walletMode === 'testnet' && (
                  <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                    Testnet
                  </span>
                )}
              </div>
              <div className="text-xs font-mono text-amber-400 mt-1">
                {shortenKey(wallet.publicKey)} ▾
              </div>
            </button>
          ) : (
            <button
              onClick={() => setShowWalletMenu(true)}
              className="btn-ghost px-3 py-2 text-sm"
            >
              Connect →
            </button>
          )}

          {/* Dropdown Menu */}
          {showWalletMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-56 card p-3 z-50"
              style={{ border: '1px solid rgba(245,158,11,0.2)' }}
            >
              {freighterAvailable && (
                <button
                  onClick={handleConnectFreighter}
                  disabled={connecting}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-amber-400/10 text-sm text-white mb-1 flex items-center gap-2"
                >
                  <span className="text-lg">🚀</span>
                  <div>
                    <div className="font-medium">Freighter Wallet</div>
                    <div className="text-xs text-slate-400">
                      {connecting ? 'Connecting...' : 'Connect Freighter'}
                    </div>
                  </div>
                </button>
              )}

              {!freighterAvailable && (
                <a
                  href="https://freighter.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-amber-400/10 text-sm text-white mb-1 flex items-center gap-2"
                >
                  <span className="text-lg">🔗</span>
                  <div>
                    <div className="font-medium">Install Freighter</div>
                    <div className="text-xs text-slate-400">freighter.app</div>
                  </div>
                </a>
              )}

              <div className="border-t border-slate-700 my-2" />

              <button
                onClick={handleGenerateTestnet}
                disabled={connecting}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-700 text-sm text-slate-300 flex items-center gap-2"
              >
                <span className="text-lg">🧪</span>
                <div>
                  <div className="font-medium">Testnet Wallet</div>
                  <div className="text-xs text-slate-500">Generate a new wallet</div>
                </div>
              </button>

              {wallet && (
                <>
                  <div className="border-t border-slate-700 my-2" />
                  <button
                    onClick={handleDisconnect}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-red-900/30 text-sm text-red-400"
                  >
                    Disconnect
                  </button>
                </>
              )}

              <button
                onClick={() => setShowWalletMenu(false)}
                className="absolute top-2 right-2 text-slate-600 hover:text-slate-400 text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Freighter error */}
      {freighterError && (
        <div className="card p-3 mb-4 border border-red-500/30 bg-red-900/10">
          <p className="text-red-400 text-sm text-center">{freighterError}</p>
        </div>
      )}

      {/* No wallet state */}
      {!wallet && (
        <div className="card p-8 mb-5 text-center slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="text-4xl mb-4">👛</div>
          <h2
            className="text-white font-bold text-lg mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            No Wallet Connected
          </h2>
          <p className="text-slate-400 text-sm mb-5">
            Connect Freighter or generate a testnet wallet to get started.
          </p>
          <div className="flex flex-col gap-3">
            {freighterAvailable && (
              <button
                onClick={handleConnectFreighter}
                disabled={connecting}
                className="btn-gold"
              >
                🚀 {connecting ? 'Connecting...' : 'Connect Freighter'}
              </button>
            )}
            {!freighterAvailable && (
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold text-center"
                style={{ textDecoration: 'none' }}
              >
                🔗 Install Freighter
              </a>
            )}
            <button
              onClick={handleGenerateTestnet}
              className="btn-ghost"
            >
              🧪 Generate Testnet Wallet
            </button>
          </div>
        </div>
      )}

      {/* Testnet funding prompt */}
      {walletMode === 'testnet' && wallet && !wallet.funded && (
        <div className="card p-5 mb-5 slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="text-center py-2">
            <p className="text-slate-400 text-sm mb-4">
              Fund your wallet first to start accepting payments
            </p>
            <button
              onClick={handleFundTestnet}
              disabled={funding}
              className="btn-gold"
              style={{ fontSize: '16px', padding: '12px 24px', width: 'auto' }}
            >
              {funding ? 'Funding...' : '✦ Fund Testnet Wallet'}
            </button>
          </div>
        </div>
      )}

      {/* Balance Card */}
      {wallet && isReady && (
        <div className="card p-5 mb-5 slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-slate-400 text-xs mb-1">XLM Balance</div>
              <div
                className="text-2xl font-bold text-amber-400"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {balance} <span className="text-sm font-normal text-slate-500">XLM</span>
              </div>
              {walletMode === 'freighter' && (
                <div className="text-xs text-amber-400/60 mt-1">via Freighter</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-xs mb-1">Today&apos;s Sales</div>
              <div
                className="text-2xl font-bold text-green-400"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                ₱{todayTotal.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Sale Button */}
      {wallet && (
        <button
          onClick={() => router.push('/new-sale')}
          className="btn-gold mb-6 slide-up"
          style={{ animationDelay: '0.1s' }}
          disabled={!isReady}
        >
          + New Sale
        </button>
      )}

      {walletMode === 'testnet' && wallet && !wallet.funded && (
        <p className="text-center text-slate-500 text-sm mb-6 -mt-3">
          Fund your wallet first
        </p>
      )}

      {/* Today's Sales */}
      {wallet && (
        <div className="slide-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-white font-bold text-lg"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Today&apos;s Sales
            </h2>
            <span className="text-slate-500 text-sm">{sales.length} sale{sales.length !== 1 ? 's' : ''}</span>
          </div>

          {sales.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-3xl mb-3">🧃</div>
              <p className="text-slate-500 text-sm">No sales yet today.</p>
              <p className="text-slate-600 text-xs mt-1">Tap &quot;New Sale&quot; to get started!</p>
            </div>
          ) : (
            <div className="card px-5 py-2">
              {sales.map((sale) => (
                <div key={sale.id} className="sale-row">
                  <div>
                    <div className="text-white text-sm font-medium">{sale.item}</div>
                    <div className="text-slate-500 text-xs mt-0.5">
                      {formatTime(sale.timestamp)} · {sale.usdcAmount.toFixed(4)} {sale.asset}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-400 font-bold">₱{sale.phpAmount}</div>
                    <div className="badge-confirmed mt-1">PAID</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-8 text-slate-600 text-xs">
        <p>Powered by Stellar Testnet · Freighter Wallet</p>
        <p className="mt-1">StellarX PH · Track 2: Financial Inclusion</p>
      </div>

      {/* Click outside to close wallet menu */}
      {showWalletMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowWalletMenu(false)}
        />
      )}
    </div>
  )
}
