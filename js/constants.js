/**
 * GAROLD'S BLOG - Application Constants
 * Centralized configuration for DOM selectors, storage keys, and event types.
 * @module constants
 */

export const AppConstants = {
    /** API endpoint configuration */
    API: {
        BASE: '/api/posts'
    },

    /** Local storage keys */
    STORAGE: {
        THEME: 'luxe-blog-theme'
    },

    /** DOM element IDs */
    DOM: {
        THEME_TOGGLE: 'themeToggle',
        POSTS_BTN: 'postsBtn',
        CLOSE_POSTS_MODAL: 'closePostsModal',
        NEW_POST_BTN: 'newPostBtn',
        SAVE_BTN: 'saveBtn',
        SHORTCUTS_BTN: 'shortcutsBtn',
        CLOSE_SHORTCUTS: 'closeShortcuts',
        POST_TITLE: 'postTitle',
        EDITOR: 'editor-container',
        TOOLBAR: 'toolbar',
        POSTS_MODAL: 'postsModal',
        POSTS_LIST: 'postsList',
        POSTS_EMPTY: 'postsEmpty',
        DELETE_MODAL: 'deleteModal',
        SHORTCUTS_MODAL: 'shortcutsModal',
        TOAST_CONTAINER: 'toastContainer',
        META_CREATED: 'metaCreated',
        META_UPDATED: 'metaUpdated',
        FILTERS: {
            NAME: 'filterName',
            CONTENT: 'filterContent',
            DATE_FROM: 'filterDateFrom',
            DATE_TO: 'filterDateTo',
            SORT_BY: 'sortBy',
            CLEAR: 'clearFilters'
        },
        STATUS_BAR: 'statusBar',
        WORD_COUNT: 'wordCount',
        READING_TIME: 'readingTime',
        SAVE_STATUS: 'saveStatus',
        ZEN_BTN: 'zenModeBtn',
        EXPORT_BTN: 'exportBtn',
        EXPORT_MENU: 'exportMenu'
    },

    /** CSS selectors for querying elements */
    SELECTORS: {
        POSTS_MODAL_OVERLAY: '.posts-modal-overlay',
        SHORTCUTS_OVERLAY: '#shortcutsModal .modal-overlay',
        DELETE_OVERLAY: '#deleteModal .modal-overlay',
        POST_ITEM: '.post-item',
        POST_DELETE_BTN: '.post-item-delete'
    },

    /** Event type constants */
    EVENTS: {
        CLICK: 'click',
        INPUT: 'input',
        CHANGE: 'change',
        KEYDOWN: 'keydown',
        DOM_LOADED: 'DOMContentLoaded'
    }
};
