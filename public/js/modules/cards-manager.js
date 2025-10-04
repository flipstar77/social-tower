// Cards Management Module
class CardsManager {
    constructor() {
        this.cardsGridElement = null;
        this.initialized = false;
        this.activeCards = new Set(); // Track active/selected cards

        // Card images mapping
        this.cardImages = [
            'Attack Speed Card.png',
            'Berserker Card.png',
            'Cash Card.png',
            'Coins Card.png',
            'Critical Chance Card.png',
            'Critical Coin Card.png',
            'Damage Card.png',
            'Death Ray Card.png',
            'Demon Mode Card.png',
            'Enemy Balance Card.png',
            'Energy Net Card.png',
            'Energy Shield Card.png',
            'Extra Defense Card.png',
            'Extra Orb Card.png',
            'Fortress Card.png',
            'Free Upgrades Card.png',
            'Health Card.png',
            'Health Regen Card.png',
            'Intro Sprint Card.png',
            'Land Mine Stun Card.png',
            'Nuke Card.png',
            'Plasma Cannon Card.png',
            'Range Card.png',
            'Recovery Package CArd.png',
            'Second Wind Card.png',
            'Slow Aura Card.png',
            'Super Tower Card.png',
            'Ultimate Crit Card.png'
        ];

        // Predefined card presets
        this.presets = {
            farm: {
                name: '🌾 Farm Setup',
                cards: ['Cash Card', 'Coins Card', 'Critical Coin Card', 'Free Upgrades Card', 'Attack Speed Card', 'Damage Card', 'Range Card']
            },
            tournament: {
                name: '🏆 Tournament Setup',
                cards: ['Damage Card', 'Critical Chance Card', 'Attack Speed Card', 'Death Ray Card', 'Plasma Cannon Card', 'Super Tower Card', 'Ultimate Crit Card', 'Berserker Card']
            },
            push: {
                name: '📈 Push Setup',
                cards: ['Damage Card', 'Health Card', 'Health Regen Card', 'Extra Defense Card', 'Death Ray Card', 'Energy Shield Card', 'Recovery Package CArd', 'Second Wind Card']
            },
            defense: {
                name: '🛡️ Defense Setup',
                cards: ['Health Card', 'Health Regen Card', 'Extra Defense Card', 'Fortress Card', 'Energy Shield Card', 'Slow Aura Card', 'Land Mine Stun Card', 'Recovery Package CArd']
            }
        };
    }

    // Initialize the cards system
    init() {
        if (this.initialized) return;

        this.cardsGridElement = document.getElementById('analyticsCardsGrid');

        if (!this.cardsGridElement) {
            console.warn('🃏 Cards elements not found, skipping initialization');
            return;
        }

        this.setupEventListeners();
        this.renderAllCards();
        this.loadActiveCards();
        this.initialized = true;

        console.log('🃏 CardsManager initialized');
    }

    // Load active cards from localStorage
    loadActiveCards() {
        try {
            const saved = localStorage.getItem('activeCards');
            if (saved) {
                const activeList = JSON.parse(saved);
                this.activeCards = new Set(activeList);

                // Update UI
                activeList.forEach(cardName => {
                    const cardTile = document.querySelector(`[data-card-name="${cardName}"]`);
                    if (cardTile) {
                        cardTile.classList.add('active');
                    }
                });

                this.updateActiveCardCount();
            }
        } catch (error) {
            console.error('🃏 Failed to load active cards:', error);
        }
    }

