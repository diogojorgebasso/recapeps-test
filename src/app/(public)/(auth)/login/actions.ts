"use server";

import { signInWithEmail } from "@/lib/firebase/auth"; // Use the client-side helper
import { redirect } from "next/navigation";
import { z } from "zod";

const LoginSchema = z.object({
    email: z.string().email({ message: "Email invalide." }),
    password: z.string().min(1, { message: "Le mot de passe est requis." }), // Basic check
});

export type LoginState =
    | {
        message: string;
        errors?: {
            email?: string[];
            password?: string[];
            _form?: string[];
        }
    } | undefined;

export async function login(state: LoginState, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const validatedFields = LoginSchema.safeParse({
        email: email,
        password: password,
    });

    if (!validatedFields.success) {
        return {
            message: "Erreur de validation.",
            errors: validatedFields.error.flatten().fieldErrors,
            fieldValues: { email },
        };
    }

    try {
        // Attempt to login  in using the client-side helper function
        // Note: This still executes on the server, but uses the client SDK config.
        // For true server-side session management, you'd typically use the Admin SDK
        // to verify an ID token passed from the client after Firebase auth.
        // However, for simplicity matching the original structure, we use the helper.
        const userCredential = await signInWithEmail(validatedFields.data.email, validatedFields.data.password);

        if (!userCredential) {
            // Handle case where signIn might return undefined/null based on its implementation
            return {
                message: "Erreur de connexion.",
                errors: { _form: ["Identifiants incorrects ou erreur inconnue."] },
            };
        }

        // Login successful - redirect happens client-side via AuthProvider usually,
        // but we can redirect server-side too.
        // The AuthProvider's onIdTokenChanged should handle setting cookies.

    } catch (error: any) {
        console.error("Firebase login error:", error);
        const errorMessage = "Identifiants incorrects ou erreur serveur.";
        // Example: Check for specific Firebase Auth error codes if needed
        // if (error.code === AuthErrorCodes.INVALID_LOGIN_CREDENTIALS) {
        //   errorMessage = "Identifiants incorrects.";
        // }
        return {
            message: "Erreur de connexion.",
            errors: { _form: [errorMessage] },
        };
    }

    redirect("/dashboard"); // Or redirect based on 'from' state if passed somehow
}
