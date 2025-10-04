// YouTube RSS Feed Manager - Modular Component
class YouTubeRSSManager {
    constructor() {
        this.channels = [
            {
                name: 'GreenyTower',
                handle: '@GreenyTower',
                channelId: 'UCdgfxA8CS_OzCZo-bGJCQYA', // Extract from URL
                rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCdgfxA8CS_OzCZo-bGJCQYA',
                color: '#4CAF50'
            },
            {
                name: 'CrowbarZero',
                handle: '@crowbarzero',
                channelId: 'UCcrowbarzero123', // You'll need to extract these
                rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCcrowbarzero123',
                color: '#FF5722'
            },
            {
                name: 'AllClouded',
                handle: '@AllClouded',
                channelId: 'UCAllClouded123',
                rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCAllClouded123',
                color: '#2196F3'
            },
            {
                name: 'SpartanTheTower',
                handle: '@SpartanTheTower',
                channelId: 'UCSpartanTheTower123',
                rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCSpartanTheTower123',
                color: '#9C27B0'
            },
            {
                name: 'Taggzrd',
                handle: '@taggzrd',
                channelId: 'UCtaggzrd123',
                rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCtaggzrd123',
                color: '#FF9800'
            },
            {
                name: 'JPlays1',
                handle: '@JPlays1',
                channelId: 'UCJPlays1123',
                rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCJPlays1123',
                color: '#795548'
            },
            {
                name: 'JeffP978',
                handle: '@JeffP978',
                channelId: 'UCJeffP978123',
                rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCJeffP978123',
                color: '#607D8B'
            },
            {
                name: 'EthanDX',
                handle: '@EthanDX',
                channelId: 'UCEthanDX123',
                rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCEthanDX123',
                color: '#E91E63'
            },
            {
                name: 'FungulusMaximus',
                handle: '@fungulusmaximus',
                channelId: 'UCfungulusmaximus123',
                rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCfungulusmaximus123',
                color: '#8BC34A'
            },
            {
                name: 'TequilaMan7',
                handle: '@tequilaman7',
                channelId: 'UCtequilaman7123',
                rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCtequilaman7123',
                color: '#FFC107'
            },
            {
                name: 'DizzyProjectRend',
                handle: '@dizzy-project-rend',
                channelId: 'UCdizzy-project-rend123',
                rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCdizzy-project-rend123',
                color: '#00BCD4'
            },
            {
                name: 'Noobodytest',
                handle: '@Noobodytest',
                channelId: 'UCNoobodytest123',
                rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCNoobodytest123',
                color: '#673AB7'
            },
            {
                name: 'PrimosTower',
                handle: '@PrimosTower',
                channelId: 'UCPrimosTower123',
                rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCPrimosTower123',
                color: '#3F51B5'
            },
            {
                name: 'jamn4evr',
                handle: '@jamn4evr',
                channelId: 'UCvoytBFsFuIzBgtUrNdYKpw',
                rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCvoytBFsFuIzBgtUrNdYKpw',
                color: '#FF6B35'
            }
        ];

        this.videos = [];
        this.filteredVideos = [];
        this.lastUpdated = null;
        this.updateInterval = 30 * 60 * 1000; // 30 minutes
        this.cache = new Map();
        this.maxVideos = 50; // Limit for performance
        this.selectedChannels = new Set();
        this.currentSort = 'newest';

        this.init();
    }

    init() {
        console.log('YouTube RSS Manager initialized with', this.channels.length, 'channels:', this.channels.map(c => c.name));
        console.log('jamn4evr channel present:', this.channels.find(c => c.name === 'jamn4evr'));
        this.loadCachedData();
        this.setupPeriodicUpdate();
        this.setupFilterEvents();
        // Load real data from backend API
        this.loadRealData();
    }

