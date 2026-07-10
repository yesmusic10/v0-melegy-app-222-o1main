'use client'

import { ReactNode } from 'react'
import Script from 'next/script'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Script 
        src="https://accounts.google.com/gsi/client" 
        async 
        defer 
      />
    </>
  )
}
