// Tower Data Sharing & Submission Module
class DataSharing {
    constructor() {
        this.init();
    }

    init() {
        console.log('📤 Initializing Data Sharing Module...');
        this.setupEventListeners();
    }

    // Create sharing modal UI
    createSharingModal(runData) {
        const modal = document.createElement('div');
        modal.className = 'data-sharing-modal';
        modal.id = 'dataSharingModal';

        modal.innerHTML = `
            <div class="modal-backdrop" onclick="dataSharing.closeModal()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">📤 Share Your Tower Run</h2>
                    <button class="modal-close" onclick="dataSharing.closeModal()">×</button>
                </div>

                <div class="modal-body">
                    <div class="run-summary">
                        <h3>Run Summary</h3>
                        <div class="summary-stats">
                            <div class="stat-item">
                                <span class="stat-label">Tier:</span>
                                <span class="stat-value">${runData.tier || 'N/A'}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Wave:</span>
                                <span class="stat-value">${runData.wave || 'N/A'}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Damage:</span>
                                <span class="stat-value">${runData.damage_dealt || 'N/A'}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Coins:</span>
                                <span class="stat-value">${this.formatNumber(runData.coins_earned)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="sharing-options">
                        <h3>Choose How to Share</h3>

                        <div class="share-buttons">
                            <!-- Discord -->
                            <button class="share-btn discord-btn" onclick="dataSharing.shareToDiscord('${btoa(JSON.stringify(runData))}')">
                                <svg class="share-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                                </svg>
                                <span>Share to Discord</span>
                            </button>

                            <!-- Email -->
                            <button class="share-btn email-btn" onclick="dataSharing.shareViaEmail('${btoa(JSON.stringify(runData))}')">
                                <svg class="share-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                </svg>
                                <span>Send via Email</span>
                            </button>

                            <!-- WhatsApp -->
                            <button class="share-btn whatsapp-btn" onclick="dataSharing.shareToWhatsApp('${btoa(JSON.stringify(runData))}')">
                                <svg class="share-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967c-.273-.099-.471-.148-.67.15c-.197.297-.767.966-.94 1.164c-.173.199-.347.223-.644.075c-.297-.15-1.255-.463-2.39-1.475c-.883-.788-1.48-1.761-1.653-2.059c-.173-.297-.018-.458.13-.606c.134-.133.298-.347.446-.52c.149-.174.198-.298.298-.497c.099-.198.05-.371-.025-.52c-.075-.149-.669-1.612-.916-2.207c-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074c.149.198 2.096 3.2 5.077 4.487c.709.306 1.262.489 1.694.625c.712.227 1.36.195 1.871.118c.571-.085 1.758-.719 2.006-1.413c.248-.694.248-1.289.173-1.413c-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214l-3.741.982l.998-3.648l-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884c2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                                </svg>
                                <span>Share via WhatsApp</span>
                            </button>

                            <!-- Telegram -->
                            <button class="share-btn telegram-btn" onclick="dataSharing.shareToTelegram('${btoa(JSON.stringify(runData))}')">
                                <svg class="share-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12a12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472c-.18 1.898-.962 6.502-1.36 8.627c-.168.9-.499 1.201-.82 1.23c-.696.065-1.225-.46-1.9-.902c-1.056-.693-1.653-1.124-2.678-1.8c-1.185-.78-.417-1.21.258-1.91c.177-.184 3.247-2.977 3.307-3.23c.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345c-.48.33-.913.49-1.302.48c-.428-.008-1.252-.241-1.865-.44c-.752-.245-1.349-.374-1.297-.789c.027-.216.325-.437.893-.663c3.498-1.524 5.83-2.529 6.998-3.014c3.332-1.386 4.025-1.627 4.476-1.635z"/>
                                </svg>
                                <span>Share via Telegram</span>
                            </button>
                        </div>

                        <div class="copy-section">
                            <h4>Or Copy Run Data</h4>
                            <div class="copy-container">
                                <textarea id="runDataText" readonly>${JSON.stringify(runData, null, 2)}</textarea>
                                <button class="copy-btn" onclick="dataSharing.copyToClipboard()">
                                    📋 Copy to Clipboard
                                </button>
                            </div>
                        </div>

                        <div class="import-section">
                            <h4>Import From Other Sources</h4>
                            <div class="import-options">
                                <button class="import-btn" onclick="dataSharing.showImportDialog()">
                                    📥 Import from Text
                                </button>
                                <button class="import-btn" onclick="dataSharing.importFromFile()">
                                    📁 Import from File
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    }

    // Share to Discord (opens Discord with pre-filled message)
    shareToDiscord(encodedData) {
        const data = JSON.parse(atob(encodedData));
        const message = this.formatDiscordMessage(data);

        // Create Discord webhook integration or copy to clipboard for Discord
        this.copyToClipboard(message);
        this.showNotification('📋 Tower run data copied! Paste it in Discord.');

        // Optional: Open Discord web/app if available
        // window.open('https://discord.com/channels/@me', '_blank');
    }

    // Format message for Discord
    formatDiscordMessage(data) {
        return `🏰 **Tower Run Stats**
━━━━━━━━━━━━━━━
📊 **Tier:** ${data.tier} | **Wave:** ${data.wave}
💥 **Damage:** ${data.damage_dealt}
💰 **Coins:** ${this.formatNumber(data.coins_earned)}
💎 **Cells:** ${this.formatNumber(data.cells_earned)}
⚡ **Killed by:** ${data.killed_by || 'N/A'}
⏱️ **Game Time:** ${this.formatTime(data.game_time)}
━━━━━━━━━━━━━━━
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\``;
    }

