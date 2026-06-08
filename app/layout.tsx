import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SariPay — Stellar POS para sa Lahat',
  description: 'Mobile point-of-sale for sari-sari stores on Stellar testnet. Track 2 — Financial Inclusion.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="store-glow">
        {children}
      </body>
    </html>
  )
}
