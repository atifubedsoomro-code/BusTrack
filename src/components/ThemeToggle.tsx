import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme, className }) => {
  return (
    <button
      onClick={toggleTheme}
      className={`p-2.5 rounded-full transition-all flex items-center justify-center
        ${theme === 'dark' 
          ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600 border border-gray-600' 
          : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200 shadow-sm'} 
        ${className || 'fixed top-4 right-4 z-[100] shadow-md'}`}
      aria-label="Toggle Theme"
      title="Toggle Theme"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