    // Mock data for demonstration (replace with real RSS parsing when CORS is handled)
    loadMockData() {
        const mockVideos = [
            {
                id: 'dQw4w9WgXcQ',
                title: 'Tower Defense Wave 10,000+ Guide',
                channel: 'GreenyTower',
                channelColor: '#4CAF50',
                publishDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
                duration: '15:32',
                views: '25.3K',
                description: 'Ultimate guide to reaching wave 10,000 in The Tower'
            },
            {
                id: 'abc123def456',
                title: 'Best Damage Build for Tier 15',
                channel: 'SpartanTheTower',
                channelColor: '#9C27B0',
                publishDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
                thumbnail: 'https://img.youtube.com/vi/abc123def456/maxresdefault.jpg',
                duration: '12:45',
                views: '18.7K',
                description: 'Optimal damage build configuration for tier 15 gameplay'
            },
            {
                id: 'xyz789uvw012',
                title: 'New Meta Strategy Analysis',
                channel: 'AllClouded',
                channelColor: '#2196F3',
                publishDate: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
                thumbnail: 'https://img.youtube.com/vi/xyz789uvw012/maxresdefault.jpg',
                duration: '22:18',
                views: '31.2K',
                description: 'Deep dive into the latest meta strategies for competitive play'
            },
            {
                id: 'lmn456opq789',
                title: 'Elite Enemy Counter Guide',
                channel: 'CrowbarZero',
                channelColor: '#FF5722',
                publishDate: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
                thumbnail: 'https://img.youtube.com/vi/lmn456opq789/maxresdefault.jpg',
                duration: '18:27',
                views: '12.9K',
                description: 'How to effectively counter all elite enemy types'
            },
            {
                id: 'rst012tuv345',
                title: 'Speed Run Tutorial - Sub 2 Hour',
                channel: 'JPlays1',
                channelColor: '#795548',
                publishDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
                thumbnail: 'https://img.youtube.com/vi/rst012tuv345/maxresdefault.jpg',
                duration: '35:42',
                views: '45.1K',
                description: 'Complete speed run tutorial for sub-2 hour completion'
            },
            {
                id: 'hij678klm901',
                title: 'Economy Optimization Tips',
                channel: 'Taggzrd',
                channelColor: '#FF9800',
                publishDate: new Date(Date.now() - 16 * 60 * 60 * 1000), // 16 hours ago
                thumbnail: 'https://img.youtube.com/vi/hij678klm901/maxresdefault.jpg',
                duration: '28:15',
                views: '22.4K',
                description: 'Maximize your income and resource management'
            },
            {
                id: 'nop234qrs567',
                title: 'Module Synergy Breakdown',
                channel: 'EthanDX',
                channelColor: '#E91E63',
                publishDate: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago
                thumbnail: 'https://img.youtube.com/vi/nop234qrs567/maxresdefault.jpg',
                duration: '19:33',
                views: '16.8K',
                description: 'Understanding module combinations for maximum efficiency'
            },
            {
                id: 'wxy890abc123',
                title: 'Endgame Content Strategy',
                channel: 'PrimosTower',
                channelColor: '#3F51B5',
                publishDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                thumbnail: 'https://img.youtube.com/vi/wxy890abc123/maxresdefault.jpg',
                duration: '41:52',
                views: '38.6K',
                description: 'Complete guide to endgame content and progression'
            }
        ];

        this.videos = mockVideos.sort((a, b) => b.publishDate - a.publishDate);
        this.lastUpdated = new Date();
        this.saveToCache();
        this.updateVideoCarousel();
    }

