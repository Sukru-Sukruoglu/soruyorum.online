import { DashboardShell } from "../../components/layout/DashboardShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function DashboardLayout({
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

            {/* Force dark theme overrides for dashboard */}
            <style>{`
                body {
                    --dashboard-shell-bg: #0B192C;
                    --dashboard-shell-surface: linear-gradient(180deg, #0B192C 0%, #0f2035 50%, #0B192C 100%);
                    --dashboard-panel-bg: rgba(255,255,255,0.05);
                    --dashboard-panel-alt-bg: rgba(255,255,255,0.03);
                    --dashboard-panel-hover-bg: rgba(255,255,255,0.08);
                    --dashboard-border-color: rgba(255,255,255,0.1);
                    --dashboard-border-strong: rgba(255,255,255,0.18);
                    --dashboard-heading: #fff;
                    --dashboard-text-primary: #e2e8f0;
                    --dashboard-text-secondary: #94a3b8;
                    --dashboard-text-muted: #64748b;
                    --dashboard-input-bg: rgba(255,255,255,0.05);
                    --dashboard-input-placeholder: #64748b;
                    --dashboard-table-head: #94a3b8;
                    --dashboard-table-text: #e2e8f0;
                    --dashboard-backdrop-blur: blur(8px);
                }
                /* Editor page – override ALL template CSS */
                body.editor-page,
                body.editor-page .page-wrapper,
                html:has(body.editor-page) {
                    background-color: #1a1b2e !important;
                    color: #e2e8f0 !important;
                    overflow: hidden !important;
                }
                /* Headings always white */
                .page-wrapper h1, .page-wrapper h2, .page-wrapper h3,
                .page-wrapper h4, .page-wrapper h5, .page-wrapper h6 {
                    color: var(--dashboard-heading) !important;
                }
                /* Override Tailwind light-theme backgrounds */
                .page-wrapper .bg-white:not(.light-panel) {
                    background-color: var(--dashboard-panel-bg) !important;
                    backdrop-filter: var(--dashboard-backdrop-blur);
                }
                .page-wrapper .bg-gray-50 {
                    background-color: var(--dashboard-panel-alt-bg) !important;
                }
                .page-wrapper .bg-gray-100 {
                    background-color: var(--dashboard-panel-hover-bg) !important;
                }
                /* Override Tailwind light-theme text colors */
                .page-wrapper .text-gray-900 {
                    color: var(--dashboard-text-primary) !important;
                }
                .page-wrapper .text-gray-800 {
                    color: var(--dashboard-text-primary) !important;
                }
                .page-wrapper .text-gray-700 {
                    color: var(--dashboard-text-secondary) !important;
                }
                .page-wrapper .text-gray-600 {
                    color: var(--dashboard-text-secondary) !important;
                }
                .page-wrapper .text-gray-500 {
                    color: var(--dashboard-text-muted) !important;
                }
                /* Override Tailwind light-theme borders */
                .page-wrapper .border-gray-200,
                .page-wrapper .border-gray-100 {
                    border-color: var(--dashboard-border-color) !important;
                }
                .page-wrapper .border-gray-300 {
                    border-color: var(--dashboard-border-strong) !important;
                }
                /* Divide colors */
                .page-wrapper .divide-gray-200 > * + * {
                    border-color: var(--dashboard-border-color) !important;
                }
                /* Hover states */
                .page-wrapper .hover\\:bg-gray-50:hover {
                    background-color: var(--dashboard-panel-hover-bg) !important;
                }
                .page-wrapper .hover\\:bg-gray-100:hover {
                    background-color: var(--dashboard-panel-hover-bg) !important;
                }
                .page-wrapper .hover\\:border-gray-300:hover {
                    border-color: var(--dashboard-border-strong) !important;
                }
                /* Form inputs */
                .page-wrapper input, .page-wrapper select, .page-wrapper textarea {
                    background-color: var(--dashboard-input-bg) !important;
                    border-color: var(--dashboard-border-strong) !important;
                    color: var(--dashboard-text-primary) !important;
                }
                .page-wrapper input::placeholder, .page-wrapper textarea::placeholder {
                    color: var(--dashboard-input-placeholder) !important;
                }
                /* Light panel exception – editor sidebar, modals etc. */
                .light-panel input, .light-panel select, .light-panel textarea {
                    background-color: #fff !important;
                    border-color: #e0e0e0 !important;
                    color: #000 !important;
                }
                .light-panel input::placeholder, .light-panel textarea::placeholder {
                    color: #9ca3af !important;
                }
                .light-panel input:disabled {
                    background-color: #f7f8fa !important;
                    color: #6b7280 !important;
                }
                .light-panel h1, .light-panel h2, .light-panel h3,
                .light-panel h4, .light-panel h5, .light-panel h6 {
                    color: #111827 !important;
                }
                .page-wrapper .light-panel .text-gray-900 { color: #111827 !important; }
                .page-wrapper .light-panel .text-gray-800 { color: #1f2937 !important; }
                .page-wrapper .light-panel .text-gray-700 { color: #374151 !important; }
                .page-wrapper .light-panel .text-gray-600 { color: #4b5563 !important; }
                .page-wrapper .light-panel .text-gray-500 { color: #6b7280 !important; }
                .page-wrapper .light-panel .bg-white { background-color: #ffffff !important; backdrop-filter: none !important; }
                .page-wrapper .light-panel .bg-gray-50 { background-color: #f9fafb !important; }
                .page-wrapper .light-panel .border-gray-200 { border-color: #e5e7eb !important; }
                .page-wrapper .light-panel .border-gray-300 { border-color: #d1d5db !important; }
                /* Table overrides */
                .page-wrapper th {
                    color: var(--dashboard-table-head) !important;
                }
                .page-wrapper td {
                    color: var(--dashboard-table-text) !important;
                }
            `}</style>

            <DashboardShell>{children}</DashboardShell>
        </>
    );
}
