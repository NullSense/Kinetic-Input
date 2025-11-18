import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Code2 } from 'lucide-react';
import sdk from '@stackblitz/sdk';

interface PlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  code?: string;
}

/**
 * Interactive Playground Modal
 *
 * Single, reusable playground that opens conditionally.
 * Embeds StackBlitz in a modal for focused editing experience.
 */
export function PlaygroundModal({ isOpen, onClose, title = 'Interactive Playground', code }: PlaygroundModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    if (isOpen && !isEmbedded && containerRef.current && code) {
      const projectFiles = {
        'src/App.js': code,
        'src/index.js': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './kinetic-input.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
        'src/kinetic-input.css': `/* Kinetic Input Styles */
.picker-surface{position:relative;user-select:none;-webkit-user-select:none;touch-action:pan-x pinch-zoom;overscroll-behavior-y:contain;cursor:default;--picker-highlight-color:rgba(62,220,255,0.85)}.picker-scroller,.picker-item{user-select:none;-webkit-user-select:none}.picker-item{cursor:default}.picker-column{outline:none}.picker-column:focus{outline:none}.picker-column-highlight{opacity:0;transition:opacity .15s ease}.picker-column:focus .picker-column-highlight{opacity:1}.picker-highlight-hitbox{position:absolute;pointer-events:none;inset-inline:0}.picker-item-unit{opacity:.7}.quick-number-input-root{--qni-row-height:40px;--qni-visible-rows:5;--qni-font-family:'Geist Mono',monospace;--qni-font-size:1rem;--qni-color-muted:#9db1be;--qni-color-active:#3edcff;--qni-color-unit:#8e77b5;--qni-highlight-fill:rgba(62,220,255,0.05);--qni-fade-color:#0a0b0d;--qni-backdrop-color:rgba(0,0,0,0.6);--qni-viewport-offset:calc(((var(--qni-visible-rows) - 1)/2)*var(--qni-row-height))}.quick-number-input-root :where(.picker-item,.qni-closed){font-family:var(--qni-font-family);font-size:var(--qni-font-size);font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1}.quick-number-input-root .picker-container{position:relative;height:calc(var(--qni-row-height)*var(--qni-visible-rows,5));overflow:hidden}.quick-number-input-root :where(.picker-item,.qni-closed,.qni-inner){gap:0.5rem}.quick-number-input-root .picker-item{height:var(--qni-row-height);line-height:var(--qni-row-height);display:flex;align-items:center;justify-content:center;width:100%;padding-inline:1rem;color:var(--qni-color-muted);transition:color .12s cubic-bezier(0.32,0.94,0.6,1),transform .16s cubic-bezier(0.32,0.94,0.6,1),opacity .16s cubic-bezier(0.32,0.94,0.6,1);position:relative;z-index:20}.quick-number-input-root .picker-item-value{font-variant-numeric:inherit}.quick-number-input-root :is(.picker-item-unit,.qni-unit){font-family:'Archivo',sans-serif;font-size:0.75em;color:var(--qni-color-unit)}.quick-number-input-root .picker-item.picker-item-active{color:var(--qni-color-active);text-shadow:0 0 0.5px currentColor,0.5px 0 0.5px currentColor;transform:scale(var(--qni-active-scale));letter-spacing:0.02em}.quick-number-input-root .picker-item.picker-item-selected:not(.picker-item-active){color:var(--qni-color-muted);text-shadow:0 0 0.4px currentColor;transform:scale(var(--qni-selected-scale));opacity:var(--qni-selected-opacity)}.quick-number-input-root .picker-item[data-padding='true']{opacity:0}.quick-number-input-root :where(.picker-highlight-hitbox,.picker-highlight-fill,.picker-fade-top,.picker-fade-bottom){position:absolute;inset-inline:0;pointer-events:none}.quick-number-input-root :where(.picker-highlight-hitbox,.picker-highlight-fill){top:var(--qni-viewport-offset);height:var(--qni-row-height)}.quick-number-input-root .picker-highlight-hitbox{background:transparent;border:0;z-index:10}.quick-number-input-root .picker-highlight-fill{background:var(--qni-highlight-fill);z-index:6}.quick-number-input-root :where(.picker-fade-top,.picker-fade-bottom){height:var(--qni-viewport-offset);z-index:10}.quick-number-input-root .picker-fade-top{top:0;background:linear-gradient(to bottom,var(--qni-fade-color),transparent)}.quick-number-input-root .picker-fade-bottom{bottom:0;background:linear-gradient(to top,var(--qni-fade-color),transparent)}.quick-number-input-root .qni-closed{display:grid;grid-auto-flow:column;align-items:center;inline-size:max-content;height:var(--qni-row-height);line-height:var(--qni-row-height);user-select:none}.quick-number-input-root .qni-ghost{grid-area:1/1;visibility:hidden;white-space:nowrap;pointer-events:none}.quick-number-input-root .qni-inner{grid-area:1/1;display:inline-grid;grid-auto-flow:column;align-items:center}.quick-number-input-root .qni-closed .qni-value{color:var(--qni-color-active);text-shadow:0 0 0.5px currentColor,0.5px 0 0.5px currentColor;letter-spacing:0.02em}.quick-number-input-root .qni-closed .qni-chevron{opacity:0.9;color:var(--qni-color-unit);stroke:currentColor;width:20px;height:20px;vertical-align:middle}.quick-number-input-root .picker-backdrop{position:fixed;inset:0;background:var(--qni-backdrop-color);z-index:9;transition:opacity .2s ease-out}@media (prefers-reduced-motion:reduce){.quick-number-input-root .picker-item{transition:none}.quick-number-input-root :is(.picker-item.picker-item-active,.picker-item.picker-item-selected:not(.picker-item-active)){transform:none;letter-spacing:normal}.quick-number-input-root .picker-item.picker-item-selected:not(.picker-item-active){opacity:1}.quick-number-input-root .qni-closed .qni-value{letter-spacing:normal}}`,
        'public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
        'package.json': JSON.stringify({
          name: 'kinetic-input-playground',
          version: '1.0.0',
          dependencies: {
            'react': '^18.2.0',
            'react-dom': '^18.2.0',
            '@tensil/kinetic-input': 'latest',
            'framer-motion': '^11.0.0',
            'xstate': '^5.0.0',
            '@xstate/react': '^6.0.0',
          },
        }, null, 2),
      };

      sdk.embedProject(
        containerRef.current,
        {
          title,
          description: 'Interactive code playground',
          template: 'create-react-app',
          files: projectFiles,
        },
        {
          height: 600,
          openFile: 'src/App.js',
          view: 'default',
          theme: 'dark',
        }
      );

      setIsEmbedded(true);
    }
  }, [isOpen, isEmbedded, code, title]);

  // Reset embed state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEmbedded(false);
    }
  }, [isOpen]);

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

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex flex-col glass-heavy rounded-sm overflow-hidden border border-accent/30"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-bg/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Code2 className="w-5 h-5 text-accent" strokeWidth={2} />
                <h2 className="text-xl font-semibold text-fg">{title}</h2>
                <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs font-mono rounded-xs">
                  LIVE EDITOR
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 transition-colors rounded-xs focus-accent"
              >
                <X className="w-5 h-5 text-muted" strokeWidth={2} />
              </button>
            </div>

            {/* StackBlitz Embed */}
            <div className="flex-1 overflow-hidden">
              <div
                ref={containerRef}
                className="w-full h-full"
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-hairline bg-bg/80 backdrop-blur-sm">
              <p className="text-xs text-muted flex items-center gap-2">
                <Play className="w-3 h-3" strokeWidth={2} />
                Edit code and see changes instantly • Fork to save your changes • Powered by StackBlitz
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
