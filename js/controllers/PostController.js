/**
 * GAROLD'S BLOG - Post Controller
 * Manages post state, CRUD operations, and auto-save functionality.
 * @module controllers/PostController
 */

import { AppConstants } from '../constants.js';
import { Utils } from '../utils.js';
import { StorageManager } from '../storage.js?v=20260121_v4';
import { EditorManager } from '../editor.js';
import { EventBus } from '../core/EventBus.js';

export const PostController = {
    /** @type {string|null} Current post ID */
    currentPostId: null,

    /** @type {string|null} Current post filename */
    currentFilename: null,

    /** @type {string|null} Current post creation timestamp */
    currentPostCreatedAt: null,

    /** @type {boolean} Whether current post is favorited */
    currentIsFavorite: false,

    /** @type {boolean} Whether there are unsaved changes */
    isDirty: false,

    /** @type {Array} Cached list of all posts */
    posts: [],

    /** @type {Function|null} Debounced save function */
    debouncedSave: null,

    /**
     * Initialize the post controller
     */
    init() {
        this.currentPostCreatedAt = new Date().toISOString();

        // Setup auto-save on editor changes
        if (EditorManager.quill) {
            EditorManager.quill.on('text-change', (delta, oldDelta, source) => {
                if (source === 'user') {
                    this.setDirty(true);
                    this.debouncedSave();
                }
            });
        }

        // Initialize debounced save (2 second delay)
        this.debouncedSave = Utils.debounce(() => {
            if (this.isDirty) {
                this.saveCurrentPost(true);
            }
        }, 2000);
    },

    /**
     * Update dirty state and emit event
     * @param {boolean} isDirty - Whether there are unsaved changes
     */
    setDirty(isDirty) {
        this.isDirty = isDirty;
        EventBus.emit('post:dirty', isDirty);
    },

    /**
     * Load all posts from storage
     * @returns {Promise<Array>} Array of posts
     */
    async loadPosts() {
        const posts = await StorageManager.getAllPosts();
        this.posts = posts.filter(p => p && p.filename);
        return this.posts;
    },

    /**
     * Create a new empty post
     * @param {boolean} [silent=false] - If true, don't show UI notifications
     */
    createNewPost(silent = false) {
        this.currentPostId = null;
        this.currentFilename = null;
        this.currentIsFavorite = false;
        this.currentPostCreatedAt = new Date().toISOString();

        EditorManager.clear();
        this.setDirty(false);

        EventBus.emit('post:created', {
            createdAt: this.currentPostCreatedAt,
            silent
        });

        if (!silent) {
            import('./UIController.js').then(module => {
                module.UIController.hideWelcomeScreen();
            });
        }
    },

    /**
     * Load an existing post into the editor
     * @param {Object} post - Post object to load
     * @returns {Promise<boolean>} True if load was successful
     */
    async loadPost(post) {
        if (!post) return false;

        this.currentPostId = post.id;
        this.currentFilename = post.filename;
        this.currentPostCreatedAt = post.createdAt;
        this.currentIsFavorite = post.isFavorite || false;

        EditorManager.setContent(post.content);
        EditorManager.updateStats();

        this.setDirty(false);
        EventBus.emit('post:loaded', post);

        import('./UIController.js').then(module => {
            module.UIController.hideWelcomeScreen();
        });

        return true;
    },

    /**
     * Save the current post
     * @param {boolean} [isAutoSave=false] - If true, this is an auto-save
     * @param {string} [titleOverride] - Optional title to use
     * @returns {Promise<{success: boolean, post?: Object, error?: Error}>}
     */
    async saveCurrentPost(isAutoSave = false, titleOverride = null) {
        // Get title from DOM input if not provided
        const titleInput = document.getElementById(AppConstants.DOM.POST_TITLE);
        const title = titleOverride || (titleInput ? titleInput.value.trim() : '') || 'Untitled Post';
        const content = EditorManager.getContent();
        const plainText = EditorManager.getPlainText();

        if (!plainText && !title && !isAutoSave) {
            return { success: false, error: 'Empty post' };
        }

        if (isAutoSave) {
            EventBus.emit('post:saving');
        }

        try {
            const post = await StorageManager.savePost({
                id: this.currentPostId,
                title,
                content,
                plainText,
                createdAt: this.currentPostCreatedAt,
                oldFilename: this.currentFilename,
                isFavorite: this.currentIsFavorite
            });

            this.currentPostId = post.id;
            this.currentFilename = post.filename;
            this.currentIsFavorite = post.isFavorite;
            this.currentPostCreatedAt = post.createdAt;

            await this.loadPosts();
            this.setDirty(false);

            EventBus.emit('post:saved', { post, isAutoSave });
            return { success: true, post };

        } catch (error) {
            console.error('[PostController] Save failed:', error);
            EventBus.emit('post:saveError', { error });
            return { success: false, error };
        }
    },

    /**
     * Delete a post
     * @param {string} filename - Filename of post to delete
     * @returns {Promise<boolean>} True if deletion was successful
     */
    async deletePost(filename) {
        if (!filename) {
            this.createNewPost(true);
            EventBus.emit('post:deleted');
            return true;
        }

        const success = await StorageManager.deletePost(filename);

        if (success) {
            if (this.currentFilename === filename) {
                this.createNewPost(true);
            }
            await this.loadPosts();
            EventBus.emit('post:deleted');
        }

        return success;
    },

    /**
     * Toggle favorite status of a post
     * @param {Object} post - Post to toggle
     * @returns {Promise<boolean>} True if toggle was successful
     */
    async toggleFavorite(post) {
        const originalState = post.isFavorite;
        post.isFavorite = !post.isFavorite;

        try {
            const savedPost = await StorageManager.savePost({
                ...post,
                oldFilename: post.filename
            });

            if (this.currentPostId === savedPost.id) {
                this.currentIsFavorite = savedPost.isFavorite;
            }

            await this.loadPosts();
            EventBus.emit('post:updated', savedPost);
            return true;

        } catch (error) {
            console.error('[PostController] Toggle favorite failed:', error);
            post.isFavorite = originalState;
            return false;
        }
    }
};
