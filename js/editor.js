/**
 * GAROLD'S BLOG - Editor Manager
 * Handles Quill.js editor initialization, custom formats, and editor features.
 * @module editor
 */

import { AppConstants } from './constants.js';

/**
 * Register custom Quill formats for checklists and fonts
 * @private
 */
function registerCustomFormats() {
    if (!window.Quill) return;

    const Parchment = Quill.import('parchment');
    const ListBlot = Quill.import('formats/list');
    const ListItemBlot = Quill.import('formats/list/item');

    // Extended List container supporting 'check' type
    class CheckList extends ListBlot {
        static create(value) {
            if (value === 'check') {
                const node = document.createElement('ul');
                node.setAttribute('data-checked', 'list');
                return node;
            }
            return super.create(value);
        }

        static formats(domNode) {
            if (domNode.getAttribute('data-checked') === 'list') {
                return 'check';
            }
            return super.formats(domNode);
        }
    }
    CheckList.blotName = 'list';
    CheckList.tagName = ['OL', 'UL'];

    // Extended ListItem supporting checked/unchecked states
    class CheckListItem extends ListItemBlot {
        static create(value) {
            const node = super.create(value);
            if (value === 'check' || value === 'checked' || value === 'unchecked') {
                node.setAttribute('data-list', value === 'checked' ? 'checked' : 'unchecked');
            }
            return node;
        }

        static formats(domNode) {
            if (domNode.hasAttribute('data-list')) {
                return 'check';
            }
            return super.formats(domNode);
        }

        format(name, value) {
            if (name === 'list') {
                if (value === 'check') {
                    const current = this.domNode.getAttribute('data-list');
                    this.domNode.setAttribute('data-list', current || 'unchecked');
                } else if (value === 'checked' || value === 'unchecked') {
                    this.domNode.setAttribute('data-list', value);
                } else {
                    this.domNode.removeAttribute('data-list');
                    super.format(name, value);
                }
            } else {
                super.format(name, value);
            }
        }
    }
    CheckListItem.blotName = 'list-item';
    CheckListItem.tagName = 'LI';

    // Register custom blots
    Quill.register(CheckList, true);
    Quill.register(CheckListItem, true);

    // Custom font whitelist
    const FontAttributor = Quill.import('formats/font');
    FontAttributor.whitelist = [
        'lora', 'inter', 'source-serif-4', 'merriweather', 'open-sans', 'roboto'
    ];
    Quill.register(FontAttributor, true);
}

