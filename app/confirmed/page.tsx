'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function ConfirmedContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [show, setShow] = useState(false)

  const item = searchParams.get('item') || 'Item'
  const php = searchParams.get('php') || '0'
  const xlm = searchParams.get('xlm') || '0'
  const asset = searchParams.get('asset') || 'XLM'

  const now = new Date().toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  useEffect(() => {
    setTimeout(() => setShow(true), 50)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8">
      <div
        className={`text-center transition-all duration-500 ${
          show ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
      >
        {/* Green circle with checkmark */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-36 h-36 rounded-full bg-green-500/10 border-2 border-green-400/30 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-400/50 flex items-center justify-center">
              <span className="text-5xl">✓</span>
            </div>
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-green-400/20 animate-ping" />
        </div>

        {/* Payment Received! */}
        <h1
          className="text-5xl font-bold text-green-400 mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Payment Received!
        </h1>
        <p className="text-slate-400 text-sm mb-8">
          Payment confirmed on Stellar Testnet
        </p>

        {/* Transaction details card */}
        <div className="card p-5 w-full mb-6 text-left">
          <div className="flex justify-between items-center py-3 border-b border-amber-400/10">
            <span className="text-slate-400 text-sm">Item</span>
            <span className="text-white font-medium">{item}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-amber-400/10">
            <span className="text-slate-400 text-sm">Amount (PHP)</span>
            <span className="text-amber-400 font-bold text-xl">₱{Number(php).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-amber-400/10">
            <span className="text-slate-400 text-sm">Stellar Amount</span>
            <span className="text-white text-sm font-mono">{Number(xlm).toFixed(7)} {asset}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-amber-400/10">
            <span className="text-slate-400 text-sm">Network</span>
            <span className="text-white text-sm">Stellar Testnet</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-slate-400 text-sm">Time</span>
            <span className="text-white text-sm">{now}</span>
          </div>
        </div>

        {/* Confirmed badge */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-green-400 text-sm font-medium">
            Confirmed on Stellar Blockchain
          </span>
        </div>

        {/* Action buttons */}
        <button
          onClick={() => router.push('/new-sale')}
          className="btn-gold mb-3"
        >
          + New Sale
        </button>
        <button
          onClick={() => router.push('/')}
          className="btn-ghost w-full"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="absolute bottom-6 text-center text-xs text-slate-700">
        <p>SariPay · Stellar Testnet · Track 2</p>
      </div>
    </div>
  )
}

export default function Confirmed() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-slate-400">Loading...</p>
        </div>
      }
    >
      <ConfirmedContent />
    </Suspense>
  )
}
