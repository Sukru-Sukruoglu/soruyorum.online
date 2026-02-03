/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
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
};

module.exports = nextConfig;
