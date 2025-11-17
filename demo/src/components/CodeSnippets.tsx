import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Code2, Copy, Check, Play } from 'lucide-react';
import { CollapsibleNumberPicker } from '@tensil/kinetic-input';
import Editor from 'react-simple-code-editor';
import { DEMO_PICKERS } from '../config/pickerDefaults';

type SnippetId = 'quickstart' | 'basic' | 'theming' | 'advanced';

interface Snippet {
  id: SnippetId;
  title: string;
  description: string;
  code: string;
}

const snippets: Snippet[] = [
  {
    id: 'quickstart',
    title: 'Quick Start',
    description: 'Minimal setup - just value, onChange, and label',
    code: `import { CollapsibleNumberPicker } from '@tensil/kinetic-input';
import '@tensil/kinetic-input/styles/all.css';

function WeightInput() {
  const [weight, setWeight] = useState(70);

  return (
    <CollapsibleNumberPicker
      value={weight}
      onChange={setWeight}
      min={0}
      max={200}
      label="WEIGHT"
      unit="kg"
    />
  );
}`,
  },
  {
    id: 'basic',
    title: 'With Physics & Feedback',
    description: 'Magnetic snap, haptics, and audio (enabled by default)',
    code: `<CollapsibleNumberPicker
  value={reps}
  onChange={setReps}
  min={1}
  max={50}
  label="REPS"
  unit="reps"

  // Physics & Feedback (all enabled by default)
  enableSnapPhysics={true}
  enableHaptics={true}
  enableAudioFeedback={true}
/>`,
  },
  {
    id: 'theming',
    title: 'Custom Theme',
    description: 'Match your design system with buildTheme',
    code: `import { buildTheme } from '@tensil/kinetic-input';

const customTheme = buildTheme({
  activeTextColor: '#3b82f6',
  textColor: '#64748b',
  closedBorderColor: 'rgba(59,130,246,0.5)',
  closedBackgroundColor: 'rgba(241,245,249,0.8)',
  labelColor: '#64748b',
  highlightBorderColor: 'rgba(59,130,246,0.5)',
  fadeColor: '#f1f5f9',
});

<CollapsibleNumberPicker
  value={weight}
  onChange={setWeight}
  min={0}
  max={200}
  label="WEIGHT"
  unit="kg"
  theme={customTheme}
/>`,
  },
  {
    id: 'advanced',
    title: 'Advanced Configuration',
    description: 'Fine-tune snap physics and wheel behavior',
    code: `<CollapsibleNumberPicker
  value={distance}
  onChange={setDistance}
  min={0}
  max={100}
  step={0.5}
  label="DISTANCE"
  unit="km"

  // Fine-tune magnetic snap physics
  enableSnapPhysics={true}
  snapPhysicsConfig={{
    snapRange: 1.4,        // Magnetic zone size
    pullStrength: 1.4,     // Attraction strength
    centerLock: 1,         // Center precision
  }}

  // Wheel sensitivity
  wheelSensitivity={1}
  wheelDeltaCap={1.25}

  // Feedback
  enableHaptics={true}
  enableAudioFeedback={true}
/>`,
  },
];

/**
 * Lightweight syntax highlighting for TSX code
 */