export const EditorManager = {
    /** @type {Object|null} Quill editor instance */
    quill: null,

    /** @type {boolean} Whether typewriter mode is enabled */
    typewriterMode: true,

    /**
     * Initialize the Quill editor
     */
    init() {
        if (!window.Quill) {
            console.error('[Editor] Quill is not defined. Editor cannot initialize.');
            return;
        }

        registerCustomFormats();

        const editorElement = document.getElementById(AppConstants.DOM.EDITOR);
        if (!editorElement) return;

        this.quill = new Quill(editorElement, {
            theme: 'snow',
            placeholder: 'Start writing your story...',
            modules: {
                syntax: (window.hljs && typeof window.hljs.highlightAuto === 'function')
                    ? { highlight: (text) => window.hljs.highlightAuto(text).value }
                    : false,
                toolbar: {
                    container: '#toolbar',
                    handlers: {
                        'undo': () => this.quill.history.undo(),
                        'redo': () => this.quill.history.redo(),
                        'align-cycle': () => this.cycleAlignment(),
                        'list': (value) => this.handleList(value)
                    }
                },
                history: {
                    delay: 1000,
                    maxStack: 100,
                    userOnly: true
                },
                keyboard: {
                    bindings: {
                        listEnter: {
                            key: 'Enter',
                            context: { format: ['list'] },
                            handler: (range) => this.handleListEnter(range)
                        },
                        tab: {
                            key: 'Tab',
                            handler: (range, context) => {
                                if (context.format.list) {
                                    this.quill.format('indent', '+1');
                                    return false;
                                }
                                return true;
                            }
                        },
                        shiftTab: {
                            key: 'Tab',
                            shiftKey: true,
                            handler: (range, context) => {
                                if (context.format.list) {
                                    this.quill.format('indent', '-1');
                                    return false;
                                }
                                return true;
                            }
                        }
                    }
                }
            }
        });

        this.initMarkdownShortcuts();
        this.initLinkHandler();
        this.initChecklistHandler();

        // Update UI on selection change
        this.quill.on('selection-change', (range) => {
            if (range) {
                this.updateAlignmentIcon();
                this.updateListButtonStates();
            }
        });

        // Update stats on text change
        this.quill.on('text-change', () => this.updateStats());

        // Typewriter mode centering
        this.quill.on('selection-change', (range, oldRange, source) => {
            if (this.typewriterMode && range && source !== 'silent') {
                requestAnimationFrame(() => this.centerSelection(range));
            }
        });
    },

    /**
     * Handle Enter key in lists
     * @param {Object} range - Current selection range
     * @returns {boolean} False to prevent default, or let Quill handle it
     * @private
     */
    handleListEnter(range) {
        const [line] = this.quill.getLine(range.index);
        const isChecklist = line.domNode.hasAttribute('data-list');

        // Insert newline at current position
        this.quill.insertText(range.index, '\n', 'user');

        // Move cursor to the new line
        this.quill.setSelection(range.index + 1, 0, 'user');

        if (isChecklist) {
            setTimeout(() => {
                this.quill.formatLine(range.index + 1, 1, 'list', 'unchecked');
            }, 0);
        }

        // Return false to prevent Quill's default enter handling
        return false;
    },

    /**
     * Handle list button clicks
     * @param {string} value - List type (bullet, ordered, check)
     */
    handleList(value) {
        const range = this.quill.getSelection();
        if (!range) return;

        const format = this.quill.getFormat(range);

        if (format.list === value) {
            this.quill.format('list', false);
        } else {
            this.quill.format('list', value === 'check' ? 'unchecked' : value);
        }
    },

    /**
     * Initialize checklist checkbox click handler
     * @private
     */
    initChecklistHandler() {
        this.quill.container.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName !== 'LI' || !target.hasAttribute('data-list')) return;

            const rect = target.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;

            // 30px sensitive area for checkbox
            if (offsetX <= 30) {
                const state = target.getAttribute('data-list');
                const newState = state === 'checked' ? 'unchecked' : 'checked';

                const blot = Quill.find(target);
                if (blot) {
                    const index = blot.offset(this.quill.scroll);
                    const length = blot.length();
                    this.quill.formatLine(index, length, 'list', newState, 'user');
                }
            }
        });
    },

    /**
     * Cycle through text alignments
     */
    cycleAlignment() {
        const currentFormat = this.quill.getFormat();
        const alignments = [undefined, 'center', 'right', 'justify'];
        const currentIdx = alignments.indexOf(currentFormat.align);
        const nextAlign = alignments[(currentIdx + 1) % alignments.length];

        this.quill.format('align', nextAlign);
        this.updateAlignmentIcon(nextAlign);
    },

    /**
     * Update alignment button icon
     * @param {string} [align] - Current alignment
     */
    updateAlignmentIcon(align) {
        if (align === undefined) {
            align = this.quill.getFormat().align;
        }

        const button = document.querySelector('.ql-align-cycle');
        if (!button) return;

        const icons = {
            center: '<line x1="21" y1="6" x2="3" y2="6"></line><line x1="17" y1="12" x2="7" y2="12"></line><line x1="19" y1="18" x2="5" y2="18"></line>',
            right: '<line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="9" y2="12"></line><line x1="21" y1="18" x2="3" y2="18"></line>',
            justify: '<line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="3" y2="12"></line><line x1="21" y1="18" x2="3" y2="18"></line>',
            default: '<line x1="21" y1="6" x2="3" y2="6"></line><line x1="15" y1="12" x2="3" y2="12"></line><line x1="21" y1="18" x2="3" y2="18"></line>'
        };

        const iconPath = icons[align] || icons.default;
        button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconPath}</svg>`;
    },

    /**
     * Update list button active states
     */
    updateListButtonStates() {
        const range = this.quill.getSelection();
        if (!range) return;

        const format = this.quill.getFormat(range);
        const buttons = {
            bullet: document.querySelector('.ql-list[value="bullet"]'),
            ordered: document.querySelector('.ql-list[value="ordered"]'),
            check: document.querySelector('.ql-list[value="check"]')
        };

        Object.values(buttons).forEach(btn => btn?.classList.remove('ql-active'));

        if (format.list === 'bullet') {
            buttons.bullet?.classList.add('ql-active');
        } else if (format.list === 'ordered') {
            buttons.ordered?.classList.add('ql-active');
        } else if (format.list === 'checked' || format.list === 'unchecked') {
            buttons.check?.classList.add('ql-active');
        }
    },

    /**
     * Initialize markdown shortcuts
     * @private
     */
    initMarkdownShortcuts() {
        this.quill.on('text-change', (delta, oldDelta, source) => {
            if (source !== 'user' || !delta.ops.some(op => op.insert === ' ')) return;

            const range = this.quill.getSelection();
            if (!range) return;

            const [line, offset] = this.quill.getLine(range.index);
            const text = line.domNode.textContent;

            const patterns = [
                { regex: /^#\s$/, format: 'header', value: 1 },
                { regex: /^##\s$/, format: 'header', value: 2 },
                { regex: /^###\s$/, format: 'header', value: 3 },
                { regex: /^[\*\-]\s$/, format: 'list', value: 'bullet' },
                { regex: /^1\.\s$/, format: 'list', value: 'ordered' },
                { regex: /^\[\]\s$/, format: 'list', value: 'unchecked' },
                { regex: /^>\s$/, format: 'blockquote', value: true }
            ];

            for (const p of patterns) {
                if (p.regex.test(text.substring(0, offset))) {
                    this.quill.formatLine(range.index, 0, p.format, p.value);
                    const matchLen = text.substring(0, offset).length;
                    this.quill.deleteText(range.index - matchLen, matchLen);
                    return;
                }
            }
        });
    },

    /**
     * Initialize link auto-prefix handler
     * @private
     */
    initLinkHandler() {
        const tooltip = this.quill.theme.tooltip;
        const originalSave = tooltip.save;

        tooltip.save = function () {
            const value = this.textbox.value;
            if (value && !/^https?:\/\//i.test(value) && !/^mailto:/i.test(value) && !/^\//.test(value)) {
                this.textbox.value = 'https://' + value;
            }
            originalSave.call(this);
        };
    },

    /**
     * Get editor HTML content
     * @returns {string} HTML content
     */
    getContent() {
        return this.quill ? this.quill.root.innerHTML : '';
    },

    /**
     * Set editor HTML content
     * @param {string} html - HTML content to set
     */
    setContent(html) {
        if (this.quill) {
            this.quill.root.innerHTML = html || '';
        }
    },

    /**
     * Get editor plain text content
     * @returns {string} Plain text content
     */
    getPlainText() {
        return this.quill ? this.quill.getText().trim() : '';
    },

    /**
     * Clear editor content
     */
    clear() {
        if (this.quill) {
            this.quill.setContents([]);
        }
    },

    /** Undo last change */
    undo() {
        this.quill.history.undo();
    },

    /** Redo last undone change */
    redo() {
        this.quill.history.redo();
    },

    /** Focus the editor */
    focus() {
        this.quill.focus();
    },

    /**
     * Check if editor is empty
     * @returns {boolean} True if editor is empty
     */
    isEmpty() {
        const text = this.getPlainText();
        return !text || text.length === 0;
    },

    /**
     * Toggle typewriter mode
     * @returns {boolean} New typewriter mode state
     */
    toggleTypewriterMode() {
        this.typewriterMode = !this.typewriterMode;
        if (this.typewriterMode) {
            const range = this.quill.getSelection();
            if (range) this.centerSelection(range);
        }
        return this.typewriterMode;
    },

    /**
     * Center the current selection in the viewport
     * @param {Object} range - Selection range
     */
    centerSelection(range) {
        if (!range) return;

        const bounds = this.quill.getBounds(range.index);
        const editorRect = this.quill.container.getBoundingClientRect();
        const absoluteCursorY = window.scrollY + editorRect.top + bounds.top;
        const targetY = absoluteCursorY - (window.innerHeight / 2) + (bounds.height / 2);

        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });
    },

    /**
     * Update word count and reading time stats
     */
    updateStats() {
        const text = this.getPlainText();
        const wordCount = text.length === 0 ? 0 : text.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200);

        const wordCountEl = document.getElementById(AppConstants.DOM.WORD_COUNT);
        const readingTimeEl = document.getElementById(AppConstants.DOM.READING_TIME);

        if (wordCountEl) wordCountEl.textContent = `${wordCount.toLocaleString()} words`;
        if (readingTimeEl) readingTimeEl.textContent = `${readingTime} min read`;
    }
};