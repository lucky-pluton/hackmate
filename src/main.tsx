import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { OpportunitiesProvider } from './context/OpportunitiesContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <OpportunitiesProvider>
          <App />
        </OpportunitiesProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
