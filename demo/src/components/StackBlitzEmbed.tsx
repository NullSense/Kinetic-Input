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
      'src/App.tsx': code || '',
      'src/index.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@tensil/kinetic-input/styles/all.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      'package.json': JSON.stringify({
        name: 'kinetic-input-example',
        version: '1.0.0',
        dependencies: {
          'react': '^19.0.0',
          'react-dom': '^19.0.0',
          '@tensil/kinetic-input': 'latest',
        },
      }, null, 2),
      'index.html': `<!DOCTYPE html>
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
        openFile: openFile || 'src/App.tsx',
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
