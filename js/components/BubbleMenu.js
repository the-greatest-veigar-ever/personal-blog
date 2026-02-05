/**
 * GAROLD'S BLOG - Bubble Menu
 * A floating formatting menu that appears when text is selected.
 * @module components/BubbleMenu
 */

export class BubbleMenu {
    /**
     * Create a BubbleMenu instance
     * @param {Object} quill - Quill editor instance
     */
    constructor(quill) {
        this.quill = quill;
        this.menu = null;
        this.isVisible = false;
        this.init();
    }

    /**
     * Initialize the bubble menu
     * @private
     */
    init() {
        this.createMenu();

        // Show/hide on selection change
        this.quill.on('selection-change', (range) => {
            if (range && range.length > 0) {
                this.updatePosition(range);
                this.show();
            } else {
                this.hide();
            }
        });

        // Hide on scroll
        this.quill.root.addEventListener('scroll', () => this.hide());

        // Hide on typing
        this.quill.on('text-change', (delta, oldDelta, source) => {
            if (source === 'user') {
                this.hide();
            }
        });
    }

    /**
     * Create the menu DOM structure
     * @private
     */
    createMenu() {
        this.menu = document.createElement('div');
        this.menu.className = 'bubble-menu';
        this.menu.style.display = 'none';

        const items = [
            { icon: 'bold', format: 'bold' },
            { icon: 'italic', format: 'italic' },
            { icon: 'link', format: 'link' },
            { icon: 'header-1', format: 'header', value: 1 },
            { icon: 'header-2', format: 'header', value: 2 }
        ];

        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'bubble-btn';
            btn.innerHTML = this.getIcon(item.icon);

            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.applyFormat(item.format, item.value);
            });

            this.menu.appendChild(btn);
        });

        document.body.appendChild(this.menu);
    }

    /**
     * Get SVG icon markup
     * @param {string} name - Icon name
     * @returns {string} SVG or text markup
     * @private
     */
    getIcon(name) {
        const icons = {
            'bold': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>',
            'italic': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>',
            'link': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
            'header-1': '<span style="font-weight:700; font-size:16px;">H1</span>',
            'header-2': '<span style="font-weight:700; font-size:14px;">H2</span>'
        };
        return icons[name] || '?';
    }

    /**
     * Apply formatting to selected text
     * @param {string} format - Format type
     * @param {*} [value=true] - Format value
     * @private
     */
    applyFormat(format, value = true) {
        const range = this.quill.getSelection();
        if (!range) return;

        const currentFormat = this.quill.getFormat(range);

        if (currentFormat[format] === value) {
            this.quill.format(format, false);
        } else {
            if (format === 'link') {
                const url = prompt('Enter link URL:');
                if (url) this.quill.format('link', url);
            } else {
                this.quill.format(format, value);
            }
        }

        this.updateActiveStates(range);
    }

    /**
     * Update button active states
     * @param {Object} range - Selection range
     * @private
     */
    updateActiveStates(range) {
        // Future: Add visual feedback for active buttons
    }

    /**
     * Position the menu above the selection
     * @param {Object} range - Selection range
     * @private
     */
    updatePosition(range) {
        const bounds = this.quill.getBounds(range.index, range.length);
        const editorRect = this.quill.container.getBoundingClientRect();

        const top = editorRect.top + bounds.top - 50;
        const left = editorRect.left + bounds.left + (bounds.width / 2);

        this.menu.style.top = `${top}px`;
        this.menu.style.left = `${left}px`;
    }

    /**
     * Show the bubble menu
     */
    show() {
        if (this.isVisible) return;
        this.menu.style.display = 'flex';
        requestAnimationFrame(() => {
            this.menu.classList.add('visible');
        });
        this.isVisible = true;
    }

    /**
     * Hide the bubble menu
     */
    hide() {
        if (!this.isVisible) return;
        this.menu.classList.remove('visible');
        setTimeout(() => {
            if (!this.isVisible) this.menu.style.display = 'none';
        }, 200);
        this.isVisible = false;
    }
}
