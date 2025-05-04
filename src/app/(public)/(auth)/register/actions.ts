"use server";

import { firebaseAdmin } from "@/lib/firebase/serverApp"; // Assuming serverApp exports initialized admin SDK as firebaseAdmin
import { redirect } from "next/navigation";
import { z } from "zod";

const SignUpSchema = z.object({
    email: z.string().email({ message: "Email invalide." }),
    password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }),
});

export type SignUpState = {
    message: string;
    errors?: {
        email?: string[];
        password?: string[];
        _form?: string[];
        terms?: string[];
    };
    fieldValues: {
        email: string;
    }
};

export async function register(state: SignUpState, formData: FormData): Promise<SignUpState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const terms = formData.get("terms") === "on";

    const validatedFields = SignUpSchema.safeParse({
        email: email,
        password: password,
        terms: terms,
    });

    if (!validatedFields.success) {
        return {
            message: "Erreur de validation.",
            errors: validatedFields.error.flatten().fieldErrors,
            fieldValues: { email },
        };
    }

    try {
        // Use Firebase Admin SDK to create the user
        await firebaseAdmin.auth().createUser({
            email: validatedFields.data.email,
            password: validatedFields.data.password,
        });

        // User created successfully, now attempt to login them in on the client
        // Or handle session creation server-side if preferred

    } catch (error: any) {
        console.error("Firebase Admin SDK error:", error);
        let errorMessage = "Une erreur inconnue s'est produite lors de l'inscription.";
        // TODO : Add more specific error handling based on Firebase Admin SDK error codes
        if (error.code === "auth/email-already-exists") {
            errorMessage = "Cet email est déjà utilisé.";
            return {
                message: "Erreur d'inscription.",
                errors: { email: [errorMessage], _form: [errorMessage] },
                fieldValues: { email },
            };
        }
        return {
            message: "Erreur d'inscription.",
            errors: { _form: [errorMessage] },
            fieldValues: { email },
        };
    }

    redirect("/verify-email");

    // This part is technically unreachable due to redirect, but needed for type safety
    // return { message: "Inscription réussie!", fieldValues: { email: "" } };
}