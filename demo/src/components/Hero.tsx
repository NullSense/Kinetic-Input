import { useState } from 'react';
import { motion } from 'framer-motion';
import { CollapsibleNumberPicker } from '@tensil/number-picker';
import { Layers, Smartphone, Zap, Code2 } from 'lucide-react';
import { CapabilitiesIndicator } from './CapabilitiesIndicator';
import { DEMO_PICKERS } from '../config/pickerDefaults';

/**
 * Hero Section
 *
 * Design: Cyber-Editorial Brutalism
 * - Centered layout with live demo
 * - Subtle animations on scroll
 * - Feature stats with icons
 */
export function Hero() {
  const [weight, setWeight] = useState(DEMO_PICKERS.weight.initialValue);
  const [reps, setReps] = useState(DEMO_PICKERS.reps.initialValue);

  const stats = [
    {
      icon: Layers,
      value: 'Virtual',
      label: 'Blazing Fast',
      description: 'Only renders visible items, handles millions of elements',
    },
    {
      icon: Zap,
      value: 'Physics',
      label: 'Smooth Settling',
      description: 'Spring physics with configurable damping',
    },
    {
      icon: Smartphone,
      value: '100%',
      label: 'Mobile-First',
      description: 'Built for touch & haptics',
    },
  ];

  return (
    <section className="min-h-screen pt-32 pb-16 px-4x">
      <div className="container mx-auto max-w-6xl">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-7xl md:text-8xl text-accent mb-4x">
            KINETIC INPUT
          </h1>
          <p className="text-xl md:text-2xl text-fg max-w-3xl mx-auto mb-3x text-balance">
            High-performance momentum-driven number pickers for React.
          </p>
          <p className="text-muted max-w-2xl mx-auto text-balance">
            Built with precision engineering for mobile-first experiences.
            Optimized for touch, haptics, and smooth physics-based settling.
          </p>
        </motion.div>

        {/* Device Capabilities Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="flex justify-center mb-4x"
        >
          <CapabilitiesIndicator />
        </motion.div>

        {/* Live Demo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="glass-subtle p-8x max-w-md mx-auto mb-12"
        >
          <div className="text-center mb-6x">
            <h2 className="text-2xl font-semibold text-fg mb-2x">
              Try it yourself
            </h2>
            <p className="text-sm text-muted">
              Tap to expand • Drag to scrub • Feel the momentum
            </p>
          </div>

          <div className="space-y-4x">
            <CollapsibleNumberPicker
              {...DEMO_PICKERS.weight}
              value={weight}
              onChange={setWeight}
            />

            <CollapsibleNumberPicker
              {...DEMO_PICKERS.reps}
              value={reps}
              onChange={setReps}
            />
          </div>

          <div className="mt-6x pt-6x border-t border-hairline text-center">
            <p className="text-sm text-muted">
              Current selection: <span className="text-accent font-mono font-semibold">{weight} kg × {reps} reps</span>
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4x max-w-4xl mx-auto"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass-subtle p-4x text-center hover:bg-accent/5 transition-colors duration-fast"
            >
              <stat.icon className="w-8 h-8 text-accent mx-auto mb-3x" strokeWidth={2} />
              <div className="font-mono text-3xl font-bold text-fg mb-1x">
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-muted mb-1x">
                {stat.label}
              </div>
              <div className="text-xs text-muted">
                {stat.description}
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="flex justify-center mt-12"
        >
          <a
            href="#snippets"
            className="inline-flex items-center gap-2x px-6x py-3x border border-accent/30 text-accent font-semibold hover:bg-accent/10 transition-all duration-fast focus-accent"
          >
            <Code2 className="w-5 h-5" strokeWidth={2} />
            Try Playground
          </a>
        </motion.div>
      </div>
    </section>
  );
}
