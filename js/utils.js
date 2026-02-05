/**
 * GAROLD'S BLOG - Utility Functions
 * Common helper functions for text processing, date formatting, and DOM manipulation.
 * @module utils
 */

export const Utils = {
    /**
     * Debounce function to limit execution rate
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Escape HTML entities to prevent XSS attacks
     * @param {string} str - String to escape
     * @returns {string} Escaped string safe for HTML insertion
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Format ISO date string to human-readable locale format
     * @param {string} isoString - ISO 8601 date string
     * @returns {string} Formatted date (e.g., "Jan 20, 2026, 11:45 PM")
     */
    formatDate(isoString) {
        if (!isoString) return '-';
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '-';

        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Format date for compact list display
     * @param {string} isoString - ISO 8601 date string
     * @returns {string} Short formatted date (e.g., "Jan 20, 2026")
     */
    formatDateShort(isoString) {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '-';

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    },

    /**
     * Generate a truncated text preview with ellipsis
     * @param {string} text - Full text content
     * @param {number} [length=80] - Maximum character length
     * @returns {string} Truncated preview text
     */
    getPreview(text, length = 80) {
        if (!text) return 'No content';
        return text.substring(0, length) + (text.length > length ? '...' : '');
    }
};
