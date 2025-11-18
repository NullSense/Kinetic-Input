import { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Play, Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { PlaygroundModal } from './PlaygroundModal';

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
    code: `import { useState } from 'react';
import { CollapsiblePicker } from '@tensil/kinetic-input';
// IMPORTANT: Import CSS styles (required)
import '@tensil/kinetic-input/styles/all.css';

export default function App() {
  const [weight, setWeight] = useState(70);

  return (
    <div style={{ padding: '2rem' }}>
      <CollapsiblePicker
        value={weight}
        onChange={setWeight}
        min={0}
        max={200}
        label="WEIGHT"
        unit="kg"
      />
    </div>
  );
}`,
  },
  {
    id: 'basic',
    title: 'With Physics & Feedback',
    description: 'Magnetic snap, haptics, and audio (enabled by default)',
    code: `import { useState } from 'react';
import { CollapsiblePicker } from '@tensil/kinetic-input';
import '@tensil/kinetic-input/styles/all.css';

export default function App() {
  const [reps, setReps] = useState(10);

  return (
    <div style={{ padding: '2rem' }}>
      <CollapsiblePicker
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
      />

      <div style={{ marginTop: '2rem', opacity: 0.7, fontSize: '0.875rem' }}>
        <strong>Try it:</strong> Open the picker and feel the magnetic snap!
        <br />
        Current value: {reps} reps
      </div>
    </div>
  );
}`,
  },
  {
    id: 'theming',
    title: 'Custom Theme',
    description: 'Match your design system with buildTheme',
    code: `import { useState } from 'react';
import { CollapsiblePicker, buildTheme } from '@tensil/kinetic-input';
import '@tensil/kinetic-input/styles/all.css';

// Build a custom theme (iOS-inspired light mode)
const customTheme = buildTheme({
  activeTextColor: '#3b82f6',
  textColor: '#64748b',
  closedBorderColor: 'rgba(59, 130, 246, 0.5)',
  closedBackgroundColor: 'rgba(241, 245, 249, 0.8)',
  labelColor: '#64748b',
  highlightBorderColor: 'rgba(59, 130, 246, 0.5)',
  fadeColor: '#f1f5f9',
});

export default function App() {
  const [weight, setWeight] = useState(70);

  return (
    <div style={{ padding: '2rem', background: '#f1f5f9', minHeight: '100vh' }}>
      <CollapsiblePicker
        value={weight}
        onChange={setWeight}
        min={0}
        max={200}
        label="WEIGHT"
        unit="kg"
        theme={customTheme}
      />

      <div style={{ marginTop: '2rem', opacity: 0.7, fontSize: '0.875rem', color: '#64748b' }}>
        Try changing the theme colors above!
        <br />
        Current value: {weight} kg
      </div>
    </div>
  );
}`,
  },
  {
    id: 'advanced',
    title: 'Advanced Configuration',
    description: 'Fine-tune snap physics and wheel behavior',
    code: `import { useState } from 'react';
import { CollapsiblePicker } from '@tensil/kinetic-input';
import '@tensil/kinetic-input/styles/all.css';

export default function App() {
  const [distance, setDistance] = useState(5);

  return (
    <div style={{ padding: '2rem' }}>
      <CollapsiblePicker
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
          pullStrength: 1.4,     // Snap force
          centerLock: 1,         // Lock strength (0-1)
          velocityReducer: 0.3,  // Damping on snap
        }}
        // Fine-tune wheel scrolling
        wheelConfig={{
          sensitivity: 1.0,      // Mouse wheel speed multiplier
          smoothing: 0.85,       // Momentum smoothing (0-1)
        }}
      />

      <div style={{ marginTop: '2rem', opacity: 0.7, fontSize: '0.875rem' }}>
        <strong>Try it:</strong> Scroll with your mouse wheel for smooth scrolling
        <br />
        Or open the picker and feel the strong magnetic snap!
        <br />
        Current value: {distance} km
      </div>
    </div>
  );
}`,
  },
];

/**
 * Code Snippets Section
 *
 * Design: Cyber-Editorial Brutalism
 * - Clean code displays with syntax highlighting
 * - Single conditional playground modal for live editing
 * - Copy-paste ready examples with "Try it Live" button
 * - Optimized UX: view code first, play when ready
 */
