import {
  GoogleAuthProvider,
  onAuthStateChanged as _onAuthStateChanged,
  onIdTokenChanged as _onIdTokenChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  NextOrObserver,
  User,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";

import { auth } from "@/lib/firebase/clientApp";

export function onAuthStateChanged(cb: NextOrObserver<User>) {
  return _onAuthStateChanged(auth, cb);
}

export function onIdTokenChanged(cb: NextOrObserver<User>) {
  return _onIdTokenChanged(auth, cb);
}

export async function signInWithGoogle() {

  const provider = new GoogleAuthProvider();

  try {
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
}

export async function signOut() {
  try {
    return auth.signOut();
  } catch (error) {
    console.error("Error signing out with Google", error);
  }
}

// Helper function to send verification email
export async function sendVerificationEmail(user: User | null) {
  if (!user) {
    user = auth.currentUser;
  }

  if (!user) {
    throw new Error("No user is currently signed in");
  }

  try {
    await sendEmailVerification(user);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
}

// Function to sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  try {
    await signInWithEmailAndPassword(auth, email, password);

  } catch (error) {
    console.error("Error signing in with email and password", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

// Function to register a new user with email and password
export async function registerWithEmailAndPassword(
  email: string,
  password: string,
  displayName?: string
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User registered:", user);
    await updateProfile(user, {
      displayName: displayName,
    });
    await sendVerificationEmail(user);

    console.log("User registered:", user);
    return;
  } catch (error) {
    throw error; // Re-throw the error to be handled by the caller
  }
}

// Function to send a password reset email
export async function sendPasswordResetEmail(email: string): Promise<void> {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    console.log("Password reset email sent to", email);
  } catch (error) {
    console.error("Error sending password reset email", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}
