import { motion } from 'framer-motion';

const interventions = [
  { id: 1, date: 'Oct 22', title: 'Road repair', place: 'Ring Rd, South Delhi', note: 'Pothole patching completed' },
  { id: 2, date: 'Oct 21', title: 'River cleanup', place: 'Yamuna Bank', note: '3.2 tons of waste removed' },
  { id: 3, date: 'Oct 20', title: 'Water treatment', place: 'Okhla STP', note: 'Capacity ramped +10%' },
  { id: 4, date: 'Oct 18', title: 'Air quality audit', place: 'Anand Vihar', note: 'Emission hotspots mapped' },
];

export default function ActionLog() {
  return (
    <section className="space-y-4 pb-6">
      <h2 className="text-lg font-medium text-zinc-200">Field Interventions</h2>
      <div className="rounded-2xl bg-zinc-900 ring-1 ring-zinc-800/70 p-6">
        <ol className="relative border-l border-zinc-800 pl-6">
          {interventions.map((it, idx) => (
            <motion.li
              key={it.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: idx * 0.04 }}
              className="mb-6"
            >
              <span className="absolute -left-2.5 top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px] shadow-emerald-400/20" />
              <div className="text-xs uppercase tracking-wide text-zinc-400">{it.date}</div>
              <div className="mt-1 text-zinc-100 font-medium">{it.title} • <span className="text-zinc-300 font-normal">{it.place}</span></div>
              <div className="text-sm text-zinc-400">{it.note}</div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
