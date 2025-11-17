import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

/**
 * PWA Update Prompt
 *
 * Aggressive update strategy:
 * - Checks on page load (automatic)
 * - Checks every 5 minutes while app is active
 * - Checks when user returns to tab (visibility change)
 * - Auto-updates with skipWaiting + clientsClaim
 * - Shows brief notification when update completes
 */
export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Check every 5 minutes (aggressive)
        setInterval(() => {
          r.update();
        }, 5 * 60 * 1000);

        // Check when user returns to tab
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            r.update();
          }
        });

        // Check on focus
        window.addEventListener('focus', () => {
          r.update();
        });
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [needRefresh]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowPrompt(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4x right-4x z-modal max-w-sm"
        >
          <div className="glass-subtle p-4x border-accent/30">
            <div className="flex items-start gap-3x">
              <div className="flex-shrink-0">
                <RefreshCw className="w-5 h-5 text-accent" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-fg mb-1x">
                  New version available!
                </h3>
                <p className="text-xs text-muted mb-3x">
                  {offlineReady
                    ? 'App ready to work offline'
                    : 'Click reload to update to the latest version'}
                </p>
                <div className="flex gap-2x">
                  <button
                    onClick={handleUpdate}
                    className="flex-1 px-3x py-2x bg-accent/20 hover:bg-accent/30 border border-accent/30 transition-colors duration-fast focus-accent text-accent font-medium text-xs"
                  >
                    Reload
                  </button>
                  <button
                    onClick={close}
                    className="px-3x py-2x bg-hairline hover:bg-hairline/70 border border-hairline transition-colors duration-fast focus-accent text-muted font-medium text-xs"
                  >
                    Later
                  </button>
                </div>
              </div>
              <button
                onClick={close}
                className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity duration-instant focus-accent"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted" strokeWidth={2} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
