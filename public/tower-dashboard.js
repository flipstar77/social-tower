// Tower Dashboard JavaScript with Stats Presets
let globalStats = {};
let originalData = [];
let filteredData = [];
let charts = {};

// Stats presets configuration
const STATS_PRESETS = {
    essential: {
        name: 'Essential',
        stats: ['total_runs', 'max_tier', 'max_wave', 'max_damage'],
        description: 'Core performance metrics'
    },
    progress: {
        name: 'Progress',
        stats: ['avg_tier', 'avg_wave', 'tier_distribution', 'wave_progress'],
        description: 'Track improvement over time'
    },
    combat: {
        name: 'Combat',
        stats: ['max_damage', 'total_damage', 'damage_sources', 'enemies_killed'],
        description: 'Battle performance stats'
    },
    efficiency: {
        name: 'Efficiency',
        stats: ['coins_earned', 'waves_skipped', 'game_time', 'damage_per_minute'],
        description: 'Resource and time efficiency'
    },
    detailed: {
        name: 'Detailed',
        stats: ['enemy_types', 'death_causes', 'tier_wave_correlation', 'session_stats'],
        description: 'In-depth analytics'
    },
    all: {
        name: 'All Stats',
        stats: null, // null means show all available stats
        description: 'Complete statistics overview'
    }
};

// Current active preset
let currentPreset = 'essential';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initializing...');
    initializePresetControls();
    loadDashboard();
    setupEventListeners();
});

// Initialize preset controls
function initializePresetControls() {
    const filtersSection = document.querySelector('.filters-section .filters-grid');

    // Add preset selector to filters
    const presetControl = document.createElement('div');
    presetControl.className = 'filter-group';
    presetControl.innerHTML = `
        <label class="filter-label">Stats Preset</label>
        <select id="presetFilter" class="filter-select" onchange="applyPreset(this.value)">
            ${Object.entries(STATS_PRESETS).map(([key, preset]) => `
                <option value="${key}" ${key === currentPreset ? 'selected' : ''}>
                    ${preset.name}
                </option>
            `).join('')}
        </select>
        <small style="color: #B0B0C8; font-size: 11px; margin-top: 4px;">
            ${STATS_PRESETS[currentPreset].description}
        </small>
    `;

    // Insert at the beginning of filters
    filtersSection.insertBefore(presetControl, filtersSection.firstChild);
}

// Apply selected preset
function applyPreset(presetKey) {
    currentPreset = presetKey;
    const preset = STATS_PRESETS[presetKey];

    // Update description
    const presetControl = document.querySelector('#presetFilter').parentElement;
    const description = presetControl.querySelector('small');
    if (description) {
        description.textContent = preset.description;
    }

    // Refresh stats display with preset
    displayStats();

    // Store preference
    localStorage.setItem('towerDashboardPreset', presetKey);
}

// Setup event listeners
function setupEventListeners() {
    // Load saved preset preference
    const savedPreset = localStorage.getItem('towerDashboardPreset');
    if (savedPreset && STATS_PRESETS[savedPreset]) {
        currentPreset = savedPreset;
        document.getElementById('presetFilter').value = savedPreset;
    }
}

