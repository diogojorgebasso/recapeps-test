"use client"

import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"
import { SubscriptionProvider } from "@/hooks/useSubscription"

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={defaultSystem}>
      <SubscriptionProvider>
        <ColorModeProvider {...props} />
      </SubscriptionProvider>
    </ChakraProvider>
  )
}
