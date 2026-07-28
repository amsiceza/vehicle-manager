import { Injectable, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly KEY = 'vm_theme';

  readonly isDark = signal(this.loadPreference());

  constructor() {
    this.apply(this.isDark());
  }

  toggle(): void {
    const next = !this.isDark();
    this.isDark.set(next);
    localStorage.setItem(this.KEY, next ? 'dark' : 'light');
    this.apply(next);
  }

  private loadPreference(): boolean {
    const saved = localStorage.getItem(this.KEY);
    if (saved) return saved === 'dark';
    // Default: dark
    return true;
  }

  private apply(dark: boolean): void {
    this.doc.documentElement.classList.toggle('theme-dark', dark);
    this.doc.documentElement.classList.toggle('theme-light', !dark);
  }
}
