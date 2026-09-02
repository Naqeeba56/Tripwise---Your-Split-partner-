import './globals.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f0fdfa' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://tripwise.app'),
  title: {
    default: 'Tripwise — Smart Group Expense Splitter & Instant UPI Settlement',
    template: '%s | Tripwise',
  },
  description:
    'Split travel and group expenses with friends in seconds. Automatic debt minimization, instant UPI payment deep links, budget tracking, AI travel budget estimator, and PDF settlement receipts.',
  keywords: [
    'Tripwise',
    'group expense splitter',
    'split trip expenses',
    'UPI split bill',
    'travel budget tracker',
    'AI travel cost estimator',
    'debt simplification',
    'GPay settlement',
    'PhonePe split payment',
    'trip organizer',
  ],
  authors: [{ name: 'Mohd Naqeeb' }],
  creator: 'Mohd Naqeeb',
  publisher: 'Tripwise',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tripwise.app',
    siteName: 'Tripwise',
    title: 'Tripwise — Smart Group Expense Splitter & Instant UPI Settlement',
    description:
      'Seamlessly track, split, and settle group trip expenses with direct UPI payments, budget alerts, and AI cost estimation.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Tripwise - Group Expense Splitter',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tripwise — Smart Group Expense Splitter & Instant UPI Settlement',
    description:
      'Track group travel bills, minimize debt transactions, and settle instantly with member UPI IDs.',
    images: ['/og-image.png'],
    creator: '@mohdnaqeeb',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Tripwise',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
  description:
    'Smart group expense splitting and direct UPI payment settlement app with AI budget estimation and travel community meetups.',
  author: {
    '@type': 'Person',
    name: 'Mohd Naqeeb',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
