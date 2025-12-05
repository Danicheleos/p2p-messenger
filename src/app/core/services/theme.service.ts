import { Injectable, signal, effect } from '@angular/core';
import { STORAGE_KEYS } from '../constants/storage-keys.const';

export type Theme = 'light' | 'dark';

/**
 * Theme Service - Manages application theme
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _theme = signal<Theme>(this.getInitialTheme());
  
  readonly theme = this._theme.asReadonly();

  constructor() {
    // Apply theme when it changes
    effect(() => {
      this.applyTheme(this._theme());
    });
  }

  /**
   * Get initial theme from storage or system preference
   */
  private getInitialTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE.THEME) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme(): void {
    const newTheme = this._theme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Set theme
   */
  setTheme(theme: Theme): void {
    this._theme.set(theme);
    localStorage.setItem(STORAGE_KEYS.LOCAL_STORAGE.THEME, theme);
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
  }
}

