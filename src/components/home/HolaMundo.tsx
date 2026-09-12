'use client';

import { motion } from 'framer-motion';

export function HolaMundo() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f0c29] text-white">
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(120deg, var(--gradient-1), var(--gradient-2), var(--gradient-3))',
          backgroundSize: '200% 200%',
        }}
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 1.6, stiffness: 260, damping: 20 }}
          className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-mono text-white/90 backdrop-blur-sm"
        >
          TypeScript
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <motion.span
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-7xl font-extrabold tracking-tighter sm:text-8xl md:text-9xl"
          >
            Hola
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
            className="text-7xl font-extrabold tracking-tighter sm:text-8xl md:text-9xl text-blue-400"
          >
            Mundo
          </motion.span>
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 1, ease: 'easeInOut' }}
          className="h-px w-40 origin-left bg-gradient-to-r from-transparent via-white/70 to-transparent"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.3 }}
          className="text-lg font-light tracking-wide text-white/60 sm:text-xl"
        >
          Sistema Fullstack TypeScript en marcha
        </motion.p>
      </div>
    </div>
  );
}
