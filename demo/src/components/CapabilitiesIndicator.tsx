import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, AlertCircle, ChevronDown, Check, X } from 'lucide-react';

// Extend Window interface for webkit prefixed AudioContext
interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Detect if device is actually mobile (not just API support)
 */
const checkMobile = () => {
  // Check multiple signals for mobile device
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  const hasSmallScreen = window.innerWidth < 768;

  // Must have touch AND (mobile UA OR small screen)
  return hasTouchScreen && (isMobileUserAgent || hasSmallScreen);
};

/**
 * Check audio API availability (without invoking - no user gesture needed)
 */
const checkAudioAvailability = () => {
  return !!(window.AudioContext || (window as WindowWithWebkit).webkitAudioContext);
};

/**
 * Check haptics availability (without invoking - no user gesture needed)
 */
const checkHapticsAvailability = () => {
  return 'vibrate' in navigator && typeof navigator.vibrate === 'function';
};

/**
 * Device Capabilities Indicator
 *
 * Design: Cyber-Editorial Brutalism
 * - Detects mobile vs desktop (not just API availability)
 * - Shows haptics (mobile only) and audio permissions
 * - Expandable for details
 */
export function CapabilitiesIndicator() {
  // Initialize with default values so component renders immediately
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [hapticsSupported, setHapticsSupported] = useState<boolean>(false);
  const [audioAllowed, setAudioAllowed] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Detect if actually mobile (not just API support)
    const mobile = checkMobile();
    setIsMobile(mobile);

    // Check API availability on mount (no user gesture needed - just check existence)
    setHapticsSupported(mobile && checkHapticsAvailability());
    setAudioAllowed(checkAudioAvailability());

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const testHaptics = () => {
    if (hapticsSupported) {
      navigator.vibrate([30, 80, 30, 80, 30]);
    }
  };

  const testAudio = () => {
    try {
      const AudioContextConstructor =
        window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
      if (!AudioContextConstructor) return;
      const audioCtx = new AudioContextConstructor();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 100);

      setAudioAllowed(true);
    } catch (error) {
      console.error('Audio test failed:', error);
    }
  };

  const capabilities = [
    { name: 'haptics', supported: hapticsSupported, relevant: isMobile },
    { name: 'audio', supported: audioAllowed, relevant: true },
  ];

  const allSupported = capabilities.every((c) => c.supported || !c.relevant);
  const someSupported = capabilities.some((c) => c.supported && c.relevant);

  const animationProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
      };

  return (
    <motion.div {...animationProps} className="inline-block font-sans">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          flex items-center gap-2x px-3x py-2x
          transition-all duration-fast
          border focus-accent
          ${
            allSupported
              ? 'bg-success/10 border-success/30 hover:bg-success/20'
              : someSupported
                ? 'bg-warning/10 border-warning/30 hover:bg-warning/20'
                : 'bg-danger/10 border-danger/30 hover:bg-danger/20'
          }
        `}
      >
        <Smartphone
          className={`w-4 h-4 ${allSupported ? 'text-success' : someSupported ? 'text-warning' : 'text-danger'}`}
          strokeWidth={2}
        />

        <span
          className={`text-sm font-medium ${allSupported ? 'text-success' : someSupported ? 'text-warning' : 'text-danger'}`}
        >
          {isMobile ? 'MOBILE' : 'DESKTOP'} • {hapticsSupported ? '✓' : '✗'} HAPTICS •{' '}
          {audioAllowed ? '✓' : '✗'} AUDIO
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
            <div className="p-3x space-y-3x text-sm">
              {/* Device Type */}
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  {isMobile ? (
                    <Check className="w-4 h-4 text-success mt-0.5" strokeWidth={2} />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-warning mt-0.5" strokeWidth={2} />
                  )}
                  <div className="flex-1">
                    <p className="text-fg font-medium">
                      {isMobile ? 'Mobile Device Detected' : 'Desktop Device'}
                    </p>
                    <p className="text-xs text-muted">
                      {isMobile
                        ? 'Touch screen + mobile browser'
                        : 'Best experienced on mobile for haptics'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Haptics */}
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  {hapticsSupported ? (
                    <Check className="w-4 h-4 text-success mt-0.5" strokeWidth={2} />
                  ) : (
                    <X className="w-4 h-4 text-danger mt-0.5" strokeWidth={2} />
                  )}
                  <div className="flex-1">
                    <p className="text-fg font-medium">Vibration API</p>
                    <p className="text-xs text-muted">
                      {hapticsSupported
                        ? 'Pickers provide tactile feedback on scroll'
                        : isMobile
                          ? 'Not available (browser or device limitation)'
                          : 'Not available on desktop devices'}
                    </p>
                  </div>
                </div>
                {hapticsSupported && (
                  <button
                    onClick={testHaptics}
                    className="w-full px-2x py-1.5 bg-success/20 hover:bg-success/30 transition-colors duration-instant focus-accent text-success font-medium text-xs"
                  >
                    TEST HAPTICS
                  </button>
                )}
              </div>

              {/* Audio */}
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  {audioAllowed ? (
                    <Check className="w-4 h-4 text-success mt-0.5" strokeWidth={2} />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-warning mt-0.5" strokeWidth={2} />
                  )}
                  <div className="flex-1">
                    <p className="text-fg font-medium">Audio Context</p>
                    <p className="text-xs text-muted">
                      {audioAllowed
                        ? 'Audio feedback enabled (optional)'
                        : 'Click to enable audio permissions'}
                    </p>
                  </div>
                </div>
                {!audioAllowed && (
                  <button
                    onClick={testAudio}
                    className="w-full px-2x py-1.5 bg-warning/20 hover:bg-warning/30 transition-colors duration-instant focus-accent text-warning font-medium text-xs"
                  >
                    ENABLE AUDIO
                  </button>
                )}
              </div>

              {/* Technical Details */}
              <div className="hairline-divider" />
              <div className="space-y-1 text-xs text-muted font-mono">
                <div className="flex justify-between">
                  <span>Touch Support:</span>
                  <span className={'ontouchstart' in window ? 'text-success' : 'text-danger'}>
                    {'ontouchstart' in window ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Reduced Motion:</span>
                  <span className={prefersReducedMotion ? 'text-warning' : 'text-muted'}>
                    {prefersReducedMotion ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Screen Width:</span>
                  <span className="text-muted">{window.innerWidth}px</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
