import { ReactNode } from "react";
import DesktopMenu from "@/components/menu/public/DesktopMenu";
import MobileMenu from "@/components/menu/public/MobileMenu";
import Footer from "@/components/menu/public/Footer";

export default async function PublicLayout({ children }: { children: ReactNode }) {

  return (
    <>
      <DesktopMenu />
      <MobileMenu />
      <main>{children} </main>
      <Footer />
    </>
  );
}
