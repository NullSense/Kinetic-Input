import { useState } from 'react';
import { motion } from 'framer-motion';
import { CollapsiblePicker, Picker } from '@tensil/kinetic-input';
import { Code2 } from 'lucide-react';
import { DEMO_PICKERS } from '../config/pickerDefaults';
import { TimePickerExample } from './TimePickerExample';

/**
 * Component Showcase Section
 *
 * Design: Cyber-Editorial Brutalism
 * - Grid layout showing all component variants
 * - Live interactive examples
 * - Code snippets (collapsed by default)
 */
export function ComponentShowcase() {
  const [weight, setWeight] = useState<number>(DEMO_PICKERS.weight.initialValue);
  const [distance, setDistance] = useState<number | string>(DEMO_PICKERS.distance.initialValue);

  return (
    <section id="components" className="py-16 px-4x bg-bg">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-5xl text-accent mb-3x">COMPONENTS</h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Three levels of abstraction. Compact inputs for forms. Inline wheels for dashboards.
            Multi-column foundation for complex pickers.
          </p>
        </motion.div>

        {/* Components Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6x">
          {/* CollapsiblePicker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass-subtle p-6x"
          >
            <div className="flex items-start justify-between mb-4x">
              <div>
                <h3 className="text-xl font-semibold text-fg mb-1x">CollapsiblePicker</h3>
                <p className="text-sm text-muted">Animated input with modal expansion</p>
              </div>
              <Code2 className="w-5 h-5 text-accent" strokeWidth={2} />
            </div>

            <div className="space-y-4x">
              <CollapsiblePicker {...DEMO_PICKERS.weight} value={weight} onChange={setWeight} />

              <div className="pt-4x border-t border-hairline">
                <p className="text-xs text-muted mb-2x">Features:</p>
                <ul className="text-xs text-muted space-y-1">
                  <li>• Momentum scrolling</li>
                  <li>• Haptic feedback</li>
                  <li>• Modal expansion</li>
                  <li>• Keyboard support</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Picker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="glass-subtle p-6x"
          >
            <div className="flex items-start justify-between mb-4x">
              <div>
                <h3 className="text-xl font-semibold text-fg mb-1x">Picker</h3>
                <p className="text-sm text-muted">Lightweight wheel without chrome</p>
              </div>
              <Code2 className="w-5 h-5 text-accent" strokeWidth={2} />
            </div>

            <div className="space-y-4x">
              <Picker {...DEMO_PICKERS.distance} value={distance} onChange={setDistance} />

              <div className="pt-4x border-t border-hairline">
                <p className="text-xs text-muted mb-2x">Features:</p>
                <ul className="text-xs text-muted space-y-1">
                  <li>• Inline display</li>
                  <li>• No modal overlay</li>
                  <li>• Compact footprint</li>
                  <li>• Same physics engine</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* PickerGroup (Multi-column Time Picker) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="glass-subtle p-6x"
          >
            <div className="flex items-start justify-between mb-4x">
              <div>
                <h3 className="text-xl font-semibold text-fg mb-1x">PickerGroup</h3>
                <p className="text-sm text-muted">Multi-column foundation (time picker)</p>
              </div>
              <Code2 className="w-5 h-5 text-accent" strokeWidth={2} />
            </div>

            <div className="space-y-4x">
              <TimePickerExample />

              <div className="pt-4x border-t border-hairline">
                <p className="text-xs text-muted mb-2x">Use cases:</p>
                <ul className="text-xs text-muted space-y-1">
                  <li>• Date/time pickers</li>
                  <li>• Multi-value selection</li>
                  <li>• Custom UIs</li>
                  <li>• Full styling control</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
