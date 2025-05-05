'use server';

import { headers } from "next/headers";


export async function checkEmailVerified(): Promise<boolean> {
    try {
        return (await headers()).get("X-User-Email-Verified") === "true";
    } catch (error) {
        console.error("Error checking email verification status:", error);
        return false; // Return false on error
    }
}
