/**
 * Tower Chatbot - RAG-powered chatbot for Tower Game questions
 */

class TowerChatbot {
    constructor() {
        this.messages = [];
        this.container = null;
        this.isOpen = false;
        this.apiBase = window.location.hostname === 'localhost' ? 'http://localhost:6078' : '';
    }

    /**
     * Initialize chatbot UI
     */
    init() {
        this.createChatbotUI();
        this.attachEventListeners();
        console.log('✅ Tower Chatbot initialized');
    }

    /**
     * Create chatbot HTML structure
     */
    createChatbotUI() {
        const chatbotHTML = `
            <!-- Chatbot Toggle Button -->
            <button id="chatbot-toggle" class="chatbot-toggle" title="Ask about Tower Game">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            </button>

            <!-- Chatbot Window -->
            <div id="chatbot-window" class="chatbot-window">
                <div class="chatbot-header">
                    <div class="chatbot-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                        <span>Tower Assistant</span>
                    </div>
                    <button id="chatbot-close" class="chatbot-close-btn">✕</button>
                </div>

                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="chatbot-message bot-message">
                        <div class="message-avatar">🏰</div>
                        <div class="message-content">
                            <p>Hi! I'm your Tower Game assistant. Ask me anything about strategies, towers, enemies, or game mechanics!</p>
                            <div class="quick-questions">
                                <button class="quick-question-btn" data-question="What's the best tower for tier 18?">
                                    Best tower for T18?
                                </button>
                                <button class="quick-question-btn" data-question="How do I beat fast enemies?">
                                    Beat fast enemies?
                                </button>
                                <button class="quick-question-btn" data-question="Workshop enhancement guide">
                                    Workshop guide?
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="chatbot-input-container">
                    <input
                        type="text"
                        id="chatbot-input"
                        class="chatbot-input"
                        placeholder="Ask about Tower Game..."
                        autocomplete="off"
                    />
                    <button id="chatbot-send" class="chatbot-send-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
        this.container = document.getElementById('chatbot-window');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Toggle button
        document.getElementById('chatbot-toggle').addEventListener('click', () => {
            this.toggle();
        });

        // Close button
        document.getElementById('chatbot-close').addEventListener('click', () => {
            this.close();
        });

        // Send button
        document.getElementById('chatbot-send').addEventListener('click', () => {
            this.sendMessage();
        });

        // Input enter key
        document.getElementById('chatbot-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Quick question buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-question-btn')) {
                const question = e.target.dataset.question;
                this.askQuestion(question);
            }
        });
    }

    /**
     * Toggle chatbot open/close
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Open chatbot
     */
    open() {
        this.container.classList.add('open');
        document.getElementById('chatbot-toggle').classList.add('hidden');
        this.isOpen = true;

        // Focus input
        setTimeout(() => {
            document.getElementById('chatbot-input').focus();
        }, 300);
    }

    /**
     * Close chatbot
     */
    close() {
        this.container.classList.remove('open');
        document.getElementById('chatbot-toggle').classList.remove('hidden');
        this.isOpen = false;
    }

    /**
     * Send message from input
     */
    async sendMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();

        if (!message) return;

        input.value = '';
        await this.askQuestion(message);
    }

    /**
     * Ask a question to the chatbot
     */
    async askQuestion(question) {
        // Add user message
        this.addMessage(question, 'user');

        // Show typing indicator
        this.showTyping();

        try {
            // Search RAG for relevant content
            const response = await fetch(`${this.apiBase}/api/reddit-rag/search?q=${encodeURIComponent(question)}&limit=3`);
            const data = await response.json();

            // Remove typing indicator
            this.hideTyping();

            if (data.success && data.results.length > 0) {
                // Format response with sources
                this.addRAGResponse(data.results, question);
            } else {
                this.addMessage("I couldn't find any relevant information about that. Try asking in a different way!", 'bot');
            }

        } catch (error) {
            console.error('❌ Chatbot error:', error);
            this.hideTyping();
            this.addMessage("Sorry, I'm having trouble connecting. Please try again later.", 'bot');
        }
    }

    /**
     * Add message to chat
     */
    addMessage(content, type = 'bot') {
        const messagesContainer = document.getElementById('chatbot-messages');

        // Get user avatar from Discord auth
        let avatar = '👤';
        if (type === 'user' && window.discordAuth?.user?.user_metadata?.avatar_url) {
            avatar = `<img src="${window.discordAuth.user.user_metadata.avatar_url}" alt="User" class="user-avatar">`;
        } else if (type === 'bot') {
            avatar = '🏰';
        }

        const messageHTML = `
            <div class="chatbot-message ${type}-message">
                <div class="message-avatar">${avatar}</div>
                <div class="message-content">
                    <p>${content}</p>
                </div>
            </div>
        `;

        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        this.scrollToBottom();
    }

    /**
     * Add RAG response with sources
     */
    addRAGResponse(results, question) {
        const messagesContainer = document.getElementById('chatbot-messages');

        // Create response based on top result
        const topResult = results[0];
        let response = `Based on community discussions, here's what I found:\n\n`;
        response += `**${topResult.title}**\n\n`;
        response += topResult.content; // Show full content instead of truncating

        // Add sources (only if URL exists and is not placeholder)
        const sourcesHTML = results
            .filter(result => result.url && !result.url.includes('reddit.com/r/TheTowerGame/'))
            .map((result, index) => `
                <a href="${result.url}" target="_blank" class="source-link">
                    📄 ${result.title} ${result.score ? `(${result.score} upvotes)` : ''}
                </a>
            `).join('');

        const messageHTML = `
            <div class="chatbot-message bot-message">
                <div class="message-avatar">🏰</div>
                <div class="message-content">
                    <p>${response}</p>
                    <div class="message-sources">
                        <strong>Sources:</strong>
                        ${sourcesHTML}
                    </div>
                </div>
            </div>
        `;

        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        this.scrollToBottom();
    }

    /**
     * Show typing indicator
     */
    showTyping() {
        const messagesContainer = document.getElementById('chatbot-messages');
        const typingHTML = `
            <div class="chatbot-message bot-message typing-indicator" id="typing-indicator">
                <div class="message-avatar">🏰</div>
                <div class="message-content">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', typingHTML);
        this.scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    hideTyping() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }

    /**
     * Scroll to bottom of messages
     */
    scrollToBottom() {
        const messagesContainer = document.getElementById('chatbot-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.towerChatbot = new TowerChatbot();
        window.towerChatbot.init();
    });
} else {
    window.towerChatbot = new TowerChatbot();
    window.towerChatbot.init();
}
