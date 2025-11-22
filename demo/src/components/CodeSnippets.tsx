import { useState } from 'react';
import { motion } from 'framer-motion';
import { CollapsiblePicker } from '@tensil/kinetic-input';
import { InlineCodePreview } from './InlineCodePreview';

type TabId = 'quickstart' | 'physics' | 'theming' | 'advanced';

interface Tab {
  id: TabId;
  label: string;
  title: string;
  description: string;
  code: string;
  preview: React.ReactNode;
}

/**
 * Code Snippets Section
 *
 * Shows code examples with live inline previews in tabs
 * Desktop: Side-by-side layout
 * Mobile: Stacked layout (component top, code bottom)
 */
export function CodeSnippets() {
  const [activeTab, setActiveTab] = useState<TabId>('quickstart');

  const [quickstartValue, setQuickstartValue] = useState(70);
  const [basicValue, setBasicValue] = useState(10);
  const [themingValue, setThemingValue] = useState(70);
  const [advancedValue, setAdvancedValue] = useState(70);

  const customTheme = {
    activeTextColor: '#10b981',
    textColor: '#6b7280',
    closedBorderColor: 'rgba(16, 185, 129, 0.5)',
    closedBackgroundColor: 'rgba(16, 185, 129, 0.1)',
    labelColor: '#6b7280',
    highlightBorderColor: 'rgba(16, 185, 129, 0.5)',
    fadeColor: '#0a0b0d',
  };

  const tabs: Tab[] = [
    {
      id: 'quickstart',
      label: 'Quick Start',
      title: 'Quick Start',
      description: 'Minimal setup - just value, onChange, and label',
      code: `import { useState } from 'react';
import { CollapsiblePicker } from '@tensil/kinetic-input';
// IMPORTANT: Import CSS styles (required)
import '@tensil/kinetic-input/styles/all.css';

export default function App() {
  const [weight, setWeight] = useState(70);

  return (
    <CollapsiblePicker
      value={weight}
      onChange={setWeight}
      min={0}
      max={200}
      label="WEIGHT"
      unit="kg"
    />
  );
}`,
      preview: (
        <CollapsiblePicker
          value={quickstartValue}
          onChange={setQuickstartValue}
          min={0}
          max={200}
          label="WEIGHT"
          unit="kg"
        />
      ),
    },
    {
      id: 'physics',
      label: 'Physics & Feedback',
      title: 'With Physics & Feedback',
      description: 'Magnetic snap, haptics, and audio (enabled by default)',
      code: `import { useState } from 'react';
import { CollapsiblePicker } from '@tensil/kinetic-input';
import '@tensil/kinetic-input/styles/all.css';

export default function App() {
  const [reps, setReps] = useState(10);

  return (
    <div>
      <CollapsiblePicker
        value={reps}
        onChange={setReps}
        min={1}
        max={50}
        label="REPS"
        unit="reps"
        // Physics & Feedback (enabled by default)
        enableSnapPhysics={true}
        enableHaptics={true}
        enableAudioFeedback={true}
      />

      <p style={{ marginTop: '1rem', opacity: 0.7 }}>
        Current value: {reps} reps
      </p>
    </div>
  );
}`,
      preview: (
        <div>
          <CollapsiblePicker
            value={basicValue}
            onChange={setBasicValue}
            min={1}
            max={50}
            label="REPS"
            unit="reps"
            enableSnapPhysics={true}
            enableHaptics={true}
            enableAudioFeedback={true}
          />
          <p className="mt-4 text-sm text-muted text-center">Current value: {basicValue} reps</p>
        </div>
      ),
    },
    {
      id: 'theming',
      label: 'Custom Theme',
      title: 'Custom Theming',
      description: 'Match your design system with buildTheme helper',
      code: `import { useState } from 'react';
import { CollapsiblePicker, buildTheme } from '@tensil/kinetic-input';
import '@tensil/kinetic-input/styles/all.css';

// Custom theme matching your design system
const customTheme = buildTheme({
  activeTextColor: '#10b981',      // Green-500
  textColor: '#6b7280',            // Gray-500
  closedBorderColor: 'rgba(16, 185, 129, 0.5)',
  closedBackgroundColor: 'rgba(16, 185, 129, 0.1)',
  labelColor: '#6b7280',
  highlightBorderColor: 'rgba(16, 185, 129, 0.5)',
  fadeColor: '#0a0b0d',
});

export default function App() {
  const [weight, setWeight] = useState(70);

  return (
    <CollapsiblePicker
      value={weight}
      onChange={setWeight}
      min={0}
      max={200}
      label="WEIGHT"
      unit="kg"
      theme={customTheme}
    />
  );
}`,
      preview: (
        <CollapsiblePicker
          value={themingValue}
          onChange={setThemingValue}
          min={0}
          max={200}
          label="WEIGHT"
          unit="kg"
          theme={customTheme}
        />
      ),
    },
    {
      id: 'advanced',
      label: 'Advanced',
      title: 'Advanced Features',
      description: 'Snap physics, backdrop, helper text, and last value restore',
      code: `import { useState } from 'react';
import { CollapsiblePicker } from '@tensil/kinetic-input';
import '@tensil/kinetic-input/styles/all.css';

export default function App() {
  const [weight, setWeight] = useState(70);
  const [lastWeight, setLastWeight] = useState(75);

  return (
    <CollapsiblePicker
      value={weight}
      onChange={(newValue) => {
        setLastWeight(weight);
        setWeight(newValue);
      }}
      min={0}
      max={200}
      step={0.5}
      label="WEIGHT"
      unit="kg"
      lastValue={lastWeight}
      // Advanced features
      showBackdrop={true}
      itemHeight={48}
      enableSnapPhysics={true}
      snapPhysicsConfig={{
        snapRange: 0.3,
        pullStrength: 0.6,
        velocityThreshold: 120,
      }}
      helperText="Drag slowly to feel magnetic snap"
    />
  );
}`,
      preview: (
        <CollapsiblePicker
          value={advancedValue}
          onChange={setAdvancedValue}
          min={0}
          max={200}
          step={0.5}
          label="WEIGHT"
          unit="kg"
          lastValue={75}
          showBackdrop={true}
          itemHeight={48}
          enableSnapPhysics={true}
          snapPhysicsConfig={{
            snapRange: 0.3,
            pullStrength: 0.6,
            velocityThreshold: 120,
          }}
          helperText="Drag slowly to feel magnetic snap"
        />
      ),
    },
  ];

  const currentTab = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  return (
    <section id="examples" className="py-16 px-4x bg-hairline/30">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-5xl text-accent mb-3x">EXAMPLES</h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Explore code examples and interact with the components. All examples are fully
            functional.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-6 overflow-x-auto">
          <div className="inline-flex gap-2 p-1 glass-subtle rounded-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2 rounded-xs text-sm font-medium transition-all duration-fast
                  ${
                    activeTab === tab.id
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'text-muted hover:text-fg hover:bg-white/5'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Tab Content */}
        <InlineCodePreview
          key={currentTab.id}
          title={currentTab.title}
          description={currentTab.description}
          code={currentTab.code}
          preview={currentTab.preview}
        />
      </div>
    </section>
  );
}
