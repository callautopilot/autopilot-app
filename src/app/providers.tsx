'use client'

import { extendTheme, ChakraProvider } from '@chakra-ui/react'
import { theme } from '@chakra-ui/pro-theme'

const proTheme = extendTheme(theme)
const extendedConfig = {
  colors: {
    ...proTheme.colors,
    brand: proTheme.colors.blue,
  },
}
const customTheme = extendTheme(extendedConfig, proTheme)

// Set and enforce dark mode color scheme
customTheme.config.initialColorMode = "dark";
customTheme.config.useSystemColorMode = false;

export function Providers({ children }: { children: React.ReactNode }) {
  return <ChakraProvider theme={customTheme}>{children}</ChakraProvider>
}