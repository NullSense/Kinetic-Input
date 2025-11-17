import { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-jsx';
import 'prismjs/themes/prism-tomorrow.css';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: 'typescript' | 'tsx' | 'jsx' | 'javascript';
  showCopy?: boolean;
  className?: string;
}

/**
 * Syntax-highlighted code block using Prism.js
 *
 * Features:
 * - Automatic syntax highlighting on mount and updates
 * - Copy-to-clipboard functionality
 * - Supports TypeScript, TSX, JSX, JavaScript
 * - Uses Prism Tomorrow theme (dark)
 */
export function CodeBlock({ code, language = 'tsx', showCopy = true, className = '' }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative ${className}`}>
      {showCopy && (
        <button
          onClick={handleCopy}
          className="absolute top-2x right-2x flex items-center gap-1x px-2x py-1x text-xs font-medium opacity-70 hover:opacity-100 transition-opacity duration-instant focus-accent bg-black/30 backdrop-blur-sm rounded-sm z-10"
          aria-label={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" strokeWidth={2} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" strokeWidth={2} />
              <span>Copy</span>
            </>
          )}
        </button>
      )}
      <pre className="!mt-0 !mb-0 overflow-x-auto rounded-sm">
        <code ref={codeRef} className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
}
