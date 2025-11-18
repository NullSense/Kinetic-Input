import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, X, Menu } from 'lucide-react';

/**
 * Navigation Component
 *
 * Design: Cyber-Editorial Brutalism
 * - Fixed header with hairline border
 * - Anta display font for logo
 * - Minimal, precise navigation
 * - Functional mobile menu with slide-in animation
 */
export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Examples', href: '#snippets' },
    { label: 'Components', href: '#components' },
    { label: 'Presets', href: '#presets' },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur-xs border-b border-hairline"
    >
      <div className="container mx-auto px-4x">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a
            href="#"
            className="font-display text-2xl text-accent hover:text-accent/80 transition-colors duration-instant"
            onClick={closeMobileMenu}
          >
            KINETIC INPUT
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6x">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted hover:text-fg transition-colors duration-instant"
              >
                {link.label}
              </a>
            ))}

            {/* GitHub Link */}
            <a
              href="https://github.com/NullSense/Kinetic-Input"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3x py-1.5 border border-hairline hover:border-accent/30 hover:bg-accent/5 transition-all duration-fast focus-accent"
              aria-label="View on GitHub"
            >
              <Github className="w-4 h-4" strokeWidth={2} />
              <span className="text-sm font-medium">GitHub</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted hover:text-fg transition-colors duration-instant focus-accent"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" strokeWidth={2} />
            ) : (
              <Menu className="w-6 h-6" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="md:hidden border-t border-hairline bg-bg/95 backdrop-blur-xs overflow-hidden"
          >
            <div className="container mx-auto px-4x py-4x space-y-3x">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="block text-sm font-medium text-muted hover:text-fg transition-colors duration-instant py-2"
                >
                  {link.label}
                </a>
              ))}

              <a
                href="https://github.com/NullSense/Kinetic-Input"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMobileMenu}
                className="flex items-center gap-2 px-3x py-2x border border-hairline hover:border-accent/30 hover:bg-accent/5 transition-all duration-fast focus-accent mt-2"
                aria-label="View on GitHub"
              >
                <Github className="w-4 h-4" strokeWidth={2} />
                <span className="text-sm font-medium">GitHub</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
