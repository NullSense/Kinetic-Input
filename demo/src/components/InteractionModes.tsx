import { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useAnimationControls } from 'framer-motion';
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

interface AnimatedCursorProps {
  isPlaying: boolean;
  mode: 'quick' | 'browse';
}

function AnimatedCursor({ isPlaying, mode }: AnimatedCursorProps) {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  // Smooth spring physics for cursor movement
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  const controls = useAnimationControls();

  useEffect(() => {
    if (!isPlaying) {
      controls.stop();
      return;
    }

    const animate = async () => {
      if (mode === 'quick') {
        // Quick Pick Animation: Single drag and release
        await controls.start({
          x: [0, 0, 0],
          y: [0, 20, 50],
          scale: [1, 0.9, 1],
          opacity: [0, 1, 1],
          transition: { duration: 0.5, ease: 'easeOut' }
        });

        // Hold at end position
        await controls.start({
          x: 0,
          y: 50,
          scale: 1,
          opacity: 1,
          transition: { duration: 0.8 }
        });

        // Release and fade
        await controls.start({
          scale: [1, 1.1, 1],
          opacity: [1, 0.5, 0],
          transition: { duration: 0.4 }
        });

        // Wait before loop
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Reset and restart
        controls.set({ x: 0, y: 0, scale: 1, opacity: 0 });
        animate();

      } else {
        // Browse Mode: Multiple scroll gestures
        await controls.start({
          opacity: [0, 1],
          transition: { duration: 0.3 }
        });

        // First scroll
        await controls.start({
          y: [0, 30],
          scale: [1, 0.95, 1],
          transition: { duration: 0.6, ease: 'easeInOut' }
        });

        await new Promise(resolve => setTimeout(resolve, 300));

        // Second scroll
        await controls.start({
          y: [30, 60],
          scale: [1, 0.95, 1],
          transition: { duration: 0.6, ease: 'easeInOut' }
        });

        await new Promise(resolve => setTimeout(resolve, 300));

        // Third scroll
        await controls.start({
          y: [60, 45],
          scale: [1, 0.95, 1],
          transition: { duration: 0.6, ease: 'easeInOut' }
        });

        // Pause (idle time)
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Fade out
        await controls.start({
          opacity: 0,
          transition: { duration: 0.4 }
        });

        // Wait before loop
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Reset and restart
        controls.set({ x: 0, y: 0, scale: 1, opacity: 0 });
        animate();
      }
    };

    animate();

    return () => {
      controls.stop();
    };
  }, [isPlaying, mode, controls]);

  return (
    <motion.div
      animate={controls}
      style={{
        x: smoothX,
        y: smoothY,
      }}
      className="absolute pointer-events-none z-50"
      initial={{ x: 0, y: 0, scale: 1, opacity: 0 }}
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
          repeatDelay: mode === 'quick' ? 2.7 : 2.5,
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
  const [quickValue, setQuickValue] = useState(70);
  const [browseValue, setBrowseValue] = useState(12);
  const [quickPlaying, setQuickPlaying] = useState(true);
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
            Users naturally discover and switch between quick selection and browsing modes.
            Both work seamlessly with smart auto-close timing.
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
                  Single gesture → Auto-closes immediately
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

            {/* Picker with Animated Overlay */}
            <div className="relative mb-4x" style={{ minHeight: '120px' }}>
              {/* Animated Cursor Overlay */}
              {quickPlaying && (
                <div className="absolute inset-0 flex items-start justify-center pt-8 pointer-events-none z-10">
                  <AnimatedCursor isPlaying={quickPlaying} mode="quick" />
                </div>
              )}

              {/* Real Picker */}
              <div className="relative z-0">
                <CollapsiblePicker
                  label="Weight"
                  value={quickValue}
                  onChange={setQuickValue}
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
                ✓ One drag or scroll → Release → Closes in 150ms
                <br />
                ✓ Perfect for quick adjustments and data entry
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

            {/* Picker with Animated Overlay */}
            <div className="relative mb-4x" style={{ minHeight: '120px' }}>
              {/* Animated Cursor Overlay */}
              {browsePlaying && (
                <div className="absolute inset-0 flex items-start justify-center pt-8 pointer-events-none z-10">
                  <AnimatedCursor isPlaying={browsePlaying} mode="browse" />
                </div>
              )}

              {/* Real Picker */}
              <div className="relative z-0">
                <CollapsiblePicker
                  label="Reps"
                  value={browseValue}
                  onChange={setBrowseValue}
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
                ✓ Scroll freely, explore values, adjust multiple times
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
