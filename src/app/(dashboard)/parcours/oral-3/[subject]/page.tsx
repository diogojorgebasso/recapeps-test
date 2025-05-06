import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import OralRecorder from "./OralRecorder";

// Server component for data fetching
async function getOral(subjectId: string) {
    return await getDoc(doc(db, "oral-3", subjectId));
}

export default async function Page({ params }: { params: Promise<{ subject: string }> }) {
    const { subject } = await params;
    const oralDoc = await getOral(subject);
    const title = oralDoc.data()?.title || "Oral Exercise";

    return <OralRecorder title={title} subjectId={subject} />;
}