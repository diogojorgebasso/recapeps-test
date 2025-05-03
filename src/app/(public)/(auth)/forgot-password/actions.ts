"use server";

import { sendPasswordResetEmail } from "@/lib/firebase/auth"; // Use the client-side helper
import { z } from "zod";

const ForgotPasswordSchema = z.object({
    email: z.string().email({ message: "Email invalide." }),
});

export type ForgotPasswordState = {
    message: string;
    errors?: {
        email?: string[];
        _form?: string[];
    };
    fieldValues: {
        email: string;
    };
    success?: boolean; // Add success flag
};

export async function forgotPasswordAction(prevState: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
    const email = formData.get("email") as string;

    const validatedFields = ForgotPasswordSchema.safeParse({
        email: email,
    });

    // Return validation errors
    if (!validatedFields.success) {
        return {
            message: "Erreur de validation.",
            errors: validatedFields.error.flatten().fieldErrors,
            fieldValues: { email },
            success: false,
        };
    }

    try {
        // Attempt to send password reset email using the helper function
        await sendPasswordResetEmail(validatedFields.data.email);

        // Email sent successfully
        return {
            message: "Email envoyé!",
            fieldValues: { email: "" }, // Clear email field on success
            success: true,
        };

    } catch (error: any) {
        console.error("Firebase password reset error:", error);
        // Check if the error indicates the email doesn't exist, if possible
        // Firebase often throws a generic error here for security reasons.
        let errorMessage = "Une erreur s'est produite. Vérifiez que l'email est correct ou réessayez plus tard.";

        return {
            message: "Erreur d'envoi.",
            errors: { _form: [errorMessage] },
            fieldValues: { email },
            success: false,
        };
    }

}
