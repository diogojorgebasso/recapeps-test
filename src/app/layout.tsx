import { Metadata } from 'next';
import { Provider } from '@/components/ui/provider';
import { ReactNode } from 'react';
import { PushNotificationsProvider } from "@/contexts/PushNotifications";
import { TrackingConsentProvider } from '@/contexts/TrackingConsent';

export const metadata: Metadata = {
  title: "Recap'eps",
  description: "Recap'eps est un outil de révision imparable pour réussir les concours du CAPEPS. Que ce soit grâce à nos fiches de révisions thématiques, quiz, flashcards ou entraînements pour les oraux, réviser n’a jamais été aussi facile.",
};

export const dynamic = "force-dynamic"; // Force server component to be dynamic to avoid caching issues with Firebase auth

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {

  return (
    <html suppressHydrationWarning lang="fr">
      <body>
        <PushNotificationsProvider>
          <TrackingConsentProvider>
            <Provider>
              {children}
            </Provider>
          </TrackingConsentProvider>
        </PushNotificationsProvider>
      </body>
    </html>
  );
}
