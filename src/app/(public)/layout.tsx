import { ReactNode } from "react";
import DesktopMenu from "@/components/menu/public/DesktopMenu";
import Footer from "@/components/menu/public/Footer";

export default async function PublicLayout({ children }: { children: ReactNode }) {

  return (
    <>
      <DesktopMenu />
      <main>{children} </main>
      <Footer />
    </>
  );
}
