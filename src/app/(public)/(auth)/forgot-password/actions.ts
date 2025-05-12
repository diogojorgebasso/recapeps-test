"use server";

import { sendPasswordResetEmail } from "@/lib/firebase/auth";
import { z } from "zod";

const ForgotPasswordSchema = z.object({
    email: z.string().email({ message: "Email invalide." }),
});

type FormState =
    {
        message: string;
        errors?: {
            email?: string[];
        };
        success?: boolean;
    }
    | undefined

export async function forgotPasswordAction(state: FormState, formData: FormData) {
    const email = formData.get("email") as string;

    const validatedFields = ForgotPasswordSchema.safeParse({
        email: email,
    });

    if (!validatedFields.success) {
        return {
            message: "Une erreur est survenue.",
            errors: validatedFields.error.flatten().fieldErrors,
            success: false,
        };
    }

    try {
        await sendPasswordResetEmail(validatedFields.data.email);

        return {
            message: "Email envoyé!",
            success: true,
        };

    } catch (error: any) {
        console.error("Firebase password reset error:", error);
        return {
            message: "Erreur d'envoi.",
            errors: { email: ["Une erreur s'est produite. Vérifiez que l'email est correct ou réessayez plus tard."] },
            success: false,
        };
    }

}
