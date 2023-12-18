import { ColorModeScript } from '@chakra-ui/react'
import type { Metadata } from 'next'
import { fonts } from './fonts'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Autopilot',
  description: 'Autopilot',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={fonts.rubik.variable}>
        <ColorModeScript initialColorMode={"dark"} />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}