import { motion } from 'framer-motion';
import { Github } from 'lucide-react';

/**
 * Navigation Component
 *
 * Design: Cyber-Editorial Brutalism
 * - Fixed header with hairline border
 * - Anta display font for logo
 * - Minimal, precise navigation
 */
export function Navigation() {
  const navLinks = [
    { label: 'Examples', href: '#snippets' },
    { label: 'Components', href: '#components' },
    { label: 'Presets', href: '#presets' },
  ];

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
          >
            KINETIC INPUT
          </a>

          {/* Navigation Links */}
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
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
