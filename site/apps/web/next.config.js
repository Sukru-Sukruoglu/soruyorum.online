/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    transpilePackages: ["@ks-interaktif/ui"],
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    async rewrites() {
        return [
            {
                source: '/esiniBul',
                destination: 'http://ks-esinibul/esiniBul/',
            },
            {
                source: '/esiniBul/:path*',
                destination: 'http://ks-esinibul/esiniBul/:path*',
            },
        ]
    },
};

module.exports = nextConfig;
