import { motion } from 'framer-motion';
import Spline from '@splinetool/react-spline';

export default function Hero() {
  return (
    <section className="relative h-[70vh] min-h-[540px] w-full overflow-hidden">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/6tUXqVcUA0xgJugv/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/30 to-black/60 pointer-events-none" />
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white"
          >
            See Delhi’s Health in Real Time.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
            className="mt-4 text-lg sm:text-xl text-zinc-300 max-w-2xl"
          >
            Air, Water, and Infrastructure combined into one Resource Equity Score (RES).
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-zinc-900/70 backdrop-blur px-5 py-3 ring-1 ring-zinc-700/70"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-zinc-300">Live citywide metrics updating</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
