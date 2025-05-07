import { Metadata } from 'next';
import { AuthProvider } from '../auth/AuthProvider';
import { Provider } from '@/components/ui/provider';
import { ReactNode } from 'react';
import { getAuthenticatedAppForUser } from "@/lib/firebase/serverApp";

export const metadata: Metadata = {
  title: "Recap'eps",
  description: "Recap'eps est un outil de révision imparable pour réussir les concours du CAPEPS externe. Que ce soit grâce à nos fiches de révisions thématiques, quiz ou flashcards, réviser n’a jamais été aussi facile.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {

  const { user } = await getAuthenticatedAppForUser();

  return (
    <html suppressHydrationWarning lang="fr">
      <body>
        <AuthProvider initialUser={user ? user.toJSON() as any : null}>
          <Provider >
            {children}
          </Provider>
        </AuthProvider>
      </body>
    </html>
  );
}
