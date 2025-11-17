import { useEffect, useRef } from 'react';
import sdk from '@stackblitz/sdk';

interface StackBlitzEmbedProps {
  title: string;
  description: string;
  code: string;
  height?: string;
  openFile?: string;
}

/**
 * StackBlitz Embedded Editor
 *
 * Creates an interactive, editable code example with live preview.
 * Users can modify the code and see results immediately.
 *
 * @param title - Project title
 * @param description - Project description
 * @param code - Component code to display
 * @param height - Height of the embed (default: 500px)
 * @param openFile - Which file to open by default (default: src/App.tsx)
 */
export function StackBlitzEmbed({
  title,
  description,
  code,
  height = '500px',
  openFile = 'src/App.tsx',
}: StackBlitzEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create StackBlitz project
    sdk.embedProject(
      containerRef.current,
      {
        title,
        description,
        template: 'node',
        files: {
          'package.json': `{
  "name": "${title.toLowerCase().replace(/\s+/g, '-')}",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tensil/kinetic-input": "^0.1.1",
    "framer-motion": "^11.11.11",
    "@xstate/react": "^6.0.0",
    "xstate": "^5.0.0",
    "lucide-react": "^0.546.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.1.1",
    "vite": "^6.4.1",
    "typescript": "^5.9.3"
  }
}`,
          'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});`,
          'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
          'src/main.tsx': `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@tensil/kinetic-input/styles/all.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
          'src/App.tsx': code,
          'src/index.css': `body {
  margin: 0;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: #0a0b0d;
  color: #e7edf2;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

#root {
  width: 100%;
  max-width: 400px;
}`,
        },
      },
      {
        height,
        openFile,
        view: 'preview',
        hideNavigation: false,
        hideDevTools: false,
        forceEmbedLayout: true,
        clickToLoad: false,
      }
    );
  }, [title, description, code, height, openFile]);

  return <div ref={containerRef} style={{ height, width: '100%', borderRadius: '4px', overflow: 'hidden' }} />;
}
