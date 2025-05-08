import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";

type FormState =
    | {
        errors?: {
            name?: string[]
            email?: string[]
            password?: string[]
        }
        message?: string
    }
    | undefined


export async function submitContactForm(state: FormState, formData: FormData) {

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    if (!name || !email || !message) {
        return { success: false, error: "All fields are required." };
    }

    try {
        await addDoc(collection(db, "contact"), {
            name,
            email,
            message,
            timestamp: Timestamp.now(),
        });
        return { success: true, message: "Votre message a été envoyé avec succès !" };
    } catch (error) {
        return { success: false, error: "Failed to send message. Please try again." };
    }
}