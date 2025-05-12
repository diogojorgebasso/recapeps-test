"use client"; // Error components must be Client Components

export default function Error({ reset }: { reset: () => void }) {

    return (
        <div>
            <h2>Une erreur est survenue!</h2>
            <button
                onClick={
                    () => reset()
                }
            >
                Veuillez réessayer
            </button>
        </div>
    );
}