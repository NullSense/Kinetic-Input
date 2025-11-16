import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import '../../packages/number-picker/src/styles/picker-base.css';
import '../../packages/number-picker/src/styles/wheel-picker.css';
import '../../packages/number-picker/src/styles/quick-number-input.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
