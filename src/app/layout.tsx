import '@/styles/globals.css';

import type { Metadata } from 'next';

// Next statically analyses this binding, so it must be a direct named export
// rather than re-exported at the bottom of the file.
export const metadata: Metadata = {
  // Private project: keep every page out of search engines.
  robots: { index: false, follow: false },
  title: 'Role Master',
  description: 'Una mesa de rol narrada por una IA, para dos jugadores.',
};

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <html lang="es">
    <body className="min-h-screen antialiased">{children}</body>
  </html>
);

export default RootLayout;
