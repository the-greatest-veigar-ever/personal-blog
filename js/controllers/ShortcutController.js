/**
 * GAROLD'S BLOG - Shortcut Controller
 * Handles global keyboard shortcuts for the application.
 * @module controllers/ShortcutController
 */

import { AppConstants } from '../constants.js';
import { PostController } from './PostController.js?v=20260121_v4';
import { UIController } from './UIController.js?v=20260121_v4';

export const ShortcutController = {
    /**
     * Initialize keyboard shortcut listeners
     */
    init() {
        document.addEventListener(AppConstants.EVENTS.KEYDOWN, (e) => {
            // Escape closes modals and exits zen mode
            if (e.key === 'Escape') {
                if (UIController.isZenMode()) {
                    UIController.exitZenMode();
                    return;
                }
                UIController.closePostsModal();
                return;
            }

            const isModifier = e.ctrlKey || e.metaKey;
            if (!isModifier) return;

            switch (e.key.toLowerCase()) {
                case 's': // Save
                    e.preventDefault();
                    UIController.handleSave();
                    break;

                case 'n': // New post
                    e.preventDefault();
                    PostController.createNewPost();
                    break;

                case 'o': // Open posts modal
                    e.preventDefault();
                    UIController.togglePostsModal();
                    break;
            }
        });
    }
};
