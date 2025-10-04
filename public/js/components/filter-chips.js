/**
 * Filter Chips Component
 * Reusable filter chip UI component
 */

class FilterChips {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            multiSelect: true,
            onChange: () => {},
            ...options
        };
        this.activeFilters = new Set();
    }

    /**
     * Render filter chips
     */
    render(filters) {
        if (!this.container) {
            console.warn(`Filter container not found: ${this.containerId}`);
            return;
        }

        // Save current state
        const currentState = this.getState();

        // Clear container
        this.container.innerHTML = '';

        // Create chips
        filters.forEach(filter => {
            const chip = this.createChip(filter);

            // Restore previous state or default to active
            const shouldBeActive = currentState.has(filter.value) ?
                currentState.has(filter.value) : true;

            if (shouldBeActive) {
                chip.classList.add('active');
                this.activeFilters.add(filter.value);
            }

            this.container.appendChild(chip);
        });
    }

    /**
     * Create individual chip element
     */
    createChip(filter) {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.dataset.value = filter.value;

        // Add color dot if provided
        if (filter.color) {
            const colorDot = document.createElement('span');
            colorDot.className = 'filter-color';
            colorDot.style.backgroundColor = filter.color;
            chip.appendChild(colorDot);
        }

        // Add label
        const label = document.createTextNode(filter.label || filter.value);
        chip.appendChild(label);

        // Add click handler
        chip.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleChipClick(filter.value, chip);
        });

        return chip;
    }

    /**
     * Handle chip click
     */
    handleChipClick(value, chipElement) {
        const wasActive = chipElement.classList.contains('active');

        if (this.options.multiSelect) {
            // Multi-select mode
            if (wasActive) {
                chipElement.classList.remove('active');
                this.activeFilters.delete(value);
            } else {
                chipElement.classList.add('active');
                this.activeFilters.add(value);
            }

            // If none active, activate all
            const allChips = this.container.querySelectorAll('.filter-chip');
            const activeChips = this.container.querySelectorAll('.filter-chip.active');

            if (activeChips.length === 0) {
                allChips.forEach(chip => {
                    chip.classList.add('active');
                    this.activeFilters.add(chip.dataset.value);
                });
            }
        } else {
            // Single-select mode
            const allChips = this.container.querySelectorAll('.filter-chip');
            allChips.forEach(chip => chip.classList.remove('active'));

            chipElement.classList.add('active');
            this.activeFilters.clear();
            this.activeFilters.add(value);
        }

        // Trigger change callback
        this.options.onChange(this.getActiveFilters());
    }

    /**
     * Get currently active filters
     */
    getActiveFilters() {
        return Array.from(this.activeFilters);
    }

    /**
     * Get current state
     */
    getState() {
        const state = new Set();
        const chips = this.container.querySelectorAll('.filter-chip.active');
        chips.forEach(chip => state.add(chip.dataset.value));
        return state;
    }

    /**
     * Set active filters programmatically
     */
    setActiveFilters(filters) {
        this.activeFilters = new Set(filters);

        const chips = this.container.querySelectorAll('.filter-chip');
        chips.forEach(chip => {
            const value = chip.dataset.value;
            if (this.activeFilters.has(value)) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });

        this.options.onChange(this.getActiveFilters());
    }

    /**
     * Clear all filters
     */
    clear() {
        this.activeFilters.clear();
        const chips = this.container.querySelectorAll('.filter-chip');
        chips.forEach(chip => chip.classList.remove('active'));
        this.options.onChange([]);
    }

    /**
     * Select all filters
     */
    selectAll() {
        const chips = this.container.querySelectorAll('.filter-chip');
        chips.forEach(chip => {
            chip.classList.add('active');
            this.activeFilters.add(chip.dataset.value);
        });
        this.options.onChange(this.getActiveFilters());
    }
}

// Export
if (typeof window !== 'undefined') {
    window.FilterChips = FilterChips;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterChips;
}
