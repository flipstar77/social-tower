/**
 * Discord Authentication Frontend Module
 * Uses Supabase Auth for Discord OAuth flow
 */

// Import Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

class DiscordAuth {
    constructor() {
        this.isAuthenticated = false;
        this.user = null;
        this.supabase = null;
        this.hasShownLoginMessage = false; // Track if we've shown the login message
        this.initSupabase();
    }

    /**
     * Initialize Supabase client
     */
    initSupabase() {
        const supabaseUrl = 'https://kktvmpwxfyevkgotppah.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdHZtcHd4Znlldmtnb3RwcGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MDk2MDksImV4cCI6MjA3NDI4NTYwOX0.0w-oSkzgXHCPVV3QxSmeXChZeyPELdii1vd0codqMxY';

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    /**
     * Initialize Discord authentication
     */
    async init() {
        // Check current authentication status
        await this.checkAuthStatus();

        // Setup UI based on auth status
        this.setupUI();

        // Listen for auth state changes
        this.supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session);
            this.handleAuthStateChange(event, session);
        });
    }

    /**
     * Handle auth state changes
     */
    async handleAuthStateChange(event, session) {
        const wasAuthenticated = this.isAuthenticated;

        if (event === 'SIGNED_IN' && session) {
            this.isAuthenticated = true;
            this.user = session.user;

            // Only show success message if this is a new login (not on page load)
            if (!wasAuthenticated && !this.hasShownLoginMessage) {
                this.showSuccess('Successfully logged in with Discord!');
                this.hasShownLoginMessage = true;
            }
        } else if (event === 'SIGNED_OUT') {
            this.isAuthenticated = false;
            this.user = null;
            this.hasShownLoginMessage = false;
        }

        this.setupUI();
    }

    /**
     * Check current authentication status
     */
    async checkAuthStatus() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();

            if (error) {
                console.error('Error getting session:', error);
                this.isAuthenticated = false;
                this.user = null;
                return;
            }

            if (session) {
                this.isAuthenticated = true;
                this.user = session.user;
                console.log('User authenticated:', this.user);
            } else {
                this.isAuthenticated = false;
                this.user = null;
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.isAuthenticated = false;
            this.user = null;
        }
    }

    /**
     * Initiate Discord login
     */
    async login() {
        try {
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: 'discord',
                options: {
                    redirectTo: window.location.origin
                }
            });

            if (error) {
                console.error('Discord login error:', error);
                this.showError('Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Error during login:', error);
            this.showError('Login failed. Please try again.');
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            const { error } = await this.supabase.auth.signOut();

            if (error) {
                throw error;
            }

            this.isAuthenticated = false;
            this.user = null;
            this.setupUI();
            this.showSuccess('Successfully logged out');
        } catch (error) {
            console.error('Error during logout:', error);
            this.showError('Logout failed. Please try again.');
        }
    }

    /**
     * Get authentication headers for API requests
     */
    async getAuthHeaders() {
        if (!this.isAuthenticated) {
            return {};
        }

        try {
            const { data: { session } } = await this.supabase.auth.getSession();

            if (session && session.access_token) {
                return {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                };
            }
        } catch (error) {
            console.error('Error getting auth headers:', error);
        }

        return {};
    }

    /**
     * Fetch with authentication
     */
    async authenticatedFetch(url, options = {}) {
        const authHeaders = await this.getAuthHeaders();

        const mergedOptions = {
            ...options,
            headers: {
                ...authHeaders,
                ...options.headers
            }
        };

        return fetch(url, mergedOptions);
    }

    /**
     * Setup UI based on authentication status
     */
    setupUI() {
        const landingPage = document.getElementById('landing-page');
        const authenticatedContent = document.getElementById('authenticated-content');
        const sidebar = document.querySelector('.sidebar');
        const header = document.querySelector('.header');
        const mainContent = document.querySelector('.main-content');

        if (this.isAuthenticated) {
            // Show authenticated content, hide landing page
            document.body.classList.add('authenticated');
            if (landingPage) landingPage.style.display = 'none';
            if (authenticatedContent) authenticatedContent.classList.add('show');
            if (sidebar) sidebar.style.display = 'flex';
            if (header) header.style.display = 'flex';
            if (mainContent) mainContent.style.marginLeft = '273px';

            // Update user info in the UI
            this.updateUserInfo();

            // Add logout functionality
            this.addLogoutButton();

            // Ensure navigation is working
            this.initializeNavigation();
        } else {
            // Show landing page ONLY, hide everything else
            document.body.classList.remove('authenticated');
            if (landingPage) landingPage.style.display = 'block';
            if (authenticatedContent) authenticatedContent.classList.remove('show');
            if (sidebar) sidebar.style.display = 'none';
            if (header) header.style.display = 'none';
            if (mainContent) mainContent.style.marginLeft = '0';

            // Show login button in landing page
            this.showLoginButton();
        }
    }

    /**
     * Show Discord login button in the landing page
     */
    showLoginButton() {
        const loginPrompt = document.querySelector('.login-prompt');
        if (!loginPrompt) return;

        // Check if login button already exists
        if (loginPrompt.querySelector('.discord-login-btn')) return;

        // Create Discord login button
        const loginButton = document.createElement('button');
        loginButton.className = 'discord-login-btn';
        loginButton.innerHTML = `
            <svg class="discord-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.174.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Login with Discord
        `;

        loginButton.onclick = () => this.login();

        // Add styles for the button
        loginButton.style.cssText = `
            background: linear-gradient(135deg, #5865F2, #4752C4);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
            margin: 20px auto 0;
            box-shadow: 0 4px 15px rgba(88, 101, 242, 0.3);
        `;

        // Add hover effect
        loginButton.addEventListener('mouseenter', () => {
            loginButton.style.transform = 'translateY(-2px)';
            loginButton.style.boxShadow = '0 6px 20px rgba(88, 101, 242, 0.4)';
        });

        loginButton.addEventListener('mouseleave', () => {
            loginButton.style.transform = 'translateY(0)';
            loginButton.style.boxShadow = '0 4px 15px rgba(88, 101, 242, 0.3)';
        });

        loginPrompt.appendChild(loginButton);
    }

    /**
     * Update user information in the authenticated UI
     */
    updateUserInfo() {
        if (!this.user) return;

        // Update user name
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            // Supabase stores Discord username in user_metadata
            const discordUsername = this.user.user_metadata?.full_name || this.user.user_metadata?.name;
            userNameElement.textContent = discordUsername || this.user.email || 'Tower Player';
        }

        // Update user avatar if available
        const userAvatarElement = document.querySelector('.user-avatar');
        if (userAvatarElement) {
            // Discord avatar URL can be in multiple places in Supabase metadata
            const avatarUrl = this.user.user_metadata?.avatar_url ||
                             this.user.user_metadata?.picture ||
                             this.getDiscordAvatarUrl();

            if (avatarUrl) {
                userAvatarElement.style.backgroundImage = `url(${avatarUrl})`;
                userAvatarElement.style.backgroundSize = 'cover';
                userAvatarElement.style.backgroundPosition = 'center';
            }
        }
    }

    /**
     * Construct Discord avatar URL from user metadata
     */
    getDiscordAvatarUrl() {
        if (!this.user?.user_metadata) return null;

        const providerId = this.user.user_metadata.provider_id;
        const avatar = this.user.user_metadata.avatar;

        if (providerId && avatar) {
            // Discord CDN URL format
            return `https://cdn.discordapp.com/avatars/${providerId}/${avatar}.png`;
        }

        return null;
    }

    /**
     * Bind login button if it exists
     */
    bindLoginButton() {
        const loginButton = document.querySelector('.discord-login-btn');
        if (loginButton && !loginButton.onclick) {
            loginButton.onclick = () => this.login();
        }
    }

    /**
     * Add logout button to user profile area
     */
    addLogoutButton() {
        const userProfile = document.querySelector('.user-profile');
        if (!userProfile) return;

        // Check if logout button already exists
        if (userProfile.querySelector('.logout-btn')) return;

        // Create logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'logout-btn';
        logoutBtn.innerHTML = '🚪 Logout';
        logoutBtn.style.cssText = `
            background: linear-gradient(135deg, #ff4757, #ff3742);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            margin-left: 10px;
            transition: all 0.3s ease;
        `;

        logoutBtn.addEventListener('mouseenter', () => {
            logoutBtn.style.transform = 'translateY(-1px)';
            logoutBtn.style.boxShadow = '0 4px 10px rgba(255, 71, 87, 0.3)';
        });

        logoutBtn.addEventListener('mouseleave', () => {
            logoutBtn.style.transform = 'translateY(0)';
            logoutBtn.style.boxShadow = 'none';
        });

        logoutBtn.onclick = () => this.logout();

        userProfile.appendChild(logoutBtn);
    }

    /**
     * Initialize navigation functionality
     */
    initializeNavigation() {
        // Initialize sidebar navigation if not already done
        const menuItems = document.querySelectorAll('.menu-item[data-section]');

        menuItems.forEach(item => {
            // Remove any existing click listeners to avoid duplicates
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);

            // Add click listener
            newItem.addEventListener('click', () => {
                const section = newItem.getAttribute('data-section');
                this.navigateToSection(section);

                // Update active state
                document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('active'));
                newItem.classList.add('active');
            });
        });

        // Initialize other navigation elements
        if (window.navigationManager && typeof window.navigationManager.init === 'function') {
            window.navigationManager.init();
        }
    }

    /**
     * Navigate to a specific section
     */
    navigateToSection(sectionName) {
        // Hide all sections
        const sections = ['towerAnalytics', 'achievements', 'tournaments', 'contentHub', 'uniqueModules'];
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) element.style.display = 'none';
        });

        // Show dashboard content by default
        const dashboardContent = document.querySelector('.dashboard-content');
        if (dashboardContent) dashboardContent.style.display = 'block';

        // Show specific section if requested
        if (sectionName && sectionName !== 'dashboard') {
            if (dashboardContent) dashboardContent.style.display = 'none';

            const targetSection = document.getElementById(sectionName);
            if (targetSection) {
                targetSection.style.display = 'block';

                // Initialize section-specific functionality
                this.initializeSectionFunctionality(sectionName);
            }
        }
    }

    /**
     * Initialize section-specific functionality
     */
    initializeSectionFunctionality(sectionName) {
        switch (sectionName) {
            case 'towerAnalytics':
                if (window.towerAnalytics && typeof window.towerAnalytics.showSection === 'function') {
                    window.towerAnalytics.showSection();
                }
                break;
            case 'achievements':
                if (window.achievements && typeof window.achievements.showSection === 'function') {
                    window.achievements.showSection();
                }
                break;
            case 'tournaments':
                if (window.tournaments && typeof window.tournaments.loadDashboard === 'function') {
                    window.tournaments.loadDashboard();
                }
                break;
            case 'contentHub':
                if (window.contentHub && typeof window.contentHub.showSection === 'function') {
                    window.contentHub.showSection();
                }
                break;
            case 'uniqueModules':
                if (window.uniqueModulesManager && typeof window.uniqueModulesManager.showSection === 'function') {
                    window.uniqueModulesManager.showSection();
                }
                break;
            case 'sessionHistory':
                // Handle session history functionality if available
                if (window.sessionHistory && typeof window.sessionHistory.showSection === 'function') {
                    window.sessionHistory.showSection();
                }
                break;
            case 'settings':
                // Handle settings functionality if available
                if (window.settingsManager && typeof window.settingsManager.showSection === 'function') {
                    window.settingsManager.showSection();
                }
                break;
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Try to use existing notification system
        if (window.notifications && typeof window.notifications.show === 'function') {
            window.notifications.show(message, type);
            return;
        }

        // Fallback to simple alert
        console.log(`[${type.toUpperCase()}] ${message}`);

        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            ${type === 'success' ? 'background: linear-gradient(135deg, #4CAF50, #45a049);' : ''}
            ${type === 'error' ? 'background: linear-gradient(135deg, #F44336, #D32F2F);' : ''}
            ${type === 'info' ? 'background: linear-gradient(135deg, #2196F3, #1976D2);' : ''}
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    /**
     * Get current user data
     */
    getUser() {
        return {
            isAuthenticated: this.isAuthenticated,
            user: this.user,
            session: this.user ? { user: this.user } : null
        };
    }
}

// Initialize Discord auth when DOM is loaded
const discordAuth = new DiscordAuth();

// Export for use in other modules
window.discordAuth = discordAuth;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    discordAuth.init();
});

export default discordAuth;