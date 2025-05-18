import DesktopMenu from "@/components/menu/public/DesktopMenu";
import Footer from "@/components/menu/public/Footer";
import { getAuthenticatedAppForUser } from "@/lib/firebase/serverApp";

export const dynamic = "force-dynamic"; // Force server component to be dynamic to avoid caching issues with Firebase auth

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