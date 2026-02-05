/**
 * GAROLD'S BLOG - Lock Controller
 * Handles application locking, inactivity timer, and PIN validation.
 * @module controllers/LockController
 */

import { AppConstants } from '../constants.js';
import { Toast } from '../components/Toast.js';

export const LockController = {
    /** @type {boolean} */
    isLocked: false,

    /** @type {Function|null} bound reset handler */
    boundReset: null,

    /** @type {number|null} Debounce timer */
    debounceTimer: null,

    /** @type {string} Current PIN input buffer */
    inputBuffer: '',

    /** @type {number|null} Inactivity timer ID */
    timer: null,

    /** @type {Object} Configuration */
    config: {
        enabled: false,
        pin: '0000', // Default PIN
        length: 4,
        timeout: 300000 // 5 minutes default
    },

    /**
     * Initialize the Lock Controller
     */
    init() {
        this.loadConfig();
        this.renderLockScreen();
        this.attachListeners();

        // Bind reset once
        this.boundReset = () => this.handleActivity();

        if (this.config.enabled) {
            this.startActivityMonitoring();
        }
    },

    /**
     * Load configuration from localStorage
     */
    loadConfig() {
        try {
            const saved = localStorage.getItem('luxe-blog-lock-config');
            if (saved) {
                this.config = { ...this.config, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to load lock config', e);
        }
    },

    /**
     * Save configuration to localStorage
     */
    saveConfig() {
        localStorage.setItem('luxe-blog-lock-config', JSON.stringify(this.config));
    },

    /**
     * Create and inject the Lock Screen HTML
     */
    renderLockScreen() {
        if (document.getElementById('lockScreen')) return;

        const overlay = document.createElement('div');
        overlay.id = 'lockScreen';
        overlay.innerHTML = `
            <div class="lock-content">
                <div class="lock-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>
                <h2 class="lock-title">Locked</h2>
                
                <div class="pin-display" id="pinDisplay">
                    ${this.generatePinDots()}
                </div>

                <div class="keypad">
                    <button class="keypad-btn" data-key="1">1</button>
                    <button class="keypad-btn" data-key="2">2</button>
                    <button class="keypad-btn" data-key="3">3</button>
                    <button class="keypad-btn" data-key="4">4</button>
                    <button class="keypad-btn" data-key="5">5</button>
                    <button class="keypad-btn" data-key="6">6</button>
                    <button class="keypad-btn" data-key="7">7</button>
                    <button class="keypad-btn" data-key="8">8</button>
                    <button class="keypad-btn" data-key="9">9</button>
                    <button class="keypad-btn transparent" data-key="backspace">←</button>
                    <button class="keypad-btn" data-key="0">0</button>
                    <button class="keypad-btn transparent" data-key="enter">↵</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    /**
     * Generate HTML for PIN dots
     */
    generatePinDots() {
        return Array(parseInt(this.config.length))
            .fill('<div class="pin-dot"></div>')
            .join('');
    },

    /**
     * Attach logic listeners
     */
    attachListeners() {
        // Keypad clicks
        document.addEventListener('click', (e) => {
            if (!this.isLocked) return;
            const btn = e.target.closest('.keypad-btn');
            if (btn) {
                const key = btn.dataset.key;
                this.handleInput(key);
            }
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (!this.isLocked) return;

            if (e.key >= '0' && e.key <= '9') {
                this.handleInput(e.key);
            } else if (e.key === 'Backspace') {
                this.handleInput('backspace');
            } else if (e.key === 'Enter') {
                this.handleInput('enter');
            }
        });
    },

    /**
     * Handle input (key press or click)
     * @param {string} key 
     */
    handleInput(key) {
        if (key === 'backspace') {
            this.inputBuffer = this.inputBuffer.slice(0, -1);
        } else if (key === 'enter') {
            this.checkPin();
            return;
        } else if (this.inputBuffer.length < this.config.length) {
            this.inputBuffer += key;

            // Auto-check if full
            if (this.inputBuffer.length === parseInt(this.config.length)) {
                setTimeout(() => this.checkPin(), 100);
            }
        }
        this.updateDots();
    },

    /**
     * Update UI dots based on buffer length
     */
    updateDots() {
        const dots = document.querySelectorAll('.pin-dot');
        dots.forEach((dot, index) => {
            if (index < this.inputBuffer.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
            dot.classList.remove('error');
        });
    },

    /**
     * Verify the PIN
     */
    checkPin() {
        if (this.inputBuffer === this.config.pin) {
            this.unlock();
        } else {
            this.showError();
        }
    },

    /**
     * Show error animation
     */
    showError() {
        const dots = document.querySelectorAll('.pin-dot');
        dots.forEach(dot => dot.classList.add('error'));
        this.inputBuffer = '';
        setTimeout(() => this.updateDots(), 500);
    },

    /**
     * Lock the screen
     */
    lock() {
        if (this.isLocked) return;

        console.log('[LockController] Locking screen due to inactivity');
        this.isLocked = true;
        this.inputBuffer = '';
        this.updateDots();
        document.getElementById('lockScreen').classList.add('active');

        // Stop monitoring while locked
        this.stopActivityMonitoring();
    },

    /**
     * Unlock the screen
     */
    unlock() {
        this.isLocked = false;
        this.inputBuffer = '';
        document.getElementById('lockScreen').classList.remove('active');

        // Resume monitoring
        if (this.config.enabled) {
            this.startActivityMonitoring();
        }
    },

    /**
     * Toggle lock manually
     */
    toggleLock() {
        if (!this.isLocked) {
            this.lock();
        }
    },

    /**
     * Start global activity monitoring
     */
    startActivityMonitoring() {
        // Clean up first to ensure no duplicates
        this.stopActivityMonitoring();

        if (!this.config.enabled) return;

        ['mousemove', 'mousedown', 'keypress', 'touchmove'].forEach(evt => {
            document.addEventListener(evt, this.boundReset, { passive: true });
        });

        console.log(`[LockController] Monitoring started. Timeout: ${this.config.timeout}ms`);
        this.resetActivityTimer();
    },

    /**
     * Stop global activity monitoring
     */
    stopActivityMonitoring() {
        if (this.boundReset) {
            ['mousemove', 'mousedown', 'keypress', 'touchmove'].forEach(evt => {
                document.removeEventListener(evt, this.boundReset);
            });
        }
        clearTimeout(this.timer);
        clearTimeout(this.debounceTimer);
    },

    /**
     * Handle user activity (Debounced)
     */
    handleActivity() {
        // Debounce: Only reset timer max once per second
        if (this.debounceTimer) return;

        this.debounceTimer = setTimeout(() => {
            this.debounceTimer = null;
            this.resetActivityTimer();
        }, 1000); // 1 second throttle
    },

    /**
     * Reset the inactivity timer
     */
    resetActivityTimer() {
        if (!this.config.enabled || this.isLocked) return;

        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.lock();
        }, this.config.timeout);
    },

    /**
     * Update Settings
     * @param {Object} newConfig 
     */
    updateSettings(newConfig) {
        // Check if timeout changed to log it
        if (newConfig.timeout !== this.config.timeout) {
            console.log(`[LockController] Timeout updated to ${newConfig.timeout}ms`);
        }

        this.config = { ...this.config, ...newConfig };
        this.saveConfig();

        // Re-render dots if length changed
        const pinDisplay = document.getElementById('pinDisplay');
        if (pinDisplay) {
            pinDisplay.innerHTML = this.generatePinDots();
        }

        // Restart monitoring with new settings
        if (this.config.enabled) {
            this.startActivityMonitoring();
        } else {
            this.stopActivityMonitoring();
        }
    }
};
