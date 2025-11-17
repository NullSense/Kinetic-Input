import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA Install Prompt
 *
 * Shows a prompt to install the app to home screen.
 * Only appears when:
 * - Browser supports installation
 * - App is not already installed
 * - User hasn't dismissed it recently
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show our custom install prompt after a short delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Wait 3 seconds after page load
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-4x left-4x z-modal max-w-sm"
      >
        <div className="glass-subtle p-4x border-accent/30">
          <div className="flex items-start gap-3x">
            <div className="flex-shrink-0">
              <Smartphone className="w-5 h-5 text-accent" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-fg mb-1x">
                Install Kinetic Input
              </h3>
              <p className="text-xs text-muted mb-3x">
                Add to your home screen for quick access and offline support
              </p>
              <div className="flex gap-2x">
                <button
                  onClick={handleInstall}
                  className="flex-1 flex items-center justify-center gap-1x px-3x py-2x bg-accent/20 hover:bg-accent/30 border border-accent/30 transition-colors duration-fast focus-accent text-accent font-medium text-xs"
                >
                  <Download className="w-3 h-3" strokeWidth={2} />
                  <span>Install</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3x py-2x bg-hairline hover:bg-hairline/70 border border-hairline transition-colors duration-fast focus-accent text-muted font-medium text-xs"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity duration-instant focus-accent"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-muted" strokeWidth={2} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
