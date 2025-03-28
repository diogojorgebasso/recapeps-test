import type { Metadata } from "next";
import { Provider } from "@/components/ui/provider"
import Header from "@/components/Header";
import { getAuthenticatedAppForUser } from "@/lib/firebase/serverApp";


export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recap'eps",
  description: "Recap’eps est un outil de révision imparable pour réussir les concours du CAPEPS externe. Que ce soit grâce à nos fiches de révisions thématiques, quiz ou flashcards, réviser n’a jamais été aussi facile.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { currentUser } = await getAuthenticatedAppForUser();

  return (
    <html suppressHydrationWarning lang="en">
      <body>
        <Header initialUser={currentUser?.toJSON()} />
        <Provider >
          {children}
        </Provider>
      </body>
    </html>
  );
}
