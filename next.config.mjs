/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.watchOptions = {
      ...(config.watchOptions ?? {}),
      ignored: [
        "**/data/raw/**",
        "**/data/db/**",
        "**/*.mp4",
      ],
    }

    return config
  },
}

export default nextConfig
