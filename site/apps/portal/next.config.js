/** @type {import('next').NextConfig} */
const path = require('path');

const cspReportOnly = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self' https://www.paytr.com",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://imagedelivery.net https://api.qrserver.com https:",
    "media-src 'self' blob: https:",
    "frame-src 'self' https://www.paytr.com https://customer-bl0til6mmugr9zxr.cloudflarestream.com",
    "connect-src 'self' https://soruyorum.online https://www.soruyorum.online https://api.soruyorum.online https://imagedelivery.net https://api.brevo.com https://www.google-analytics.com https://cloudflareinsights.com https://static.cloudflareinsights.com wss:",
    "report-uri /api/security/csp-report",
].join("; ");

const securityHeaders = [
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
    },
    {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
    },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
    },
    {
        key: 'Content-Security-Policy-Report-Only',
        value: cspReportOnly,
    },
];

const nextConfig = {
    reactStrictMode: false,
    output: 'standalone',
    experimental: {
        outputFileTracingRoot: path.join(__dirname, '../..'),
    },
    transpilePackages: ["@ks-interaktif/ui"],
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: securityHeaders,
            },
            {
                source: '/avatars/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/images/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
