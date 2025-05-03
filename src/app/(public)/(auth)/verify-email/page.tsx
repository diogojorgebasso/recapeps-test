'use client';

import { auth } from '@/lib/firebaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendEmailVerification } from 'firebase/auth';

export default function VerifyEmailPage() {
    const [sentAgain, setSentAgain] = useState(false);
    const [checking, setChecking] = useState(false);
    const router = useRouter();

    // helper that reloads the currentUser and sees if emailVerified flipped
    async function checkVerified() {
        if (!auth.currentUser) return;
        setChecking(true);
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) router.replace('/'); // ✅ go on
        setChecking(false);
    }

    return (
        <main className="flex flex-col items-center gap-4 p-8 text-center">
            <h1 className="text-2xl font-bold">Verify your e-mail</h1>
            <p>
                We’ve just sent a link to <strong>{auth.currentUser?.email}</strong>. <br />
                Click it, then come back and press the button below.
            </p>

            <button onClick={checkVerified} className="border px-4 py-2 rounded">
                {checking ? 'Checking…' : 'I have verified my address'}
            </button>

            <button
                disabled={sentAgain}
                onClick={async () => {
                    if (auth.currentUser) {
                        await sendEmailVerification(auth.currentUser);
                        setSentAgain(true);
                    }
                }}
                className="text-sm underline"
            >
                {sentAgain ? 'Link re-sent!' : 'Send the e-mail again'}
            </button>
        </main>
    );
}
