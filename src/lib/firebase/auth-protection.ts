"use server";

import { redirect } from "next/navigation";
import { getAuthenticatedAppForUser } from "@/lib/firebase/serverApp";

export async function requireAuth() {
    const { user } = await getAuthenticatedAppForUser();

    if (!user) {
        redirect("/");
    }

    if (!user.emailVerified) {
        // TODO : Study more about the ActionCode.
        redirect("/verify-email");
    }

    return user;
}
