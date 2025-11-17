import { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Play } from 'lucide-react';
import { StackBlitzEmbed } from './StackBlitzEmbed';

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
import { CollapsibleNumberPicker } from '@tensil/kinetic-input';

export default function App() {
  const [weight, setWeight] = useState(70);

  return (
    <div style={{ padding: '2rem' }}>
      <CollapsibleNumberPicker
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
import { CollapsibleNumberPicker } from '@tensil/kinetic-input';

export default function App() {
  const [reps, setReps] = useState(10);

  return (
    <div style={{ padding: '2rem' }}>
      <CollapsibleNumberPicker
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
import { CollapsibleNumberPicker, buildTheme } from '@tensil/kinetic-input';

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
      <CollapsibleNumberPicker
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
import { CollapsibleNumberPicker } from '@tensil/kinetic-input';

export default function App() {
  const [distance, setDistance] = useState(5);

  return (
    <div style={{ padding: '2rem' }}>
      <CollapsibleNumberPicker
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
 * - Now with fully interactive StackBlitz embeds
 * - Users can modify and test code live
 * - Real working examples with live preview
 */
export function CodeSnippets() {
  const [activeSnippet, setActiveSnippet] = useState<SnippetId>('quickstart');

  const currentSnippet = snippets.find((s) => s.id === activeSnippet) || snippets[0];

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

          {/* StackBlitz Embed */}
          <StackBlitzEmbed
            title={currentSnippet.title}
            description={currentSnippet.description}
            code={currentSnippet.code}
            height="600px"
            openFile="src/App.tsx"
          />

          <div className="mt-4x pt-4x border-t border-hairline">
            <p className="text-xs text-muted">
              💡 Edit the code above and see changes instantly • Fork the project to save your changes
            </p>
          </div>
        </motion.div>

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
          <div className="grid md:grid-cols-2 gap-4x">
            <div>
              <p className="text-sm text-muted mb-2x">npm</p>
              <code className="block bg-black/30 p-3x font-mono text-sm text-accent">
                npm install @tensil/kinetic-input
              </code>
            </div>
            <div>
              <p className="text-sm text-muted mb-2x">Import CSS</p>
              <code className="block bg-black/30 p-3x font-mono text-sm text-accent">
                import '@tensil/kinetic-input/styles/all.css';
              </code>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
