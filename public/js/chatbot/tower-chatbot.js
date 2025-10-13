/**
 * Tower Chatbot - RAG-powered chatbot for Tower Game questions
 */

class TowerChatbot {
    constructor() {
        this.messages = [];
        this.container = null;
        this.isOpen = false;
        this.apiBase = window.location.hostname === 'localhost'
            ? 'http://localhost:6078'
            : 'https://tower-stats-backend-production.up.railway.app';
        this.size = 'normal'; // 'normal', 'large', 'fullscreen'
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
                    <div style="display: flex; gap: 0;">
                        <button id="chatbot-resize" class="chatbot-resize-btn" title="Resize window">⇱</button>
                        <button id="chatbot-close" class="chatbot-close-btn">✕</button>
                    </div>
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

        // Resize button
        document.getElementById('chatbot-resize').addEventListener('click', () => {
            this.cycleSize();
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
     * Cycle through chatbot sizes
     */
    cycleSize() {
        // Remove current size classes
        this.container.classList.remove('large', 'fullscreen');

        // Cycle: normal -> large -> fullscreen -> normal
        if (this.size === 'normal') {
            this.size = 'large';
            this.container.classList.add('large');
        } else if (this.size === 'large') {
            this.size = 'fullscreen';
            this.container.classList.add('fullscreen');
        } else {
            this.size = 'normal';
        }
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
            // Call AI-powered answer endpoint
            const response = await fetch(`${this.apiBase}/api/reddit-rag/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question })
            });

            const data = await response.json();

            // Remove typing indicator
            this.hideTyping();

            if (data.success && data.answer) {
                // Add AI-generated answer with sources
                console.log('📚 Chatbot sources:', data.sources);
                this.addAIAnswer(data.answer, data.sources, question);
            } else {
                this.addMessage(data.answer || "I couldn't find any relevant information about that. Try asking in a different way!", 'bot');
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
    addMessage(content, type = 'bot', autoScroll = true) {
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
        // Only auto-scroll for user messages, not bot responses
        if (autoScroll && type === 'user') {
            this.scrollToBottom();
        }
    }

    /**
     * Add AI-generated answer with sources
     */
    addAIAnswer(answer, sources, question) {
        const messagesContainer = document.getElementById('chatbot-messages');

        // Extract sections from AI answer
        const quickAnswerMatch = answer.match(/##\s*Quick Answer\s*\n([\s\S]*?)(?=\n##|$)/i);
        const detailsMatch = answer.match(/##\s*Details\s*\n([\s\S]*?)(?=\n##|$)/i);
        const relatedQuestionsMatch = answer.match(/##\s*Related Questions\s*\n((?:[-•]\s*.+\n?)+)/i);

        let quickAnswer = '';
        let details = '';
        let relatedQuestions = [];

        if (quickAnswerMatch) {
            quickAnswer = quickAnswerMatch[1].trim();
        }

        if (detailsMatch) {
            details = detailsMatch[1].trim();
        }

        if (relatedQuestionsMatch) {
            relatedQuestions = relatedQuestionsMatch[1]
                .split('\n')
                .map(q => q.replace(/^[-•]\s*/, '').trim())
                .filter(q => q.length > 0)
                .slice(0, 3);
        }

        // If no sections found, use the whole answer
        if (!quickAnswer && !details) {
            details = answer;
        }

        // Format sections with markdown-like styling
        const formatText = (text) => text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');

        // Build sources HTML with footnote-style numbering
        const filteredSources = sources && sources.length > 0 ? sources.filter(s => s.url) : [];
        console.log('📋 Filtered sources for display:', filteredSources);
        const sourcesHTML = filteredSources.map((s, i) => `
                <a href="${s.url}" target="_blank" class="source-link" data-index="${i + 1}">
                    ${s.title}${s.score ? ` (${s.score} upvotes)` : ''}
                </a>
            `).join('');

        // Build related questions HTML
        const relatedQuestionsHTML = relatedQuestions.length > 0 ? `
            <div class="related-questions">
                <strong>💡 You might also ask:</strong>
                ${relatedQuestions.map(q => `
                    <button class="quick-question-btn" data-question="${q}">
                        ${q}
                    </button>
                `).join('')}
            </div>
        ` : '';

        // Build the complete message
        let contentHTML = '';

        if (quickAnswer) {
            contentHTML += `
                <div class="quick-answer">
                    <div class="section-header">📌 Quick Answer</div>
                    <p>${formatText(quickAnswer)}</p>
                </div>
            `;
        }

        if (details) {
            contentHTML += `
                <div class="details-section">
                    ${quickAnswer ? '<div class="section-header">📖 Details</div>' : ''}
                    <p>${formatText(details)}</p>
                </div>
            `;
        }

        const messageHTML = `
            <div class="chatbot-message bot-message">
                <div class="message-avatar">🏰</div>
                <div class="message-content">
                    ${contentHTML}
                    ${relatedQuestionsHTML}
                    ${sourcesHTML ? `
                        <div class="message-sources">
                            <strong>Sources:</strong>
                            ${sourcesHTML}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        // Don't auto-scroll for bot responses - let user stay at their current position
    }

    /**
     * Add RAG response with sources (legacy - keeping for fallback)
     */
    addRAGResponse(results, question) {
        const messagesContainer = document.getElementById('chatbot-messages');

        // Create response based on top result
        const topResult = results[0];
        const formattedContent = this.formatContent(topResult.content, question);

        // Add sources with footnote-style numbering (only if URL exists)
        const sourcesHTML = results
            .filter(result => result.url)
            .map((result, index) => `
                <a href="${result.url}" target="_blank" class="source-link" data-index="${index + 1}">
                    ${result.title}${result.score ? ` (${result.score} upvotes)` : ''}
                </a>
            `).join('');

        // Generate related questions based on content
        const relatedQuestions = this.generateRelatedQuestions(topResult.content, question);
        const relatedQuestionsHTML = relatedQuestions.length > 0 ? `
            <div class="related-questions">
                <strong>💡 Related questions:</strong>
                ${relatedQuestions.map(q => `
                    <button class="quick-question-btn" data-question="${q}">
                        ${q}
                    </button>
                `).join('')}
            </div>
        ` : '';

        const messageHTML = `
            <div class="chatbot-message bot-message">
                <div class="message-avatar">🏰</div>
                <div class="message-content">
                    ${formattedContent}
                    ${sourcesHTML ? `
                        <div class="message-sources">
                            <strong>Sources:</strong>
                            ${sourcesHTML}
                        </div>
                    ` : ''}
                    ${relatedQuestionsHTML}
                </div>
            </div>
        `;

        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        // Don't auto-scroll for bot responses - let user stay at their current position
    }

    /**
     * Format content for better readability
     */
    formatContent(content, question) {
        // Extract key information based on question context
        const lowerQuestion = question.toLowerCase();

        // For UW/Ultimate Weapon questions, format structured response
        if (lowerQuestion.includes('uw') || lowerQuestion.includes('ultimate weapon') ||
            lowerQuestion.includes('first') || lowerQuestion.includes('unlock')) {

            const unlockOrder = content.match(/UNLOCK ORDER:([^.]+\.)/)?.[1] || '';
            const syncConcept = content.match(/THE SYNC CONCEPT:([^.]+\.)/)?.[1] || '';
            const labPriority = content.match(/LAB PRIORITY:([^.]+\.)/)?.[1] || '';
            const keyAdvice = content.match(/KEY ADVICE:([^.]+\.)/)?.[1] || '';

            let formatted = `<div class="formatted-response">`;

            if (unlockOrder) {
                formatted += `<p><strong>📋 Unlock Order:</strong><br>${unlockOrder}</p>`;
            }

            if (syncConcept) {
                formatted += `<p><strong>⚡ The Sync Concept:</strong><br>${syncConcept}</p>`;
            }

            if (labPriority) {
                formatted += `<p><strong>🔬 Lab Priority:</strong><br>${labPriority}</p>`;
            }

            if (keyAdvice) {
                formatted += `<p><strong>💡 Key Advice:</strong><br>${keyAdvice}</p>`;
            }

            formatted += `</div>`;
            return formatted;
        }

        // Default: Add line breaks for readability
        return `<p>${content.replace(/\. ([A-Z])/g, '.<br><br>$1')}</p>`;
    }

    /**
     * Generate related questions based on content
     */
    generateRelatedQuestions(content, originalQuestion) {
        const questions = [];

        // UW-related follow-ups
        if (content.includes('UNLOCK ORDER')) {
            if (!originalQuestion.toLowerCase().includes('sync')) {
                questions.push('How does UW sync work?');
            }
            if (!originalQuestion.toLowerCase().includes('lab')) {
                questions.push('What labs should I prioritize?');
            }
            if (!originalQuestion.toLowerCase().includes('stone')) {
                questions.push('How many stones do I need?');
            }
        }

        // Limit to 3 questions
        return questions.slice(0, 3);
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