    // Real RSS parsing (for when CORS is handled server-side)
    async fetchRSSFeed(channel) {
        try {
            // Note: This would need a CORS proxy or server-side handling
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(channel.rssUrl)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data.contents, 'text/xml');

            const entries = xmlDoc.getElementsByTagName('entry');
            const videos = [];

            for (let i = 0; i < Math.min(entries.length, 10); i++) {
                const entry = entries[i];
                const video = this.parseVideoEntry(entry, channel);
                if (video) videos.push(video);
            }

            return videos;
        } catch (error) {
            console.error(`Error fetching RSS for ${channel.name}:`, error);
            return [];
        }
    }

    parseVideoEntry(entry, channel) {
        try {
            const title = entry.getElementsByTagName('title')[0]?.textContent;
            const link = entry.getElementsByTagName('link')[0]?.getAttribute('href');
            const published = entry.getElementsByTagName('published')[0]?.textContent;
            const description = entry.getElementsByTagName('media:description')[0]?.textContent;

            // Extract video ID from YouTube URL
            const videoId = this.extractVideoId(link);

            if (!videoId) return null;

            return {
                id: videoId,
                title: title,
                channel: channel.name,
                channelColor: channel.color,
                publishDate: new Date(published),
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                description: description || '',
                url: link
            };
        } catch (error) {
            console.error('Error parsing video entry:', error);
            return null;
        }
    }

    extractVideoId(url) {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        return match ? match[1] : null;
    }

    async updateAllFeeds() {
        console.log('Updating YouTube feeds...');
        const allVideos = [];

        for (const channel of this.channels) {
            const videos = await this.fetchRSSFeed(channel);
            allVideos.push(...videos);
        }

        // Sort by publish date (newest first)
        this.videos = allVideos
            .sort((a, b) => b.publishDate - a.publishDate)
            .slice(0, this.maxVideos);

        this.lastUpdated = new Date();
        this.saveToCache();
        this.updateVideoCarousel();
        this.showUpdateNotification();
    }

    updateVideoCarousel() {
        // Find the YouTube grid
        const grid = document.querySelector('.youtube-grid');
        if (!grid) return;

        // Apply filters
        this.applyFilters();
        this.populateChannelFilter();

        // Clear existing content
        grid.innerHTML = '';

        // Create tiles container
        const tilesContainer = document.createElement('div');
        tilesContainer.className = 'tiles-container';

        // Duplicate videos for seamless carousel animation
        const videosForCarousel = [...this.filteredVideos, ...this.filteredVideos];

        // Create video tiles
        videosForCarousel.forEach((video, index) => {
            const tile = this.createVideoTile(video);
            tile.style.animationDelay = `${(index % this.filteredVideos.length) * 0.1}s`;
            tilesContainer.appendChild(tile);
        });

        grid.appendChild(tilesContainer);
    }

    createYouTubeSection() {
        const contentHub = document.getElementById('contentHub');
        if (!contentHub) return;

        const container = contentHub.querySelector('.content-hub-container');
        if (!container) return;

        const youtubeSection = document.createElement('div');
        youtubeSection.className = 'content-section youtube-videos-section';
        youtubeSection.innerHTML = `
            <div class="section-header">
                <h2 class="content-title">Latest Tower Videos</h2>
                <div class="update-info">
                    <span class="last-updated">Updated: <span class="timestamp">Never</span></span>
                    <button class="refresh-btn" title="Refresh feeds">
                        <div class="refresh-icon"></div>
                    </button>
                </div>
                <div class="chevron-right"></div>
            </div>
            <div class="content-grid youtube-grid auto-rotate">
                <!-- Videos will be populated here -->
            </div>
        `;

        // Insert as the first section
        container.insertBefore(youtubeSection, container.firstChild);

        // Add refresh button functionality
        const refreshBtn = youtubeSection.querySelector('.refresh-btn');
        refreshBtn.addEventListener('click', () => {
            this.manualRefresh();
        });
    }

    createVideoTile(video) {
        const tile = document.createElement('div');
        tile.className = 'tile-component video-tile';
        tile.dataset.videoId = video.id;
        tile.dataset.tileId = video.id;

        const timeAgo = this.getTimeAgo(video.publishDate);

        tile.innerHTML = `
            <div class="tile-image video-thumbnail" style="background-image: url('${video.thumbnail}');">
                <div class="video-duration">${video.duration || ''}</div>
                <div class="channel-badge" style="background-color: ${video.channelColor};">
                    ${video.channel}
                </div>
                <div class="play-overlay">
                    <div class="play-button-large"></div>
                </div>
            </div>
            <div class="tile-info video-info">
                <div class="control-bar">
                    <div class="controls">
                        <button class="control-btn play-btn" title="Watch on YouTube"><span></span></button>
                        <button class="control-btn transcript-btn" title="View Transcript" data-video-id="${video.id}">📝</button>
                        <button class="control-btn add-btn" title="Add to Watch Later"><span class="plus-icon"></span></button>
                        <button class="control-btn thumbs-up" title="Like"><span></span></button>
                        <button class="control-btn share-btn" title="Share"><span></span></button>
                    </div>
                    <button class="control-btn reveal-btn"><span class="chevron-down"></span></button>
                </div>
                <div class="show-info">
                    <span class="video-views">${video.views || 'New'}</span>
                    <span class="video-time">${timeAgo}</span>
                    <span class="channel-name">${video.channel}</span>
                </div>
                <div class="video-title">
                    ${video.title}
                </div>
                <div class="video-description">
                    ${this.truncateText(video.description, 120)}
                </div>
            </div>
        `;

        // Add click handler to play video
        tile.addEventListener('click', (e) => {
            if (!e.target.closest('.control-btn')) {
                this.playVideo(video);
            }
        });

        // Add transcript button handler
        const transcriptBtn = tile.querySelector('.transcript-btn');
        if (transcriptBtn) {
            transcriptBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.fetchTranscript(video.id, video.title);
            });
        }

        return tile;
    }

    playVideo(video) {
        const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
        window.open(videoUrl, '_blank');
    }

    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text || '';
        return text.substring(0, maxLength) + '...';
    }

    updateTimestamp(section) {
        const timestamp = section.querySelector('.timestamp');
        if (timestamp && this.lastUpdated) {
            timestamp.textContent = this.lastUpdated.toLocaleTimeString();
        }
    }

    async manualRefresh() {
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.classList.add('refreshing');
        }

        try {
            await this.loadRealData(true); // Force refresh
            this.showNotification('YouTube feeds updated!');
        } catch (error) {
            console.error('Error refreshing:', error);
            this.showNotification('Error updating feeds');
        }

        if (refreshBtn) {
            refreshBtn.classList.remove('refreshing');
        }
    }

    // Load real data from backend API
    async loadRealData(forceRefresh = false) {
        try {
            const endpoint = forceRefresh ? '/api/videos/refresh' : '/api/videos';
            const method = forceRefresh ? 'POST' : 'GET';

            const response = await fetch(`http://localhost:6078${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.videos) {
                this.videos = data.videos.map(video => ({
                    ...video,
                    publishDate: new Date(video.publishDate)
                }));

                this.lastUpdated = data.lastUpdate ? new Date(data.lastUpdate) : new Date();
                this.saveToCache();
                this.updateVideoCarousel();

                console.log(`✅ Loaded ${this.videos.length} real videos from backend`);
            } else {
                throw new Error(data.error || 'Failed to load videos');
            }
        } catch (error) {
            console.error('❌ Error loading real data:', error);
            console.log('🔄 Falling back to mock data...');
            this.loadMockData(); // Fallback to mock data
        }
    }

    setupPeriodicUpdate() {
        // Check for updates every 5 minutes
        setInterval(() => {
            this.loadRealData();
        }, 5 * 60 * 1000);
    }

    loadCachedData() {
        try {
            const cached = localStorage.getItem('youtube_videos');
            if (cached) {
                const data = JSON.parse(cached);
                this.videos = data.videos || [];
                this.lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : null;
            }
        } catch (error) {
            console.error('Error loading cached data:', error);
        }
    }

    saveToCache() {
        try {
            const data = {
                videos: this.videos,
                lastUpdated: this.lastUpdated
            };
            localStorage.setItem('youtube_videos', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to cache:', error);
        }
    }

    showUpdateNotification() {
        this.showNotification(`Updated ${this.videos.length} videos from ${this.channels.length} channels`);
    }

    setupFilterEvents() {
        // Setup filter event listeners
        document.addEventListener('DOMContentLoaded', () => {
            this.bindFilterEvents();
        });

        // If DOM already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindFilterEvents());
        } else {
            this.bindFilterEvents();
        }
    }

    bindFilterEvents() {
        console.log('🔧 YouTube: Binding filter events...');

        const channelFilterToggle = document.getElementById('channelFilterToggle');
        const channelFilterDropdown = document.getElementById('channelFilterDropdown');
        const selectAllCheckbox = document.getElementById('selectAll');
        const sortFilter = document.getElementById('sortFilter');
        const refreshBtn = document.getElementById('refreshVideos');

        console.log('🔧 YouTube elements found:', {
            channelFilterToggle: !!channelFilterToggle,
            channelFilterDropdown: !!channelFilterDropdown,
            selectAllCheckbox: !!selectAllCheckbox,
            sortFilter: !!sortFilter,
            refreshBtn: !!refreshBtn
        });

        // Remove existing listeners by cloning elements
        if (channelFilterToggle && !channelFilterToggle.hasAttribute('data-youtube-bound')) {
            channelFilterToggle.setAttribute('data-youtube-bound', 'true');
            channelFilterToggle.addEventListener('click', (e) => {
                console.log('🔧 YouTube: Channel filter toggle clicked');
                e.stopPropagation();
                channelFilterToggle.classList.toggle('open');
                if (channelFilterDropdown) {
                    channelFilterDropdown.classList.toggle('open');
                }
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.channel-filter-container')) {
                if (channelFilterToggle) channelFilterToggle.classList.remove('open');
                if (channelFilterDropdown) channelFilterDropdown.classList.remove('open');
            }
        });

        // Select All functionality
        if (selectAllCheckbox && !selectAllCheckbox.hasAttribute('data-youtube-bound')) {
            selectAllCheckbox.setAttribute('data-youtube-bound', 'true');
            selectAllCheckbox.addEventListener('change', (e) => {
                console.log('🔧 YouTube: Select All checkbox changed');
                e.stopPropagation();
                const isChecked = e.target.checked;
                const channelCheckboxes = document.querySelectorAll('#channelCheckboxes input[type="checkbox"]');

                channelCheckboxes.forEach(checkbox => {
                    checkbox.checked = isChecked;
                });

                if (isChecked) {
                    this.selectedChannels.clear();
                } else {
                    this.selectedChannels.clear();
                }

                this.updateChannelSelectionDisplay();
                this.updateVideoCarousel();
            });
        }

        if (sortFilter && !sortFilter.hasAttribute('data-youtube-bound')) {
            sortFilter.setAttribute('data-youtube-bound', 'true');
            sortFilter.addEventListener('change', (e) => {
                console.log('🔧 YouTube: Sort filter changed');
                this.currentSort = e.target.value;
                this.updateVideoCarousel();
            });
        }

        if (refreshBtn && !refreshBtn.hasAttribute('data-youtube-bound')) {
            refreshBtn.setAttribute('data-youtube-bound', 'true');
            refreshBtn.addEventListener('click', () => {
                console.log('🔧 YouTube: Refresh button clicked');
                this.manualRefresh();
            });
        }
    }

    populateChannelFilter() {
        console.log('🔧 YouTube: Populating channel filter...');
        const channelFilterChips = document.getElementById('channelFilterChips');
        if (!channelFilterChips) {
            console.log('❌ YouTube: channelFilterChips element not found!');
            console.log('Available elements:', document.querySelectorAll('[id*="channel"], [id*="Filter"]'));
            return;
        }

        // Use ALL configured channels, not just ones with videos
        const uniqueChannels = this.channels.map(c => c.name).sort();

        // Remember current chip states before clearing
        const currentChipStates = {};
        const existingChips = channelFilterChips.querySelectorAll('.filter-chip');
        existingChips.forEach(chip => {
            currentChipStates[chip.dataset.channel] = chip.classList.contains('active');
        });

        console.log('🔧 Current chip states:', currentChipStates);

        // Clear existing chips
        channelFilterChips.innerHTML = '';

        // Add channel filter chips
        uniqueChannels.forEach(channel => {
            const chip = document.createElement('div');
            chip.className = 'filter-chip';
            chip.dataset.channel = channel;
            chip.textContent = channel;

            // Restore previous state or default to active
            const shouldBeActive = currentChipStates.hasOwnProperty(channel) ?
                currentChipStates[channel] : true;

            if (shouldBeActive) {
                chip.classList.add('active');
            }

            console.log('🔧 Channel', channel, 'is', shouldBeActive ? 'active' : 'inactive');

            // Add click handler
            chip.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleChannelChipClick(channel, chip);
            });

            channelFilterChips.appendChild(chip);
        });
    }

    handleChannelChipClick(channel, chipElement) {
        console.log('🔧 YouTube: Channel chip clicked:', channel);

        if (chipElement.classList.contains('active')) {
            // Deactivating chip - remove from filter
            chipElement.classList.remove('active');
            console.log('🔧 Deactivated channel:', channel);
        } else {
            // Activating chip - add to filter
            chipElement.classList.add('active');
            console.log('🔧 Activated channel:', channel);
        }

        // Check if any chips are still active
        const allChips = document.querySelectorAll('#channelFilterChips .filter-chip');
        const activeChips = document.querySelectorAll('#channelFilterChips .filter-chip.active');

        console.log('🔧 Active chips:', activeChips.length, 'of', allChips.length);

        // If no chips are active, activate all (show everything)
        if (activeChips.length === 0) {
            console.log('🔧 No chips active, showing all channels');
            allChips.forEach(chip => chip.classList.add('active'));
        }

        this.updateVideoCarousel();
    }

    updateChannelSelectionDisplay() {
        const selectedCountSpan = document.querySelector('.selected-count');
        if (!selectedCountSpan) return;

        const totalChannels = document.querySelectorAll('#channelCheckboxes input[type="checkbox"]').length;

        if (this.selectedChannels.size === 0 || this.selectedChannels.size === totalChannels) {
            selectedCountSpan.textContent = 'All Channels';
        } else if (this.selectedChannels.size === 1) {
            selectedCountSpan.textContent = [...this.selectedChannels][0];
        } else {
            selectedCountSpan.textContent = `${this.selectedChannels.size} Channels`;
        }
    }

    applyFilters() {
        console.log('🔧 YouTube: Applying filters...');
        let filtered = [...this.videos];
        console.log('🔧 Starting with', filtered.length, 'videos');

        // Apply channel filter - show only active channels
        const activeChips = document.querySelectorAll('#channelFilterChips .filter-chip.active');
        console.log('🔧 Found', activeChips.length, 'active channel chips');

        if (activeChips.length > 0) {
            const activeChannels = Array.from(activeChips).map(chip => chip.dataset.channel);
            console.log('🔧 Active channels:', activeChannels);

            const originalCount = filtered.length;
            filtered = filtered.filter(video => activeChannels.includes(video.channel));
            console.log('🔧 Filtered from', originalCount, 'to', filtered.length, 'videos');
        }

        // Apply sorting
        switch (this.currentSort) {
            case 'newest':
                filtered.sort((a, b) => b.publishDate - a.publishDate);
                break;
            case 'oldest':
                filtered.sort((a, b) => a.publishDate - b.publishDate);
                break;
            case 'channel':
                filtered.sort((a, b) => a.channel.localeCompare(b.channel));
                break;
        }

        this.filteredVideos = filtered;
        console.log('🔧 Final filtered videos:', this.filteredVideos.length);
    }

    async fetchTranscript(videoId, videoTitle) {
        try {
            console.log(`📝 Fetching transcript for video: ${videoId}`);

            // Show loading state
            this.showNotification('Fetching transcript...');

            const response = await fetch(`http://localhost:6078/api/transcript/${videoId}`);
            const data = await response.json();

            if (data.success) {
                this.displayTranscript(videoId, videoTitle, data.transcript);
                this.showNotification('Transcript loaded successfully!');
            } else {
                this.showNotification(`No transcript available: ${data.error}`);
            }
        } catch (error) {
            console.error('❌ Error fetching transcript:', error);
            this.showNotification('Failed to fetch transcript');
        }
    }

    displayTranscript(videoId, videoTitle, transcriptData) {
        // Create transcript modal
        const modal = document.createElement('div');
        modal.className = 'transcript-modal';
        modal.innerHTML = `
            <div class="transcript-content">
                <div class="transcript-header">
                    <h3>📝 Transcript: ${videoTitle}</h3>
                    <button class="close-transcript">×</button>
                </div>
                <div class="transcript-body">
                    <pre>${transcriptData}</pre>
                </div>
                <div class="transcript-footer">
                    <button class="copy-transcript">Copy to Clipboard</button>
                    <span class="video-id">Video ID: ${videoId}</span>
                </div>
            </div>
        `;

        // Style the modal
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        modal.querySelector('.transcript-content').style.cssText = `
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            border-radius: 12px;
            max-width: 80%;
            max-height: 80%;
            padding: 20px;
            color: white;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;

        modal.querySelector('.transcript-body').style.cssText = `
            overflow-y: auto;
            flex: 1;
            margin: 15px 0;
            padding: 15px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
        `;

        // Add event handlers
        modal.querySelector('.close-transcript').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.copy-transcript').addEventListener('click', () => {
            navigator.clipboard.writeText(transcriptData);
            this.showNotification('Transcript copied to clipboard!');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'youtube-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: linear-gradient(135deg, #FF0000, #CC0000);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideInLeft 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutLeft 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Export for use in main application
window.YouTubeRSSManager = YouTubeRSSManager;