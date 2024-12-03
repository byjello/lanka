import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { PrivyProvider } from '@privy-io/react-auth'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['email', 'google', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#8B5CF6', // Purple to match your theme
          showWalletLoginFirst: false,
        },
      }}
    >
      <Component {...pageProps} />
    </PrivyProvider>
  )
}

export default MyApp