    // Share via Email
    shareViaEmail(encodedData) {
        const data = JSON.parse(atob(encodedData));
        const subject = `Tower Run Stats - Tier ${data.tier} Wave ${data.wave}`;
        const body = this.formatEmailBody(data);

        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
    }

    // Format email body
    formatEmailBody(data) {
        return `Tower Run Statistics

Performance Summary:
- Tier: ${data.tier}
- Wave: ${data.wave}
- Damage Dealt: ${data.damage_dealt}
- Coins Earned: ${this.formatNumber(data.coins_earned)}
- Cells Earned: ${this.formatNumber(data.cells_earned)}
- Killed by: ${data.killed_by || 'N/A'}
- Game Time: ${this.formatTime(data.game_time)}

Full Run Data (JSON):
${JSON.stringify(data, null, 2)}

---
Shared from Tower Dashboard Analytics
`;
    }

    // Share to WhatsApp
    shareToWhatsApp(encodedData) {
        const data = JSON.parse(atob(encodedData));
        const message = this.formatWhatsAppMessage(data);

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    // Format message for WhatsApp
    formatWhatsAppMessage(data) {
        return `🏰 *Tower Run Stats*
━━━━━━━━━━━━
📊 Tier: ${data.tier} | Wave: ${data.wave}
💥 Damage: ${data.damage_dealt}
💰 Coins: ${this.formatNumber(data.coins_earned)}
💎 Cells: ${this.formatNumber(data.cells_earned)}
⚡ Killed by: ${data.killed_by || 'N/A'}
⏱️ Time: ${this.formatTime(data.game_time)}
━━━━━━━━━━━━`;
    }

    // Share to Telegram
    shareToTelegram(encodedData) {
        const data = JSON.parse(atob(encodedData));
        const message = this.formatTelegramMessage(data);

        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent('Tower Run Stats')}&text=${encodeURIComponent(message)}`;
        window.open(telegramUrl, '_blank');
    }

    // Format message for Telegram
    formatTelegramMessage(data) {
        return `🏰 Tower Run Stats
━━━━━━━━━━━━
📊 Tier: ${data.tier} | Wave: ${data.wave}
💥 Damage: ${data.damage_dealt}
💰 Coins: ${this.formatNumber(data.coins_earned)}
💎 Cells: ${this.formatNumber(data.cells_earned)}
⚡ Killed by: ${data.killed_by || 'N/A'}
⏱️ Time: ${this.formatTime(data.game_time)}`;
    }

    // Copy to clipboard
    copyToClipboard(text = null) {
        const textarea = text ? null : document.getElementById('runDataText');
        const textToCopy = text || textarea.value;

        navigator.clipboard.writeText(textToCopy).then(() => {
            this.showNotification('✅ Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            // Fallback method
            if (textarea) {
                textarea.select();
                document.execCommand('copy');
                this.showNotification('✅ Copied to clipboard!');
            }
        });
    }

    // Show import dialog
    showImportDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'import-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>📥 Import Run Data</h3>
                <p>Paste your Tower run data (JSON format):</p>
                <textarea id="importDataText" placeholder="Paste JSON data here..."></textarea>
                <div class="dialog-buttons">
                    <button onclick="dataSharing.processImport()">Import</button>
                    <button onclick="dataSharing.closeImportDialog()">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    // Process imported data
    processImport() {
        const textarea = document.getElementById('importDataText');
        if (!textarea) return;

        try {
            const data = JSON.parse(textarea.value);

            // Validate the data
            if (this.validateRunData(data)) {
                // Import to Tower Analytics
                if (window.towerAnalytics) {
                    window.towerAnalytics.importRun(data);
                    this.showNotification('✅ Run data imported successfully!');
                    this.closeImportDialog();
                    this.closeModal();
                } else {
                    this.showNotification('⚠️ Tower Analytics not available', 'error');
                }
            } else {
                this.showNotification('❌ Invalid run data format', 'error');
            }
        } catch (error) {
            console.error('Import error:', error);
            this.showNotification('❌ Failed to parse JSON data', 'error');
        }
    }

    // Import from file
    importFromFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.txt';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (this.validateRunData(data)) {
                        if (window.towerAnalytics) {
                            window.towerAnalytics.importRun(data);
                            this.showNotification('✅ File imported successfully!');
                            this.closeModal();
                        }
                    } else {
                        this.showNotification('❌ Invalid file format', 'error');
                    }
                } catch (error) {
                    console.error('File import error:', error);
                    this.showNotification('❌ Failed to read file', 'error');
                }
            };
            reader.readAsText(file);
        };

        input.click();
    }

    // Validate run data structure
    validateRunData(data) {
        // Check for required fields
        const requiredFields = ['tier', 'wave'];
        return requiredFields.every(field => data.hasOwnProperty(field));
    }

    // Close modal
    closeModal() {
        const modal = document.getElementById('dataSharingModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    // Close import dialog
    closeImportDialog() {
        const dialog = document.querySelector('.import-dialog');
        if (dialog) {
            dialog.remove();
        }
    }

    // Show notification
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `share-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Format number with commas
    formatNumber(num) {
        if (!num) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // Format time in seconds to readable format
    formatTime(seconds) {
        if (!seconds) return 'N/A';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}h ${minutes}m ${secs}s`;
    }

    // Setup event listeners
    setupEventListeners() {
        // Add share button to existing run displays if they exist
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('share-run-btn')) {
                const runData = JSON.parse(e.target.dataset.run);
                this.createSharingModal(runData);
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dataSharing = new DataSharing();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataSharing;
}