// Modal Management Utility Module
class ModalManager {
    static show(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling

            // Add click-outside-to-close functionality
            this.addOutsideClickHandler(modal);

            // Add escape key handler
            this.addEscapeKeyHandler(modal);

            return modal;
        }
        console.warn(`Modal with ID '${modalId}' not found`);
        return null;
    }

    static hide(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling

            // Remove event handlers
            this.removeEventHandlers(modal);

            return modal;
        }
        console.warn(`Modal with ID '${modalId}' not found`);
        return null;
    }

    static hideAll() {
        const modals = document.querySelectorAll('.modal, .tournament-modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
            this.removeEventHandlers(modal);
        });
        document.body.style.overflow = '';
    }

    static toggle(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            if (modal.style.display === 'none' || modal.style.display === '') {
                return this.show(modalId);
            } else {
                return this.hide(modalId);
            }
        }
        return null;
    }

    static isOpen(modalId) {
        const modal = document.getElementById(modalId);
        return modal && modal.style.display === 'block';
    }

    static addOutsideClickHandler(modal) {
        const handler = (e) => {
            if (e.target === modal) {
                this.hide(modal.id);
            }
        };

        modal.addEventListener('click', handler);
        modal._outsideClickHandler = handler;
    }

    static addEscapeKeyHandler(modal) {
        const handler = (e) => {
            if (e.key === 'Escape') {
                this.hide(modal.id);
            }
        };

        document.addEventListener('keydown', handler);
        modal._escapeKeyHandler = handler;
    }

    static removeEventHandlers(modal) {
        if (modal._outsideClickHandler) {
            modal.removeEventListener('click', modal._outsideClickHandler);
            delete modal._outsideClickHandler;
        }

        if (modal._escapeKeyHandler) {
            document.removeEventListener('keydown', modal._escapeKeyHandler);
            delete modal._escapeKeyHandler;
        }
    }

    // Specific modal helpers
    static showDataModal() {
        return this.show('dataModal');
    }

    static hideDataModal() {
        return this.hide('dataModal');
    }

    static showAddTournamentModal() {
        return this.show('addTournamentModal');
    }

    static hideAddTournamentModal() {
        return this.hide('addTournamentModal');
    }

    static showImportTournamentModal() {
        return this.show('importTournamentModal');
    }

    static hideImportTournamentModal() {
        return this.hide('importTournamentModal');
    }

    // Form utilities
    static resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();

            // Reset any custom form elements
            const textareas = form.querySelectorAll('textarea');
            textareas.forEach(textarea => textarea.value = '');

            return form;
        }
        return null;
    }

    static clearTextarea(textareaId) {
        const textarea = document.getElementById(textareaId);
        if (textarea) {
            textarea.value = '';
            return textarea;
        }
        return null;
    }

    // Auto-setup for modals with close buttons
    static autoSetup() {
        // Setup close button handlers
        document.querySelectorAll('.close, .modal-close, .tournament-modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();

                // Find the parent modal
                let modal = closeBtn.closest('.modal, .tournament-modal');
                if (modal && modal.id) {
                    this.hide(modal.id);
                }
            });
        });

        // Setup form cancel button handlers
        document.querySelectorAll('button[type="button"]').forEach(btn => {
            if (btn.textContent.toLowerCase().includes('cancel')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();

                    // Find the parent modal
                    let modal = btn.closest('.modal, .tournament-modal');
                    if (modal && modal.id) {
                        this.hide(modal.id);
                    }
                });
            }
        });
    }
}

// Auto-setup when DOM is ready
if (typeof window !== 'undefined') {
    window.ModalManager = ModalManager;

    // Auto-setup when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ModalManager.autoSetup());
    } else {
        ModalManager.autoSetup();
    }
}