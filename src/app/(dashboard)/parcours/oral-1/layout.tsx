import { requireServerAuth } from "@/lib/firebase/auth-protection"
// server side.
export default async function Layout({ children }: { children: React.ReactNode }) {
    await requireServerAuth()
    return (
        { children }
    )
}