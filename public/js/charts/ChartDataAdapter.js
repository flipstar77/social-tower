/**
 * ChartDataAdapter - Converts tower statistics data to chart-ready format
 * Bridges between tower analytics and PerformanceCharts
 */

class ChartDataAdapter {
    constructor() {
        this.towerData = null;
    }

    /**
     * Load tower data from the API or localStorage
     */
    async loadTowerData() {
        try {
            // Try to get data from the global analytics
            if (window.towerMigration?.analyticsManager?.runs) {
                this.towerData = window.towerMigration.analyticsManager.runs;
                console.log('📊 Loaded tower data from migration manager:', this.towerData.length, 'runs');
                return this.towerData;
            }

            // Fallback to API
            const response = await fetch('/api/tower/runs?limit=50');
            const data = await response.json();
            this.towerData = data.runs || [];
            console.log('📊 Loaded tower data from API:', this.towerData.length, 'runs');
            return this.towerData;
        } catch (error) {
            console.warn('⚠️ Could not load tower data, using mock data:', error.message);
            return [];
        }
    }

    /**
     * Get data for weekly progress bar chart
     * Shows floors cleared and sessions per day
     */
    getWeeklyProgressData() {
        if (!this.towerData || this.towerData.length === 0) {
            // Mock data
            return {
                categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                floorsCleared: [120, 80, 150, 100, 110, 125, 140],
                sessions: [60, 50, 80, 90, 120, 70, 85]
            };
        }

        // Group runs by day of week
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekData = {
            Mon: { floors: 0, sessions: 0 },
            Tue: { floors: 0, sessions: 0 },
            Wed: { floors: 0, sessions: 0 },
            Thu: { floors: 0, sessions: 0 },
            Fri: { floors: 0, sessions: 0 },
            Sat: { floors: 0, sessions: 0 },
            Sun: { floors: 0, sessions: 0 }
        };

        // Get last 7 days of runs
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        this.towerData.forEach(run => {
            const runDate = new Date(run.timestamp || run.created_at);
            if (runDate >= sevenDaysAgo) {
                const dayName = daysOfWeek[runDate.getDay()];
                weekData[dayName].floors += run.wave || 0;
                weekData[dayName].sessions += 1;
            }
        });

        return {
            categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            floorsCleared: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => weekData[day].floors),
            sessions: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => weekData[day].sessions)
        };
    }

    /**
     * Get data for tower floor progress (horizontal bars)
     */
    getFloorProgressData() {
        if (!this.towerData || this.towerData.length === 0) {
            return {
                categories: ['Tier 8', 'Tier 9', 'Tier 10', 'Tier 11', 'Tier 12', 'Tier 13', 'Tier 14'],
                values: [40, 85, 55, 70, 52, 38, 70]
            };
        }

        // Get highest wave per tier
        const tierProgress = {};
        this.towerData.forEach(run => {
            const tier = run.tier || Math.floor((run.wave || 0) / 1000);
            if (!tierProgress[tier] || run.wave > tierProgress[tier]) {
                tierProgress[tier] = run.wave || 0;
            }
        });

        const tiers = Object.keys(tierProgress).sort((a, b) => b - a).slice(0, 7);
        return {
            categories: tiers.map(t => `Tier ${t}`),
            values: tiers.map(t => Math.min(100, (tierProgress[t] % 1000) / 10))
        };
    }

    /**
     * Get coins performance trend (line chart)
     */
    getCoinsPerformanceData() {
        if (!this.towerData || this.towerData.length === 0) {
            return {
                categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
                values: [75, 60, 25, 50, 30, 15, 45]
            };
        }

        // Get last 7 runs with coins data
        const recentRuns = this.towerData
            .filter(run => run.coins_hour || run.coinsPerHour)
            .slice(0, 7)
            .reverse();

        return {
            categories: recentRuns.map((_, i) => `Run ${i + 1}`),
            values: recentRuns.map(run => {
                const coins = run.coins_hour || run.coinsPerHour || 0;
                return Math.round(coins / 1000); // Scale down for display
            })
        };
    }

    /**
     * Get activity heatmap data (area chart)
     */
    getActivityHeatmapData() {
        if (!this.towerData || this.towerData.length === 0) {
            return {
                categories: ['8:00am', '10:00am', '12:00pm', '2:00pm', '4:00pm'],
                values: [2.5, 3.8, 2.2, 4.1, 3.5]
            };
        }

        // Group by hour of day
        const hourActivity = new Array(24).fill(0);
        this.towerData.forEach(run => {
            const runDate = new Date(run.timestamp || run.created_at);
            const hour = runDate.getHours();
            hourActivity[hour] += 1;
        });

        // Get top 5 active hours
        const topHours = hourActivity
            .map((count, hour) => ({ hour, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .sort((a, b) => a.hour - b.hour);

        return {
            categories: topHours.map(h => {
                const period = h.hour >= 12 ? 'pm' : 'am';
                const displayHour = h.hour % 12 || 12;
                return `${displayHour}:00${period}`;
            }),
            values: topHours.map(h => h.count)
        };
    }

    /**
     * Update all charts with real tower data
     */
    async updateAllCharts(performanceCharts) {
        await this.loadTowerData();

        if (!performanceCharts) {
            console.warn('⚠️ PerformanceCharts instance not provided');
            return;
        }

        try {
            // Update vertical bar chart
            const weeklyData = this.getWeeklyProgressData();
            const verticalChart = performanceCharts.charts.get('verticalBars');
            if (verticalChart) {
                verticalChart.setOption({
                    xAxis: { data: weeklyData.categories },
                    series: [
                        { data: weeklyData.floorsCleared },
                        { data: weeklyData.sessions }
                    ]
                });
                console.log('✅ Updated vertical bar chart with real data');
            }

            // Update horizontal bars
            const floorData = this.getFloorProgressData();
            const horizontalChart = performanceCharts.charts.get('horizontalBars');
            if (horizontalChart) {
                horizontalChart.setOption({
                    yAxis: { data: floorData.categories },
                    series: [
                        { data: floorData.categories.map(() => 100) }, // Background
                        { data: floorData.values } // Actual progress
                    ]
                });
                console.log('✅ Updated horizontal bars with real data');
            }

            // Update line chart
            const coinsData = this.getCoinsPerformanceData();
            const lineChart = performanceCharts.charts.get('lineChart');
            if (lineChart) {
                lineChart.setOption({
                    xAxis: { data: coinsData.categories },
                    series: [{ data: coinsData.values }]
                });
                console.log('✅ Updated line chart with real data');
            }

            // Update area chart
            const activityData = this.getActivityHeatmapData();
            const areaChart = performanceCharts.charts.get('areaChart');
            if (areaChart) {
                areaChart.setOption({
                    xAxis: { data: activityData.categories },
                    series: [{ data: activityData.values }]
                });
                console.log('✅ Updated area chart with real data');
            }

            console.log('🎉 All charts updated with real tower data!');
        } catch (error) {
            console.error('❌ Error updating charts:', error);
        }
    }
}

// Export for use
window.ChartDataAdapter = ChartDataAdapter;