// Display stats based on current preset
function displayStats() {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;

    const preset = STATS_PRESETS[currentPreset];
    const allStats = calculateStats();

    // Determine which stats to show
    let statsToShow = [];

    if (preset.stats === null) {
        // Show all stats
        statsToShow = [
            { value: allStats.total_runs || 0, label: 'Total Runs', key: 'total_runs' },
            { value: allStats.max_tier || 0, label: 'Highest Tier', key: 'max_tier' },
            { value: formatNumber(allStats.max_wave || 0), label: 'Highest Wave', key: 'max_wave' },
            { value: formatNumber(allStats.max_damage || 0), label: 'Max Damage', key: 'max_damage' },
            { value: formatNumber(allStats.total_damage || 0), label: 'Total Damage', key: 'total_damage' },
            { value: allStats.avg_tier?.toFixed(1) || 0, label: 'Average Tier', key: 'avg_tier' },
            { value: formatNumber(allStats.avg_wave || 0), label: 'Average Wave', key: 'avg_wave' },
            { value: formatNumber(allStats.total_enemies || 0), label: 'Enemies Killed', key: 'enemies_killed' },
            { value: formatNumber(allStats.total_coins || 0), label: 'Coins Earned', key: 'coins_earned' },
            { value: formatNumber(allStats.waves_skipped || 0), label: 'Waves Skipped', key: 'waves_skipped' },
            { value: formatTime(allStats.total_game_time || 0), label: 'Total Play Time', key: 'game_time' },
            { value: allStats.unique_enemies || 0, label: 'Enemy Types', key: 'enemy_types' },
            { value: allStats.unique_death_causes || 0, label: 'Death Causes', key: 'death_causes' }
        ];
    } else {
        // Show only preset stats
        preset.stats.forEach(statKey => {
            switch(statKey) {
                case 'total_runs':
                    statsToShow.push({ value: allStats.total_runs || 0, label: 'Total Runs', key: statKey });
                    break;
                case 'max_tier':
                    statsToShow.push({ value: allStats.max_tier || 0, label: 'Highest Tier', key: statKey });
                    break;
                case 'max_wave':
                    statsToShow.push({ value: formatNumber(allStats.max_wave || 0), label: 'Highest Wave', key: statKey });
                    break;
                case 'max_damage':
                    statsToShow.push({ value: formatNumber(allStats.max_damage || 0), label: 'Max Damage', key: statKey });
                    break;
                case 'total_damage':
                    statsToShow.push({ value: formatNumber(allStats.total_damage || 0), label: 'Total Damage', key: statKey });
                    break;
                case 'avg_tier':
                    statsToShow.push({ value: allStats.avg_tier?.toFixed(1) || 0, label: 'Average Tier', key: statKey });
                    break;
                case 'avg_wave':
                    statsToShow.push({ value: formatNumber(allStats.avg_wave || 0), label: 'Average Wave', key: statKey });
                    break;
                case 'enemies_killed':
                    statsToShow.push({ value: formatNumber(allStats.total_enemies || 0), label: 'Enemies Killed', key: statKey });
                    break;
                case 'coins_earned':
                    statsToShow.push({ value: formatNumber(allStats.total_coins || 0), label: 'Coins Earned', key: statKey });
                    break;
                case 'waves_skipped':
                    statsToShow.push({ value: formatNumber(allStats.waves_skipped || 0), label: 'Waves Skipped', key: statKey });
                    break;
                case 'game_time':
                    statsToShow.push({ value: formatTime(allStats.total_game_time || 0), label: 'Total Play Time', key: statKey });
                    break;
                case 'damage_per_minute':
                    const dpm = allStats.total_game_time > 0 ?
                        Math.round(allStats.total_damage / (allStats.total_game_time / 60)) : 0;
                    statsToShow.push({ value: formatNumber(dpm), label: 'Damage/Minute', key: statKey });
                    break;
                case 'tier_distribution':
                    statsToShow.push({ value: `T${allStats.most_common_tier || 0}`, label: 'Most Common Tier', key: statKey });
                    break;
                case 'wave_progress':
                    const progress = allStats.avg_wave > 0 ?
                        `${Math.round((allStats.max_wave / allStats.avg_wave) * 100)}%` : '0%';
                    statsToShow.push({ value: progress, label: 'Wave Progress', key: statKey });
                    break;
                case 'enemy_types':
                    statsToShow.push({ value: allStats.unique_enemies || 0, label: 'Enemy Types', key: statKey });
                    break;
                case 'death_causes':
                    statsToShow.push({ value: allStats.unique_death_causes || 0, label: 'Death Causes', key: statKey });
                    break;
                case 'damage_sources':
                    statsToShow.push({ value: allStats.damage_sources || 0, label: 'Damage Sources', key: statKey });
                    break;
                case 'tier_wave_correlation':
                    const correlation = calculateCorrelation();
                    statsToShow.push({ value: correlation, label: 'Tier-Wave Correlation', key: statKey });
                    break;
                case 'session_stats':
                    statsToShow.push({ value: allStats.total_sessions || 0, label: 'Total Sessions', key: statKey });
                    break;
            }
        });
    }

    // Render stats cards
    statsGrid.innerHTML = statsToShow.map(stat => `
        <div class="stat-card" data-stat-key="${stat.key}">
            <div class="stat-value">${stat.value}</div>
            <div class="stat-label">${stat.label}</div>
        </div>
    `).join('');
}

