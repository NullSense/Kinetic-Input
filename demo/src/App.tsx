import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { CodeSnippets } from './components/CodeSnippets';
import { ComponentShowcase } from './components/ComponentShowcase';
import { PresetsGallery } from './components/PresetsGallery';
import { Footer } from './components/Footer';

function App() {
  return (
    <>
      <Navigation />

      <main className="min-h-screen bg-bg text-fg">
        <Hero />
        <CodeSnippets />
        <ComponentShowcase />
        <PresetsGallery />
      </main>

      <Footer />
    </>
  );
}

export default App;
