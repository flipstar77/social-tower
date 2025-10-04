// Event Bus Module for Decoupled Communication
class EventBus {
    constructor() {
        this.events = new Map();
        this.debugMode = false;
    }

    // Subscribe to an event
    on(eventName, handler, options = {}) {
        if (typeof handler !== 'function') {
            console.error('🚌 EventBus: Handler must be a function');
            return false;
        }

        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const subscription = {
            handler: handler,
            once: options.once || false,
            context: options.context || null,
            priority: options.priority || 0,
            id: this.generateSubscriptionId()
        };

        this.events.get(eventName).push(subscription);

        // Sort by priority (higher priority first)
        this.events.get(eventName).sort((a, b) => b.priority - a.priority);

        if (this.debugMode) {
            console.log(`🚌 Subscribed to '${eventName}' (ID: ${subscription.id})`);
        }

        return subscription.id;
    }

    // Subscribe to an event once
    once(eventName, handler, options = {}) {
        return this.on(eventName, handler, { ...options, once: true });
    }

    // Unsubscribe from an event
    off(eventName, handlerOrId) {
        if (!this.events.has(eventName)) {
            return false;
        }

        const handlers = this.events.get(eventName);
        let removed = false;

        if (typeof handlerOrId === 'string') {
            // Remove by ID
            const index = handlers.findIndex(sub => sub.id === handlerOrId);
            if (index !== -1) {
                handlers.splice(index, 1);
                removed = true;
            }
        } else if (typeof handlerOrId === 'function') {
            // Remove by handler function
            const index = handlers.findIndex(sub => sub.handler === handlerOrId);
            if (index !== -1) {
                handlers.splice(index, 1);
                removed = true;
            }
        }

        // Clean up empty event arrays
        if (handlers.length === 0) {
            this.events.delete(eventName);
        }

        if (this.debugMode && removed) {
            console.log(`🚌 Unsubscribed from '${eventName}'`);
        }

        return removed;
    }

    // Emit an event
    emit(eventName, data = null) {
        if (!this.events.has(eventName)) {
            if (this.debugMode) {
                console.log(`🚌 No listeners for '${eventName}'`);
            }
            return 0;
        }

        const handlers = this.events.get(eventName);
        const toRemove = [];
        let executedCount = 0;

        for (let i = 0; i < handlers.length; i++) {
            const subscription = handlers[i];

            try {
                if (subscription.context) {
                    subscription.handler.call(subscription.context, data, eventName);
                } else {
                    subscription.handler(data, eventName);
                }

                executedCount++;

                // Mark for removal if it's a once listener
                if (subscription.once) {
                    toRemove.push(i);
                }
            } catch (error) {
                console.error(`🚌 Error in event handler for '${eventName}':`, error);
            }
        }

        // Remove once listeners (in reverse order to maintain indices)
        for (let i = toRemove.length - 1; i >= 0; i--) {
            handlers.splice(toRemove[i], 1);
        }

        // Clean up empty event arrays
        if (handlers.length === 0) {
            this.events.delete(eventName);
        }

        if (this.debugMode) {
            console.log(`🚌 Emitted '${eventName}' to ${executedCount} handlers`);
        }

        return executedCount;
    }

    // Emit an event asynchronously
    async emitAsync(eventName, data = null) {
        if (!this.events.has(eventName)) {
            return 0;
        }

        const handlers = this.events.get(eventName);
        const toRemove = [];
        let executedCount = 0;

        for (let i = 0; i < handlers.length; i++) {
            const subscription = handlers[i];

            try {
                let result;
                if (subscription.context) {
                    result = subscription.handler.call(subscription.context, data, eventName);
                } else {
                    result = subscription.handler(data, eventName);
                }

                // Wait for promise if handler returns one
                if (result instanceof Promise) {
                    await result;
                }

                executedCount++;

                if (subscription.once) {
                    toRemove.push(i);
                }
            } catch (error) {
                console.error(`🚌 Error in async event handler for '${eventName}':`, error);
            }
        }

        // Remove once listeners
        for (let i = toRemove.length - 1; i >= 0; i--) {
            handlers.splice(toRemove[i], 1);
        }

        if (handlers.length === 0) {
            this.events.delete(eventName);
        }

        return executedCount;
    }

    // Remove all listeners for an event
    removeAllListeners(eventName) {
        if (eventName) {
            const hadListeners = this.events.has(eventName);
            this.events.delete(eventName);
            return hadListeners;
        } else {
            // Remove all listeners for all events
            const eventCount = this.events.size;
            this.events.clear();
            return eventCount;
        }
    }

    // Get list of event names with listeners
    getEventNames() {
        return Array.from(this.events.keys());
    }

    // Get listener count for an event
    getListenerCount(eventName) {
        if (!this.events.has(eventName)) {
            return 0;
        }
        return this.events.get(eventName).length;
    }

    // Get total listener count across all events
    getTotalListenerCount() {
        let total = 0;
        this.events.forEach(handlers => {
            total += handlers.length;
        });
        return total;
    }

    // Enable/disable debug mode
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`🚌 EventBus debug mode: ${enabled ? 'enabled' : 'disabled'}`);
    }

    // Generate unique subscription ID
    generateSubscriptionId() {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Predefined event constants for common events
    static get EVENTS() {
        return {
            // Navigation events
            SECTION_CHANGED: 'section:changed',
            SECTION_SHOW: 'section:show',
            SECTION_HIDE: 'section:hide',

            // Session events
            SESSION_CREATED: 'session:created',
            SESSION_UPDATED: 'session:updated',
            SESSION_DELETED: 'session:deleted',
            SESSION_CLEARED: 'session:cleared',

            // Data events
            DATA_IMPORTED: 'data:imported',
            DATA_EXPORTED: 'data:exported',
            DATA_RESET: 'data:reset',

            // UI events
            UI_UPDATE: 'ui:update',
            UI_REFRESH: 'ui:refresh',

            // Chart events
            CHART_CREATED: 'chart:created',
            CHART_UPDATED: 'chart:updated',
            CHART_DESTROYED: 'chart:destroyed',

            // Error events
            ERROR_OCCURRED: 'error:occurred',
            WARNING_OCCURRED: 'warning:occurred',

            // Analytics events
            ANALYTICS_REFRESHED: 'analytics:refreshed',
            STATS_CALCULATED: 'stats:calculated'
        };
    }

    // Utility method to create namespaced events
    static createEvent(namespace, action) {
        return `${namespace}:${action}`;
    }
}

// Global event bus instance
if (typeof window !== 'undefined') {
    window.EventBus = EventBus;
    window.eventBus = new EventBus();

    // Set up some common event handlers for debugging
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.eventBus.setDebugMode(true);
    }
}