import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Routing Bench: model-agnostic request routing',
  description: 'Independent demo: route workspace questions across model profiles with explicit cost, latency and quality tradeoffs. Simulated answers; not affiliated with OpenTag.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body className="min-h-screen font-sans antialiased">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
          <Link href="/" className="text-base font-semibold text-ink">Routing Bench <span className="font-normal text-mute">independent demo</span></Link>
          <nav className="flex gap-5 text-sm"><Link className="text-ink hover:text-accent" href="/">Routing desk</Link></nav>
        </header>
        {children}
        <footer className="mt-12 border-t border-line py-5 text-xs leading-relaxed text-mute">
          Demo built by Vinil Polepalli. Model profiles are illustrative, answers are simulated locally and no real model is called. Routing decisions, ratings and policy you set are stored in this demo's database under an anonymous browser cookie and shape only your own routing. Independent demo; not affiliated with or endorsed by OpenTag.
        </footer>
      </div>
    </body></html>
  );
}
