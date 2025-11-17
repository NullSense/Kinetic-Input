import { useEffect, useRef } from 'react';
import sdk from '@stackblitz/sdk';

interface StackBlitzEmbedProps {
  /**
   * Simple code string (will be converted to App.tsx) OR full project files
   */
  code?: string;
  files?: Record<string, string>;

  /**
   * Title of the StackBlitz project
   */
  title?: string;

  /**
   * Description of the project
   */
  description?: string;

  /**
   * Template type (default: 'create-react-app')
   */
  template?: 'create-react-app' | 'typescript' | 'javascript';

  /**
   * Height of the embed (default: '500px')
   */
  height?: string;

  /**
   * Hide certain UI elements
   */
  hideNavigation?: boolean;
  hideDevTools?: boolean;

  /**
   * File to open by default
   */
  openFile?: string;

  /**
   * View mode: 'default' shows both editor and preview, 'preview' shows only preview
   */
  view?: 'default' | 'preview' | 'editor';
}

/**
 * StackBlitz Embed Component
 *
 * Creates an interactive, editable code sandbox using StackBlitz SDK.
 * Perfect for live examples that users can modify and see results instantly.
 *
 * Features:
 * - Live code editing with syntax highlighting (handled by StackBlitz)
 * - Instant preview
 * - Shareable URLs
 * - No need for separate syntax highlighting library
 */
export function StackBlitzEmbed({
  code,
  files,
  title = 'Kinetic Input Example',
  description = 'Interactive example',
  template = 'create-react-app',
  height = '500px',
  hideNavigation = false,
  hideDevTools = false,
  openFile,
  view = 'default',
}: StackBlitzEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Convert code string to files object if needed
    const projectFiles = files || {
      'src/App.js': code || '',
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
        name: 'kinetic-input-example',
        version: '1.0.0',
        dependencies: {
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
          '@tensil/kinetic-input': 'latest',
        },
      }, null, 2),
    };

    // Embed StackBlitz project
    sdk.embedProject(
      containerRef.current,
      {
        title,
        description,
        template,
        files: projectFiles,
      },
      {
        height: parseInt(height) || 500,
        hideNavigation,
        hideDevTools,
        openFile: openFile || 'src/App.js',
        view,
        theme: 'dark', // Match our design system
      }
    );
  }, [code, files, title, description, template, height, hideNavigation, hideDevTools, openFile, view]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%' }}
      className="rounded-sm overflow-hidden border border-hairline"
    />
  );
}
