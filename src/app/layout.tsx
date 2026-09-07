import '@/styles/globals.css';

import type { Metadata } from 'next';
import { Cinzel, Roboto_Condensed } from 'next/font/google';
import localFont from 'next/font/local';

// Free remakes of the 5e book faces (see src/fonts/5e/LICENSE.md).
const bookinsanity = localFont({
  src: [
    { path: '../fonts/5e/bookinsanity.woff2', weight: '400', style: 'normal' },
    {
      path: '../fonts/5e/bookinsanity-bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/5e/bookinsanity-italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../fonts/5e/bookinsanity-bold-italic.woff2',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-bookinsanity',
  display: 'swap',
});

const mrEaves = localFont({
  src: '../fonts/5e/mr-eaves-small-caps.woff2',
  variable: '--font-mr-eaves',
  display: 'swap',
});

const scalySans = localFont({
  src: [
    { path: '../fonts/5e/scaly-sans.woff2', weight: '400', style: 'normal' },
    {
      path: '../fonts/5e/scaly-sans-bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/5e/scaly-sans-italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../fonts/5e/scaly-sans-bold-italic.woff2',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-scaly-sans',
  display: 'swap',
});

const scalyCaps = localFont({
  src: '../fonts/5e/scaly-sans-caps.woff2',
  variable: '--font-scaly-caps',
  display: 'swap',
});

const nodesto = localFont({
  src: [
    { path: '../fonts/5e/nodesto-caps-condensed.woff2', weight: '400' },
    { path: '../fonts/5e/nodesto-caps-condensed-bold.woff2', weight: '700' },
  ],
  variable: '--font-nodesto',
  display: 'swap',
});

const solbera = localFont({
  src: '../fonts/5e/solbera-imitation-tweak.woff2',
  variable: '--font-solbera',
  display: 'swap',
});

const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-roboto-condensed',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-cinzel',
  display: 'swap',
});

const fontVariables = [
  bookinsanity,
  mrEaves,
  scalySans,
  scalyCaps,
  nodesto,
  solbera,
  robotoCondensed,
  cinzel,
]
  .map((f) => f.variable)
  .join(' ');

// Next statically analyses this binding, so it must be a direct named export
// rather than re-exported at the bottom of the file.
export const metadata: Metadata = {
  // Private project: keep every page out of search engines.
  robots: { index: false, follow: false },
  title: 'Role Master',
  description: 'Una mesa de rol narrada por una IA, para dos jugadores.',
};

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <html className={fontVariables} lang="es" suppressHydrationWarning>
    <body className="min-h-screen antialiased">{children}</body>
  </html>
);

export default RootLayout;
