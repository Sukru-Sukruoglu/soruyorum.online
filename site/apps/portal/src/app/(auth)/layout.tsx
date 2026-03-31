export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* Google Fonts – same as landing page */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link
                href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap"
                rel="stylesheet"
            />
            <link
                href="https://fonts.googleapis.com/css2?family=Marcellus&display=swap"
                rel="stylesheet"
            />

            {/* Template CSS from static site (served via Traefik → nginx) */}
            <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
            <link rel="stylesheet" href="/assets/css/animate.min.css" />
            <link rel="stylesheet" href="/assets/css/font-awesome-all.css" />
            <link rel="stylesheet" href="/assets/css/flaticon.css" />
            <link rel="stylesheet" href="/assets/css/module-css/page-header.css" />
            <link rel="stylesheet" href="/assets/css/module-css/footer.css" />
            <link rel="stylesheet" href="/assets/css/module-css/newsletter.css" />
            <link rel="stylesheet" href="/assets/css/module-css/shop.css" />
            <link rel="stylesheet" href="/assets/css/style.css" />
            <link rel="stylesheet" href="/assets/css/responsive.css" />

            {children}
        </>
    );
}
