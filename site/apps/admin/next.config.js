/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@ks-interaktif/ui"],
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

module.exports = nextConfig;
