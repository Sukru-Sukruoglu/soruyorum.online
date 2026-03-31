import VerifyEmailClient from "./VerifyEmailClient";

export default function VerifyEmailPage({
    searchParams,
}: {
    searchParams?: { token?: string };
}) {
    return <VerifyEmailClient token={searchParams?.token ?? ""} />;
}

