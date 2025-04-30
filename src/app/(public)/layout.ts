import Header from "@/components/Header";
import { getAuthenticatedAppForUser } from "@/lib/firebase/serverApp";

import { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  const { currentUser } = await getAuthenticatedAppForUser();

  return (
    <>
    <main>{ children } </main>
    </>
  );
}
