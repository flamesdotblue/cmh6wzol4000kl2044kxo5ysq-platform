import { useMemo } from 'react';
import Hero from './components/Hero';
import MapPanel from './components/MapPanel';
import InsightCards from './components/InsightCards';
import ActionLog from './components/ActionLog';

export default function App() {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100 selection:bg-emerald-400/30 selection:text-emerald-100">
      <Hero />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <MapPanel />
        <InsightCards />
        <ActionLog />
      </main>
      <footer className="mt-20 border-t border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-200">Delhi Climate Sentinel</span>
            <span className="hidden md:inline">•</span>
            <span className="opacity-80">Powered by AI. Built for Delhi.</span>
          </div>
          <div className="flex items-center gap-4">
            <a className="hover:text-emerald-400 transition-colors" href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a>
            <a className="hover:text-emerald-400 transition-colors" href="https://figma.com/" target="_blank" rel="noreferrer">Figma</a>
            <span className="opacity-60">© {year}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
