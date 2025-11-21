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
 * - Timing badges and countdown displays
 */

interface AnimatedDemoProps {
  isPlaying: boolean;
  mode: 'quick' | 'browse';
  onPickerStateChange: (isOpen: boolean) => void;
  onValueChange: (value: number) => void;
  initialValue: number;
  targetValue: number;
}

/**
 * Coordinated animation that controls both cursor movement and picker state.
 * This demonstrates the interaction by actually opening the picker and changing values.
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

  useEffect(() => {
    if (!isPlaying) {
      controls.stop();
      return;
    }

    const animate = async () => {
      if (mode === 'quick') {
        // === Quick Pick Animation: Single dramatic flick gesture ===

        // Reset to initial state
        onPickerStateChange(false);
        onValueChange(initialValue);
        await new Promise(resolve => setTimeout(resolve, 100));

        // Cursor appears and moves toward picker
        await controls.start({
          y: [0, 20],
          opacity: [0, 1],
          scale: 1,
          transition: { duration: 0.3, ease: 'easeOut' }
        });

        // Picker opens as cursor "touches" it
        onPickerStateChange(true);
        await new Promise(resolve => setTimeout(resolve, 200));

        // Single FLICK gesture - fast dramatic drag with momentum
        const flickDuration = 800;
        const flickPromise = controls.start({
          y: [20, 120],  // Much larger movement (was 15->50, now 20->120)
          scale: [1, 0.85, 1],  // More pronounced scale
          transition: {
            duration: flickDuration / 1000,
            ease: [0.2, 0.8, 0.3, 1] as [number, number, number, number] // Fast start, momentum feel
          }
        });

        // Gradually change value during flick - many steps for smooth animation
        const steps = 12;  // More steps for smoother value changes
        const valueStep = (targetValue - initialValue) / steps;
        for (let i = 1; i <= steps; i++) {
          await new Promise(resolve => setTimeout(resolve, flickDuration / steps));
          onValueChange(Math.round(initialValue + valueStep * i));
        }
        await flickPromise;

        // Brief momentum settle
        await new Promise(resolve => setTimeout(resolve, 150));

        // Release - picker closes immediately (150ms after release in real component)
        onPickerStateChange(false);

        // Cursor fades out
        await controls.start({
          opacity: 0,
          scale: 1.1,
          transition: { duration: 0.3 }
        });

        // Wait before looping
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Reset and restart
        controls.set({ y: 0, opacity: 0, scale: 1 });
        animate();

      } else {
        // === Browse Mode: Multiple dramatic gestures exploring values ===

        // Reset to initial state
        onPickerStateChange(false);
        onValueChange(initialValue);
        await new Promise(resolve => setTimeout(resolve, 100));

        // Cursor appears and moves toward picker
        await controls.start({
          y: 0,
          opacity: [0, 1],
          scale: 1,
          transition: { duration: 0.3 }
        });

        // Picker opens as cursor "touches" it
        onPickerStateChange(true);
        await new Promise(resolve => setTimeout(resolve, 200));

        // First scroll DOWN - exploring higher values
        const scroll1Duration = 600;
        const scroll1Promise = controls.start({
          y: [0, 60],  // Larger movement
          scale: [1, 0.92, 1],
          transition: { duration: scroll1Duration / 1000, ease: 'easeInOut' }
        });
        // Gradually change value (go from 12 to 22)
        for (let i = 0; i <= 5; i++) {
          await new Promise(resolve => setTimeout(resolve, scroll1Duration / 5));
          onValueChange(initialValue + i * 2);
        }
        await scroll1Promise;

        await new Promise(resolve => setTimeout(resolve, 250));

        // Second scroll UP - changed mind, going back down
        const scroll2Duration = 700;
        const scroll2Promise = controls.start({
          y: [60, -20],  // Big upward scroll
          scale: [1, 0.9, 1],
          transition: { duration: scroll2Duration / 1000, ease: 'easeInOut' }
        });
        // Go back down (22 to 8)
        for (let i = 0; i <= 7; i++) {
          await new Promise(resolve => setTimeout(resolve, scroll2Duration / 7));
          onValueChange(22 - i * 2);
        }
        await scroll2Promise;

        await new Promise(resolve => setTimeout(resolve, 300));

        // Third scroll - FLICK down fast (browsing quickly)
        const flickDuration = 500;
        const flickPromise = controls.start({
          y: [-20, 80],  // Fast dramatic flick
          scale: [1, 0.88, 1],
          transition: {
            duration: flickDuration / 1000,
            ease: [0.15, 0.85, 0.25, 1] as [number, number, number, number] // Momentum feel
          }
        });
        // Fast value changes during flick (8 to 26)
        for (let i = 0; i <= 9; i++) {
          await new Promise(resolve => setTimeout(resolve, flickDuration / 9));
          onValueChange(8 + i * 2);
        }
        await flickPromise;

        await new Promise(resolve => setTimeout(resolve, 250));

        // Fourth scroll UP - fine-tuning to find the right value
        const fineTuneDuration = 600;
        const fineTunePromise = controls.start({
          y: [80, 40],  // Scroll back up a bit
          scale: [1, 0.93, 1],
          transition: { duration: fineTuneDuration / 1000, ease: 'easeInOut' }
        });
        // Settle on target value (26 to targetValue)
        const settleSteps = 4;
        const settleValueStep = (targetValue - 26) / settleSteps;
        for (let i = 0; i <= settleSteps; i++) {
          await new Promise(resolve => setTimeout(resolve, fineTuneDuration / settleSteps));
          onValueChange(Math.round(26 + settleValueStep * i));
        }
        await fineTunePromise;

        // Fifth scroll - tiny adjustment (showing precision)
        await new Promise(resolve => setTimeout(resolve, 200));
        const tinyAdjustPromise = controls.start({
          y: [40, 45],
          scale: [1, 0.97, 1],
          transition: { duration: 0.4, ease: 'easeInOut' }
        });
        await new Promise(resolve => setTimeout(resolve, 200));
        onValueChange(targetValue);
        await tinyAdjustPromise;

        // Idle pause - picker stays open, cursor stationary
        // (demonstrating the 2.5s idle timeout)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Picker auto-closes after idle timeout
        onPickerStateChange(false);

        // Cursor fades out
        await controls.start({
          opacity: 0,
          transition: { duration: 0.3 }
        });

        // Wait before looping
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Reset and restart
        controls.set({ y: 0, opacity: 0, scale: 1 });
        animate();
      }
    };

    animate();

    return () => {
      controls.stop();
      // Clean up - close picker and reset value
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
      {/* Cursor SVG */}
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
          repeatDelay: mode === 'quick' ? 2.8 : 5.5,  // Adjusted for longer animations
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
                  Single flick gesture → Auto-closes immediately
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
              {/* Animated Demo - coordinates cursor and picker interaction */}
              {quickPlaying && (
                <div className="absolute inset-0 flex items-start justify-center pt-8 pointer-events-none z-10">
                  <AnimatedDemo
                    isPlaying={quickPlaying}
                    mode="quick"
                    onPickerStateChange={setQuickIsOpen}
                    onValueChange={setQuickValue}
                    initialValue={70}
                    targetValue={110}
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
                  step={5}
                />
              </div>
            </div>

            {/* Timing Info */}
            <div className="flex flex-col gap-3x">
              <TimingBadge time="150ms" label="after release" isActive />
              <div className="text-xs text-muted">
                ✓ One flick or drag → Release → Closes in 150ms
                <br />
                ✓ Perfect for quick adjustments with momentum
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
              {/* Animated Demo - coordinates cursor and picker interaction */}
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
                ✓ Multiple gestures: scroll, flick, explore, fine-tune
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
