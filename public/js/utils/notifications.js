// Notification System Utility Module
class NotificationManager {
    static show(message, type = 'info', duration = 3000) {
        // Remove any existing notifications of the same type
        this.clearType(type);

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type} show`;
        notification.textContent = message;

        // Add styling
        this.applyStyles(notification, type);

        document.body.appendChild(notification);

        // Remove after specified duration
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);

        return notification;
    }

    static success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    static error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    static warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }

    static info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    static clearAll() {
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        });
    }

    static clearType(type) {
        const notifications = document.querySelectorAll(`.notification.${type}`);
        notifications.forEach(notification => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        });
    }

    static applyStyles(notification, type) {
        // Base styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '10000',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            fontSize: '14px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        });

        // Type-specific styling
        const typeStyles = {
            success: {
                background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                borderLeft: '4px solid #2E7D32'
            },
            error: {
                background: 'linear-gradient(135deg, #F44336, #D32F2F)',
                borderLeft: '4px solid #C62828'
            },
            warning: {
                background: 'linear-gradient(135deg, #FF9800, #F57C00)',
                borderLeft: '4px solid #E65100'
            },
            info: {
                background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                borderLeft: '4px solid #0D47A1'
            }
        };

        if (typeStyles[type]) {
            Object.assign(notification.style, typeStyles[type]);
        }

        // Show animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
    }

    // Tournament-specific notifications
    static tournamentAdded(count = 1) {
        const message = count === 1
            ? 'Tournament added successfully!'
            : `${count} tournaments imported successfully!`;
        return this.success(message);
    }

    static tournamentDeleted() {
        return this.success('Tournament deleted successfully!');
    }

    static importError(error) {
        return this.error(`Import failed: ${error}`);
    }

    static dataUpdated(type = 'data') {
        return this.success(`${type} updated successfully!`);
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.NotificationManager = NotificationManager;
}