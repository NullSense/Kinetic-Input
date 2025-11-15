import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CollapsibleNumberPicker,
  StandaloneWheelPicker,
  PickerGroup,
  PickerColumn,
  PickerItem,
} from '@tensil/kinetic-input';
import { Code2 } from 'lucide-react';
import { DEMO_PICKERS } from '../config/pickerDefaults';

/**
 * Component Showcase Section
 *
 * Design: Cyber-Editorial Brutalism
 * - Grid layout showing all component variants
 * - Live interactive examples
 * - Code snippets (collapsed by default)
 */
export function ComponentShowcase() {
  const [weight, setWeight] = useState(DEMO_PICKERS.weight.initialValue);
  const [distance, setDistance] = useState(DEMO_PICKERS.distance.initialValue);
  const [customValue, setCustomValue] = useState('M');

  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL'];

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
          <h2 className="font-display text-5xl text-accent mb-3x">
            COMPONENTS
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Three components, infinite possibilities. From simple number inputs
            to complex multi-column pickers.
          </p>
        </motion.div>

        {/* Components Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6x">
          {/* CollapsibleNumberPicker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass-subtle p-6x"
          >
            <div className="flex items-start justify-between mb-4x">
              <div>
                <h3 className="text-xl font-semibold text-fg mb-1x">
                  CollapsibleNumberPicker
                </h3>
                <p className="text-sm text-muted">
                  Animated input with modal expansion
                </p>
              </div>
              <Code2 className="w-5 h-5 text-accent" strokeWidth={2} />
            </div>

            <div className="space-y-4x">
              <CollapsibleNumberPicker
                {...DEMO_PICKERS.weight}
                value={weight}
                onChange={setWeight}
              />

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

          {/* StandaloneWheelPicker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="glass-subtle p-6x"
          >
            <div className="flex items-start justify-between mb-4x">
              <div>
                <h3 className="text-xl font-semibold text-fg mb-1x">
                  StandaloneWheelPicker
                </h3>
                <p className="text-sm text-muted">
                  Lightweight wheel without chrome
                </p>
              </div>
              <Code2 className="w-5 h-5 text-accent" strokeWidth={2} />
            </div>

            <div className="space-y-4x">
              <StandaloneWheelPicker
                {...DEMO_PICKERS.distance}
                value={distance}
                onChange={setDistance}
              />

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

          {/* PickerGroup (Custom) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="glass-subtle p-6x"
          >
            <div className="flex items-start justify-between mb-4x">
              <div>
                <h3 className="text-xl font-semibold text-fg mb-1x">
                  PickerGroup
                </h3>
                <p className="text-sm text-muted">
                  Low-level API for custom pickers
                </p>
              </div>
              <Code2 className="w-5 h-5 text-accent" strokeWidth={2} />
            </div>

            <div className="space-y-4x">
              <PickerGroup
                className="h-48 glass-subtle"
                value={{ size: customValue }}
                onChange={(newValue: { size: string | number }) => setCustomValue(newValue.size as string)}
              >
                <PickerColumn name="size">
                  {sizeOptions.map((size) => (
                    <PickerItem key={size} value={size}>
                      {size}
                    </PickerItem>
                  ))}
                </PickerColumn>
              </PickerGroup>

              <div className="pt-4x border-t border-hairline">
                <p className="text-xs text-muted mb-2x">Features:</p>
                <ul className="text-xs text-muted space-y-1">
                  <li>• Full control</li>
                  <li>• Multi-column support</li>
                  <li>• Custom styling</li>
                  <li>• Event-driven API</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-center mt-12"
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
