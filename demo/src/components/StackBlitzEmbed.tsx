import { useEffect, useRef } from 'react';
import sdk from '@stackblitz/sdk';

interface StackBlitzEmbedProps {
  /**
   * Project files to embed
   */
  files: Record<string, string>;

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
  template?: 'create-react-app' | 'react-ts' | 'typescript' | 'javascript';

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
  files,
  title = 'Kinetic Input Example',
  description = 'Interactive example',
  template = 'react-ts',
  height = '500px',
  hideNavigation = false,
  hideDevTools = false,
  openFile,
  view = 'default',
}: StackBlitzEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Embed StackBlitz project
    sdk.embedProject(
      containerRef.current,
      {
        title,
        description,
        template,
        files,
      },
      {
        height: parseInt(height) || 500,
        hideNavigation,
        hideDevTools,
        openFile,
        view,
        theme: 'dark', // Match our design system
      }
    );
  }, [files, title, description, template, height, hideNavigation, hideDevTools, openFile, view]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%' }}
      className="rounded-sm overflow-hidden border border-hairline"
    />
  );
}
