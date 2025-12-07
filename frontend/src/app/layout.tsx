import type { Metadata } from 'next'
import { DM_Sans, Fraunces, JetBrains_Mono } from 'next/font/google'
import { MainLayout } from '@/components/layouts/MainLayout'
import { PipecatProvider } from '@/providers/PipecatProvider'
import '@/styles/globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Ginger - Voice-First Emotional Reflection Companion',
  description: 'Ginger helps users understand their relationships and themselves through multiple psychological lenses.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased" suppressHydrationWarning>
        <PipecatProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </PipecatProvider>
      </body>
    </html>
  )
}
