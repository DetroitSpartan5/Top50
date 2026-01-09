/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
        pathname: '/b/**',
      },
      {
        protocol: 'https',
        hostname: 'media.rawg.io',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'is1-ssl.mzstatic.com',
        pathname: '/image/**',
      },
      {
        protocol: 'https',
        hostname: '*.mzstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.thecocktaildb.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
        pathname: '/file/**',
      },
      {
        protocol: 'https',
        hostname: 'lastfm.freetls.fastly.net',
        pathname: '/i/**',
      },
    ],
  },
}

module.exports = nextConfig
