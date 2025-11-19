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
   * Template type (default: 'node')
   */
  template?: 'node' | 'create-react-app' | 'typescript' | 'javascript';

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

  /**
   * Package version to use (default: 'latest')
   * Set to specific version for testing (e.g., '0.0.4')
   */
  packageVersion?: string;
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
  template = 'node',
  height = '500px',
  hideNavigation = false,
  hideDevTools = false,
  openFile,
  view = 'default',
  packageVersion = 'latest',
}: StackBlitzEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Convert code string to files object if needed
    const projectFiles = files || {
      'src/App.jsx': code || '',
      'src/main.jsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@tensil/kinetic-input/styles/all.css';

createRoot(document.getElementById('root')).render(<App />);`,
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      body { margin: 0; padding: 20px; background: #0a0b0d; color: #fff; font-family: system-ui; }
      #root { max-width: 800px; margin: 0 auto; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
      'vite.config.js': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@tensil/kinetic-input']
  }
});`,
      'package.json': JSON.stringify({
        name: 'kinetic-input-example',
        type: 'module',
        scripts: {
          dev: 'vite',
          start: 'vite'
        },
        dependencies: {
          'react': '^19.0.0',
          'react-dom': '^19.0.0',
          '@tensil/kinetic-input': packageVersion,
          'framer-motion': '^11.0.0',
          'xstate': '^5.0.0',
          '@xstate/react': '^6.0.0',
          '@emotion/is-prop-valid': '^1.2.1'
        },
        devDependencies: {
          '@vitejs/plugin-react': '^5.0.0',
          'vite': '^6.0.0'
        },
        stackblitz: {
          installDependencies: true,
          startCommand: 'npm start'
        }
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
        openFile: openFile || 'src/App.jsx',
        view,
        theme: 'dark',
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
