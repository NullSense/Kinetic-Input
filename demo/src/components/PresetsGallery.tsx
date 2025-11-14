import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CollapsibleNumberPicker } from '@tensil/number-picker';
import { Palette, X } from 'lucide-react';
import { DEMO_PICKERS } from '../config/pickerDefaults';

type Preset = {
  id: string;
  name: string;
  description: string;
  theme: {
    bg: string;
    fg: string;
    accent: string;
    border: string;
  };
  pickerTheme: {
    activeTextColor: string;
    closedBorderColor: string;
    closedBackgroundColor: string;
    closedBackgroundColorEmpty: string;
    labelColor: string;
    lastValueButtonColor: string;
    focusRingColor: string;
    highlightBorderColor: string;
    highlightFillColor: string;
    fadeColor: string;
    textColor: string;
  };
};

const presets: Preset[] = [
  {
    id: 'ios',
    name: 'iOS Native',
    description: 'Apple HIG-inspired design',
    theme: {
      bg: 'bg-slate-100',
      fg: 'text-slate-900',
      accent: 'text-blue-500',
      border: 'border-slate-300',
    },
    pickerTheme: {
      activeTextColor: '#3b82f6', // blue-500
      textColor: '#64748b', // slate-500 for non-selected rows
      closedBorderColor: 'rgba(59, 130, 246, 0.5)',
      closedBackgroundColor: 'rgba(241, 245, 249, 0.8)', // slate-100 semi-transparent
      closedBackgroundColorEmpty: 'rgba(226, 232, 240, 0.6)', // slate-200
      labelColor: '#64748b', // slate-500
      lastValueButtonColor: '#3b82f6', // blue-500
      focusRingColor: 'rgba(59, 130, 246, 0.7)',
      highlightBorderColor: 'rgba(59, 130, 246, 0.5)',
      highlightFillColor: 'rgba(59, 130, 246, 0.1)', // blue fill behind selected
      fadeColor: '#f1f5f9', // slate-100 - matches modal bg
    },
  },
  {
    id: 'material',
    name: 'Material Design',
    description: 'Google Material 3',
    theme: {
      bg: 'bg-indigo-50',
      fg: 'text-indigo-950',
      accent: 'text-indigo-600',
      border: 'border-indigo-200',
    },
    pickerTheme: {
      activeTextColor: '#4f46e5', // indigo-600
      textColor: '#6366f1', // indigo-500 for non-selected rows
      closedBorderColor: 'rgba(79, 70, 229, 0.5)',
      closedBackgroundColor: 'rgba(238, 242, 255, 0.8)', // indigo-50 semi-transparent
      closedBackgroundColorEmpty: 'rgba(224, 231, 255, 0.6)', // indigo-100
      labelColor: '#6366f1', // indigo-500
      lastValueButtonColor: '#4f46e5', // indigo-600
      focusRingColor: 'rgba(79, 70, 229, 0.7)',
      highlightBorderColor: 'rgba(79, 70, 229, 0.5)',
      highlightFillColor: 'rgba(79, 70, 229, 0.1)', // indigo fill
      fadeColor: '#eef2ff', // indigo-50 - matches modal bg
    },
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    description: 'Bold & high contrast',
    theme: {
      bg: 'bg-yellow-400',
      fg: 'text-black',
      accent: 'text-black',
      border: 'border-black',
    },
    pickerTheme: {
      activeTextColor: '#000000',
      textColor: '#000000', // black for all rows
      closedBorderColor: '#000000',
      closedBackgroundColor: 'rgba(250, 204, 21, 0.9)', // yellow-400 semi-transparent
      closedBackgroundColorEmpty: 'rgba(250, 204, 21, 0.6)',
      labelColor: '#000000',
      lastValueButtonColor: '#000000',
      focusRingColor: '#000000',
      highlightBorderColor: '#000000',
      highlightFillColor: 'rgba(0, 0, 0, 0.1)', // subtle black fill
      fadeColor: '#facc15', // yellow-400 - matches modal bg
    },
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    description: 'Cyberpunk aesthetic',
    theme: {
      bg: 'bg-purple-950',
      fg: 'text-cyan-400',
      accent: 'text-pink-500',
      border: 'border-pink-500',
    },
    pickerTheme: {
      activeTextColor: '#ec4899', // pink-500
      textColor: '#22d3ee', // cyan-400 for non-selected rows
      closedBorderColor: 'rgba(236, 72, 153, 0.8)',
      closedBackgroundColor: 'rgba(59, 7, 100, 0.8)', // purple-950 semi-transparent
      closedBackgroundColorEmpty: 'rgba(59, 7, 100, 0.5)',
      labelColor: '#22d3ee', // cyan-400
      lastValueButtonColor: '#ec4899', // pink-500
      focusRingColor: 'rgba(236, 72, 153, 0.7)',
      highlightBorderColor: 'rgba(236, 72, 153, 0.8)',
      highlightFillColor: 'rgba(236, 72, 153, 0.1)', // pink fill
      fadeColor: '#3b0764', // purple-950 - matches modal bg
    },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Pure black & white',
    theme: {
      bg: 'bg-white',
      fg: 'text-black',
      accent: 'text-gray-800',
      border: 'border-gray-400',
    },
    pickerTheme: {
      activeTextColor: '#1f2937', // gray-800
      textColor: '#6b7280', // gray-500 for non-selected rows
      closedBorderColor: 'rgba(156, 163, 175, 0.6)', // gray-400
      closedBackgroundColor: 'rgba(255, 255, 255, 0.9)',
      closedBackgroundColorEmpty: 'rgba(249, 250, 251, 0.8)', // gray-50
      labelColor: '#6b7280', // gray-500
      lastValueButtonColor: '#1f2937', // gray-800
      focusRingColor: 'rgba(31, 41, 55, 0.7)',
      highlightBorderColor: 'rgba(156, 163, 175, 0.6)',
      highlightFillColor: 'rgba(31, 41, 55, 0.05)', // subtle gray fill
      fadeColor: '#ffffff', // white - matches modal bg
    },
  },
  {
    id: 'gaming',
    name: 'RGB Gaming',
    description: 'Gamer aesthetic',
    theme: {
      bg: 'bg-slate-900',
      fg: 'text-green-400',
      accent: 'text-green-400',
      border: 'border-green-500',
    },
    pickerTheme: {
      activeTextColor: '#22c55e', // green-500
      textColor: '#4ade80', // green-400 for non-selected rows
      closedBorderColor: 'rgba(34, 197, 94, 0.8)',
      closedBackgroundColor: 'rgba(15, 23, 42, 0.9)', // slate-900 semi-transparent
      closedBackgroundColorEmpty: 'rgba(15, 23, 42, 0.6)',
      labelColor: '#4ade80', // green-400
      lastValueButtonColor: '#22c55e', // green-500
      focusRingColor: 'rgba(34, 197, 94, 0.7)',
      highlightBorderColor: 'rgba(34, 197, 94, 0.8)',
      highlightFillColor: 'rgba(34, 197, 94, 0.1)', // green fill
      fadeColor: '#0f172a', // slate-900 - matches modal bg
    },
  },
];

