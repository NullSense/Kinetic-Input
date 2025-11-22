import { motion } from 'framer-motion';
import { Timer, MousePointerClick, Mouse, Clock } from 'lucide-react';

/**
 * Timing Behavior Documentation Section
 *
 * Documents the smart auto-close timing behavior
 */
export function TimingBehavior() {
  const timingInfo = [
    {
      icon: MousePointerClick,
      event: 'Pointer Release',
      timeout: '150 ms',
      description: 'After dragging stops, allows quick value adjustments',
      technical: 'settleGracePeriod',
    },
    {
      icon: Mouse,
      event: 'Wheel/Scroll',
      timeout: '800 ms',
      description: 'After scrolling stops, waits for momentum to finish',
      technical: 'wheelIdleTimeout',
    },
    {
      icon: Clock,
      event: 'Idle Browsing',
      timeout: '2.5 s',
      description: 'No interactions detected, auto-closes picker',
      technical: 'idleTimeout',
    },
    {
      icon: Timer,
      event: 'ESC / Click Outside',
      timeout: 'Immediate',
      description: 'Hard close via state machine, no delay',
      technical: 'external close',
    },
  ];

  const presets = [
    { name: 'instant', values: '50ms / 300ms / 1.5s', use: 'Fast data entry' },
    { name: 'fast', values: '100ms / 500ms / 2.5s', use: 'Desktop workflows' },
    {
      name: 'balanced',
      values: '150ms / 800ms / 2.5s',
      use: 'Default - General use',
      isDefault: true,
    },
    { name: 'patient', values: '300ms / 1200ms / 6s', use: 'Mobile / Accessibility' },
  ];

  return (
    <section id="timing" className="py-16 px-4x bg-surface">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-5xl text-accent mb-3x">SMART AUTO-CLOSE</h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Context-aware timing that adapts to your interaction style. No manual close buttons
            needed.
          </p>
        </motion.div>

        {/* Timing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4x mb-12">
          {timingInfo.map((item, index) => (
            <motion.div
              key={item.event}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="glass-subtle p-5x"
            >
              <div className="flex items-center gap-3x mb-3x">
                <div className="text-accent">
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-sm text-fg uppercase tracking-wider">
                    {item.event}
                  </h3>
                  <p className="text-xl font-mono text-accent font-bold">{item.timeout}</p>
                </div>
              </div>
              <p className="text-sm text-muted mb-2x">{item.description}</p>
              <code className="text-xs text-accent/70 font-mono">{item.technical}</code>
            </motion.div>
          ))}
        </div>

        {/* Presets Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.4 }}
          className="glass-subtle p-6x"
        >
          <h3 className="font-display text-2xl text-accent mb-4x text-center">Timing Presets</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-accent/20">
                  <th className="font-mono text-sm text-muted uppercase tracking-wider pb-3x pr-4x">
                    Preset
                  </th>
                  <th className="font-mono text-sm text-muted uppercase tracking-wider pb-3x pr-4x">
                    Timings
                  </th>
                  <th className="font-mono text-sm text-muted uppercase tracking-wider pb-3x">
                    Best For
                  </th>
                </tr>
              </thead>
              <tbody>
                {presets.map((preset) => (
                  <tr
                    key={preset.name}
                    className={`border-b border-accent/10 ${preset.isDefault ? 'bg-accent/5' : ''}`}
                  >
                    <td className="py-3x pr-4x">
                      <code className="text-accent font-mono text-sm">
                        {preset.name}
                        {preset.isDefault && (
                          <span className="ml-2x text-xs text-accent/70">(default)</span>
                        )}
                      </code>
                    </td>
                    <td className="py-3x pr-4x">
                      <code className="text-fg font-mono text-sm">{preset.values}</code>
                    </td>
                    <td className="py-3x text-muted text-sm">{preset.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4x text-center">
            <p className="text-xs text-muted">
              Use <code className="text-accent font-mono">timingPreset</code> prop to customize
              behavior
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
