import { useState, useEffect } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { CollapsiblePicker } from '@tensil/kinetic-input';
import { MousePointerClick, MousePointer2, Timer, Pause, Play } from 'lucide-react';

/**
 * InteractionModes Component
 *
 * Demonstrates the two main interaction patterns:
 * 1. Quick Pick (single gesture) - 150ms auto-close
 * 2. Browse Mode (multi-gesture) - 2.5s idle auto-close
 *
 * Features:
 * - Real working pickers users can interact with
 * - Animated cursor overlays showing typical usage patterns
 * - Looping animations with pause/play controls
 * - Synchronized cursor position and value changes
 */

interface AnimatedDemoProps {
  isPlaying: boolean;
  mode: 'quick' | 'browse';
  onPickerStateChange: (isOpen: boolean) => void;
  onValueChange: (value: number) => void;
  initialValue: number;
  targetValue: number;
}

type CursorType = 'pointer' | 'wheel';

/**
 * Coordinated animation with perfect sync between cursor position and picker value.
 * Uses motion values to ensure cursor Y maps directly to the displayed value.
 */
function AnimatedDemo({
  isPlaying,
  mode,
  onPickerStateChange,
  onValueChange,
  initialValue,
  targetValue
}: AnimatedDemoProps) {
  const controls = useAnimationControls();
  const clickPulseControls = useAnimationControls();
  const [cursorType, setCursorType] = useState<CursorType>('pointer');

  // Helper to trigger click pulse animation
  const triggerClickPulse = async () => {
    clickPulseControls.start({
      scale: [0, 2.5],
      opacity: [0.8, 0],
      transition: { duration: 0.6, ease: 'easeOut' }
    });
  };

  useEffect(() => {
    if (!isPlaying) {
      controls.stop();
      clickPulseControls.stop();
      return;
    }

    const animate = async () => {
      if (mode === 'quick') {
        // === Quick Pick: ONE single gesture with immediate close ===

        // Reset
        onPickerStateChange(false);
        onValueChange(initialValue);
        setCursorType('pointer');
        await new Promise(resolve => setTimeout(resolve, 100));

        // Cursor appears
        await controls.start({
          y: 0,
          opacity: [0, 1],
          scale: 1,
          transition: { duration: 0.3, ease: 'easeOut' }
        });

        // CLICK to open picker - show visual click feedback
        triggerClickPulse();
        await controls.start({
          scale: [1, 0.85, 1],
          transition: { duration: 0.3 }
        });

        // Open picker after click
        onPickerStateChange(true);

        // Brief wait to show picker opened
        await new Promise(resolve => setTimeout(resolve, 200));

        // === Single smooth drag gesture ===
        const dragDuration = 900;
        // With step=1, we have (90-70)+1 = 21 values for smooth animation
        const dragSteps = 21;
        const dragYStart = 0;
        const dragYEnd = 90;
        const dragValueStart = initialValue; // 70
        const dragValueEnd = targetValue; // 90

        const dragPromise = controls.start({
          y: [dragYStart, dragYEnd],
          scale: [1, 0.9, 0.95],
          transition: { duration: dragDuration / 1000, ease: 'easeOut' }
        });

        // Sync value changes with cursor position
        for (let i = 0; i <= dragSteps; i++) {
          const progressPct = i / dragSteps;
          const newValue = Math.round(dragValueStart + (dragValueEnd - dragValueStart) * progressPct);
          onValueChange(newValue);
          await new Promise(resolve => setTimeout(resolve, dragDuration / dragSteps));
        }
        await dragPromise;

        // Release - picker closes immediately (quick pick behavior)
        await controls.start({
          scale: 1,
          transition: { duration: 0.2 }
        });
        await new Promise(resolve => setTimeout(resolve, 150)); // 150ms close delay

        onPickerStateChange(false);

        // Brief hold to show closed state
        await new Promise(resolve => setTimeout(resolve, 400));

        // Fade out
        await controls.start({
          opacity: 0,
          scale: 1.1,
          transition: { duration: 0.3 }
        });

        await new Promise(resolve => setTimeout(resolve, 800));

        // Reset
        controls.set({ y: 0, opacity: 0, scale: 1 });
        animate();

      } else {
        // === Browse Mode: Click to open, then drag, release, drag back, then scroll wheel ===

        // Reset
        onPickerStateChange(false);
        onValueChange(initialValue);
        setCursorType('pointer');
        await new Promise(resolve => setTimeout(resolve, 100));

        // Cursor appears
        await controls.start({
          y: 0,
          opacity: [0, 1],
          scale: 1,
          transition: { duration: 0.3 }
        });

        // CLICK to open picker - show visual click feedback
        triggerClickPulse();
        await controls.start({
          scale: [1, 0.85, 1],
          transition: { duration: 0.3 }
        });

        // Open picker after click
        onPickerStateChange(true);

        // Wait IDLE - demonstrating the 2.5s idle timeout before any interaction
        // This shows: click to open, picker stays open, waiting for user input
        await new Promise(resolve => setTimeout(resolve, 1500));

        // === Gesture 1: Drag DOWN (pointer) ===
        // Pulse to indicate drag interaction starting
        triggerClickPulse();
        await new Promise(resolve => setTimeout(resolve, 100));

        const drag1Duration = 800;
        const drag1Steps = 30;
        const drag1YStart = 0;
        const drag1YEnd = 70;
        const drag1ValueStart = initialValue; // 12
        const drag1ValueEnd = 22; // +10

        const drag1Promise = controls.start({
          y: [drag1YStart, drag1YEnd],
          scale: [1, 0.9, 0.95],
          transition: { duration: drag1Duration / 1000, ease: 'easeOut' }
        });

        for (let i = 0; i <= drag1Steps; i++) {
          const progressPct = i / drag1Steps;
          const newValue = Math.round(drag1ValueStart + (drag1ValueEnd - drag1ValueStart) * progressPct);
          onValueChange(newValue);
          await new Promise(resolve => setTimeout(resolve, drag1Duration / drag1Steps));
        }
        await drag1Promise;

        // Release (but picker stays open - browse mode)
        await controls.start({
          scale: 1,
          transition: { duration: 0.2 }
        });
        await new Promise(resolve => setTimeout(resolve, 300));

        // === Gesture 2: Drag UP (pointer - changed mind) ===
        // Pulse to indicate new drag interaction starting
        triggerClickPulse();
        await new Promise(resolve => setTimeout(resolve, 100));

        const drag2Duration = 900;
        const drag2Steps = 35;
        const drag2YStart = 70;
        const drag2YEnd = -10;
        const drag2ValueStart = 22;
        const drag2ValueEnd = 8; // Go below initial

        const drag2Promise = controls.start({
          y: [drag2YStart, drag2YEnd],
          scale: [1, 0.9, 0.95],
          transition: { duration: drag2Duration / 1000, ease: 'easeOut' }
        });

        for (let i = 0; i <= drag2Steps; i++) {
          const progressPct = i / drag2Steps;
          const newValue = Math.round(drag2ValueStart + (drag2ValueEnd - drag2ValueStart) * progressPct);
          onValueChange(newValue);
          await new Promise(resolve => setTimeout(resolve, drag2Duration / drag2Steps));
        }
        await drag2Promise;

        // Release
        await controls.start({
          scale: 1,
          transition: { duration: 0.2 }
        });
        await new Promise(resolve => setTimeout(resolve, 400));

        // === Gesture 3: SCROLL WHEEL (change cursor to wheel icon) ===
        // Keep cursor at same position (drag2YEnd = -10)
        // Switch cursor type instantly without moving position
        setCursorType('wheel');

        // Brief pause to show the cursor change
        await new Promise(resolve => setTimeout(resolve, 300));

        // Scroll wheel action: multiple small scrolls to target value
        // Scroll down (increase values) - cursor stays at Y=-10
        const scrollDuration = 1200;
        const scrollSteps = 24;
        const scrollValueStart = 8;
        const scrollValueEnd = targetValue; // 20

        for (let i = 0; i <= scrollSteps; i++) {
          const progressPct = i / scrollSteps;
          const newValue = Math.round(scrollValueStart + (scrollValueEnd - scrollValueStart) * progressPct);
          onValueChange(newValue);

          // Subtle pulse animation for wheel scrolling
          if (i % 4 === 0) {
            controls.start({
              scale: [1, 0.95, 1],
              transition: { duration: 0.15 }
            });
          }

          await new Promise(resolve => setTimeout(resolve, scrollDuration / scrollSteps));
        }

        // Revert back to regular pointer cursor after scrolling completes
        setCursorType('pointer');
        await new Promise(resolve => setTimeout(resolve, 200));

        // Idle pause - picker stays open for the full 2.5s timeout
        // Cursor stays as pointer, showing idle wait state
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Picker auto-closes after idle
        onPickerStateChange(false);

        // Fade out
        await controls.start({
          opacity: 0,
          transition: { duration: 0.3 }
        });

        await new Promise(resolve => setTimeout(resolve, 600));

        // Reset
        setCursorType('pointer');
        controls.set({ y: 0, opacity: 0, scale: 1 });
        animate();
      }
    };

    animate();

    return () => {
      controls.stop();
      onPickerStateChange(false);
      onValueChange(initialValue);
    };
  }, [isPlaying, mode, controls, onPickerStateChange, onValueChange, initialValue, targetValue]);

  return (
    <motion.div
      animate={controls}
      className="absolute pointer-events-none z-50"
      initial={{ y: 0, opacity: 0, scale: 1 }}
    >
      {cursorType === 'pointer' ? (
        // Pointer cursor SVG
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          <motion.path
            d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
            fill="currentColor"
            className="text-accent"
            stroke="white"
            strokeWidth="1"
          />
        </svg>
      ) : (
        // Scroll wheel cursor
        <div className="relative drop-shadow-lg">
          <svg
            width="28"
            height="36"
            viewBox="0 0 28 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Mouse body */}
            <rect
              x="4"
              y="2"
              width="20"
              height="30"
              rx="10"
              fill="currentColor"
              className="text-accent"
              stroke="white"
              strokeWidth="1.5"
            />
            {/* Scroll wheel indicator */}
            <motion.rect
              x="12"
              y="8"
              width="4"
              height="8"
              rx="2"
              fill="white"
              animate={{
                y: [8, 12, 8],
                opacity: [1, 0.6, 1],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </svg>
        </div>
      )}

      {/* Click pulse - radiating circle on click */}
      <motion.div
        animate={clickPulseControls}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-accent/30 border-2 border-accent pointer-events-none"
        initial={{ scale: 0, opacity: 0 }}
      />

      {/* Click ripple effect */}
      <motion.div
        className="absolute top-0 left-0 w-6 h-6 rounded-full border-2 border-accent"
        animate={{
          scale: [1, 2, 2],
          opacity: [0.5, 0.3, 0],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatDelay: mode === 'quick' ? 2.6 : 9.5,
        }}
      />
    </motion.div>
  );
}

interface TimingBadgeProps {
  time: string;
  label: string;
  isActive: boolean;
}

function TimingBadge({ time, label, isActive }: TimingBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{
        scale: isActive ? 1 : 0.95,
        opacity: isActive ? 1 : 0.6
      }}
      transition={{ duration: 0.3 }}
      className={`inline-flex items-center gap-2x px-3x py-1.5x rounded-full border ${
        isActive
          ? 'bg-accent/10 border-accent text-accent'
          : 'bg-muted/10 border-muted/30 text-muted'
      }`}
    >
      <Timer className="w-4 h-4" />
      <span className="font-mono text-sm font-bold">{time}</span>
      <span className="text-xs">{label}</span>
    </motion.div>
  );
}

