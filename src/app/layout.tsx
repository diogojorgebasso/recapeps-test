import { Metadata } from 'next';
import { getTokens } from 'next-firebase-auth-edge';
import { cookies, headers } from 'next/headers';
import { AuthProvider } from '../auth/AuthProvider';
import { toUser } from '../lib/user';
import { Provider } from '@/components/ui/provider';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: "Recap'eps",
  description: "Recap’eps est un outil de révision imparable pour réussir les concours du CAPEPS externe. Que ce soit grâce à nos fiches de révisions thématiques, quiz ou flashcards, réviser n’a jamais été aussi facile.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const tokens = await getTokens(await cookies(), {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    cookieName: 'AuthToken',
    cookieSignatureKeys: process.env.AUTH_COOKIE_SIGNATURE_KEY_CURRENT ? [process.env.AUTH_COOKIE_SIGNATURE_KEY_CURRENT] : [],
    headers: await headers()
  });
  const user = tokens ? toUser(tokens) : null;


  return (
    <html suppressHydrationWarning lang="fr">
      <body>
        <AuthProvider user={user}>
          <Provider >
            {children}
          </Provider>
        </AuthProvider>
      </body>
    </html>
  );
}
