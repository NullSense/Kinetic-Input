import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, AlertCircle, ChevronDown } from 'lucide-react';

/**
 * Check if haptics/vibration is supported
 */
const checkHaptics = () => {
  const hasVibration = 'vibrate' in navigator;

  if (!hasVibration) return false;

  // Test if vibration actually works (some browsers return true but don't vibrate)
  try {
    return navigator.vibrate(0) !== false;
  } catch {
    return false;
  }
};

/**
 * Haptics Detection Indicator
 *
 * Design: Cyber-Editorial Brutalism
 * - Precision instrument, not decorative UI
 * - Subtle animations (100-200ms, no bouncing)
 * - Clear state communication
 * - Respects prefers-reduced-motion
 */
export function HapticsIndicator() {
  const [hapticsSupported, setHapticsSupported] = useState<boolean | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Check haptics support
    setHapticsSupported(checkHaptics());

    // Re-check on focus (mobile browsers sometimes enable after interaction)
    const handleFocus = () => setHapticsSupported(checkHaptics());
    window.addEventListener('focus', handleFocus);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const testHaptics = () => {
    if (hapticsSupported) {
      // Subtle triple-tap pattern
      navigator.vibrate([30, 80, 30, 80, 30]);
    }
  };

  if (hapticsSupported === null) return null;

  const animationProps = prefersReducedMotion ? {} : {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  };

  return (
    <motion.div
      {...animationProps}
      className="inline-block font-sans"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          flex items-center gap-2x px-3x py-2x
          transition-all duration-fast
          border focus-accent
          ${hapticsSupported
            ? 'bg-success/10 border-success/30 hover:bg-success/20'
            : 'bg-danger/10 border-danger/30 hover:bg-danger/20'
          }
        `}
      >
        {hapticsSupported ? (
          <Smartphone className="w-4 h-4 text-success" strokeWidth={2} />
        ) : (
          <AlertCircle className="w-4 h-4 text-danger" strokeWidth={2} />
        )}

        <span className={`text-sm font-medium ${hapticsSupported ? 'text-success' : 'text-danger'}`}>
          {hapticsSupported ? 'HAPTICS' : 'NO HAPTICS'}
        </span>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          className="text-muted"
        >
          <ChevronDown className="w-3 h-3" strokeWidth={2} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1x glass-subtle overflow-hidden"
          >
            <div className="p-3x space-y-2x text-sm">
              {hapticsSupported ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-success font-mono">✓</span>
                    <p className="text-fg">Vibration API detected</p>
                  </div>

                  <p className="text-muted text-xs">
                    Pickers will provide subtle haptic feedback during interaction.
                  </p>

                  <button
                    onClick={testHaptics}
                    className="w-full px-2x py-1.5 bg-success/20 hover:bg-success/30 transition-colors duration-instant focus-accent text-success font-medium text-xs"
                  >
                    TEST HAPTICS
                  </button>

                  <div className="hairline-divider my-2x" />

                  <div className="space-y-1 text-xs text-muted font-mono">
                    <div className="flex justify-between">
                      <span>Vibration API:</span>
                      <span className="text-success">ACTIVE</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reduced Motion:</span>
                      <span className={prefersReducedMotion ? 'text-warning' : 'text-muted'}>
                        {prefersReducedMotion ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-danger font-mono">✗</span>
                    <p className="text-fg">Vibration API not available</p>
                  </div>

                  <p className="text-muted text-xs">
                    Haptic feedback requires mobile device or supported browser.
                  </p>

                  <div className="hairline-divider my-2x" />

                  <div className="space-y-1 text-xs text-muted">
                    <p className="font-medium text-fg">Common causes:</p>
                    <ul className="space-y-0.5 pl-3x">
                      <li>• Desktop browsers (no hardware)</li>
                      <li>• iOS Safari (requires user gesture)</li>
                      <li>• Security/privacy settings</li>
                    </ul>
                    <p className="mt-2x text-accent">
                      💡 Try this on a mobile device
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