// Calculate all statistics
function calculateStats() {
    if (!filteredData || filteredData.length === 0) {
        return {};
    }

    const stats = {
        total_runs: filteredData.length,
        max_tier: Math.max(...filteredData.map(d => d.tier || 0)),
        max_wave: Math.max(...filteredData.map(d => d.wave || 0)),
        max_damage: Math.max(...filteredData.map(d => d.damage_dealt || 0)),
        total_damage: filteredData.reduce((sum, d) => sum + (d.damage_dealt || 0), 0),
        avg_tier: filteredData.reduce((sum, d) => sum + (d.tier || 0), 0) / filteredData.length,
        avg_wave: filteredData.reduce((sum, d) => sum + (d.wave || 0), 0) / filteredData.length,
        total_enemies: filteredData.reduce((sum, d) => sum + (d.total_enemies || 0), 0),
        total_coins: filteredData.reduce((sum, d) => sum + (d.coins || 0), 0),
        waves_skipped: filteredData.reduce((sum, d) => sum + (d.waves_skipped || 0), 0),
        total_game_time: filteredData.reduce((sum, d) => sum + (parseGameTime(d.game_time) || 0), 0)
    };

    // Calculate unique counts
    stats.unique_enemies = [...new Set(filteredData.flatMap(d =>
        Object.keys(d.enemies_killed || {})
    ))].length;

    stats.unique_death_causes = [...new Set(filteredData.map(d =>
        d.killed_by
    ).filter(Boolean))].length;

    stats.damage_sources = [...new Set(filteredData.flatMap(d =>
        Object.keys(d.damage_sources || {})
    ))].length;

    // Find most common tier
    const tierCounts = {};
    filteredData.forEach(d => {
        tierCounts[d.tier] = (tierCounts[d.tier] || 0) + 1;
    });
    stats.most_common_tier = Object.entries(tierCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 0;

    // Count unique sessions
    stats.total_sessions = [...new Set(filteredData.map(d =>
        d.session_id || d.timestamp?.split(' ')[0]
    ))].length;

    return stats;
}

// Calculate correlation between tier and wave
function calculateCorrelation() {
    if (!filteredData || filteredData.length < 2) return 'N/A';

    const tiers = filteredData.map(d => d.tier || 0);
    const waves = filteredData.map(d => d.wave || 0);

    const n = tiers.length;
    const meanTier = tiers.reduce((a, b) => a + b) / n;
    const meanWave = waves.reduce((a, b) => a + b) / n;

    let numerator = 0;
    let denomTier = 0;
    let denomWave = 0;

    for (let i = 0; i < n; i++) {
        const tierDiff = tiers[i] - meanTier;
        const waveDiff = waves[i] - meanWave;
        numerator += tierDiff * waveDiff;
        denomTier += tierDiff * tierDiff;
        denomWave += waveDiff * waveDiff;
    }

    const correlation = numerator / Math.sqrt(denomTier * denomWave);
    return (correlation * 100).toFixed(0) + '%';
}

// Utility functions
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

function parseGameTime(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length === 3) {
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    } else if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
}

