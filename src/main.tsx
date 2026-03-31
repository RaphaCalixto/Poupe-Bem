import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ClerkProvider } from '@clerk/react'
import { ptBR } from '@clerk/localizations'
import { BrowserRouter } from 'react-router-dom'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js')
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* @ts-expect-error - publishable key is resolved via VITE_CLERK_PUBLISHABLE_KEY */}
    <ClerkProvider
      afterSignOutUrl="/"
      signInForceRedirectUrl="/dashboard/resumo"
      signInFallbackRedirectUrl="/dashboard/resumo"
      signUpForceRedirectUrl="/dashboard/resumo"
      signUpFallbackRedirectUrl="/dashboard/resumo"
      localization={ptBR}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