export function CodeSnippets() {
  const [activeSnippet, setActiveSnippet] = useState<SnippetId>('quickstart');
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const currentSnippet = snippets.find((s) => s.id === activeSnippet) || snippets[0];

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <section id="snippets" className="py-16 px-4x bg-bg">
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
            Live, interactive examples. Edit the code and see results instantly.
          </p>
        </motion.div>

        {/* Snippet Tabs */}
        <div className="flex flex-wrap gap-2x mb-6x justify-center">
          {snippets.map((snippet) => (
            <button
              key={snippet.id}
              onClick={() => setActiveSnippet(snippet.id)}
              className={`
                px-4x py-2x font-medium text-sm uppercase transition-all duration-fast
                focus-accent
                ${
                  activeSnippet === snippet.id
                    ? 'bg-accent text-bg'
                    : 'bg-hairline text-muted hover:bg-hairline/70 hover:text-fg'
                }
              `}
            >
              <div className="flex items-center gap-2">
                {activeSnippet === snippet.id && <Play className="w-4 h-4" strokeWidth={2} fill="currentColor" />}
                <Code2 className="w-4 h-4" strokeWidth={2} />
                <span>{snippet.title}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Active Snippet */}
        <motion.div
          key={activeSnippet}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-subtle p-6x"
        >
          <div className="mb-4x">
            <h3 className="text-2xl font-semibold text-fg mb-2x">
              {currentSnippet.title}
            </h3>
            <p className="text-muted">
              {currentSnippet.description}
            </p>
          </div>

          {/* Code Display with Syntax Highlighting */}
          <div className="relative">
            <SyntaxHighlighter
              language="typescript"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                borderRadius: '2px',
                fontSize: '0.875rem',
                lineHeight: '1.6',
                border: '1px solid rgba(62, 220, 255, 0.2)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
              }}
              showLineNumbers
              wrapLines
            >
              {currentSnippet.code}
            </SyntaxHighlighter>

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {/* Copy Code Button */}
              <button
                onClick={() => copyToClipboard(currentSnippet.code)}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-medium text-sm transition-all duration-instant focus-accent rounded-xs shadow-lg backdrop-blur-sm"
                title="Copy code"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4" strokeWidth={2} />
                    <span className="text-xs">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" strokeWidth={2} />
                    <span className="text-xs">COPY</span>
                  </>
                )}
              </button>

              {/* Try it Live Button */}
              <button
                onClick={() => setPlaygroundOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent/20 hover:bg-accent/30 border border-accent/40 hover:border-accent/60 text-accent font-medium text-sm transition-all duration-instant focus-accent rounded-xs shadow-lg backdrop-blur-sm"
              >
                <Play className="w-4 h-4" strokeWidth={2} />
                TRY IT LIVE
              </button>
            </div>
          </div>

          <div className="mt-4x grid md:grid-cols-3 gap-3x text-xs">
            <div className="flex items-start gap-2 p-3x bg-black/20 rounded-xs border border-hairline">
              <Code2 className="w-4 h-4 text-accent mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-fg font-medium mb-1">Copy & Paste Ready</p>
                <p className="text-muted">Complete working example</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3x bg-black/20 rounded-xs border border-hairline">
              <Play className="w-4 h-4 text-success mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-fg font-medium mb-1">Interactive Playground</p>
                <p className="text-muted">Edit and test live</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3x bg-black/20 rounded-xs border border-hairline">
              <Code2 className="w-4 h-4 text-warning mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-fg font-medium mb-1">Zero Config</p>
                <p className="text-muted">Works out of the box</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Playground Modal */}
        <PlaygroundModal
          isOpen={playgroundOpen}
          onClose={() => setPlaygroundOpen(false)}
          title={currentSnippet.title}
          code={currentSnippet.code}
        />

        {/* Installation */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-12 glass-subtle p-6x"
        >
          <h3 className="text-xl font-semibold text-fg mb-4x flex items-center gap-2">
            <Code2 className="w-5 h-5" strokeWidth={2} />
            Installation
          </h3>

          {/* Step 1 & 2 */}
          <div className="grid md:grid-cols-2 gap-4x mb-6x">
            <div>
              <p className="text-sm text-muted mb-2x">Step 1: Install Package</p>
              <code className="block bg-black/30 p-3x font-mono text-sm text-accent">
                npm install @tensil/kinetic-input
              </code>
            </div>
            <div>
              <p className="text-sm text-muted mb-2x">Step 2: Import CSS (Required)</p>
              <code className="block bg-black/30 p-3x font-mono text-sm text-accent">
                {`import '@tensil/kinetic-input/styles/all.css';`}
              </code>
            </div>
          </div>

          {/* CSS Warning */}
          <div className="p-4x bg-warning/10 border border-warning/30 rounded-xs mb-6x">
            <p className="text-sm text-fg mb-2x font-semibold">⚠️ CSS Import is Required</p>
            <p className="text-sm text-muted">
              The component will not work without importing the CSS. You can import the bundled CSS
              (<code className="text-accent font-mono text-xs">all.css</code>) or granular imports
              for specific components.
            </p>
          </div>

          {/* CSS Options */}
          <div className="space-y-3x">
            <div>
              <p className="text-sm font-medium text-fg mb-2x">Option 1: All Styles (Recommended)</p>
              <code className="block bg-black/30 p-3x font-mono text-sm text-muted">
                {`import '@tensil/kinetic-input/styles/all.css';`}
              </code>
              <p className="text-xs text-muted mt-1x">Includes all component styles (~3KB gzipped)</p>
            </div>

            <div>
              <p className="text-sm font-medium text-fg mb-2x">Option 2: Granular Imports</p>
              <code className="block bg-black/30 p-3x font-mono text-sm text-muted">
                {`import '@tensil/kinetic-input/styles/picker.css'; // Base picker`}<br />
                {`import '@tensil/kinetic-input/styles/quick.css';  // CollapsiblePicker`}<br />
                {`import '@tensil/kinetic-input/styles/wheel.css';  // Picker`}
              </code>
              <p className="text-xs text-muted mt-1x">Import only what you need</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