// Parse Tower real time format (e.g., "14h", "3d", "2h 30m")
function parseRealTime(timeStr) {
    if (!timeStr) return 0;

    // Handle formats like "14h", "3d", "2h 30m"
    let totalHours = 0;

    // Extract days
    const dayMatch = timeStr.match(/(\d+)d/);
    if (dayMatch) {
        totalHours += parseInt(dayMatch[1]) * 24;
    }

    // Extract hours
    const hourMatch = timeStr.match(/(\d+)h/);
    if (hourMatch) {
        totalHours += parseInt(hourMatch[1]);
    }

    // Extract minutes
    const minuteMatch = timeStr.match(/(\d+)m/);
    if (minuteMatch) {
        totalHours += parseInt(minuteMatch[1]) / 60;
    }

    return totalHours;
}

// Format real time for display
function formatRealTime(timeStr) {
    if (!timeStr) return 'N/A';

    // If it's already formatted nicely, return as is
    if (timeStr.includes('d') || timeStr.includes('h') || timeStr.includes('m')) {
        return timeStr;
    }

    // If it's a number, format it as hours
    const num = parseFloat(timeStr);
    if (!isNaN(num)) {
        if (num >= 24) {
            const days = Math.floor(num / 24);
            const hours = Math.floor(num % 24);
            return `${days}d ${hours}h`;
        } else if (num >= 1) {
            const hours = Math.floor(num);
            const minutes = Math.floor((num % 1) * 60);
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        } else {
            const minutes = Math.floor(num * 60);
            return `${minutes}m`;
        }
    }

    return timeStr;
}

// Calculate per hour rate
function calculatePerHour(value, timeStr) {
    if (!value || !timeStr) return 'N/A';

    const hours = parseRealTime(timeStr);
    if (hours <= 0) return 'N/A';

    // Parse value (handle formats like "217,87T", "315,26K")
    let numericValue = 0;
    if (typeof value === 'string') {
        const cleaned = value.replace(/[,$]/g, '');
        const lastChar = cleaned.slice(-1).toLowerCase();
        const number = parseFloat(cleaned.slice(0, -1));

        if (lastChar === 't') {
            numericValue = number * 1000000000000; // Trillion
        } else if (lastChar === 'b') {
            numericValue = number * 1000000000; // Billion
        } else if (lastChar === 'm') {
            numericValue = number * 1000000; // Million
        } else if (lastChar === 'k') {
            numericValue = number * 1000; // Thousand
        } else {
            numericValue = parseFloat(cleaned);
        }
    } else {
        numericValue = parseFloat(value);
    }

    const perHour = numericValue / hours;

    // Format the result
    if (perHour >= 1000000000000) {
        return (perHour / 1000000000000).toFixed(2) + 'T/h';
    } else if (perHour >= 1000000000) {
        return (perHour / 1000000000).toFixed(2) + 'B/h';
    } else if (perHour >= 1000000) {
        return (perHour / 1000000).toFixed(2) + 'M/h';
    } else if (perHour >= 1000) {
        return (perHour / 1000).toFixed(2) + 'K/h';
    } else {
        return perHour.toFixed(0) + '/h';
    }
}

// No mock data - always return empty array when no real data exists
function generateMockRunData() {
    console.log('🚫 Mock data generation disabled - returning empty array');
    return [];
}

