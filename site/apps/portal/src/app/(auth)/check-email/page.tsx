import CheckEmailClient from "./CheckEmailClient";

export default function CheckEmailPage({
    searchParams,
}: {
    searchParams?: { email?: string };
}) {
    return <CheckEmailClient email={searchParams?.email ?? ""} />;
}

