import { Github } from 'lucide-react';

/**
 * Footer Component
 *
 * Design: Cyber-Editorial Brutalism
 * - Minimal footer with links
 * - Hairline top border
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline bg-bg">
      <div className="container mx-auto px-4x py-8x">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4x">
          {/* Logo */}
          <div className="font-display text-xl text-accent">
            KINETIC INPUT
          </div>

          {/* Links */}
          <div className="flex items-center gap-6x text-sm">
            <a
              href="#examples"
              className="text-muted hover:text-fg transition-colors duration-instant"
            >
              Examples
            </a>
            <a
              href="#components"
              className="text-muted hover:text-fg transition-colors duration-instant"
            >
              Components
            </a>
            <a
              href="https://github.com/NullSense/Kinetic-Input"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-fg transition-colors duration-instant"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" strokeWidth={2} />
            </a>
          </div>

          {/* Copyright */}
          <div className="text-sm text-muted">
            © {currentYear} Tensil
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-6x pt-6x border-t border-hairline text-center">
          <p className="text-xs text-muted">
            Built with React 19, Framer Motion, and Vite •{' '}
            <a
              href="https://github.com/NullSense/Kinetic-Input"
              className="text-accent hover:underline"
            >
              Open source
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
