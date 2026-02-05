/**
 * GAROLD'S BLOG - Application Entry Point
 * Initializes all application modules and controllers.
 * @module app
 */

import { ThemeManager } from './theme.js';
import { EditorManager } from './editor.js';
import { BubbleMenu } from './components/BubbleMenu.js';
import { Toast } from './components/Toast.js';

const App = {
    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize foundation (theme and editor)
            ThemeManager.init();
            EditorManager.init();

            // Initialize bubble menu if editor is ready
            if (EditorManager.quill) {
                new BubbleMenu(EditorManager.quill);
            }

            // Dynamically import controllers to isolate potential errors
            try {
                const v = '20260121_v4'; // Static version to ensures singleton consistency
                const { PostController } = await import(`./controllers/PostController.js?v=${v}`);
                const { UIController } = await import(`./controllers/UIController.js?v=${v}`);
                const { ShortcutController } = await import(`./controllers/ShortcutController.js?v=${v}`);
                const { LockController } = await import(`./controllers/LockController.js?v=${v}`);

                // Initialize controllers
                PostController.init();
                UIController.init();
                ShortcutController.init();
                LockController.init();

                // Wire up Lock Button
                document.getElementById('lockBtn')?.addEventListener('click', () => {
                    LockController.lock();
                });

                // Wire up Settings Button & Modal Logic
                const settingsModal = document.getElementById('settingsModal');
                const settingsBtn = document.getElementById('settingsBtn');
                const closeSettingsBtn = document.getElementById('closeSettings');
                const saveSettingsBtn = document.getElementById('saveSettings');
                const lockEnabledCheckbox = document.getElementById('settingLockEnabled');
                const lockSettingsDiv = document.getElementById('lockSettings');

                // Open Settings
                settingsBtn?.addEventListener('click', () => {
                    // Populate current values
                    const config = LockController.config;
                    lockEnabledCheckbox.checked = config.enabled;
                    document.getElementById('settingPin').value = config.pin;
                    document.getElementById('settingPinConfirm').value = config.pin;
                    document.getElementById('settingTimeout').value = config.timeout / 60000; // ms to minutes

                    const radio = document.querySelector(`input[name="pinLength"][value="${config.length}"]`);
                    if (radio) radio.checked = true;

                    // Enforce initial limit
                    updatePinLimits(config.length);

                    lockSettingsDiv.style.display = config.enabled ? 'flex' : 'none';
                    settingsModal.classList.add('active');
                });

                // Close Settings
                closeSettingsBtn?.addEventListener('click', () => {
                    settingsModal.classList.remove('active');
                });

                // Helper to update input limits
                const updatePinLimits = (length) => {
                    const pinInput = document.getElementById('settingPin');
                    const confirmInput = document.getElementById('settingPinConfirm');

                    pinInput.maxLength = length;
                    confirmInput.maxLength = length;

                    if (pinInput.value.length > length) pinInput.value = pinInput.value.slice(0, length);
                    if (confirmInput.value.length > length) confirmInput.value = confirmInput.value.slice(0, length);
                };

                // Radio Button Listeners
                document.querySelectorAll('input[name="pinLength"]').forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        updatePinLimits(parseInt(e.target.value));
                    });
                });

                // Toggle Lock Settings Visibility
                lockEnabledCheckbox?.addEventListener('change', (e) => {
                    lockSettingsDiv.style.display = e.target.checked ? 'flex' : 'none';
                });

                // Save Settings
                saveSettingsBtn?.addEventListener('click', () => {
                    const enabled = lockEnabledCheckbox.checked;
                    const pin = document.getElementById('settingPin').value;
                    const confirmPin = document.getElementById('settingPinConfirm').value;
                    const length = parseInt(document.querySelector('input[name="pinLength"]:checked').value);
                    const timeout = parseInt(document.getElementById('settingTimeout').value) * 60000;

                    if (enabled) {
                        if (pin !== confirmPin) {
                            Toast.show('PIN codes do not match', 'error');
                            return;
                        }
                        if (pin.length !== length) {
                            Toast.show(`PIN must be exactly ${length} digits`, 'error');
                            return;
                        }
                    }

                    LockController.updateSettings({
                        enabled,
                        pin,
                        length,
                        timeout
                    });

                    // Update Lock Button Visibility
                    const lockBtn = document.getElementById('lockBtn');
                    if (lockBtn) {
                        lockBtn.style.display = enabled ? 'flex' : 'none';
                    }

                    settingsModal.classList.remove('active');
                    Toast.show('Settings saved', 'success');
                });

                // Reset Lock Settings
                const resetLockBtn = document.getElementById('resetLockBtn');
                resetLockBtn?.addEventListener('click', () => {
                    if (confirm('Are you sure you want to remove the passcode and disable screen lock?')) {
                        // Reset to defaults
                        document.getElementById('settingPin').value = '';
                        document.getElementById('settingPinConfirm').value = '';
                        lockEnabledCheckbox.checked = false;

                        // Update Controller with defaults
                        LockController.updateSettings({
                            enabled: false,
                            pin: '0000',
                            length: 4
                        });

                        // Hide settings inputs
                        lockSettingsDiv.style.display = 'none';

                        // Hide Lock Button
                        const lockBtn = document.getElementById('lockBtn');
                        if (lockBtn) lockBtn.style.display = 'none';

                        Toast.show('Passcode removed and Screen Lock disabled', 'success');
                    }
                });

                // Load initial data
                await PostController.loadPosts();

                // Initialize Lock Button Visibility based on loaded config
                const lockBtn = document.getElementById('lockBtn');
                if (lockBtn) {
                    lockBtn.style.display = LockController.config.enabled ? 'flex' : 'none';
                }

                // Show welcome screen (user can create new or open existing)
                UIController.showWelcomeScreen();

            } catch (controllerError) {
                console.error('[App] Controller initialization failed:', controllerError);
                document.getElementById('editorWrapper').style.display = 'block';
                Toast.show('Storage unavailable - Offline mode', 'warning');
            }

        } catch (error) {
            console.error('[App] Initialization failed:', error);
            Toast.show('Application failed to initialize', 'error');
        }
    }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
