/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['resend'],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;
