import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import OralRecorder from "./OralRecorder";

// Server component for data fetching
async function getOral(subjectId: string) {
    return await getDoc(doc(db, "oral", subjectId));
}

export default async function Page({ params }: { params: { subject: string } }) {
    const subjectId = params.subject;
    const oralDoc = await getOral(subjectId);
    const title = oralDoc.data()?.title || "Oral Exercise";

    return <OralRecorder title={title} subjectId={subjectId} />;
}