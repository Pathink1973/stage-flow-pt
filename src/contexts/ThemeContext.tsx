import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';
type ThemeIntensity = 'low' | 'medium' | 'high';

interface ThemeContextType {
  mode: ThemeMode;
  intensity: ThemeIntensity;
  toggleMode: () => void;
  setIntensity: (intensity: ThemeIntensity) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode');
    return (saved as ThemeMode) || 'light';
  });

  const [intensity, setIntensityState] = useState<ThemeIntensity>(() => {
    const saved = localStorage.getItem('theme-intensity');
    return (saved as ThemeIntensity) || 'medium';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    document.documentElement.setAttribute('data-intensity', intensity);
    localStorage.setItem('theme-mode', mode);
    localStorage.setItem('theme-intensity', intensity);
  }, [mode, intensity]);

  const toggleMode = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setIntensity = (newIntensity: ThemeIntensity) => {
    setIntensityState(newIntensity);
  };

  return (
    <ThemeContext.Provider value={{ mode, intensity, toggleMode, setIntensity }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
