// Navigation Management Module
class NavigationManager {
    constructor() {
        this.activeSection = 'dashboard';
        this.sections = new Map();
        this.menuItems = new Map();
        this.initialized = false;
    }

    // Initialize navigation system
    init() {
        if (this.initialized) return;

        this.registerDefaultSections();
        this.setupEventListeners();
        this.showSection('dashboard'); // Default section
        this.initialized = true;

        console.log('🧭 NavigationManager initialized');
    }

    // Register default sections based on actual HTML structure
    registerDefaultSections() {
        this.registerSection('dashboard', {
            elementSelector: '.dashboard-content',
            menuText: 'Dashboard',
            onShow: () => {
                if (window.towerStatsManager) {
                    window.towerStatsManager.updateDisplay();
                }
            }
        });

        this.registerSection('tower-analytics', {
            elementSelector: '#towerAnalytics',
            menuText: 'Tower Analytics',
            onShow: () => {
                if (window.towerAnalytics) {
                    window.towerAnalytics.showSection();
                }
                // Inject achievements widget into analytics section
                if (window.towerAchievements) {
                    setTimeout(() => {
                        window.towerAchievements.injectAnalyticsWidget();
                    }, 500);
                }
            },
            onHide: () => {
                if (window.towerAnalytics) {
                    window.towerAnalytics.hideSection();
                }
            }
        });

        this.registerSection('achievements', {
            elementSelector: '#achievements',
            menuText: 'Achievements',
            onShow: () => {
                if (window.towerAchievements) {
                    // Initialize achievements display in main container
                    window.towerAchievements.injectIntoContainer('achievementsMainContainer');

                    // Update summary
                    const summary = window.towerAchievements.getAchievementSummary();
                    const summaryContainer = document.getElementById('achievementsSummaryMain');
                    if (summaryContainer) {
                        summaryContainer.innerHTML = `
                            <div class="achievements-summary">
                                <span class="achievement-count">${summary.unlocked}/${summary.total} unlocked</span>
                                <span class="achievement-points">${summary.points} points</span>
                                <span class="achievement-percentage">${summary.percentage}% complete</span>
                                <span class="achievement-streak">🔥 ${summary.streak} day streak</span>
                            </div>
                        `;
                    }

                    // Track achievement view
                    window.towerAchievements.onDashboardView();
                }
            }
        });

        this.registerSection('tournaments', {
            elementSelector: '#tournaments',
            menuText: 'Tournaments',
            onShow: () => {
                if (!window.tournamentsInstance) {
                    window.tournamentsInstance = new TournamentsManager();
                }
                window.tournamentsInstance.showSection();
            }
        });

        this.registerSection('content-hub', {
            elementSelector: '#contentHub',
            menuText: 'Content Hub',
            onShow: () => {
                if (!window.contentHubInstance) {
                    window.contentHubInstance = new ContentHub();
                }
                window.contentHubInstance.showContentHub();
            }
        });

        this.registerSection('myLabs', {
            elementSelector: '#myLabs',
            menuText: 'My Labs',
            onShow: () => {
                if (window.labsManager) {
                    window.labsManager.loadUserLabs();
                }
            }
        });

        this.registerSection('unique-modules', {
            elementSelector: '#uniqueModules',
            menuText: 'Unique Modules',
            onShow: () => {
                if (window.uniqueModulesManager) {
                    window.uniqueModulesManager.showSection();
                }
            },
            onHide: () => {
                if (window.uniqueModulesManager) {
                    window.uniqueModulesManager.hideSection();
                }
            }
        });
    }

    // Register a new section
    registerSection(name, config) {
        this.sections.set(name, {
            elementSelector: config.elementSelector,
            menuText: config.menuText,
            onShow: config.onShow || (() => {}),
            onHide: config.onHide || (() => {})
        });
    }

    // Show a specific section
    showSection(sectionName) {
        if (!this.sections.has(sectionName)) {
            console.warn(`🧭 Section '${sectionName}' not found`);
            return;
        }

        // Hide ALL sections first to ensure clean state
        this.hideAllSections();

        // Show new section
        const newSection = this.sections.get(sectionName);
        const newElement = document.querySelector(newSection.elementSelector);
        if (newElement) {
            newElement.style.display = 'block';
            newSection.onShow();
        }

        this.addActiveMenuClass(sectionName);
        this.activeSection = sectionName;

        console.log(`🧭 Switched to section: ${sectionName}`);
    }

    // Hide all sections
    hideAllSections() {
        this.sections.forEach((section, name) => {
            const element = document.querySelector(section.elementSelector);
            if (element) {
                element.style.display = 'none';
                section.onHide();
            }
        });
        this.removeAllActiveMenuClasses();
        this.activeSection = null;
    }

    // Show section by menu text
    showSectionByMenuText(menuText) {
        for (const [sectionName, section] of this.sections) {
            if (section.menuText === menuText) {
                this.showSection(sectionName);
                return true;
            }
        }
        console.warn(`🧭 No section found for menu text: ${menuText}`);
        return false;
    }

    // Get current active section
    getActiveSection() {
        return this.activeSection;
    }

    // Add active class to menu item
    addActiveMenuClass(sectionName) {
        // Find menu item by text content
        const section = this.sections.get(sectionName);
        if (section && section.menuText) {
            const menuItems = document.querySelectorAll('.menu-item');
            menuItems.forEach(item => {
                const span = item.querySelector('span');
                if (span && span.textContent === section.menuText) {
                    item.classList.add('active');
                }
            });
        }
    }

    // Remove active class from menu item
    removeActiveMenuClass(sectionName) {
        const section = this.sections.get(sectionName);
        if (section && section.menuText) {
            const menuItems = document.querySelectorAll('.menu-item');
            menuItems.forEach(item => {
                const span = item.querySelector('span');
                if (span && span.textContent === section.menuText) {
                    item.classList.remove('active');
                }
            });
        }
    }

    // Remove active class from all menu items
    removeAllActiveMenuClasses() {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.classList.remove('active');
        });
    }

    // Setup global event listeners
    setupEventListeners() {
        // Handle responsive menu toggle
        const hamburger = document.querySelector('.hamburger');
        const sidebar = document.querySelector('.sidebar');

        if (hamburger && sidebar) {
            hamburger.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }

        // Handle clicks outside sidebar on mobile
        document.addEventListener('click', (e) => {
            if (sidebar && sidebar.classList.contains('active')) {
                if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    // Utility method to check if section exists
    hasSection(sectionName) {
        return this.sections.has(sectionName);
    }

    // Get all registered sections
    getAllSections() {
        return Array.from(this.sections.keys());
    }
}

// Global navigation manager instance
if (typeof window !== 'undefined') {
    window.NavigationManager = NavigationManager;
    window.navigationManager = new NavigationManager();
}