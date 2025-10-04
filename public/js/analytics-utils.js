// Tower Analytics Utilities
export class AnalyticsUtils {
    static formatNumber(num) {
        if (num == null || isNaN(num)) return '0';

        const absNum = Math.abs(num);

        if (absNum >= 1e12) return (num / 1e12).toFixed(1) + 'T';
        if (absNum >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (absNum >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (absNum >= 1e3) return (num / 1e3).toFixed(1) + 'K';

        return Math.round(num).toLocaleString('en-US'); // Force English locale for consistent formatting
    }

    static parseNumericValue(value) {
        if (typeof value === 'number') return value;
        if (!value || typeof value !== 'string') return 0;

        const cleanValue = value.replace(/[^\d,.]/g, '');
        const hasCommaAsDecimal = /^\d+,\d+$/.test(cleanValue);

        if (hasCommaAsDecimal) {
            return parseFloat(cleanValue.replace(',', '.'));
        }

        const multipliers = { 'K': 1e3, 'M': 1e6, 'B': 1e9, 'T': 1e12 };
        const lastChar = value.slice(-1).toUpperCase();

        if (multipliers[lastChar]) {
            const baseValue = parseFloat(value.slice(0, -1).replace(/[^\d.]/g, ''));
            return baseValue * multipliers[lastChar];
        }

        return parseFloat(cleanValue.replace(/,/g, '')) || 0;
    }

    static formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    static getTierBadge(tier) {
        const tierColors = {
            '1-5': '#4CAF50',
            '6-10': '#FF9800',
            '11-15': '#F44336',
            '16-20': '#9C27B0',
            '21+': '#FFD700'
        };

        let tierRange, color;
        if (tier <= 5) {
            tierRange = '1-5';
            color = tierColors['1-5'];
        } else if (tier <= 10) {
            tierRange = '6-10';
            color = tierColors['6-10'];
        } else if (tier <= 15) {
            tierRange = '11-15';
            color = tierColors['11-15'];
        } else if (tier <= 20) {
            tierRange = '16-20';
            color = tierColors['16-20'];
        } else {
            tierRange = '21+';
            color = tierColors['21+'];
        }

        return `<span class="analytics-tier-badge analytics-tier-${tierRange.replace('+', '-plus')}" style="background: ${color}">${tier}</span>`;
    }

    static getMetricLabel(metric) {
        const labels = {
            'tier': 'Tier',
            'wave': 'Wave',
            'coins': 'Coins Earned',
            'damage': 'Damage Dealt'
        };
        return labels[metric] || metric;
    }

    static calculateDaysSince(dateString) {
        if (!dateString) return 0;
        const startDate = new Date(dateString);
        const today = new Date();
        const diffTime = Math.abs(today - startDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    static showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `analytics-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    static filterRunsByTimeRange(runs, timeRange) {
        if (timeRange === 'all') return runs;

        const cutoffDate = new Date();
        const days = parseInt(timeRange.replace('d', ''));
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return runs.filter(run => {
            const runDate = new Date(run.timestamp);
            return runDate >= cutoffDate;
        });
    }

    static filterRunsBySession(runs, sessionName) {
        if (!sessionName) return runs;
        return runs.filter(run => run.session_name === sessionName);
    }

    static aggregateEnemyData(runs, selectedTypes) {
        const enemyTotals = {};

        runs.forEach(run => {
            selectedTypes.forEach(enemyType => {
                const key = `${enemyType.toLowerCase().replace(/\s+/g, '_')}_killed`;
                const value = this.parseNumericValue(run[key]);
                enemyTotals[enemyType] = (enemyTotals[enemyType] || 0) + value;
            });
        });

        return enemyTotals;
    }

    static aggregateDamageData(runs, selectedTypes) {
        const damageTotals = {};

        runs.forEach(run => {
            selectedTypes.forEach(damageType => {
                let key;
                switch (damageType) {
                    case 'Projectiles': key = 'projectiles_damage'; break;
                    case 'Orb Damage': key = 'orb_damage'; break;
                    case 'Thorn Damage': key = 'thorn_damage'; break;
                    case 'Land Mine': key = 'land_mine_damage'; break;
                    case 'Chain Lightning': key = 'chain_lightning_damage'; break;
                    case 'Black Hole': key = 'black_hole_damage'; break;
                    case 'Smart Missile': key = 'smart_missile_damage'; break;
                    case 'Death Ray': key = 'death_ray_damage'; break;
                    case 'Inner Land Mine': key = 'inner_land_mine_damage'; break;
                    case 'Death Wave': key = 'death_wave_damage'; break;
                    case 'Swamp': key = 'swamp_damage'; break;
                    default: return;
                }

                const value = this.parseNumericValue(run[key]);
                damageTotals[damageType] = (damageTotals[damageType] || 0) + value;
            });
        });

        return damageTotals;
    }
}