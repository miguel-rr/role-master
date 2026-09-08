import type { Metadata } from 'next';
import Link from 'next/link';
import { TvToggle } from './_components/tv-toggle';

export const metadata: Metadata = {
  robots: { index: false },
  title: 'Role Master — Laboratorio de diseño',
};

const SECTIONS = [
  { href: '#portada', label: 'Portada' },
  { href: '#retratos', label: 'Retratos' },
  { href: '#inventario', label: 'Inventario' },
  { href: '#ficha', label: 'Ficha' },
  { href: '#decisiones', label: 'Decisiones' },
  { href: '#tablero', label: 'Tablero' },
  { href: '#dados', label: 'Dados' },
  { href: '#estilo', label: 'Estilo' },
  { href: '/design/scenes', label: 'Escenas' },
];

const DesignLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => (
  <div className="theme-beyond">
    <header className="sticky top-0 z-40 border-brand-legacy border-b bg-charcoal-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-2">
        <Link
          className="font-nodesto text-brass-pale text-xl uppercase tracking-wider"
          href="/design"
        >
          Role Master
        </Link>
        <span className="font-condensed text-charcoal-500 text-xs uppercase tracking-xl">
          Laboratorio de diseño
        </span>
        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {SECTIONS.map((s) => (
            <a
              className={`label-beyond rounded px-2 py-1 text-xs hover:bg-charcoal-800 hover:text-white ${s.href.startsWith('/') ? 'text-brass' : 'text-charcoal-300'}`}
              href={s.href}
              key={s.href}
            >
              {s.label}
            </a>
          ))}
        </nav>
        <TvToggle />
      </div>
    </header>
    {children}
  </div>
);

export default DesignLayout;
