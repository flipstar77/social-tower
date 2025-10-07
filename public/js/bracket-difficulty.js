/**
 * Tournament Bracket Difficulty Module
 * Fetches and displays bracket difficulty analysis for tournaments
 */

class BracketDifficultyManager {
    constructor() {
        this.apiBaseUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:6078'
            : 'https://tower-stats-backend-production.up.railway.app';
        this.bracketData = [];
        this.latestAnalysis = null;
    }

    /**
     * Initialize the bracket difficulty display
     */
    async init(discordUserId) {
        if (!discordUserId) {
            this.showEmptyState('Please log in to view your bracket analysis');
            return;
        }

        try {
            await this.loadBracketData(discordUserId);
            this.renderLatestAnalysis();
            this.renderBracketHistory();
        } catch (error) {
            console.error('Error initializing bracket difficulty:', error);
            this.showError('Failed to load bracket difficulty data');
        }
    }

    /**
     * Load bracket difficulty data from API
     */
    async loadBracketData(discordUserId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/tournament-brackets/user/${discordUserId}?limit=10`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.data) {
                this.bracketData = data.data;
                this.latestAnalysis = data.data.length > 0 ? data.data[0] : null;
            } else {
                this.bracketData = [];
                this.latestAnalysis = null;
            }
        } catch (error) {
            console.error('Error loading bracket data:', error);
            throw error;
        }
    }

    /**
     * Render the latest bracket analysis card
     */
    renderLatestAnalysis() {
        const container = document.getElementById('latestBracketAnalysis');

        if (!this.latestAnalysis) {
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }

        const analysis = this.latestAnalysis;
        const difficultyClass = this.getDifficultyClass(analysis.difficulty_label);

        container.innerHTML = `
            <div class="bracket-header">
                <div>
                    <div class="bracket-title">Latest Tournament: ${analysis.league} League</div>
                    <div class="bracket-date">${this.formatDate(analysis.analyzed_at)}</div>
                </div>
                <div class="difficulty-badge ${difficultyClass}">
                    ${analysis.difficulty_label || 'Unknown'}
                </div>
            </div>

            <div class="bracket-stats-grid">
                <div class="bracket-stat-item">
                    <span class="bracket-stat-label">Difficulty Score</span>
                    <span class="bracket-stat-value highlight">${Math.round(analysis.difficulty_score)}/100</span>
                </div>
                <div class="bracket-stat-item">
                    <span class="bracket-stat-label">Your Rank</span>
                    <span class="bracket-stat-value">#${analysis.actual_rank}</span>
                </div>
                <div class="bracket-stat-item">
                    <span class="bracket-stat-label">Best Possible</span>
                    <span class="bracket-stat-value">#${analysis.best_possible_rank}</span>
                </div>
                <div class="bracket-stat-item">
                    <span class="bracket-stat-label">Worst Possible</span>
                    <span class="bracket-stat-value">#${analysis.worst_possible_rank}</span>
                </div>
                <div class="bracket-stat-item">
                    <span class="bracket-stat-label">Average Rank</span>
                    <span class="bracket-stat-value">#${Math.round(analysis.average_rank)}</span>
                </div>
                <div class="bracket-stat-item">
                    <span class="bracket-stat-label">Wave</span>
                    <span class="bracket-stat-value">${analysis.wave.toLocaleString()}</span>
                </div>
            </div>

            <div class="bracket-visualization">
                <h4 style="color: rgba(255, 255, 255, 0.9); margin: 0 0 10px 0; font-size: 16px;">Bracket Comparison</h4>
                <p style="color: rgba(255, 255, 255, 0.6); font-size: 13px; margin: 0 0 15px 0;">
                    Your performance was analyzed across ${analysis.total_brackets_analyzed} brackets in ${analysis.league} league
                </p>
                <div id="bracketChart" class="bracket-chart-container"></div>
            </div>

            <div class="bracket-interpretation">
                ${this.getInterpretationText(analysis)}
            </div>
        `;

        // Render the chart
        this.renderBracketChart(analysis);
    }

    /**
     * Render bracket history list
     */
    renderBracketHistory() {
        const container = document.getElementById('bracketHistoryList');

        if (this.bracketData.length === 0) {
            container.innerHTML = '<div class="bracket-empty-state"><p>No bracket analysis data available yet.</p></div>';
            return;
        }

        container.innerHTML = this.bracketData.map(analysis => `
            <div class="bracket-history-item" onclick="window.bracketDifficulty?.showAnalysisDetails(${analysis.id})">
                <div class="bracket-history-header">
                    <span class="bracket-history-date">${this.formatDate(analysis.analyzed_at)}</span>
                    <span class="bracket-history-league">${analysis.league} League</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div class="difficulty-badge ${this.getDifficultyClass(analysis.difficulty_label)}" style="font-size: 11px; padding: 6px 12px;">
                        ${analysis.difficulty_label}
                    </div>
                    <span style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">
                        Difficulty: <strong style="color: #8257e5;">${Math.round(analysis.difficulty_score)}/100</strong>
                    </span>
                </div>
                <div class="bracket-history-stats">
                    <div class="bracket-history-stat">
                        <span class="bracket-history-stat-label">Rank</span>
                        <span class="bracket-history-stat-value">#${analysis.actual_rank}</span>
                    </div>
                    <div class="bracket-history-stat">
                        <span class="bracket-history-stat-label">Wave</span>
                        <span class="bracket-history-stat-value">${analysis.wave.toLocaleString()}</span>
                    </div>
                    <div class="bracket-history-stat">
                        <span class="bracket-history-stat-label">Best</span>
                        <span class="bracket-history-stat-value">#${analysis.best_possible_rank}</span>
                    </div>
                    <div class="bracket-history-stat">
                        <span class="bracket-history-stat-label">Worst</span>
                        <span class="bracket-history-stat-value">#${analysis.worst_possible_rank}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render the bracket comparison chart
     */
    renderBracketChart(analysis) {
        const chartContainer = document.getElementById('bracketChart');
        if (!chartContainer) return;

        const chart = echarts.init(chartContainer);

        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(20, 20, 30, 0.9)',
                borderColor: 'rgba(130, 87, 229, 0.5)',
                textStyle: { color: '#fff' }
            },
            grid: {
                left: '50px',
                right: '20px',
                top: '20px',
                bottom: '40px'
            },
            xaxis: {
                type: 'category',
                data: ['Best\nPossible', 'Your\nActual', 'Average', 'Worst\nPossible'],
                axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
                axisLabel: {
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: 11
                }
            },
            yAxis: {
                type: 'value',
                name: 'Rank',
                inverse: true, // Lower rank number is better
                axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
                axisLabel: {
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: 11,
                    formatter: '#{value}'
                },
                splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } }
            },
            series: [{
                data: [
                    {
                        value: analysis.best_possible_rank,
                        itemStyle: { color: '#11998e' }
                    },
                    {
                        value: analysis.actual_rank,
                        itemStyle: { color: '#8257e5' }
                    },
                    {
                        value: Math.round(analysis.average_rank),
                        itemStyle: { color: '#f2c94c' }
                    },
                    {
                        value: analysis.worst_possible_rank,
                        itemStyle: { color: '#ee0979' }
                    }
                ],
                type: 'bar',
                barWidth: '50%',
                label: {
                    show: true,
                    position: 'top',
                    color: '#fff',
                    formatter: '#{c}'
                }
            }]
        };

        chart.setOption(option);

        // Resize chart on window resize
        window.addEventListener('resize', () => chart.resize());
    }

    /**
     * Get interpretation text based on difficulty score
     */
    getInterpretationText(analysis) {
        const score = analysis.difficulty_score;
        const rank = analysis.actual_rank;
        const bestRank = analysis.best_possible_rank;
        const worstRank = analysis.worst_possible_rank;

        let interpretation = '';

        if (score >= 75) {
            interpretation = `🍀 <strong>You got lucky!</strong> Your bracket was easier than ${Math.round(score)}% of other brackets. `;
            interpretation += `In most other brackets, you would have ranked worse than #${rank}. `;
            interpretation += `Your performance could have placed you as low as #${worstRank} in the toughest bracket.`;
        } else if (score >= 50) {
            interpretation = `📊 <strong>Average difficulty.</strong> Your bracket was about average compared to others. `;
            interpretation += `You would have had similar results in most other brackets, `;
            interpretation += `though you could have ranked as high as #${bestRank} or as low as #${worstRank}.`;
        } else if (score >= 25) {
            interpretation = `⚔️ <strong>Tough competition!</strong> Your bracket was harder than ${Math.round(100 - score)}% of other brackets. `;
            interpretation += `In an easier bracket, you could have achieved rank #${bestRank} with the same performance.`;
        } else {
            interpretation = `💪 <strong>Very challenging bracket!</strong> You faced one of the toughest brackets in your league. `;
            interpretation += `Your wave of ${analysis.wave.toLocaleString()} could have earned you rank #${bestRank} in an easier bracket. `;
            interpretation += `Your performance was stronger than your rank suggests.`;
        }

        return interpretation;
    }

    /**
     * Get difficulty CSS class from label
     */
    getDifficultyClass(label) {
        if (!label) return 'medium';
        const normalized = label.toLowerCase().replace(/\s+/g, '-');
        return normalized;
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Show empty state
     */
    showEmptyState(message = 'No bracket analysis available yet') {
        const container = document.getElementById('latestBracketAnalysis');
        container.innerHTML = this.getEmptyStateHTML(message);
    }

    /**
     * Get empty state HTML
     */
    getEmptyStateHTML(message = 'No bracket analysis available yet') {
        return `
            <div class="bracket-empty-state">
                <div class="empty-icon">🎯</div>
                <div class="empty-title">No Bracket Data Yet</div>
                <div class="empty-description">
                    ${message}<br>
                    Bracket difficulty analysis will appear here after tournaments are scraped (twice weekly).
                </div>
            </div>
        `;
    }

    /**
     * Show error state
     */
    showError(message) {
        const container = document.getElementById('latestBracketAnalysis');
        container.innerHTML = `
            <div class="bracket-empty-state">
                <div class="empty-icon">⚠️</div>
                <div class="empty-title">Error Loading Data</div>
                <div class="empty-description">${message}</div>
            </div>
        `;
    }

    /**
     * Show analysis details (placeholder for future modal/expansion)
     */
    showAnalysisDetails(analysisId) {
        const analysis = this.bracketData.find(a => a.id === analysisId);
        if (analysis) {
            console.log('Show details for:', analysis);
            // Future: Show detailed modal or expand inline
        }
    }
}

// Initialize global instance
window.bracketDifficulty = new BracketDifficultyManager();
