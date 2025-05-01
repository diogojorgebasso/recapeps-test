import type { User } from "firebase/auth";

export interface UserProfile {
    hasSeenTour?: boolean;
    lastVisited?: number;         // ms epoch
    abBucket?: "A" | "B";
}

export interface AppUser {
    auth: User;                   // the Firebase Auth object
    profile: UserProfile | null;  // null until fetched
}