/**
 * Presets Gallery Section
 *
 * Design: Cyber-Editorial Brutalism
 * - Grid of themed picker examples
 * - Click to expand and interact
 * - Auto-playing demos
 */
export function PresetsGallery() {
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [presetValue, setPresetValue] = useState(DEMO_PICKERS.weight.initialValue);

  return (
    <section id="presets" className="py-16 px-4x bg-hairline/30">
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
            PRESETS
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Fully themeable and customizable. Start with a preset or build your
            own design system integration.
          </p>
        </motion.div>

        {/* Presets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4x">
          {presets.map((preset, index) => (
            <motion.button
              key={preset.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              onClick={() => setSelectedPreset(preset)}
              className={`
                glass-subtle p-6x text-left
                hover:border-accent/30 transition-all duration-fast
                focus-accent group
              `}
            >
              <div className="flex items-start justify-between mb-4x">
                <div>
                  <h3 className="text-lg font-semibold text-fg group-hover:text-accent transition-colors duration-instant mb-1x">
                    {preset.name}
                  </h3>
                  <p className="text-sm text-muted">{preset.description}</p>
                </div>
                <Palette className="w-5 h-5 text-accent" strokeWidth={2} />
              </div>

              {/* Preview Swatch */}
              <div className="flex gap-2">
                <div className={`w-8 h-8 rounded ${preset.theme.bg} ${preset.theme.border} border-2`} />
                <div className={`w-8 h-8 rounded ${preset.theme.fg.replace('text-', 'bg-')}`} />
                <div className={`w-8 h-8 rounded ${preset.theme.accent.replace('text-', 'bg-')}`} />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Preset Modal */}
        <AnimatePresence>
          {selectedPreset && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-modal bg-bg/90 backdrop-blur-sm flex items-center justify-center p-4x"
              onClick={() => setSelectedPreset(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className={`
                  relative max-w-md w-full p-8x
                  ${selectedPreset.theme.bg} ${selectedPreset.theme.fg}
                  ${selectedPreset.theme.border} border-2
                `}
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedPreset(null)}
                  className={`
                    absolute top-4 right-4 p-2
                    hover:opacity-70 transition-opacity duration-instant
                    focus-accent
                  `}
                  aria-label="Close"
                >
                  <X className="w-6 h-6" strokeWidth={2} />
                </button>

                {/* Content */}
                <div className="mb-6x">
                  <h3 className="text-2xl font-semibold mb-2x">
                    {selectedPreset.name}
                  </h3>
                  <p className="text-sm opacity-70">
                    {selectedPreset.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2x uppercase">
                    Try it out
                  </label>
                  <CollapsibleNumberPicker
                    {...DEMO_PICKERS.weight}
                    value={presetValue}
                    onChange={setPresetValue}
                    theme={selectedPreset.pickerTheme}
                  />
                </div>

                <div className="mt-6x pt-6x border-t opacity-50">
                  <p className="text-xs">
                    Click outside to close • Drag to interact
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Text */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-sm text-muted">
            All presets support dark mode, reduced motion, and full theming via CSS variables
          </p>
        </motion.div>
      </div>
    </section>
  );
}
