/**
 * GAROLD'S BLOG - Theme Manager
 * Handles dark/light mode toggle with system preference detection and persistence.
 * @module theme
 */

import { AppConstants } from './constants.js';

export const ThemeManager = {
    /**
     * Initialize theme based on saved preference or system setting
     */
    init() {
        const savedTheme = localStorage.getItem(AppConstants.STORAGE.THEME);

        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark ? 'dark' : 'light');
        }

        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(AppConstants.STORAGE.THEME)) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    },

    /**
     * Apply and persist a theme
     * @param {'light'|'dark'} theme - Theme to apply
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(AppConstants.STORAGE.THEME, theme);
    },

    /**
     * Get the current active theme
     * @returns {'light'|'dark'} Current theme
     */
    getTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    },

    /**
     * Toggle between light and dark themes
     */
    toggle() {
        const currentTheme = this.getTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
};