const highlightCode = (code: string) => {
  const tokens: { type: string; value: string }[] = [];
  let i = 0;

  while (i < code.length) {
    // Comments
    if (code.slice(i, i + 2) === '//') {
      const end = code.indexOf('\n', i);
      tokens.push({ type: 'comment', value: code.slice(i, end === -1 ? code.length : end) });
      i = end === -1 ? code.length : end;
      continue;
    }

    // Strings
    if (['"', "'", '`'].includes(code[i])) {
      const quote = code[i];
      let end = i + 1;
      while (end < code.length && code[end] !== quote) {
        if (code[end] === '\\') end++; // Skip escaped characters
        end++;
      }
      tokens.push({ type: 'string', value: code.slice(i, end + 1) });
      i = end + 1;
      continue;
    }

    // JSX tags
    if (code[i] === '<') {
      const match = code.slice(i).match(/^<\/?([A-Z]\w*)/);
      if (match) {
        tokens.push({ type: 'plain', value: '<' + (code[i + 1] === '/' ? '/' : '') });
        tokens.push({ type: 'component', value: match[1] });
        i += match[0].length;
        continue;
      }
    }

    // Numbers
    const numMatch = code.slice(i).match(/^\d+\.?\d*/);
    if (numMatch && (i === 0 || !/\w/.test(code[i - 1]))) {
      tokens.push({ type: 'number', value: numMatch[0] });
      i += numMatch[0].length;
      continue;
    }

    // Keywords, functions, identifiers
    const wordMatch = code.slice(i).match(/^[a-zA-Z_]\w*/);
    if (wordMatch) {
      const word = wordMatch[0];
      const keywords = ['import', 'from', 'function', 'const', 'return', 'interface', 'export', 'default'];

      if (keywords.includes(word)) {
        tokens.push({ type: 'keyword', value: word });
      } else if (code[i + word.length] === '(') {
        tokens.push({ type: 'function', value: word });
      } else if (code[i + word.length] === '=') {
        tokens.push({ type: 'prop', value: word });
      } else {
        tokens.push({ type: 'plain', value: word });
      }
      i += word.length;
      continue;
    }

    // Everything else
    tokens.push({ type: 'plain', value: code[i] });
    i++;
  }

  // Convert tokens to HTML
  return tokens
    .map((token) => {
      const escaped = token.value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      switch (token.type) {
        case 'keyword': return `<span class="syntax-keyword">${escaped}</span>`;
        case 'string': return `<span class="syntax-string">${escaped}</span>`;
        case 'number': return `<span class="syntax-number">${escaped}</span>`;
        case 'comment': return `<span class="syntax-comment">${escaped}</span>`;
        case 'component': return `<span class="syntax-component">${escaped}</span>`;
        case 'prop': return `<span class="syntax-prop">${escaped}</span>`;
        case 'function': return `<span class="syntax-function">${escaped}</span>`;
        default: return escaped;
      }
    })
    .join('');
};

/**
 * Code Snippets Section
 *
 * Design: Cyber-Editorial Brutalism
 * - Tabbed interface for different examples
 * - Copy-to-clipboard functionality
 * - Syntax highlighting via CSS
 */
