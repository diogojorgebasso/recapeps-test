import DesktopMenu from "@/components/menu/public/DesktopMenu";
import Footer from "@/components/menu/public/Footer";
import { getAuthenticatedAppForUser } from "@/lib/firebase/serverApp";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
    const { user } = await getAuthenticatedAppForUser();

    return (
        <>
            <DesktopMenu initialUser={user?.toJSON()} />
            {children}
            <Footer />
        </>
    );
}