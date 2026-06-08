'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  phpToXlm,
  checkPaymentReceived,
  shortenKey,
  HORIZON_URL,
  NETWORK_PASSPHRASE,
} from '@/lib/stellar'
import { getWallet, addSale } from '@/lib/store'
import { signAndSubmitWithFreighter } from '@/lib/freighter'

const QRCodeSVG = dynamic(
  () => import('qrcode.react').then((m) => m.QRCodeSVG),
  { ssr: false }
)

type Step = 'form' | 'qr' | 'waiting'

export default function NewSale() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [item, setItem] = useState('')
  const [phpAmount, setPhpAmount] = useState('')
  const [wallet, setWallet] = useState<{ publicKey: string; secretKey: string; useFreighter?: boolean } | null>(null)
  const [paymentTimestamp] = useState(new Date().toISOString())
  const [simulating, setSimulating] = useState(false)
  const [simulateError, setSimulateError] = useState<string | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const xlmAmount = phpAmount ? phpToXlm(Number(phpAmount)) : 0
  const usdAmount = phpAmount ? (Number(phpAmount) / 56).toFixed(4) : '0.0000'

  const stellarUri = wallet
    ? `web+stellar:pay?destination=${wallet.publicKey}&amount=${xlmAmount}&asset_code=XLM&memo=${encodeURIComponent(item)}`
    : ''

  useEffect(() => {
    const w = getWallet()
    if (!w) { router.push('/'); return }
    setWallet(w)
  }, [router])

  useEffect(() => {
    if (step !== 'waiting' || !wallet) return

    pollRef.current = setInterval(async () => {
      const result = await checkPaymentReceived(wallet.publicKey, paymentTimestamp)
      if (result.received) {
        clearInterval(pollRef.current!)
        addSale({
          id: Date.now().toString(),
          item: item || 'Item',
          phpAmount: Number(phpAmount),
          usdcAmount: xlmAmount,
          asset: result.asset || 'XLM',
          timestamp: new Date().toISOString(),
          txFrom: result.from,
        })
        router.push(
          `/confirmed?item=${encodeURIComponent(item)}&php=${phpAmount}&xlm=${xlmAmount}&asset=${result.asset || 'XLM'}`
        )
      }
    }, 3000)

    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [step, wallet, paymentTimestamp, item, phpAmount, xlmAmount, router])

  async function handleSimulatePayment() {
    if (!wallet || simulating) return
    setSimulating(true)
    setSimulateError(null)

    try {
      if (wallet.useFreighter) {
        const {
          TransactionBuilder,
          Networks,
          Operation,
          Asset,
          BASE_FEE,
          Server,
        } = await import('@stellar/stellar-sdk')

        const server = new Server(HORIZON_URL)
        const account = await server.loadAccount(wallet.publicKey)

        const tx = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: Networks.TESTNET,
        })
          .addOperation(
            Operation.payment({
              destination: wallet.publicKey,
              asset: Asset.native(),
              amount: String(Math.max(xlmAmount, 0.0000001)),
            })
          )
          .setTimeout(30)
          .build()

        const txXdr = tx.toXDR()
        const { success, error } = await signAndSubmitWithFreighter(txXdr, Networks.TESTNET)

        if (!success) {
          console.warn('Freighter sign failed (demo mode continues):', error)
        }
      } else {
        const {
          Keypair,
          Server,
          TransactionBuilder,
          Networks,
          Operation,
          Asset,
          BASE_FEE,
        } = await import('@stellar/stellar-sdk')

        const server = new Server(HORIZON_URL)
        const sourceKeypair = Keypair.fromSecret(wallet.secretKey)
        const account = await server.loadAccount(sourceKeypair.publicKey())

        const tx = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: Networks.TESTNET,
        })
          .addOperation(
            Operation.payment({
              destination: wallet.publicKey,
              asset: Asset.native(),
              amount: String(Math.max(xlmAmount, 0.0000001)),
            })
          )
          .setTimeout(30)
          .build()

        tx.sign(sourceKeypair)
        await server.submitTransaction(tx)
      }
    } catch (err: any) {
      console.error('Simulate error:', err)
      setSimulateError('Something went wrong. Continuing demo anyway...')
    }

    addSale({
      id: Date.now().toString(),
      item: item || 'Item',
      phpAmount: Number(phpAmount),
      usdcAmount: xlmAmount,
      asset: 'XLM',
      timestamp: new Date().toISOString(),
    })
    router.push(
      `/confirmed?item=${encodeURIComponent(item)}&php=${phpAmount}&xlm=${xlmAmount}&asset=XLM`
    )

    setSimulating(false)
  }

  return (
    <div className="min-h-screen px-5 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.push('/')} className="btn-ghost px-3 py-2">
          ← Back
        </button>
        <h1
          className="text-white text-xl font-bold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          New Sale
        </h1>
        {wallet?.useFreighter && (
          <span className="ml-auto text-xs bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-400/30">
            Freighter
          </span>
        )}
      </div>

      {/* STEP 1: Form */}
      {step === 'form' && (
        <div className="slide-up">
          <div className="card p-5 mb-5">
            <label className="block text-slate-400 text-sm mb-2">Item Name</label>
            <input
              className="input-field mb-4"
              placeholder="e.g. Coke 500ml, Chips, Bottled Water..."
              value={item}
              onChange={(e) => setItem(e.target.value)}
            />
            <label className="block text-slate-400 text-sm mb-2">Amount (PHP ₱)</label>
            <input
              className="input-field"
              type="number"
              placeholder="e.g. 25"
              value={phpAmount}
              onChange={(e) => setPhpAmount(e.target.value)}
              min="1"
            />
          </div>

          {phpAmount && Number(phpAmount) > 0 && (
            <div className="card p-4 mb-5 slide-up">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">PHP</span>
                <span className="text-white font-bold">₱{Number(phpAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">≈ USD</span>
                <span className="text-slate-300">${usdAmount}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-amber-400/10 pt-2 mt-2">
                <span className="text-amber-400">≈ XLM</span>
                <span className="text-amber-400 font-bold">{xlmAmount} XLM</span>
              </div>
              <div className="text-xs text-slate-600 mt-2 text-right">
                Rate: ₱56 = $1 · $1 = 10 XLM (demo)
              </div>
            </div>
          )}

          <button
            onClick={() => setStep('qr')}
            className="btn-gold"
            disabled={!item || !phpAmount || Number(phpAmount) <= 0}
          >
            Generate QR Code →
          </button>
        </div>
      )}

      {/* STEP 2: QR Code */}
      {step === 'qr' && (
        <div className="slide-up text-center">
          <div className="card p-6 mb-5">
            <div className="text-slate-400 text-sm mb-1">{item}</div>
            <div
              className="text-amber-400 text-3xl font-bold mb-5"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              ₱{Number(phpAmount).toLocaleString()}
            </div>
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-2xl">
                <QRCodeSVG
                  value={stellarUri}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  level="M"
                />
              </div>
            </div>
            <div className="text-xs text-slate-500 mb-1">Scan with any Stellar wallet</div>
            <div className="text-xs font-mono text-amber-400/60">
              {wallet ? shortenKey(wallet.publicKey) : ''}
            </div>
            <div className="mt-3 bg-navy-900/50 rounded-xl p-3 text-left">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Amount Due</span>
                <span className="text-white">{xlmAmount} XLM</span>
              </div>
            </div>
          </div>

          <button onClick={() => setStep('waiting')} className="btn-gold mb-3">
            Wait for Payment...
          </button>
          <button onClick={() => setStep('form')} className="btn-ghost w-full">
            Edit Item
          </button>
        </div>
      )}

      {/* STEP 3: Waiting / Polling */}
      {step === 'waiting' && (
        <div className="slide-up text-center">
          <div className="card p-8 mb-5">
            <div className="text-5xl mb-4 payment-pulse">⏳</div>
            <h2
              className="text-white text-xl font-bold mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Waiting for Payment
            </h2>
            <p className="text-slate-400 text-sm mb-2">{item}</p>
            <div className="text-amber-400 text-2xl font-bold mb-4">
              ₱{Number(phpAmount).toLocaleString()}
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
              <span className="payment-pulse">●</span>
              <span>Checking Stellar Horizon every 3 seconds...</span>
            </div>
          </div>

          {/* Demo / Freighter simulate button */}
          <div className="card p-4 mb-4">
            {simulateError && (
              <p className="text-amber-400 text-xs mb-2 text-center">{simulateError}</p>
            )}
            <p className="text-slate-400 text-xs mb-3 text-center">
              {wallet?.useFreighter
                ? 'Sign the payment with Freighter for demo'
                : 'For demo — simulate a payment from the testnet wallet'}
            </p>
            <button
              onClick={handleSimulatePayment}
              disabled={simulating}
              className="btn-gold"
              style={{ background: simulating ? '#334155' : undefined }}
            >
              {simulating
                ? wallet?.useFreighter ? 'Waiting for Freighter...' : 'Sending...'
                : wallet?.useFreighter ? '🚀 Sign with Freighter (Demo)' : '🚀 Simulate Payment (Demo)'}
            </button>
          </div>

          <button onClick={() => setStep('qr')} className="btn-ghost w-full">
            ← Back to QR
          </button>
        </div>
      )}
    </div>
  )
}
