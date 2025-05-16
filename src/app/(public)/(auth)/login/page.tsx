
import { getAuthenticatedAppForUser } from '@/lib/firebase/serverApp';
import ClientComponent from './ClientComponent';

export default async function Page() {

    const { user } = await getAuthenticatedAppForUser();

    console.log("user", user);
    return (<ClientComponent />)
}
