import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Code2, Play } from 'lucide-react';
import { CollapsiblePicker } from '@tensil/kinetic-input';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { DEMO_PICKERS } from '../config/pickerDefaults';

interface PlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  code?: string;
}

/**
 * Interactive Playground Modal
 *
 * Shows code example with syntax highlighting alongside a live, interactive demo.
 * No external dependencies - pure local React rendering.
 */
export function PlaygroundModal({ isOpen, onClose, title = 'Interactive Playground', code }: PlaygroundModalProps) {
  const [demoValue, setDemoValue] = useState(DEMO_PICKERS.weight.initialValue);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal - Large and Wide */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-2 md:inset-4 lg:inset-8 z-50 flex flex-col glass-heavy rounded-sm overflow-hidden border border-accent/30 max-w-[95vw] mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-bg/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Code2 className="w-5 h-5 text-accent" strokeWidth={2} />
                <h2 className="text-xl font-semibold text-fg">{title}</h2>
                <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs font-mono rounded-xs">
                  LIVE DEMO
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 transition-colors rounded-xs focus-accent"
              >
                <X className="w-5 h-5 text-muted" strokeWidth={2} />
              </button>
            </div>

            {/* Content - Split View */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* Code Panel */}
              <div className="flex-1 overflow-auto p-6 border-b lg:border-b-0 lg:border-r border-hairline bg-bg/40">
                <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                  <Code2 className="w-4 h-4" strokeWidth={2} />
                  <span className="font-medium uppercase tracking-wide">Code Example</span>
                </div>
                <SyntaxHighlighter
                  language="typescript"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: '2px',
                    fontSize: '0.8125rem',
                    lineHeight: '1.6',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  }}
                  showLineNumbers={true}
                  wrapLines
                >
                  {code || '// No code provided'}
                </SyntaxHighlighter>
              </div>

              {/* Live Demo Panel */}
              <div className="flex-1 overflow-auto p-6 bg-bg/60">
                <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                  <Play className="w-4 h-4" strokeWidth={2} />
                  <span className="font-medium uppercase tracking-wide">Live Preview</span>
                </div>
                <div className="flex items-center justify-center min-h-[300px]">
                  <div className="p-8 glass-subtle rounded-sm border border-accent/20">
                    <CollapsiblePicker
                      {...DEMO_PICKERS.weight}
                      value={demoValue}
                      onChange={setDemoValue}
                    />
                  </div>
                </div>
                <p className="mt-6 text-xs text-muted text-center">
                  Interact with the component above - drag, scroll, or click to explore
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-hairline bg-bg/80 backdrop-blur-sm">
              <p className="text-xs text-muted">
                Fully interactive local demo • No external dependencies • Pure React rendering
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