export function CodeSnippets() {
  const [activeSnippet, setActiveSnippet] = useState<SnippetId>('quickstart');
  const [copiedId, setCopiedId] = useState<SnippetId | null>(null);

  // Initialize editable code from snippets
  const [editableCode, setEditableCode] = useState<Record<SnippetId, string>>(() => ({
    quickstart: snippets[0].code,
    basic: snippets[1].code,
    theming: snippets[2].code,
    advanced: snippets[3].code,
  }));

  const activeSnippetData = snippets.find((s) => s.id === activeSnippet)!;
  const currentCode = editableCode[activeSnippet];

  const copyToClipboard = (code: string, id: SnippetId) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetCode = (id: SnippetId) => {
    const original = snippets.find((s) => s.id === id)?.code || '';
    setEditableCode((prev) => ({ ...prev, [id]: original }));
  };

  // Live preview component based on editable code
  const LivePreview = ({ code }: { code: string }) => {
    const [value, setValue] = useState(DEMO_PICKERS.weight.initialValue);

    // Parse only label and unit from code (everything else uses defaults)
    const props = useMemo(() => {
      try {
        const labelMatch = code.match(/label="([^"]+)"/);
        const unitMatch = code.match(/unit=["'{]([^"'}]+)["'}]/);

        return {
          label: labelMatch?.[1] || DEMO_PICKERS.weight.label,
          unit: unitMatch?.[1] || DEMO_PICKERS.weight.unit,
        };
      } catch {
        return {
          label: DEMO_PICKERS.weight.label,
          unit: DEMO_PICKERS.weight.unit,
        };
      }
    }, [code]);

    return (
      <div className="h-full min-h-[500px] flex items-center justify-center p-6x bg-bg/30">
        <div className="w-full max-w-xs">
          <CollapsibleNumberPicker
            {...DEMO_PICKERS.weight}
            value={value}
            onChange={setValue}
            label={props.label}
            unit={props.unit}
          />
          <p className="text-xs text-muted text-center mt-4x">
            Current: <span className="text-accent font-mono">{value} {props.unit}</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <section id="snippets" className="py-16 px-4x bg-hairline/30">
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
            GET STARTED
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Drop-in React component with zero configuration required.
            Customize everything when you need it.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-4x justify-center"
        >
          {snippets.map((snippet) => (
            <button
              key={snippet.id}
              onClick={() => setActiveSnippet(snippet.id)}
              className={`
                px-4x py-2x text-sm font-medium transition-all duration-fast
                border focus-accent
                ${
                  activeSnippet === snippet.id
                    ? 'bg-accent/20 border-accent text-accent'
                    : 'bg-hairline border-hairline hover:border-accent/50 text-muted hover:text-accent'
                }
              `}
            >
              {snippet.title}
            </button>
          ))}
        </motion.div>

        {/* Code Display + Live Preview */}
        <motion.div
          key={activeSnippet}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-subtle overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4x border-b border-hairline">
            <div className="flex items-center gap-3x">
              <Code2 className="w-5 h-5 text-accent" strokeWidth={2} />
              <div>
                <h3 className="text-lg font-semibold text-fg">
                  {activeSnippetData.title}
                </h3>
                <p className="text-sm text-muted">
                  {activeSnippetData.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2x">
              <button
                onClick={() => resetCode(activeSnippet)}
                className="flex items-center gap-2x px-3x py-2x bg-hairline hover:bg-hairline/70 border border-hairline transition-colors duration-fast focus-accent"
                title="Reset to original"
              >
                <Play className="w-4 h-4 text-muted" strokeWidth={2} />
                <span className="text-sm font-medium text-muted">Reset</span>
              </button>
              <button
                onClick={() => copyToClipboard(currentCode, activeSnippet)}
                className="flex items-center gap-2x px-3x py-2x bg-accent/10 hover:bg-accent/20 border border-accent/30 transition-colors duration-fast focus-accent"
              >
                {copiedId === activeSnippet ? (
                  <>
                    <Check className="w-4 h-4 text-success" strokeWidth={2} />
                    <span className="text-sm font-medium text-success">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-accent" strokeWidth={2} />
                    <span className="text-sm font-medium text-accent">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Two-column layout: Code + Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-hairline">
            {/* Editable Code with Syntax Highlighting */}
            <div className="p-4x bg-bg/50">
              <Editor
                value={currentCode}
                onValueChange={(code) => setEditableCode((prev) => ({ ...prev, [activeSnippet]: code }))}
                highlight={(code) => highlightCode(code)}
                padding={16}
                style={{
                  fontFamily: '"Geist Mono", monospace',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  minHeight: '500px',
                  backgroundColor: 'transparent',
                  outline: 'none',
                }}
                textareaClassName="focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>

            {/* Live Preview */}
            <LivePreview code={currentCode} />
          </div>
        </motion.div>

        {/* Installation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8x text-center"
        >
          <p className="text-sm text-muted mb-3x">Installation</p>
          <div className="inline-flex items-center gap-3x px-6x py-3x bg-hairline/50 border border-hairline font-mono text-sm text-fg">
            <span className="text-muted">$</span>
            <span>npm install @tensil/kinetic-input</span>
            <button
              onClick={() => copyToClipboard('npm install @tensil/kinetic-input', 'quickstart')}
              className="ml-2x p-1x hover:bg-accent/20 transition-colors duration-instant focus-accent"
            >
              {copiedId === 'quickstart' ? (
                <Check className="w-4 h-4 text-success" strokeWidth={2} />
              ) : (
                <Copy className="w-4 h-4 text-muted" strokeWidth={2} />
              )}
            </button>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
