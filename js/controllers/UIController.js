/**
 * GAROLD'S BLOG - UI Controller
 * Manages all UI interactions, modals, and view rendering.
 * @module controllers/UIController
 */

import { AppConstants } from '../constants.js';
import { Utils } from '../utils.js';
import { EventBus } from '../core/EventBus.js';
import { PostController } from './PostController.js?v=20260121_v4';
import { ThemeManager } from '../theme.js';
import { FiltersManager } from '../filters.js';
import { EditorManager } from '../editor.js';
import { Toast } from '../components/Toast.js';

export const UIController = {
    /** @type {string|null} Filename of post pending deletion */
    postToDelete: null,

    /** @type {number|null} Timer for filter debouncing */
    filterDebounceTimer: null,

    /** @type {'normal'|'zen'} Current view mode */
    viewMode: 'normal',

    /**
     * Initialize UI controller
     */
    init() {
        this.setupEventListeners();
        this.setupEventBusListeners();
        this.renderPostsList(PostController.posts);
        this.initZenMode();
    },

    /**
     * Initialize Zen Mode functionality
     */
    initZenMode() {
        // Ensure we start in normal mode
        this.viewMode = 'normal';
        document.body.classList.remove('zen-mode');
    },

    /**
     * Toggle between normal and zen mode
     */
    toggleZenMode() {
        if (this.viewMode === 'normal') {
            this.enterZenMode();
        } else {
            this.exitZenMode();
        }
    },

    /**
     * Enter zen mode (distraction-free writing)
     */
    enterZenMode() {
        this.viewMode = 'zen';
        document.body.classList.add('zen-mode');
    },

    /**
     * Exit zen mode (return to normal)
     */
    exitZenMode() {
        this.viewMode = 'normal';
        document.body.classList.remove('zen-mode');
    },

    /**
     * Check if currently in zen mode
     * @returns {boolean}
     */
    isZenMode() {
        return this.viewMode === 'zen';
    },

    // =========================================================================
    // Welcome Screen
    // =========================================================================

    /**
     * Show the welcome screen and hide editor
     */
    showWelcomeScreen() {
        const screen = document.getElementById('welcomeScreen');
        const editor = document.getElementById('editorWrapper');

        if (screen && editor) {
            screen.style.display = 'flex';
            editor.style.display = 'none';
            this.refreshWelcomeContent();
        }
    },

    /**
     * Hide welcome screen and show editor
     */
    hideWelcomeScreen() {
        const screen = document.getElementById('welcomeScreen');
        const editor = document.getElementById('editorWrapper');

        if (screen && editor) {
            screen.style.display = 'none';
            editor.style.display = 'block';
        }
    },

    /**
     * Refresh welcome screen with random content
     */
    async refreshWelcomeContent() {
        const { WELCOME_CONTENT, GREETINGS } = await import('../contents.js');

        const greetingEl = document.getElementById('welcomeGreeting');
        const textEl = document.getElementById('welcomeText');
        const authorEl = document.getElementById('welcomeAuthor');

        if (greetingEl) {
            greetingEl.textContent = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
        }

        if (textEl) {
            const content = WELCOME_CONTENT[Math.floor(Math.random() * WELCOME_CONTENT.length)];
            textEl.textContent = content.text;
            if (authorEl) {
                authorEl.textContent = content.author ? `— ${content.author}` : '';
            }
        }
    },

    // =========================================================================
    // Event Listeners Setup
    // =========================================================================

    /**
     * Setup all DOM event listeners
     * @private
     */
    setupEventListeners() {
        const { DOM, EVENTS } = AppConstants;

        // Theme
        document.getElementById(DOM.THEME_TOGGLE).addEventListener(EVENTS.CLICK, () => ThemeManager.toggle());

        // Posts modal
        document.getElementById(DOM.POSTS_BTN).addEventListener(EVENTS.CLICK, () => this.togglePostsModal());
        document.getElementById(DOM.CLOSE_POSTS_MODAL).addEventListener(EVENTS.CLICK, () => this.closePostsModal());
        document.querySelector(AppConstants.SELECTORS.POSTS_MODAL_OVERLAY).addEventListener(EVENTS.CLICK, () => this.closePostsModal());

        // Editor actions
        document.getElementById(DOM.NEW_POST_BTN).addEventListener(EVENTS.CLICK, () => PostController.createNewPost());
        document.getElementById(DOM.SAVE_BTN).addEventListener(EVENTS.CLICK, () => this.handleSave());

        const deleteBtn = document.getElementById('deleteBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener(EVENTS.CLICK, () => this.handleDelete());
        }

        // Shortcuts modal
        document.getElementById(DOM.SHORTCUTS_BTN).addEventListener(EVENTS.CLICK, () => this.showShortcutsModal());
        document.getElementById(DOM.CLOSE_SHORTCUTS).addEventListener(EVENTS.CLICK, () => this.hideShortcutsModal());
        document.querySelector(AppConstants.SELECTORS.SHORTCUTS_OVERLAY).addEventListener(EVENTS.CLICK, () => this.hideShortcutsModal());

        // Filters
        this.setupFiltersEvents();

        // Delete modal
        document.getElementById('cancelDelete').addEventListener(EVENTS.CLICK, () => this.hideDeleteModal());
        document.getElementById('confirmDelete').addEventListener(EVENTS.CLICK, () => this.confirmDeletion());
        document.querySelector(AppConstants.SELECTORS.DELETE_OVERLAY).addEventListener(EVENTS.CLICK, () => this.hideDeleteModal());

        // Welcome screen buttons
        const welcomeNewBtn = document.getElementById('welcomeNewBtn');
        const welcomeOpenBtn = document.getElementById('welcomeOpenBtn');
        const inspireBtn = document.getElementById('inspireBtn');

        if (welcomeNewBtn) welcomeNewBtn.addEventListener(EVENTS.CLICK, () => PostController.createNewPost());
        if (welcomeOpenBtn) welcomeOpenBtn.addEventListener(EVENTS.CLICK, () => this.togglePostsModal());
        if (inspireBtn) inspireBtn.addEventListener(EVENTS.CLICK, () => this.refreshWelcomeContent());

        // Zen mode toggle (header button)
        document.getElementById(DOM.ZEN_BTN).addEventListener(EVENTS.CLICK, () => this.toggleZenMode());

        // Exit Zen Mode floating button
        const exitZenBtn = document.getElementById('exitZenBtn');
        if (exitZenBtn) {
            exitZenBtn.addEventListener(EVENTS.CLICK, () => this.exitZenMode());
        }

        // Export
        this.setupExportEvents();

        // Title input triggers dirty state
        document.getElementById(DOM.POST_TITLE).addEventListener(EVENTS.INPUT, () => {
            PostController.setDirty(true);
            PostController.debouncedSave();
        });
    },

    /**
     * Setup EventBus listeners for post events
     * @private
     */
    setupEventBusListeners() {
        EventBus.on('post:created', (data) => {
            document.getElementById(AppConstants.DOM.POST_TITLE).value = '';
            document.getElementById(AppConstants.DOM.POST_TITLE).focus();
            this.updateMetadata(data.createdAt, data.createdAt);
            this.updateSaveStatus('');

            if (!data.silent) {
                this.closePostsModal();
                Toast.show('New post created', 'success');
            }
        });

        EventBus.on('post:loaded', (post) => {
            document.getElementById(AppConstants.DOM.POST_TITLE).value = post.title;
            this.updateMetadata(post.createdAt, post.modifiedAt);
            this.updateSaveStatus('');
            this.closePostsModal();
            this.highlightActivePost(post.id);
        });

        EventBus.on('post:dirty', (isDirty) => {
            if (isDirty) this.updateSaveStatus('Unsaved changes...');
        });

        EventBus.on('post:saving', () => {
            this.updateSaveStatus('Saving...');
        });

        EventBus.on('post:saved', ({ post, isAutoSave }) => {
            this.renderPostsList(PostController.posts);
            this.updateMetadata(post.createdAt, post.modifiedAt);
            this.highlightActivePost(post.id);

            if (isAutoSave) {
                this.updateSaveStatus('All changes saved');
            } else {
                Toast.show('Post saved successfully', 'success');
                this.updateSaveStatus('');
            }
        });

        EventBus.on('post:deleted', () => {
            this.renderPostsList(PostController.posts);
            Toast.show('Post deleted', 'success');
        });

        EventBus.on('post:updated', () => {
            this.flipAnimation(() => {
                this.renderPostsList(PostController.posts);
            });
        });
    },

    // =========================================================================
    // Actions
    // =========================================================================

    /**
     * Handle save action
     */
    handleSave() {
        const titleInput = document.getElementById(AppConstants.DOM.POST_TITLE);
        const title = titleInput.value.trim() || 'Untitled Post';
        PostController.saveCurrentPost(false, title);
    },

    /**
     * Handle delete action
     */
    handleDelete() {
        if (PostController.currentFilename) {
            this.postToDelete = PostController.currentFilename;
            this.showDeleteModal();
        } else {
            if (confirm('Discard this draft?')) {
                PostController.createNewPost();
                Toast.show('Draft discarded', 'info');
            }
        }
    },

    /**
     * Confirm and execute deletion
     * @private
     */
    confirmDeletion() {
        if (!this.postToDelete) return;

        const filename = this.postToDelete;
        this.hideDeleteModal();

        PostController.deletePost(filename).then(success => {
            if (!success) Toast.show('Failed to delete post', 'error');
        });
    },

    // =========================================================================
    // Filters
    // =========================================================================

    /**
     * Setup filter input event listeners
     * @private
     */
    setupFiltersEvents() {
        const { FILTERS } = AppConstants.DOM;
        const filterInputs = [FILTERS.NAME, FILTERS.CONTENT, FILTERS.DATE_FROM, FILTERS.DATE_TO, FILTERS.SORT_BY];

        filterInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener(AppConstants.EVENTS.INPUT, () => this.debounceFilter());
                el.addEventListener(AppConstants.EVENTS.CHANGE, () => this.applyFilters());
            }
        });

        document.getElementById(FILTERS.CLEAR).addEventListener(AppConstants.EVENTS.CLICK, () => this.clearFilters());
    },

    /**
     * Debounce filter application
     * @private
     */
    debounceFilter() {
        clearTimeout(this.filterDebounceTimer);
        this.filterDebounceTimer = setTimeout(() => this.applyFilters(), 300);
    },

    /**
     * Apply current filters to posts list
     */
    applyFilters() {
        this.renderPostsList(PostController.posts);
    },

    /**
     * Get filtered and sorted posts
     * @param {Array} posts - Posts to filter
     * @returns {Array} Filtered posts with favorites first
     * @private
     */
    getFilteredPosts(posts) {
        const { DOM } = AppConstants;

        const filtered = FiltersManager.applyFilters(posts, {
            name: document.getElementById(DOM.FILTERS.NAME).value,
            content: document.getElementById(DOM.FILTERS.CONTENT).value,
            fromDate: document.getElementById(DOM.FILTERS.DATE_FROM).value,
            toDate: document.getElementById(DOM.FILTERS.DATE_TO).value,
            sortBy: document.getElementById(DOM.FILTERS.SORT_BY).value
        });

        // Prioritize favorites
        return [...filtered].sort((a, b) => {
            if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    },

    /**
     * Clear all filters
     */
    clearFilters() {
        const { DOM } = AppConstants;
        document.getElementById(DOM.FILTERS.NAME).value = '';
        document.getElementById(DOM.FILTERS.CONTENT).value = '';
        document.getElementById(DOM.FILTERS.DATE_FROM).value = '';
        document.getElementById(DOM.FILTERS.DATE_TO).value = '';
        document.getElementById(DOM.FILTERS.SORT_BY).value = 'date-desc';
        this.renderPostsList(PostController.posts);
    },

    // =========================================================================
    // Export
    // =========================================================================

    /**
     * Setup export dropdown events
     * @private
     */
    setupExportEvents() {
        const { DOM, EVENTS } = AppConstants;
        const exportBtn = document.getElementById(DOM.EXPORT_BTN);

        if (exportBtn) {
            exportBtn.addEventListener(EVENTS.CLICK, (e) => {
                e.stopPropagation();
                document.getElementById(DOM.EXPORT_MENU).classList.toggle('active');
            });
        }

        // Close on outside click
        document.addEventListener(EVENTS.CLICK, (e) => {
            if (!e.target.closest('.dropdown-wrapper')) {
                const menu = document.getElementById(DOM.EXPORT_MENU);
                if (menu) menu.classList.remove('active');
            }
        });

        // Format buttons
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener(EVENTS.CLICK, () => {
                this.handleExport(item.dataset.format);
                document.getElementById(DOM.EXPORT_MENU).classList.remove('active');
            });
        });
    },

    /**
     * Handle export in specified format
     * @param {'html'|'markdown'|'json'|'pdf'} format - Export format
     */
    handleExport(format) {
        const title = document.getElementById(AppConstants.DOM.POST_TITLE).value || 'Untitled';
        const filename = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();

        switch (format) {
            case 'html':
                this.downloadFile(`${filename}.html`, EditorManager.getContent(), 'text/html');
                break;

            case 'markdown':
                if (typeof TurndownService !== 'undefined') {
                    const markdown = new TurndownService().turndown(EditorManager.getContent());
                    this.downloadFile(`${filename}.md`, markdown, 'text/markdown');
                } else {
                    Toast.show('Markdown export unavailable', 'error');
                }
                break;

            case 'json':
                const data = {
                    title,
                    content: EditorManager.getContent(),
                    createdAt: PostController.currentPostCreatedAt,
                    modifiedAt: new Date().toISOString()
                };
                this.downloadFile(`${filename}.json`, JSON.stringify(data, null, 2), 'application/json');
                break;

            case 'pdf':
                this.exportToPdf(title, filename);
                break;
        }
    },

    /**
     * Export current post to PDF
     * @param {string} title - Post title
     * @param {string} filename - Base filename
     * @private
     */
    exportToPdf(title, filename) {
        if (typeof html2pdf === 'undefined') {
            Toast.show('PDF export not ready yet', 'error');
            return;
        }

        const element = document.createElement('div');
        element.style.cssText = 'padding: 40px; font-family: var(--font-primary); color: #000;';
        element.innerHTML = `
            <h1 style="font-size: 24px; margin-bottom: 20px;">${Utils.escapeHtml(title)}</h1>
            <div style="font-size: 14px; color: #666; margin-bottom: 30px;">
                ${Utils.formatDate(PostController.currentPostCreatedAt)}
            </div>
            <div class="ql-editor" style="padding: 0;">
                ${EditorManager.getContent()}
            </div>
        `;

        Toast.show('Generating PDF...', 'info');

        html2pdf()
            .set({
                margin: 1,
                filename: `${filename}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            })
            .from(element)
            .save()
            .then(() => Toast.show('PDF downloaded', 'success'))
            .catch(() => Toast.show('PDF generation failed', 'error'));
    },

    /**
     * Download content as a file
     * @param {string} filename - Download filename
     * @param {string} content - File content
     * @param {string} type - MIME type
     * @private
     */
    downloadFile(filename, content, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // =========================================================================
    // Modals
    // =========================================================================

    /** Toggle posts modal visibility */
    togglePostsModal() {
        const modal = document.getElementById(AppConstants.DOM.POSTS_MODAL);
        modal.classList.contains('active') ? this.closePostsModal() : this.openPostsModal();
    },

    /** Open posts modal */
    openPostsModal() {
        this.renderPostsList(PostController.posts);
        document.getElementById(AppConstants.DOM.POSTS_MODAL).classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    /** Close posts modal */
    closePostsModal() {
        document.getElementById(AppConstants.DOM.POSTS_MODAL).classList.remove('active');
        document.body.style.overflow = '';
    },

    /** Show keyboard shortcuts modal */
    showShortcutsModal() {
        document.getElementById(AppConstants.DOM.SHORTCUTS_MODAL).classList.add('active');
    },

    /** Hide keyboard shortcuts modal */
    hideShortcutsModal() {
        document.getElementById(AppConstants.DOM.SHORTCUTS_MODAL).classList.remove('active');
    },

    /** Show delete confirmation modal */
    showDeleteModal() {
        document.getElementById(AppConstants.DOM.DELETE_MODAL).classList.add('active');
    },

    /** Hide delete confirmation modal */
    hideDeleteModal() {
        document.getElementById(AppConstants.DOM.DELETE_MODAL).classList.remove('active');
        this.postToDelete = null;
    },

    // =========================================================================
    // UI Updates
    // =========================================================================

    /**
     * Update save status indicator
     * @param {string} msg - Status message
     */
    updateSaveStatus(msg) {
        const el = document.getElementById(AppConstants.DOM.SAVE_STATUS);
        if (el) {
            el.textContent = msg;
            el.className = msg ? 'save-status visible' : 'save-status';
        }
    },

    /**
     * Update post metadata display
     * @param {string} created - Creation date
     * @param {string} updated - Last modified date
     */
    updateMetadata(created, updated) {
        document.getElementById(AppConstants.DOM.META_CREATED).textContent = Utils.formatDate(created);
        document.getElementById(AppConstants.DOM.META_UPDATED).textContent = Utils.formatDate(updated);
    },

    /**
     * Highlight the currently active post in the list
     * @param {string} currentId - ID of active post
     */
    highlightActivePost(currentId) {
        document.querySelectorAll(AppConstants.SELECTORS.POST_ITEM).forEach(item => {
            item.classList.toggle('active', item.dataset.id === currentId);
        });
    },

    // =========================================================================
    // Rendering
    // =========================================================================

    /**
     * Render the posts list
     * @param {Array} posts - Posts to render
     */
    renderPostsList(posts) {
        const filteredPosts = this.getFilteredPosts(posts);
        const container = document.getElementById(AppConstants.DOM.POSTS_LIST);
        const emptyState = document.getElementById(AppConstants.DOM.POSTS_EMPTY);

        // Clear existing items
        container.querySelectorAll(AppConstants.SELECTORS.POST_ITEM).forEach(item => item.remove());

        if (filteredPosts.length === 0) {
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';

        const fragment = document.createDocumentFragment();
        filteredPosts.forEach(post => {
            fragment.appendChild(this.createPostItem(post));
        });
        container.appendChild(fragment);

        if (PostController.currentPostId) {
            this.highlightActivePost(PostController.currentPostId);
        }
    },

    /**
     * Create a post list item element
     * @param {Object} post - Post data
     * @returns {HTMLElement} Post item element
     * @private
     */
    createPostItem(post) {
        const item = document.createElement('div');
        item.className = 'post-item';
        item.dataset.id = post.id;
        item.dataset.filename = post.filename;

        if (post.isFavorite) {
            item.classList.add('favorite');
        }

        item.innerHTML = `
            <div class="post-item-header">
                <span class="post-item-title">${Utils.escapeHtml(post.title)}</span>
                <div class="post-item-actions">
                    <button class="post-item-favorite ${post.isFavorite ? 'active' : ''}" 
                            title="${post.isFavorite ? 'Unpin' : 'Pin to top'}">
                        <svg viewBox="0 0 24 24" fill="${post.isFavorite ? 'currentColor' : 'none'}" 
                             stroke="currentColor" stroke-width="2">
                            <use href="#icon-star"></use>
                        </svg>
                    </button>
                    <button class="post-item-delete" title="Delete post">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <use href="#icon-trash"></use>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="post-item-meta">
                <span class="post-item-date">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <use href="#icon-calendar"></use>
                    </svg>
                    ${Utils.formatDateShort(post.createdAt)}
                </span>
            </div>
            <div class="post-item-preview">${Utils.escapeHtml(Utils.getPreview(post.plainText))}</div>
        `;

        // Click to load post
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.post-item-actions')) {
                PostController.loadPost(post);
            }
        });

        // Favorite toggle
        item.querySelector('.post-item-favorite').addEventListener('click', (e) => {
            e.stopPropagation();
            PostController.toggleFavorite(post);
        });

        // Delete button
        item.querySelector('.post-item-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            if (!post.filename) {
                Toast.show('Cannot delete invalid post', 'error');
                return;
            }
            this.postToDelete = post.filename;
            this.showDeleteModal();
        });

        return item;
    },

    // =========================================================================
    // Animation
    // =========================================================================

    /**
     * FLIP animation for post list reordering
     * @param {Function} updateAction - DOM update function
     * @private
     */
    flipAnimation(updateAction) {
        const container = document.getElementById(AppConstants.DOM.POSTS_LIST);
        const firstPositions = new Map();

        // First: Record positions
        container.querySelectorAll(AppConstants.SELECTORS.POST_ITEM).forEach(item => {
            if (item.dataset.id) {
                firstPositions.set(item.dataset.id, item.getBoundingClientRect());
            }
        });

        // Last: Update DOM
        updateAction();

        // Invert: Calculate and apply transforms
        container.querySelectorAll(AppConstants.SELECTORS.POST_ITEM).forEach(item => {
            const id = item.dataset.id;
            const first = firstPositions.get(id);

            if (first) {
                const last = item.getBoundingClientRect();
                const deltaY = first.top - last.top;

                if (deltaY !== 0) {
                    item.style.transform = `translateY(${deltaY}px)`;
                    item.style.transition = 'none';
                }
            } else {
                item.style.opacity = '0';
                item.style.transform = 'scale(0.95)';
            }
        });

        // Play: Animate to final positions
        requestAnimationFrame(() => {
            container.offsetHeight; // Force reflow

            container.querySelectorAll(AppConstants.SELECTORS.POST_ITEM).forEach(item => {
                item.style.transform = '';
                item.style.opacity = '';
                item.style.transition = 'transform 500ms cubic-bezier(0.2, 0, 0.2, 1), opacity 300ms ease';

                const cleanup = () => {
                    item.style.transition = '';
                    item.removeEventListener('transitionend', cleanup);
                };
                item.addEventListener('transitionend', cleanup);
            });
        });
    }
};
