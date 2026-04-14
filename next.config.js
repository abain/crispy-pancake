/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow images from common clothing/fashion CDNs.
    // Restrict to specific trusted domains rather than using '**' (wildcard).
    // Add more domains here as needed for user-uploaded image sources.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.cloudinary.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: 'i.imgur.com' },
    ],
  },
};

module.exports = nextConfig;
