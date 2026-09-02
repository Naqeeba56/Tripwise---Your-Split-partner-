export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tripwise.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/auth/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
