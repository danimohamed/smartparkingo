import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

/** @type {import('next').NextConfig} — rebuild 2026-03-29 */
const nextConfig = {
    images: {
        qualities: [100, 75],
    },
    async rewrites() {
        return [
            {
                source: '/backend-api/:path*',
                destination: `${backendUrl}/api/:path*`,
            },
        ]
    },
};

export default withNextIntl(nextConfig);
