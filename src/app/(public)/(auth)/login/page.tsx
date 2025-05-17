
import { getAuthenticatedAppForUser } from '@/lib/firebase/serverApp';
import ClientComponent from './ClientComponent';
import { redirect } from 'next/navigation';
export default async function Page() {

    const { user } = await getAuthenticatedAppForUser();

    if (user) {
        redirect('/parcours/dashboard');
    }
    return (<ClientComponent />)
}
