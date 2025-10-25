import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp } from 'lucide-react';

const insights = [
  {
    id: 1,
    title: 'Yamuna Pollution ↑ 12% this week',
    detail: 'Elevated BOD levels detected along the river corridor.',
    icon: <TrendingUp size={16} />,
    tone: 'warning'
  },
  {
    id: 2,
    title: 'South Delhi AQI in critical zone',
    detail: 'Particulate matter spikes during morning commute hours.',
    icon: <AlertTriangle size={16} />,
    tone: 'critical'
  },
  {
    id: 3,
    title: 'Infrastructure uptime at 78%',
    detail: 'Minor road repairs affecting transit speeds in 3 sectors.',
    icon: <TrendingUp size={16} />,
    tone: 'neutral'
  }
];

export default function InsightCards() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium text-zinc-200">Insights</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((card, idx) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
            className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800/70 p-4 hover:ring-zinc-700 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-zinc-400 uppercase tracking-wide">Alert</div>
                <div className="mt-1 text-base font-medium text-zinc-100">{card.title}</div>
                <div className="mt-1 text-sm text-zinc-400">{card.detail}</div>
              </div>
              <div className={`shrink-0 p-2 rounded-lg ${toneBg(card.tone)}`}>{card.icon}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function toneBg(t) {
  switch (t) {
    case 'critical': return 'bg-red-500/15 text-red-300';
    case 'warning': return 'bg-amber-500/15 text-amber-300';
    default: return 'bg-emerald-500/10 text-emerald-300';
  }
}
