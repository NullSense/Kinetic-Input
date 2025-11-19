import { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface InlineCodePreviewProps {
  title: string;
  description?: string;
  code: string;
  preview: React.ReactNode;
  delay?: number;
}

/**
 * Inline Code + Interactive Component
 *
 * Desktop: Side-by-side (code left, component right)
 * Mobile: Stacked (component top, code bottom)
 */
export function InlineCodePreview({
  title,
  description,
  code,
  preview,
  delay = 0
}: InlineCodePreviewProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Silent fail
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, delay }}
      className="glass-subtle overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-hairline bg-bg/40">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-fg mb-1">{title}</h3>
            {description && (
              <p className="text-sm text-muted">{description}</p>
            )}
          </div>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-bg/60 hover:bg-bg/80 border border-hairline hover:border-accent/30 text-muted hover:text-accent text-xs font-medium transition-all duration-fast focus-accent rounded-xs"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" strokeWidth={2} />
                <span>COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" strokeWidth={2} />
                <span>COPY</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-0">
        {/* Code Panel - First on desktop (takes available space), second on mobile */}
        <div className="order-2 lg:order-1 overflow-auto">
          <div className="p-4 lg:p-6">
            <div className="flex items-center gap-2 text-sm text-muted mb-3">
              <Code2 className="w-4 h-4" strokeWidth={2} />
              <span className="font-medium uppercase tracking-wide">Code</span>
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
                maxHeight: '500px',
              }}
              showLineNumbers={true}
              wrapLines
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Component Panel - First on mobile, right on desktop */}
        <div className="order-1 lg:order-2 p-6 lg:p-8 bg-bg/20 border-b lg:border-b-0 lg:border-l border-hairline lg:min-w-[400px] lg:max-w-[480px] flex items-center justify-center">
          <div className="w-full max-w-sm">
            {preview}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
