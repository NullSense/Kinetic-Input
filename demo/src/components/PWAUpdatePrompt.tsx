import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

/**
 * PWA Update Handler
 *
 * Aggressive update strategy with proper edge case handling:
 * - Checks on page load (automatic)
 * - Checks every 5 minutes while app is active
 * - Checks when user returns to tab (visibility change)
 * - Checks on window focus
 * - Auto-updates with skipWaiting + clientsClaim
 * - Automatically reloads page when update is ready
 * - Shows brief "Updating..." notification before reload
 *
 * Edge cases handled:
 * - Skip checks when service worker is installing
 * - Skip checks when offline
 * - Use no-cache headers to avoid stale service worker
 */
export function PWAUpdatePrompt() {
  const [showUpdating, setShowUpdating] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (!r) return;

      // Robust periodic update check with edge case handling
      const checkForUpdates = async () => {
        // Skip if service worker is already installing
        if (r.installing) return;

        // Skip if navigator is not available
        if (!navigator) return;

        // Skip if user is offline
        if ('connection' in navigator && !navigator.onLine) return;

        try {
          // Fetch service worker with no-cache to avoid stale versions
          const resp = await fetch(swUrl, {
            cache: 'no-store',
            headers: {
              'cache': 'no-store',
              'cache-control': 'no-cache',
            },
          });

          // Only update if server responded successfully
          if (resp?.status === 200) {
            await r.update();
          }
        } catch (error) {
          console.error('Update check failed:', error);
        }
      };

      // Check every 5 minutes (aggressive for demo app)
      setInterval(checkForUpdates, 5 * 60 * 1000);

      // Check when user returns to tab
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          checkForUpdates();
        }
      });

      // Check on window focus
      window.addEventListener('focus', () => {
        checkForUpdates();
      });
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      // Show brief "Updating..." message
      setShowUpdating(true);

      // Auto-reload after 1 second (gives user visual feedback)
      setTimeout(() => {
        updateServiceWorker(true);
      }, 1000);
    }
  }, [needRefresh, updateServiceWorker]);

  return (
    <AnimatePresence>
      {showUpdating && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4x right-4x z-modal"
        >
          <div className="glass-subtle p-4x border-accent/30">
            <div className="flex items-center gap-3x">
              <RefreshCw className="w-5 h-5 text-accent animate-spin" strokeWidth={2} />
              <div>
                <p className="text-sm font-semibold text-fg">Updating app...</p>
                <p className="text-xs text-muted">This will only take a moment</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
