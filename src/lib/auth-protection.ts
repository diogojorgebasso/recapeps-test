"use server";

import { redirect } from "next/navigation";
import { getAuthenticatedAppForUser } from "@/lib/firebase/serverApp";

export async function requireAuth() {
    const { user } = await getAuthenticatedAppForUser();

    if (!user) {
        redirect("/");
    }

    if (!user.emailVerified) {
        redirect("/verify-email");
    }

    return user;
}
