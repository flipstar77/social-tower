/**
 * YouTube RSS Manager - Refactored
 * Extends BaseFeedManager with YouTube-specific functionality
 */

class YouTubeRSSManager extends BaseFeedManager {
    constructor() {
        super({
            updateInterval: window.APP_CONFIG?.updateIntervals.youtube || 300000,
            maxItems: 50,
            defaultSort: 'newest',
            cacheKey: window.APP_CONFIG?.cache.youtube.key || 'youtube_videos',
            cacheMaxAge: window.APP_CONFIG?.cache.youtube.maxAge || 1800000,
            refreshButtonId: 'refreshVideos',
            notificationColor: '#FF0000'
        });

        this.channels = window.YOUTUBE_CHANNELS || [];
        this.filterChips = null;

        console.log(`YouTube RSS Manager initialized with ${this.channels.length} channels`);
    }

    /**
     * Get grid selector for YouTube
     */
    getGridSelector() {
        return '.youtube-grid';
    }

    /**
     * Load YouTube video data
     */
    async loadData(forceRefresh = false) {
        try {
            console.log('🔄 Loading YouTube videos...');

            const endpoint = forceRefresh ? '/api/videos/refresh' : '/api/videos';
            const method = forceRefresh ? 'POST' : 'GET';

            const response = await this.apiClient._request(
                method,
                `http://localhost:6078${endpoint}`,
                null,
                { timeout: 5000, retries: 1 }
            );

            if (response.success && response.data.videos) {
                this.items = response.data.videos.map(video => ({
                    ...video,
                    publishDate: new Date(video.publishDate)
                }));

                this.lastUpdated = response.data.lastUpdate ?
                    new Date(response.data.lastUpdate) : new Date();

                this.saveToCache();
                this.updateCarousel();

                console.log(`✅ Loaded ${this.items.length} videos from backend`);
            } else {
                throw new Error(response.error || 'Failed to load videos');
            }
        } catch (error) {
            console.error('❌ Error loading YouTube data:', error);
            console.log('🔄 Using cached data...');

            if (this.items.length === 0) {
                this.loadMockData();
            } else {
                this.updateCarousel();
            }
        }
    }

    /**
     * Load mock data as fallback
     */
    loadMockData() {
        this.items = [
            {
                id: 'mock1',
                title: 'Tower Defense Wave 10,000+ Guide',
                channel: 'GreenyTower',
                channelColor: '#4CAF50',
                publishDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
                duration: '15:32',
                views: '25.3K',
                description: 'Ultimate guide to reaching wave 10,000 in The Tower'
            }
        ];

        this.lastUpdated = new Date();
        this.saveToCache();
        this.updateCarousel();
    }

    /**
     * Create video tile element
     */
    createTile(video) {
        const tile = document.createElement('div');
        tile.className = 'tile-component video-tile';
        tile.dataset.videoId = video.id;
        tile.dataset.tileId = video.id;

        const timeAgo = TextUtils.getTimeAgo(video.publishDate);

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
                    ${TextUtils.truncate(video.description, 120)}
                </div>
            </div>
        `;

        // Add click handlers
        tile.addEventListener('click', (e) => {
            if (!e.target.closest('.control-btn')) {
                this.openItem(video);
            }
        });

        const playBtn = tile.querySelector('.play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openItem(video);
            });
        }

        const transcriptBtn = tile.querySelector('.transcript-btn');
        if (transcriptBtn) {
            transcriptBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.fetchTranscript(video.id, video.title);
            });
        }

        return tile;
    }

    /**
     * Bind filter events
     */
    bindFilterEvents() {
        console.log('🔧 YouTube: Binding filter events...');

        const refreshBtn = document.getElementById('refreshVideos');
        if (refreshBtn && !refreshBtn.hasAttribute('data-youtube-bound')) {
            refreshBtn.setAttribute('data-youtube-bound', 'true');
            refreshBtn.addEventListener('click', () => {
                this.manualRefresh();
            });
        }

        const sortFilter = document.getElementById('sortFilter');
        if (sortFilter && !sortFilter.hasAttribute('data-youtube-bound')) {
            sortFilter.setAttribute('data-youtube-bound', 'true');
            sortFilter.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.updateCarousel();
            });
        }
    }

    /**
     * Populate filter UI with channel chips
     */
    populateFilterUI() {
        const chipContainer = document.getElementById('channelFilterChips');
        if (!chipContainer) return;

        // Initialize filter chips component if not already done
        if (!this.filterChips) {
            this.filterChips = new FilterChips('channelFilterChips', {
                multiSelect: true,
                onChange: (activeFilters) => {
                    console.log('Active filters changed:', activeFilters);
                    this.updateCarousel();
                }
            });
        }

        // Convert channels to filter format
        const filters = this.channels.map(channel => ({
            value: channel.name,
            label: channel.name,
            color: channel.color
        }));

        this.filterChips.render(filters);
    }

    /**
     * Apply channel filters
     */
    applyCustomFilters(items) {
        if (!this.filterChips) return items;

        const activeChannels = this.filterChips.getActiveFilters();

        // If all are selected or none selected, show all
        if (activeChannels.length === 0 || activeChannels.length === this.channels.length) {
            return items;
        }

        return items.filter(video => activeChannels.includes(video.channel));
    }

    /**
     * Fetch video transcript
     */
    async fetchTranscript(videoId, videoTitle) {
        try {
            console.log(`📝 Fetching transcript for video: ${videoId}`);
            this.showNotification('Fetching transcript...');

            const result = await this.apiClient.get(`/api/transcript/${videoId}`);

            if (result.success && result.data.transcript) {
                this.displayTranscript(videoId, videoTitle, result.data.transcript);
                this.showNotification('Transcript loaded successfully!');
            } else {
                this.showNotification(`No transcript available: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('❌ Error fetching transcript:', error);
            this.showNotification('Failed to fetch transcript', 'error');
        }
    }

    /**
     * Display transcript in modal
     */
    displayTranscript(videoId, videoTitle, transcriptData) {
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

        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.8); display: flex;
            justify-content: center; align-items: center; z-index: 10000;
        `;

        modal.querySelector('.transcript-content').style.cssText = `
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            border-radius: 12px; max-width: 80%; max-height: 80%;
            padding: 20px; color: white; overflow: hidden;
            display: flex; flex-direction: column;
        `;

        modal.querySelector('.transcript-body').style.cssText = `
            overflow-y: auto; flex: 1; margin: 15px 0; padding: 15px;
            background: rgba(0, 0, 0, 0.2); border-radius: 8px;
        `;

        modal.querySelector('.close-transcript').addEventListener('click', () => modal.remove());
        modal.querySelector('.copy-transcript').addEventListener('click', () => {
            navigator.clipboard.writeText(transcriptData);
            this.showNotification('Transcript copied to clipboard!');
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        document.body.appendChild(modal);
    }
}

// Export for use in main application
window.YouTubeRSSManager = YouTubeRSSManager;