// Load dashboard data
async function loadDashboard() {
    console.log('Loading dashboard data...');
    try {
        let data;

        // Try to fetch from unified API endpoint first
        try {
            console.log('Fetching runs from unified API endpoint...');
            const response = await fetch('/api/tower/runs');
            if (response.ok) {
                data = await response.json();
                console.log('Successfully loaded runs from unified API:', data);
            } else {
                throw new Error(`API returned ${response.status}`);
            }
        } catch (apiError) {
            console.warn('Failed to fetch from API endpoint:', apiError);

            // Check if user is authenticated with Discord as fallback
            if (window.discordAuth && window.discordAuth.isAuthenticated) {
                console.log('Falling back to Discord auth for user-specific runs...');
                try {
                    const userRuns = await window.discordAuth.getUserRuns();
                    data = { success: true, runs: userRuns };
                    console.log('Loaded user runs via Discord auth:', userRuns);
                } catch (authError) {
                    console.error('Error loading user runs via Discord auth:', authError);
                    // Return empty runs instead of mock data
                    console.log('No runs available');
                    data = { success: true, runs: [] };
                }
            } else {
                console.log('No authentication available, returning empty runs...');
                // Return empty runs instead of mock data
                data = { success: true, runs: [] };
            }
        }

        console.log('API response:', data);

        if (data.success && data.runs) {
            originalData = data.runs;
            filteredData = [...originalData];
            console.log(`Loaded ${originalData.length} runs`);

            populateFilters();
            displayStats();
            updateCharts();
            updateRunsTable();
        } else if (data.success && data.data) {
            // Fallback for different response structure
            originalData = data.data;
            filteredData = [...originalData];
            console.log(`Loaded ${originalData.length} runs (fallback)`);

            populateFilters();
            displayStats();
            updateCharts();
            updateRunsTable();
        } else {
            console.log('No data available');
            displayStats(); // Show empty state
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification('Failed to load dashboard data', 'error');
        displayStats(); // Show empty state
    }
}

// Populate filter dropdowns
function populateFilters() {
    // Populate session filter
    const sessions = [...new Set(originalData.map(d =>
        d.session_id || d.timestamp?.split(' ')[0]
    ))];

    const sessionFilter = document.getElementById('sessionFilter');
    if (sessionFilter) {
        sessionFilter.innerHTML = '<option value="">All Sessions</option>' +
            sessions.map(s => `<option value="${s}">${s}</option>`).join('');
    }
}

// Apply filters to data
function applyFilters() {
    const sessionFilter = document.getElementById('sessionFilter')?.value;
    const timeFilter = document.getElementById('timeFilter')?.value;

    filteredData = [...originalData];

    // Apply session filter
    if (sessionFilter) {
        filteredData = filteredData.filter(d =>
            (d.session_id || d.timestamp?.split(' ')[0]) === sessionFilter
        );
    }

    // Apply time filter
    if (timeFilter && timeFilter !== 'all') {
        const daysAgo = parseInt(timeFilter);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

        filteredData = filteredData.filter(d => {
            const runDate = new Date(d.timestamp);
            return runDate >= cutoffDate;
        });
    }

    // Refresh displays
    displayStats();
    updateCharts();
    updateRunsTable();
}

// Update charts
function updateCharts() {
    updateProgressChart();
    updateTierChart();
    updateDamageChart();
    updateEnemyChart();
}

// Update progress chart
function updateProgressChart() {
    const canvas = document.getElementById('progressChart');
    if (!canvas) return;

    const metricFilter = document.getElementById('metricFilter')?.value || 'tier';
    const ctx = canvas.getContext('2d');

    // Destroy existing chart if it exists
    if (charts.progress) {
        charts.progress.destroy();
        charts.progress = null;
    }

    // Handle empty data case
    if (!filteredData || filteredData.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#B0B0C8';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Prepare data based on selected metric
    const labels = filteredData.map((d, i) => `Run ${i + 1}`);
    let data = [];
    let label = '';

    switch(metricFilter) {
        case 'tier':
            data = filteredData.map(d => d.tier || 0);
            label = 'Tier Progress';
            break;
        case 'wave':
            data = filteredData.map(d => d.wave || 0);
            label = 'Wave Progress';
            break;
        case 'damage_dealt':
            data = filteredData.map(d => d.damage_dealt || 0);
            label = 'Damage Dealt';
            break;
        case 'total_enemies':
            data = filteredData.map(d => d.total_enemies || 0);
            label = 'Enemies Killed';
            break;
    }

    // Create new chart
    charts.progress = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: '#FFD700',
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#E6E6FA' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#B0B0C8' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    ticks: { color: '#B0B0C8' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}

// Update tier distribution chart
function updateTierChart() {
    const canvas = document.getElementById('tierChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Destroy existing chart if it exists
    if (charts.tier) {
        charts.tier.destroy();
        charts.tier = null;
    }

    // Handle empty data case
    if (!filteredData || filteredData.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#B0B0C8';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Calculate tier distribution
    const tierCounts = {};
    filteredData.forEach(d => {
        const tierRange = getTierRange(d.tier);
        tierCounts[tierRange] = (tierCounts[tierRange] || 0) + 1;
    });

    // Create new chart
    charts.tier = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(tierCounts),
            datasets: [{
                data: Object.values(tierCounts),
                backgroundColor: [
                    '#4CAF50',
                    '#FF9800',
                    '#F44336',
                    '#9C27B0',
                    '#FFD700'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#E6E6FA' }
                }
            }
        }
    });
}

// Update damage sources chart
function updateDamageChart() {
    const canvas = document.getElementById('damageChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Destroy existing chart if it exists
    if (charts.damage) {
        charts.damage.destroy();
        charts.damage = null;
    }

    // Handle empty data case
    if (!filteredData || filteredData.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#B0B0C8';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Aggregate damage sources
    const damageSources = {};
    filteredData.forEach(d => {
        if (d.damage_sources) {
            Object.entries(d.damage_sources).forEach(([source, amount]) => {
                damageSources[source] = (damageSources[source] || 0) + amount;
            });
        }
    });

    // Sort and take top 10
    const sorted = Object.entries(damageSources)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    // If no damage sources found, show message
    if (sorted.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#B0B0C8';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No damage data available', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Create new chart
    charts.damage = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(([source]) => source),
            datasets: [{
                label: 'Total Damage',
                data: sorted.map(([, amount]) => amount),
                backgroundColor: 'rgba(255, 215, 0, 0.6)',
                borderColor: '#FFD700',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#E6E6FA' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#B0B0C8' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    ticks: { color: '#B0B0C8' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}

// Update enemy types chart
function updateEnemyChart() {
    const canvas = document.getElementById('enemyChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Destroy existing chart if it exists
    if (charts.enemy) {
        charts.enemy.destroy();
        charts.enemy = null;
    }

    // Handle empty data case
    if (!filteredData || filteredData.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#B0B0C8';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Aggregate enemy kills
    const enemyKills = {};
    filteredData.forEach(d => {
        if (d.enemies_killed) {
            Object.entries(d.enemies_killed).forEach(([enemy, count]) => {
                enemyKills[enemy] = (enemyKills[enemy] || 0) + count;
            });
        }
    });

    // Sort and take top 10
    const sorted = Object.entries(enemyKills)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    // If no enemy data found, show message
    if (sorted.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#B0B0C8';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No enemy data available', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Create new chart
    charts.enemy = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(([enemy]) => enemy),
            datasets: [{
                label: 'Enemies Defeated',
                data: sorted.map(([, count]) => count),
                backgroundColor: 'rgba(244, 67, 54, 0.6)',
                borderColor: '#F44336',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // This makes the bar chart horizontal
            plugins: {
                legend: {
                    labels: { color: '#E6E6FA' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#B0B0C8' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    ticks: { color: '#B0B0C8' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}

// Update runs table
function updateRunsTable() {
    const tbody = document.getElementById('analyticsRunsTableBody');
    if (!tbody) return;

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="loading">No runs found</td></tr>';
        return;
    }

    // Sort by timestamp (most recent first) - handle both timestamp formats
    const sortedData = [...filteredData].sort((a, b) => {
        const timeA = new Date(a.timestamp || a.submitted_at || a.created_at || 0);
        const timeB = new Date(b.timestamp || b.submitted_at || b.created_at || 0);

        console.log('Sort debug:', {
            runA: { tier: a.tier, timestamp: a.timestamp, submitted_at: a.submitted_at, timeA: timeA.toISOString() },
            runB: { tier: b.tier, timestamp: b.timestamp, submitted_at: b.submitted_at, timeB: timeB.toISOString() }
        });

        return timeB - timeA;
    });

    // Take first 20 runs
    const recentRuns = sortedData.slice(0, 20);

    tbody.innerHTML = recentRuns.map(run => {
        // Handle field name differences between SQLite and Discord runs
        const timestamp = run.timestamp || run.submitted_at || run.created_at;
        const coins = run.coins || run.coins_earned;
        const totalEnemies = run.total_enemies || (run.raw_data && run.raw_data.totalEnemies);
        const gameTime = run.game_time || (run.raw_data && run.raw_data.gameTime);
        const realTime = run.real_time || (run.raw_data && run.raw_data.realTime);
        const killedBy = run.killed_by || (run.raw_data && run.raw_data.killedBy);
        const cellsEarned = run.cells_earned || (run.raw_data && run.raw_data.cellsEarned);

        // Calculate per hour rates
        const coinsPerHour = calculatePerHour(coins, realTime || gameTime);
        const cellsPerHour = calculatePerHour(cellsEarned, realTime || gameTime);
        const formattedRealTime = formatRealTime(realTime || gameTime);

        console.log('Run timestamp debug:', {
            timestamp,
            tier: run.tier,
            wave: run.wave,
            original_timestamp: run.timestamp,
            original_submitted_at: run.submitted_at
        });

        return `
            <tr>
                <td>${formatDate(timestamp)}</td>
                <td><span class="tier-badge ${getTierClass(run.tier)}">${run.tier}</span></td>
                <td>${run.wave || 0}</td>
                <td>${killedBy || 'N/A'}</td>
                <td>${formattedRealTime}</td>
                <td>${coinsPerHour}</td>
                <td>${cellsPerHour}</td>
                <td>${formatNumber(run.damage_dealt || 0)}</td>
                <td>${formatNumber(totalEnemies || 0)}</td>
                <td><button class="run-details-btn" onclick="showRunDetails(${run.id || run.tier})">View</button></td>
            </tr>
        `;
    }).join('');
}

// Get tier range for grouping
function getTierRange(tier) {
    if (tier <= 5) return 'Tier 1-5';
    if (tier <= 10) return 'Tier 6-10';
    if (tier <= 15) return 'Tier 11-15';
    if (tier <= 20) return 'Tier 16-20';
    return 'Tier 21+';
}

// Get tier class for styling
function getTierClass(tier) {
    if (tier <= 5) return 'tier-1-5';
    if (tier <= 10) return 'tier-6-10';
    if (tier <= 15) return 'tier-11-15';
    if (tier <= 20) return 'tier-16-20';
    return 'tier-21-plus';
}

// Format date for display
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';

    // Handle different timestamp formats
    let date;
    if (timestamp instanceof Date) {
        date = timestamp;
    } else if (typeof timestamp === 'string') {
        // Handle ISO strings, SQLite datetime strings, etc.
        date = new Date(timestamp);
    } else {
        date = new Date(timestamp);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
        console.warn('Invalid date:', timestamp);
        return 'N/A';
    }

    // Format as DD/MM/YYYY HH:MM
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// File upload handler
async function uploadFile(input) {
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('statsFile', file);

    try {
        const response = await fetch('http://localhost:6078/api/tower/upload-stats', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showNotification('File uploaded successfully!', 'success');
            loadDashboard(); // Reload data
        } else {
            showNotification(result.message || 'Upload failed', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showNotification('Failed to upload file', 'error');
    }

    // Reset input
    input.value = '';
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Export for global access
window.loadDashboard = loadDashboard;
window.uploadFile = uploadFile;
window.applyFilters = applyFilters;
window.updateProgressChart = updateProgressChart;
window.applyPreset = applyPreset;