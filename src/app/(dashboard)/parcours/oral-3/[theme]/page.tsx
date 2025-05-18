import ClientComponent from "./ClientComponent";

export default async function Page({ params }: { params: Promise<{ theme: string }> }) {
    const { theme } = await params;
    return <ClientComponent theme={theme} />;
}