    // Save active cards to localStorage
    saveActiveCards() {
        try {
            localStorage.setItem('activeCards', JSON.stringify(Array.from(this.activeCards)));
        } catch (error) {
            console.error('🃏 Failed to save active cards:', error);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Preset selector
        const presetSelect = document.getElementById('cardPresetSelect');
        if (presetSelect) {
            presetSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.loadPreset(e.target.value);
                    e.target.value = ''; // Reset dropdown
                }
            });
        }

        // Save preset button
        const savePresetBtn = document.getElementById('savePresetBtn');
        if (savePresetBtn) {
            savePresetBtn.addEventListener('click', () => {
                this.showSavePresetModal();
            });
        }

        // Clear all button
        const clearAllBtn = document.getElementById('clearAllCardsBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllCards();
            });
        }
    }

    // Render all available cards
    renderAllCards() {
        if (!this.cardsGridElement) return;

        // Clear existing cards
        this.cardsGridElement.innerHTML = '';

        // Create cards for all available card images
        this.cardImages.forEach((cardImage, index) => {
            const cardTile = this.createCardTile(cardImage, index + 1);
            this.cardsGridElement.appendChild(cardTile);
        });

        console.log(`🃏 Rendered ${this.cardImages.length} cards`);
    }

    // Create a single card tile element
    createCardTile(cardImage, cardNumber) {
        const cardTile = document.createElement('div');
        cardTile.className = 'analytics-card-tile';
        cardTile.setAttribute('data-card-number', cardNumber);

        const cardName = cardImage.replace(' Card.png', '').replace('.png', '');
        cardTile.setAttribute('data-card-name', cardName);

        cardTile.innerHTML = `
            <div class="analytics-card-image">
                <img src="assets/cards/${cardImage}" alt="${cardName}" onerror="this.style.display='none'">
            </div>
            <div class="analytics-card-name">${cardName}</div>
        `;

        // Add click event listener for toggling active state
        cardTile.addEventListener('click', () => {
            this.toggleCard(cardName, cardTile);
        });

        return cardTile;
    }

    // Toggle card active state
    toggleCard(cardName, cardElement) {
        if (this.activeCards.has(cardName)) {
            this.activeCards.delete(cardName);
            cardElement.classList.remove('active');
        } else {
            this.activeCards.add(cardName);
            cardElement.classList.add('active');
        }

        this.updateActiveCardCount();
        this.saveActiveCards();

        // Emit event for other modules to respond
        if (window.eventBus) {
            window.eventBus.emit('cards:selection-changed', {
                activeCards: Array.from(this.activeCards)
            });
        }

        console.log(`🃏 ${cardName} ${this.activeCards.has(cardName) ? 'activated' : 'deactivated'}`);
    }

    // Update the active card count display
    updateActiveCardCount() {
        const countElement = document.getElementById('activeCardCount');
        if (countElement) {
            const count = this.activeCards.size;
            countElement.textContent = `${count} card${count !== 1 ? 's' : ''} active`;
        }
    }

    // Show the cards section
    showSection() {
        if (!this.initialized) {
            this.init();
        }

        // Refresh cards display
        const currentCount = this.cardCountElement ? parseInt(this.cardCountElement.value) : this.cardCount;
        this.renderCards(currentCount);
    }

    // Hide the cards section
    hideSection() {
        // Cleanup if needed
    }

    // Get current card count
    getCardCount() {
        return this.cardCount;
    }

    // Render cards (compatibility method)
    renderCards(count) {
        // This method is called but the cards are already rendered in renderAllCards()
        // Just ensure cards are displayed
        if (!this.initialized) {
            this.init();
        }
        console.log(`🃏 renderCards called with count: ${count || 'default'}`);
    }

    // Set card count programmatically
    setCardCount(count) {
        if (count < 1 || count > 21) {
            console.warn('🃏 Invalid card count:', count);
            return false;
        }

        this.cardCount = count;

        if (this.cardCountElement) {
            this.cardCountElement.value = count;
        }

        this.renderCards(count);
        return true;
    }

    // Get all card elements
    getCardElements() {
        return this.cardsGridElement ? this.cardsGridElement.querySelectorAll('.card-tile') : [];
    }

    // Reset to default state
    reset() {
        this.setCardCount(21);
    }
}

// Global cards manager instance
if (typeof window !== 'undefined') {
    window.CardsManager = CardsManager;
    window.cardsManager = new CardsManager();
}