import type { AppProps } from "next/app";
import { PrivyProvider } from "@privy-io/react-auth";
import { Layout } from "@/components/layout";
import { AuthHandler } from "@/components/auth-handler";
import "@/styles/globals.css";
import { Toaster } from "@/components/ui/toaster";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        loginMethods: ["email", "google"],
        appearance: {
          theme: "dark",
          accentColor: "#8B5CF6",
          showWalletLoginFirst: false,
        },
      }}
    >
      <AuthHandler />
      <Layout>
        <Component {...pageProps} />
        <Toaster />
      </Layout>
    </PrivyProvider>
  );
}

export default MyApp;
