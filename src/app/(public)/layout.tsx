import { ReactNode, Suspense } from "react";
import { Spinner } from "@chakra-ui/react";
import DesktopMenu from "@/components/menu/public/DesktopMenu";
import MobileMenu from "@/components/menu/public/MobileMenu";

export default async function PublicLayout({ children }: { children: ReactNode }) {

  return (
    <>
      <Suspense fallback={<Spinner position="fixed" top={4} left={4} />}>
        <DesktopMenu />
        <MobileMenu />
      </Suspense>
      <main>{children} </main>
    </>
  );
}
