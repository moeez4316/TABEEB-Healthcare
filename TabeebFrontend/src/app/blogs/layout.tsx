import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Health Blog | TABEEB - Expert Medical Articles & Health Tips',
  description: 'Read expert health articles from verified doctors. Get reliable medical information, health tips, and wellness advice from trusted healthcare professionals.',
  keywords: 'health blog, medical articles, doctor advice, health tips, wellness, healthcare',
  openGraph: {
    title: 'Health Blog | TABEEB',
    description: 'Expert health articles from verified doctors',
    type: 'website',
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
