/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ['node-forge'],
    },
    typescript: {
        ignoreBuildErrors: false,
    },
};

export default nextConfig;
