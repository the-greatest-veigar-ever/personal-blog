/**
 * GAROLD'S BLOG - Toast Notification
 * Lightweight toast notification component for user feedback.
 * @module components/Toast
 */

import { AppConstants } from '../constants.js';
import { Utils } from '../utils.js';

export const Toast = {
    /**
     * Display a toast notification
     * @param {string} message - Message to display
     * @param {'success'|'error'|'warning'|'info'} [type='success'] - Toast type
     * @param {number} [duration=3000] - Duration in milliseconds
     */
    show(message, type = 'success', duration = 3000) {
        const container = document.getElementById(AppConstants.DOM.TOAST_CONTAINER);
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span class="toast-message">${Utils.escapeHtml(message)}</span>`;

        container.appendChild(toast);

        // Auto-dismiss after duration
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};