export function InteractionModes() {
  // Quick Pick state
  const [quickValue, setQuickValue] = useState(70);
  const [quickIsOpen, setQuickIsOpen] = useState(false);
  const [quickPlaying, setQuickPlaying] = useState(true);

  // Browse Mode state
  const [browseValue, setBrowseValue] = useState(12);
  const [browseIsOpen, setBrowseIsOpen] = useState(false);
  const [browsePlaying, setBrowsePlaying] = useState(true);

  return (
    <section className="py-12 px-4x">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-4xl md:text-5xl text-accent mb-3x">
            TWO INTERACTION MODES
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Watch the automated demo or interact with the pickers yourself!
            The component automatically adapts between quick selection and browsing modes.
          </p>
        </motion.div>

        {/* Two Mode Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6x">
          {/* Quick Pick Mode */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass-subtle p-6x relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4x">
              <div>
                <div className="flex items-center gap-2x mb-2x">
                  <MousePointerClick className="w-6 h-6 text-accent" />
                  <h3 className="font-display text-2xl text-fg">Quick Pick</h3>
                </div>
                <p className="text-sm text-muted">
                  One gesture → Auto-closes immediately
                </p>
              </div>

              {/* Play/Pause Control */}
              <button
                onClick={() => setQuickPlaying(!quickPlaying)}
                className="p-2x rounded-lg hover:bg-accent/10 transition-colors"
                aria-label={quickPlaying ? 'Pause animation' : 'Play animation'}
              >
                {quickPlaying ? (
                  <Pause className="w-5 h-5 text-muted" />
                ) : (
                  <Play className="w-5 h-5 text-muted" />
                )}
              </button>
            </div>

            {/* Picker with Animated Demo */}
            <div className="relative mb-4x" style={{ minHeight: '120px' }}>
              {/* Animated Demo - perfectly synced cursor and values */}
              {quickPlaying && (
                <div className="absolute inset-0 flex items-start justify-center pt-8 pointer-events-none z-10">
                  <AnimatedDemo
                    isPlaying={quickPlaying}
                    mode="quick"
                    onPickerStateChange={setQuickIsOpen}
                    onValueChange={setQuickValue}
                    initialValue={70}
                    targetValue={90}
                  />
                </div>
              )}

              {/* Real Picker - controlled by animation when playing, user when paused */}
              <div className="relative z-0">
                <CollapsiblePicker
                  label="Weight"
                  value={quickValue}
                  onChange={setQuickValue}
                  isOpen={quickPlaying ? quickIsOpen : undefined}
                  onRequestOpen={quickPlaying ? undefined : () => setQuickIsOpen(true)}
                  onRequestClose={quickPlaying ? undefined : () => setQuickIsOpen(false)}
                  unit="kg"
                  min={40}
                  max={120}
                  step={1}
                />
              </div>
            </div>

            {/* Timing Info */}
            <div className="flex flex-col gap-3x">
              <TimingBadge time="150ms" label="after release" isActive />
              <div className="text-xs text-muted">
                ✓ Click → One smooth drag → Release → Closes in 150ms
                <br />
                ✓ Perfect for quick single adjustments
              </div>
            </div>

            {/* Background decoration */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/5 rounded-tl-full -z-10" />
          </motion.div>

          {/* Browse Mode */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="glass-subtle p-6x relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4x">
              <div>
                <div className="flex items-center gap-2x mb-2x">
                  <MousePointer2 className="w-6 h-6 text-accent" />
                  <h3 className="font-display text-2xl text-fg">Browse Mode</h3>
                </div>
                <p className="text-sm text-muted">
                  Multiple gestures → Closes after idle
                </p>
              </div>

              {/* Play/Pause Control */}
              <button
                onClick={() => setBrowsePlaying(!browsePlaying)}
                className="p-2x rounded-lg hover:bg-accent/10 transition-colors"
                aria-label={browsePlaying ? 'Pause animation' : 'Play animation'}
              >
                {browsePlaying ? (
                  <Pause className="w-5 h-5 text-muted" />
                ) : (
                  <Play className="w-5 h-5 text-muted" />
                )}
              </button>
            </div>

            {/* Picker with Animated Demo */}
            <div className="relative mb-4x" style={{ minHeight: '120px' }}>
              {/* Animated Demo - perfectly synced cursor and values */}
              {browsePlaying && (
                <div className="absolute inset-0 flex items-start justify-center pt-8 pointer-events-none z-10">
                  <AnimatedDemo
                    isPlaying={browsePlaying}
                    mode="browse"
                    onPickerStateChange={setBrowseIsOpen}
                    onValueChange={setBrowseValue}
                    initialValue={12}
                    targetValue={20}
                  />
                </div>
              )}

              {/* Real Picker - controlled by animation when playing, user when paused */}
              <div className="relative z-0">
                <CollapsiblePicker
                  label="Reps"
                  value={browseValue}
                  onChange={setBrowseValue}
                  isOpen={browsePlaying ? browseIsOpen : undefined}
                  onRequestOpen={browsePlaying ? undefined : () => setBrowseIsOpen(true)}
                  onRequestClose={browsePlaying ? undefined : () => setBrowseIsOpen(false)}
                  unit="reps"
                  min={1}
                  max={30}
                  step={1}
                />
              </div>
            </div>

            {/* Timing Info */}
            <div className="flex flex-col gap-3x">
              <TimingBadge time="2.5s" label="idle timeout" isActive />
              <div className="text-xs text-muted">
                ✓ Drag, release, drag back, scroll wheel
                <br />
                ✓ Auto-closes after 2.5s of inactivity
              </div>
            </div>

            {/* Background decoration */}
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-tr-full -z-10" />
          </motion.div>
        </div>

        {/* Bottom Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6x text-center"
        >
          <p className="text-sm text-muted">
            💡 <strong>Pro tip:</strong> The picker automatically detects your interaction pattern
            and applies the appropriate timing. No mode switching needed!
          </p>
        </motion.div>
      </div>
    </section>
  );
}
