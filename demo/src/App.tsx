import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { InteractionModes } from './components/InteractionModes';
import { CodeSnippets } from './components/CodeSnippets';
import { TimingBehavior } from './components/TimingBehavior';
import { ComponentShowcase } from './components/ComponentShowcase';
import { PresetsGallery } from './components/PresetsGallery';
import { Footer } from './components/Footer';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

function App() {
  return (
    <>
      <Navigation />

      <main className="min-h-screen bg-bg text-fg">
        {/* 1. Hook: Clear value proposition */}
        <Hero />

        {/* 2. WOW: Show the magic with animated demos */}
        <InteractionModes />

        {/* 3. TOUCH: Let users interact and play */}
        <ComponentShowcase />

        {/* 4. DESIRE: Show customization possibilities */}
        <PresetsGallery />

        {/* 5. LEARN: Technical deep-dive for interested developers */}
        <TimingBehavior />

        {/* 6. BUILD: Implementation details (now they're sold!) */}
        <CodeSnippets />
      </main>

      <Footer />

      {/* PWA Prompts */}
      <PWAUpdatePrompt />
      <PWAInstallPrompt />
    </>
  );
}

export default App;
