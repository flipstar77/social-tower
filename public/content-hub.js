// Content Hub Module - Modular JavaScript Component
class ContentHub {
    constructor() {
        this.contentData = {
            trending: [],
            recent: [],
            strategies: []
        };
        this.rotationSettings = {
            isRotating: true,
            speed: 30, // seconds - fast enough to see movement
            currentSpeed: 'normal'
        };
        this.rotationIntervals = new Map();
        this.channelFilters = null; // Will be initialized after DOM loads
        this.activeChannels = new Set(); // Track active channel filters
        this.init();
    }

    async init() {
        console.log('🚀 Content Hub initializing...');
        await this.loadContentData();
        console.log('📊 Data loaded, rendering content...');
        this.renderContent();
        console.log('🎮 Setting up event listeners...');
        this.setupEventListeners();
        console.log('🔍 Initializing search functionality...');
        this.initSearchFunctionality();
        console.log('🎛️ Initializing channel filters...');
        this.initChannelFilters();
        console.log('✅ Content Hub initialization complete');
    }

    // Load content data from YouTube RSS API
    async loadContentData() {
        try {
            // Fetch real YouTube data from server
            console.log('📺 Starting YouTube data load...');
            await this.loadRealYouTubeData();
            console.log('✅ YouTube data loaded successfully');

            // Also load Reddit data
            console.log('📋 Starting Reddit data load...');
            await this.loadRealRedditData();
            console.log('✅ Reddit data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading content data:', error);
            console.error('Error details:', error.message, error.stack);
            // Don't fall back to mock data - show error instead
            this.showNotification('Failed to load content. Please refresh the page.');
        }
    }

    // Load real YouTube data from server API
    async loadRealYouTubeData() {
        console.log('📺 Fetching YouTube data from API...');
        const apiBase = window.APP_CONFIG?.api?.baseUrl || '';
        const response = await fetch(`${apiBase}/api/videos`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // API returns: { success: true, data: { videos: [...], lastUpdate, totalVideos, totalChannels } }
        const videos = data.data?.videos || data.videos || [];

        if (data.success && videos.length > 0) {
            // Convert YouTube videos to content format
            const youtubeVideos = videos.slice(0, 20); // Limit to 20 videos
            console.log('📺 Sample video from API:', youtubeVideos[0]);

            // Split into categories
            this.contentData.trending = youtubeVideos.slice(0, 8).map((video, index) => this.convertYouTubeToContentFormat(video, index + 1, 'trending'));
            this.contentData.recent = youtubeVideos.slice(8, 16).map((video, index) => this.convertYouTubeToContentFormat(video, index + 9, 'recent'));
            this.contentData.strategies = youtubeVideos.slice(16, 20).map((video, index) => this.convertYouTubeToContentFormat(video, index + 17, 'strategies'));

            console.log('✅ Loaded real YouTube content:', {
                trending: this.contentData.trending.length,
                recent: this.contentData.recent.length,
                strategies: this.contentData.strategies.length
            });
        } else {
            throw new Error('Invalid API response format');
        }
    }

    // Load real Reddit data from server API
    async loadRealRedditData() {
        console.log('📋 Fetching Reddit data from API...');
        try {
            const apiBase = window.APP_CONFIG?.api?.baseUrl || '';
            const response = await fetch(`${apiBase}/api/reddit`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📋 Raw Reddit API response:', data);

            if (data.success && data.posts && Array.isArray(data.posts)) {
                console.log(`📋 Processing ${data.posts.length} Reddit posts...`);

                // Convert Reddit posts to content format and store in contentData.reddit
                this.contentData.reddit = data.posts.slice(0, 10).map((post, index) => {
                    const redditPost = {
                        id: `reddit_${index}`,
                        title: post.title || 'No Title',
                        author: post.author || 'Unknown',
                        subreddit: post.subreddit || 'TheTowerGame',
                        score: post.score || post.ups || 0,
                        comments: post.num_comments || 0,
                        category: 'reddit',
                        thumbnail: post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default' ? post.thumbnail : 'https://via.placeholder.com/320x180?text=Reddit+Post',
                        url: post.url || `https://reddit.com${post.permalink}`,
                        flair: post.link_flair_text || 'Discussion',
                        created: post.created_utc || Date.now() / 1000,
                        selftext: post.selftext || '',
                        permalink: post.permalink,
                        // Properties needed for tile rendering
                        gradient: 'linear-gradient(135deg, #FF4500 0%, #FF6500 100%)', // Reddit orange theme
                        matchPercentage: Math.min(95, Math.max(70, post.score ? Math.floor(70 + (post.score / 10)) : 75)),
                        channelColor: '#FF4500',
                        channel: `r/${post.subreddit || 'TheTowerGame'}`,
                        rating: post.link_flair_text || 'Discussion',
                        duration: `${post.num_comments || 0} comments`,
                        quality: `${post.score || 0} ⬆`,
                        views: post.score || 0,
                        likes: Math.floor((post.score || 0) * 0.8),
                        genres: [post.link_flair_text || 'Discussion', post.author ? `u/${post.author}` : 'Reddit']
                    };
                    console.log(`📋 Processed Reddit post ${index}:`, redditPost.title);
                    return redditPost;
                });

                console.log('✅ Loaded real Reddit content:', this.contentData.reddit.length, 'posts');
                console.log('📋 First Reddit post sample:', this.contentData.reddit[0]);
            } else {
                console.warn('Invalid Reddit API response format:', data);
                this.contentData.reddit = [];
            }
        } catch (error) {
            console.error('❌ Error loading Reddit data:', error);
            this.contentData.reddit = [];
        }
    }

    // Convert YouTube video data to content hub format
    convertYouTubeToContentFormat(video, id, category) {
        // Calculate match percentage based on video age and views
        const ageHours = (Date.now() - new Date(video.publishDate).getTime()) / (1000 * 60 * 60);
        const matchPercentage = Math.max(70, Math.min(99, 90 - Math.floor(ageHours / 24) * 2));

        // Generate gradient based on channel color
        const channelColor = video.channelColor || video.color || '#4CAF50';
        const gradient = this.generateGradient(channelColor);

        // Parse views if they exist
        const viewsText = video.views || '0';
        const views = this.parseViews(viewsText);

        return {
            id: id,
            title: video.title,
            matchPercentage: matchPercentage,
            rating: this.generateRating(video),
            duration: video.duration || 'N/A',
            quality: 'HD',
            genres: this.generateGenres(video.title, video.description),
            gradient: gradient,
            views: views,
            likes: Math.floor(views * 0.05), // Estimate likes as 5% of views
            category: category,
            youtubeId: video.id,
            thumbnail: video.thumbnail,
            channel: video.channelTitle || video.channel,
            channelColor: channelColor,
            publishDate: video.publishDate,
            description: video.description,
            url: video.url || `https://www.youtube.com/watch?v=${video.id}`
        };
    }

    // Generate gradient based on channel color
    generateGradient(color) {
        const gradients = [
            `linear-gradient(135deg, ${color} 0%, #764ba2 100%)`,
            `linear-gradient(135deg, ${color} 0%, #f093fb 100%)`,
            `linear-gradient(135deg, ${color} 0%, #4facfe 100%)`,
            `linear-gradient(135deg, ${color} 0%, #43e97b 100%)`,
            `linear-gradient(135deg, ${color} 0%, #fa709a 100%)`
        ];
        return gradients[Math.floor(Math.random() * gradients.length)];
    }

    // Parse view count string to number
    parseViews(viewsText) {
        if (!viewsText) return 0;

        const match = viewsText.toLowerCase().match(/(\d+(?:\.\d+)?)\s*([kmb]?)/);
        if (!match) return 0;

        const [, number, suffix] = match;
        const base = parseFloat(number);

        switch (suffix) {
            case 'k': return Math.floor(base * 1000);
            case 'm': return Math.floor(base * 1000000);
            case 'b': return Math.floor(base * 1000000000);
            default: return Math.floor(base);
        }
    }

    // Generate rating based on video data
    generateRating(video) {
        const ratings = ['T11', 'T12', 'T13', 'T14', 'T15', 'W8K', 'W10K', 'W12K', 'HD'];
        return ratings[Math.floor(Math.random() * ratings.length)];
    }

    // Generate genres based on title and description
    generateGenres(title, description) {
        const allGenres = ['Strategy', 'Tutorial', 'Guide', 'Build', 'Meta', 'Tips', 'Advanced', 'Beginner', 'Progression', 'Tower Defense'];
        const text = (title + ' ' + (description || '')).toLowerCase();

        const matchedGenres = allGenres.filter(genre =>
            text.includes(genre.toLowerCase()) ||
            text.includes(genre.toLowerCase().replace(' ', ''))
        );

        // If no matches, return default genres
        if (matchedGenres.length === 0) {
            return ['Strategy', 'Tutorial', 'Guide'].slice(0, 3);
        }

        // Return up to 3 matched genres
        return matchedGenres.slice(0, 3);
    }

    // Fallback mock data method
    loadMockData() {
        this.contentData.trending = [
            {
                id: 1,
                title: 'Tower Guides',
                matchPercentage: 89,
                rating: 'T11',
                duration: '1 Season',
                quality: 'HD',
                genres: ['Strategy', 'Tower Defense', 'Progression'],
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                views: 15234,
                likes: 892,
                category: 'guide'
            },
            {
                id: 2,
                title: 'Wave Strategies',
                matchPercentage: 92,
                rating: 'W8K',
                duration: '2 Hours',
                quality: '4K',
                genres: ['Tutorial', 'Advanced', 'Meta'],
                gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                views: 23456,
                likes: 1523,
                category: 'strategy'
            },
            {
                id: 3,
                title: 'Damage Build',
                matchPercentage: 95,
                rating: 'DMG',
                duration: '45 min',
                quality: 'HD',
                genres: ['Build Guide', 'DPS Focus', 'Meta'],
                gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                views: 34567,
                likes: 2341,
                category: 'build'
            },
            {
                id: 4,
                title: 'Economy Guide',
                matchPercentage: 87,
                rating: 'ECO',
                duration: '30 min',
                quality: 'HD',
                genres: ['Economy', 'Farming', 'Optimization'],
                gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                views: 12345,
                likes: 765,
                category: 'economy'
            },
            {
                id: 5,
                title: 'Elite Enemies',
                matchPercentage: 91,
                rating: 'ELT',
                duration: '1 Hour',
                quality: 'HD',
                genres: ['Boss Guide', 'Tactics', 'Counter Play'],
                gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                views: 18976,
                likes: 1234,
                category: 'combat'
            }
        ];

        // Load recent content
        this.contentData.recent = this.generateRecentContent();

        // Load strategy content
        this.contentData.strategies = this.generateStrategyContent();
    }

    generateRecentContent() {
        return [
            {
                id: 6,
                title: 'Speed Run Tips',
                matchPercentage: 85,
                rating: 'SPD',
                duration: '20 min',
                quality: 'HD',
                genres: ['Speed Run', 'Tips', 'Advanced'],
                gradient: 'linear-gradient(135deg, #ff6a88 0%, #ff99ac 100%)',
                views: 8765,
                likes: 543,
                category: 'tips'
            },
            {
                id: 7,
                title: 'Tier 15 Guide',
                matchPercentage: 93,
                rating: 'T15',
                duration: '1.5 Hours',
                quality: '4K',
                genres: ['High Tier', 'Expert', 'Endgame'],
                gradient: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
                views: 45678,
                likes: 3456,
                category: 'guide'
            },
            {
                id: 8,
                title: 'Module Optimization',
                matchPercentage: 88,
                rating: 'MOD',
                duration: '35 min',
                quality: 'HD',
                genres: ['Modules', 'Optimization', 'Setup'],
                gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
                views: 19876,
                likes: 1567,
                category: 'optimization'
            }
        ];
    }

    generateStrategyContent() {
        return [
            {
                id: 9,
                title: 'Early Game Rush',
                matchPercentage: 90,
                rating: 'EGR',
                duration: '25 min',
                quality: 'HD',
                genres: ['Early Game', 'Rush', 'Strategy'],
                gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
                views: 23456,
                likes: 1876,
                category: 'strategy'
            },
            {
                id: 10,
                title: 'Defensive Setup',
                matchPercentage: 86,
                rating: 'DEF',
                duration: '40 min',
                quality: 'HD',
                genres: ['Defense', 'Setup', 'Turtle'],
                gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
                views: 15678,
                likes: 987,
                category: 'defense'
            }
        ];
    }

    renderContent() {
        // Use the existing youtube-grid container instead of separate grids
        const allVideos = [
            ...this.contentData.trending,
            ...this.contentData.recent,
            ...this.contentData.strategies
        ];
        console.log('🎬 Content Hub rendering videos:', allVideos.length, 'total videos');
        console.log('📊 Breakdown:', {
            trending: this.contentData.trending.length,
            recent: this.contentData.recent.length,
            strategies: this.contentData.strategies.length
        });
        this.renderSection('youtube', allVideos);

        // Also render Reddit posts if available
        if (this.contentData.reddit && this.contentData.reddit.length > 0) {
            console.log('📋 Content Hub rendering Reddit posts:', this.contentData.reddit.length, 'total posts');
            this.renderSection('reddit', this.contentData.reddit);
        } else {
            console.warn('📋 No Reddit posts to render');
        }
    }

    renderSection(sectionName, data) {
        console.log(`🎨 renderSection called for: ${sectionName} with ${data.length} items`);
        const container = document.querySelector(`.${sectionName}-grid`);
        console.log(`🔍 Found container .${sectionName}-grid:`, container ? 'YES' : 'NO');

        if (!container || !data.length) {
            console.warn(`Container .${sectionName}-grid not found or no data`);
            return;
        }

        // Create tiles HTML
        const tilesHTML = data.map(item => `
            <div class="tile-component" data-tile-id="${item.id}" style="background: ${item.gradient}">
                <div class="tile-thumbnail" style="cursor: pointer;">
                    <img src="${item.thumbnail}" alt="${item.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/320x180?text=No+Image'" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px;">
                    <div class="tile-overlay">
                        <div class="control-btn play-btn">▶</div>
                    </div>
                </div>
                <div class="tile-header">
                    <div class="match-score">${item.matchPercentage}% Match</div>
                    <div class="tile-channel" style="font-size: 11px; color: ${item.channelColor}">${item.channel || 'Unknown'}</div>
                </div>
                <div class="tile-body">
                    <h3 class="tile-title" style="font-size: 13px; margin: 8px 0; line-height: 1.3;">${item.title}</h3>
                    <div class="tile-meta">
                        <span class="rating">${item.rating}</span>
                        <span class="duration">${item.duration}</span>
                        <span class="quality">${item.quality}</span>
                    </div>
                    <div class="tile-genres">
                        ${item.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                    </div>
                </div>
                <div class="tile-footer">
                    <div class="tile-stats">
                        <span>👀 ${item.views.toLocaleString('en-US')}</span>
                        <span>👍 ${item.likes.toLocaleString('en-US')}</span>
                    </div>
                    <div class="control-btn add-btn">+</div>
                </div>
            </div>
        `).join('');

        // Wrap in tiles-container for rotation
        container.innerHTML = `<div class="tiles-container">${tilesHTML}</div>`;

        // Start carousel rotation after rendering
        if (this.rotationSettings.isRotating) {
            this.startRotation(container);
        }
    }

    setupEventListeners() {
        // Control button interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.control-btn')) {
                this.handleControlClick(e);
            } else if (e.target.closest('.tile-component')) {
                this.handleTileClick(e);
            }
            if (e.target.closest('.chevron-right')) {
                this.handleSectionExpand(e);
            }
            if (e.target.closest('.rotation-toggle')) {
                this.toggleRotation(e);
            }
            if (e.target.closest('.speed-btn')) {
                this.changeRotationSpeed(e);
            }
        });

        // Refresh button for YouTube content
        const refreshBtn = document.getElementById('refreshVideos');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshContent();
            });
        }

        // Hover effects for tiles and rotation pause
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('.tile-component')) {
                this.handleTileHover(e);
            }
            if (e.target.closest('.content-grid.auto-rotate')) {
                this.pauseRotation(e.target.closest('.content-grid'));
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('.content-grid.auto-rotate')) {
                this.resumeRotation(e.target.closest('.content-grid'));
            }
        });
    }

    handleControlClick(e) {
        const btn = e.target.closest('.control-btn');
        const tileId = btn.closest('.tile-component')?.dataset.tileId;

        if (btn.classList.contains('play-btn')) {
            this.playContent(tileId);
        } else if (btn.classList.contains('add-btn')) {
            this.addToList(tileId);
        } else if (btn.classList.contains('thumbs-up')) {
            this.likeContent(tileId);
        } else if (btn.classList.contains('thumbs-down')) {
            this.dislikeContent(tileId);
        } else if (btn.classList.contains('reveal-btn')) {
            this.toggleInfo(tileId);
        }

        e.stopPropagation();
    }

    handleThumbnailClick(e) {
        const tile = e.target.closest('.tile-component');
        const tileId = tile?.dataset.tileId;

        console.log('🖱️ Thumbnail clicked, tileId:', tileId);

        if (tileId) {
            this.playContent(tileId);
        } else {
            console.error('❌ No tileId found on thumbnail click');
        }

        e.stopPropagation();
    }

    handleTileClick(e) {
        const tile = e.target.closest('.tile-component');
        const tileId = tile?.dataset.tileId;

        // Skip control buttons (play, add, etc.)
        if (e.target.closest('.control-btn')) {
            console.log('⏸️ Control button clicked, skipping tile action');
            return;
        }

        // For YouTube videos, clicking anywhere on tile should play the video
        if (tileId) {
            console.log('🎬 Tile clicked, attempting to play content:', tileId);

            // Find the content to check if it's a video
            const allContent = [
                ...this.contentData.trending,
                ...this.contentData.recent,
                ...this.contentData.strategies,
                ...this.contentData.reddit
            ];
            const content = allContent.find(item => item.id == tileId);

            if (content && (content.youtubeId || content.url)) {
                // It's a YouTube video or has a URL - play it
                console.log('✅ Found YouTube/URL content, playing...');
                this.playContent(tileId);
            } else {
                // No URL - show details modal
                console.log('ℹ️ No URL found, showing details modal');
                this.showContentDetails(tileId);
            }
        }
    }

    handleSectionExpand(e) {
        const section = e.target.closest('.content-section');
        const sectionType = section?.querySelector('.content-title')?.textContent;

        this.expandSection(sectionType);
    }

    handleTileHover(e) {
        const tile = e.target.closest('.tile-component');
        // Add hover analytics or preload content
        this.preloadContent(tile?.dataset.tileId);
    }

    playContent(contentId) {
        console.log(`▶️ Playing content: ${contentId}`);

        // Find the content item by ID - include Reddit posts
        const allContent = [
            ...this.contentData.trending,
            ...this.contentData.recent,
            ...this.contentData.strategies,
            ...this.contentData.reddit
        ];
        console.log(`📊 Searching in ${allContent.length} items for ID ${contentId}`);
        const content = allContent.find(item => item.id == contentId);
        console.log(`🔍 Found content:`, content);

        if (content && content.youtubeId) {
            // Open YouTube video in new tab
            const youtubeUrl = content.url || `https://www.youtube.com/watch?v=${content.youtubeId}`;
            console.log(`🎬 Opening YouTube URL: ${youtubeUrl}`);
            window.open(youtubeUrl, '_blank');
            this.showNotification(`Opening "${content.title}" on YouTube...`);
        } else if (content && content.url) {
            // Open Reddit post or other content with URL
            console.log(`📋 Opening URL: ${content.url}`);
            window.open(content.url, '_blank');
            this.showNotification(`Opening "${content.title}"...`);
        } else {
            console.error('❌ Content not found or no URL:', contentId, content);
            this.showNotification('Unable to open content');
        }
    }

    addToList(contentId) {
        console.log(`Adding to list: ${contentId}`);
        // Implementation for adding to user's list
        this.showNotification('Added to your list!');
    }

    likeContent(contentId) {
        console.log(`Liked content: ${contentId}`);
        // Implementation for liking content
        this.updateLikes(contentId, 1);
        this.showNotification('Liked!');
    }

    dislikeContent(contentId) {
        console.log(`Disliked content: ${contentId}`);
        // Implementation for disliking content
        this.updateLikes(contentId, -1);
        this.showNotification('Feedback recorded');
    }

    toggleInfo(contentId) {
        const tile = document.querySelector(`[data-tile-id="${contentId}"]`);
        if (tile) {
            const info = tile.querySelector('.tile-info');
            info.classList.toggle('expanded');
        }
    }

    showContentDetails(contentId) {
        const content = this.findContentById(contentId);
        if (content) {
            console.log('Showing details for:', content);
            // Implementation for showing detailed view
            this.createDetailModal(content);
        }
    }

    expandSection(sectionType) {
        console.log(`Expanding section: ${sectionType}`);
        // Implementation for expanding section to full view
    }

    preloadContent(contentId) {
        // Preload content for faster access
        if (contentId) {
            console.log(`Preloading content: ${contentId}`);
        }
    }

    findContentById(id) {
        const allContent = [
            ...this.contentData.trending,
            ...this.contentData.recent,
            ...this.contentData.strategies
        ];
        return allContent.find(item => item.id === parseInt(id));
    }

    updateLikes(contentId, delta) {
        const content = this.findContentById(contentId);
        if (content) {
            content.likes += delta;
            // Update UI
            this.refreshTile(contentId);
        }
    }

    refreshTile(contentId) {
        // Refresh tile UI with updated data
        const tile = document.querySelector(`[data-tile-id="${contentId}"]`);
        if (tile) {
            // Update match percentage or other dynamic content
        }
    }

    createDetailModal(content) {
        // Create and show detailed modal for content
        const modal = document.createElement('div');
        modal.className = 'content-detail-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-detail-content">
                <button class="modal-close">&times;</button>
                <div class="detail-header" style="background: ${content.gradient}">
                    <h2>${content.title}</h2>
                </div>
                <div class="detail-body">
                    <div class="detail-stats">
                        <span class="stat-item">Views: ${this.formatNumber(content.views)}</span>
                        <span class="stat-item">Likes: ${this.formatNumber(content.likes)}</span>
                        <span class="stat-item">Duration: ${content.duration}</span>
                    </div>
                    <div class="detail-genres">
                        ${content.genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                    </div>
                    <div class="detail-description">
                        <p>Master the ${content.title} with this comprehensive guide covering all aspects of gameplay.</p>
                    </div>
                    <div class="detail-actions">
                        <button class="btn-primary">Play Now</button>
                        <button class="btn-secondary">Add to List</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add close functionality
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.modal-backdrop').addEventListener('click', () => {
            modal.remove();
        });

        // Add Play Now button functionality
        modal.querySelector('.btn-primary').addEventListener('click', () => {
            console.log('🎬 Play Now clicked from modal');
            modal.remove();
            this.playContent(content.id);
        });

        // Add "Add to List" button functionality
        modal.querySelector('.btn-secondary').addEventListener('click', () => {
            console.log('➕ Add to List clicked from modal');
            this.addToList(content.id);
            modal.remove();
            this.showNotification(`Added "${content.title}" to your list`);
        });

        // Add animation
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'content-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    }

    // Populate content dynamically
    populateContentSection(sectionType, data) {
        let gridSelector = '';

        switch(sectionType) {
            case 'trending':
                gridSelector = '.trending-grid';
                break;
            case 'recent':
                gridSelector = '.recent-grid';
                break;
            case 'strategies':
                gridSelector = '.strategies-grid';
                break;
        }

        const grid = document.querySelector(gridSelector);
        if (!grid || !data.length) return;

        // Clear existing placeholder
        if (grid.children.length === 0 || grid.querySelector('<!-- Similar tile components')) {
            grid.innerHTML = '';
        }

        // Create tiles container for rotation
        const tilesContainer = document.createElement('div');
        tilesContainer.className = 'tiles-container';

        // Create tiles and duplicate them for seamless rotation
        const allTiles = [...data, ...data]; // Duplicate for seamless loop

        allTiles.forEach((item, index) => {
            const tile = this.createTileElement(item);
            tile.style.animationDelay = `${(index % data.length) * 0.1}s`;
            tilesContainer.appendChild(tile);
        });

        grid.appendChild(tilesContainer);
    }

    createTileElement(content) {
        const tile = document.createElement('div');
        tile.className = 'tile-component';
        tile.dataset.tileId = content.id;

        tile.innerHTML = `
            <div class="tile-image" style="background: ${content.gradient};">
                <div class="tile-placeholder">${content.title}</div>
            </div>
            <div class="tile-info">
                <div class="control-bar">
                    <div class="controls">
                        <button class="control-btn play-btn"><span></span></button>
                        <button class="control-btn add-btn"><span class="plus-icon"></span></button>
                        <button class="control-btn thumbs-up"><span></span></button>
                        <button class="control-btn thumbs-down"><span></span></button>
                    </div>
                    <button class="control-btn reveal-btn"><span class="chevron-down"></span></button>
                </div>
                <div class="show-info">
                    <span class="match-percentage">${content.matchPercentage}% Match</span>
                    <span class="age-rating">${content.rating}</span>
                    <span class="duration">${content.duration}</span>
                    <span class="quality">${content.quality}</span>
                </div>
                <div class="genre-tags">
                    ${content.genres.map((genre, i) =>
                        `${i > 0 ? '<span class="dot"></span>' : ''}<span class="genre">${genre}</span>`
                    ).join('')}
                </div>
            </div>
        `;

        return tile;
    }

    // Rotation control methods
    toggleRotation(e) {
        e.stopPropagation();
        this.rotationSettings.isRotating = !this.rotationSettings.isRotating;

        const toggle = e.target.closest('.rotation-toggle');
        toggle.classList.toggle('active', this.rotationSettings.isRotating);

        const section = toggle.closest('.content-section');
        const grid = section.querySelector('.content-grid');

        if (this.rotationSettings.isRotating) {
            this.startRotation(grid);
        } else {
            this.stopRotation(grid);
        }

        this.showNotification(this.rotationSettings.isRotating ? 'Auto-rotation enabled' : 'Auto-rotation disabled');
    }

    changeRotationSpeed(e) {
        e.stopPropagation();
        const speedBtn = e.target.closest('.speed-btn');
        const speed = speedBtn.dataset.speed;

        // Remove active class from all speed buttons in this section
        const section = speedBtn.closest('.content-section');
        section.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
        speedBtn.classList.add('active');

        // Update speed settings
        const speedMap = {
            'slow': 180,
            'normal': 120,
            'fast': 60
        };

        this.rotationSettings.speed = speedMap[speed];
        this.rotationSettings.currentSpeed = speed;

        // Restart rotation with new speed
        const grid = section.querySelector('.content-grid');
        if (this.rotationSettings.isRotating) {
            this.startRotation(grid);
        }

        this.showNotification(`Speed set to ${speed}`);
    }

    startRotation(grid) {
        if (!grid) {
            console.warn('⚠️ startRotation called but no grid found');
            return;
        }

        console.log('🔄 Starting rotation for grid:', grid.className);
        grid.classList.add('auto-rotate');

        // Update CSS animation duration
        const tilesContainer = grid.querySelector('.tiles-container');
        const progressBar = grid.querySelector('.progress-bar');

        console.log('🔍 Found .tiles-container:', tilesContainer ? 'YES' : 'NO');
        console.log('🔍 Found .progress-bar:', progressBar ? 'YES' : 'NO');

        if (tilesContainer) {
            tilesContainer.style.animationDuration = `${this.rotationSettings.speed}s`;
            console.log(`✅ Set animation duration to ${this.rotationSettings.speed}s`);
        } else {
            console.warn('⚠️ No .tiles-container found - rotation will not work!');
        }

        if (progressBar) {
            progressBar.style.animationDuration = `${this.rotationSettings.speed}s`;
        }
    }

    stopRotation(grid) {
        if (!grid) return;
        grid.classList.remove('auto-rotate');
    }

    pauseRotation(grid) {
        if (!grid || !this.rotationSettings.isRotating) return;

        // Mark this grid as currently hovered
        grid.dataset.isHovered = 'true';

        const tilesContainer = grid.querySelector('.tiles-container');
        const progressBar = grid.querySelector('.progress-bar');

        if (tilesContainer) {
            tilesContainer.style.animationPlayState = 'paused';
        }
        if (progressBar) {
            progressBar.style.animationPlayState = 'paused';
        }
    }

    resumeRotation(grid) {
        if (!grid || !this.rotationSettings.isRotating) return;

        // Only resume if we're actually leaving this grid
        // Check if mouse is still within the grid
        const rect = grid.getBoundingClientRect();
        const mouseX = event?.clientX || 0;
        const mouseY = event?.clientY || 0;

        if (mouseX >= rect.left && mouseX <= rect.right &&
            mouseY >= rect.top && mouseY <= rect.bottom) {
            return; // Still inside, don't resume
        }

        // Mark as not hovered
        grid.dataset.isHovered = 'false';

        const tilesContainer = grid.querySelector('.tiles-container');
        const progressBar = grid.querySelector('.progress-bar');

        if (tilesContainer) {
            tilesContainer.style.animationPlayState = 'running';
        }
        if (progressBar) {
            progressBar.style.animationPlayState = 'running';
        }
    }

    createRotationControls() {
        return `
            <div class="rotation-controls">
                <div class="rotation-toggle ${this.rotationSettings.isRotating ? 'active' : ''}">
                    <div class="rotation-indicator"></div>
                </div>
                <div class="rotation-speed-control">
                    <button class="speed-btn ${this.rotationSettings.currentSpeed === 'slow' ? 'active' : ''}" data-speed="slow">S</button>
                    <button class="speed-btn ${this.rotationSettings.currentSpeed === 'normal' ? 'active' : ''}" data-speed="normal">N</button>
                    <button class="speed-btn ${this.rotationSettings.currentSpeed === 'fast' ? 'active' : ''}" data-speed="fast">F</button>
                </div>
            </div>
            <div class="rotation-progress">
                <div class="progress-bar"></div>
            </div>
        `;
    }

    // Initialize content when Content Hub is shown
    showContentHub() {
        const contentHub = document.getElementById('contentHub');
        if (contentHub) {
            // Show the content hub first
            contentHub.style.display = 'block';

            // Hide main dashboard
            document.querySelector('.dashboard-content').style.display = 'none';

            // Render content
            this.renderContent();

            // Note: YouTube manager disabled to prevent conflicts with Content Hub rendering
            // Content Hub now handles YouTube video display directly

            // Note: Reddit RSS Manager disabled - Content Hub now handles Reddit posts directly
        }
    }

    addRotationControls() {
        const contentSections = document.querySelectorAll('.content-section');

        contentSections.forEach(section => {
            // Check if controls already exist
            if (section.querySelector('.rotation-controls')) return;

            const header = section.querySelector('.section-header');
            if (header) {
                header.style.position = 'relative';
                header.insertAdjacentHTML('beforeend', this.createRotationControls());
            }
        });
    }

    startAllRotations() {
        const grids = document.querySelectorAll('.content-grid');
        grids.forEach(grid => {
            if (this.rotationSettings.isRotating) {
                this.startRotation(grid);
            }
        });
    }

    hideContentHub() {
        const contentHub = document.getElementById('contentHub');
        if (contentHub) {
            contentHub.style.display = 'none';
            document.querySelector('.dashboard-content').style.display = 'block';
        }
    }

    // Refresh YouTube content from server
    async refreshContent() {
        try {
            this.showNotification('Refreshing YouTube content...');

            // Force refresh from server
            const apiBase = window.APP_CONFIG?.api?.baseUrl || '';
            const response = await fetch(`${apiBase}/api/videos/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                // Reload content data
                await this.loadRealYouTubeData();
                this.renderContent();
                this.showNotification('YouTube content refreshed successfully!');
            } else {
                throw new Error('Refresh failed');
            }
        } catch (error) {
            console.error('Error refreshing content:', error);
            this.showNotification('Error refreshing content');
        }
    }

    // Initialize channel filters
    initChannelFilters() {
        if (typeof FilterChips === 'undefined') {
            console.warn('FilterChips not loaded, skipping channel filter initialization');
            return;
        }

        // Get unique channels from all videos
        const allVideos = [
            ...this.contentData.trending,
            ...this.contentData.recent,
            ...this.contentData.strategies
        ];

        const channelsMap = new Map();
        allVideos.forEach(video => {
            console.log('🔍 Video channel:', video.channel, 'channelColor:', video.channelColor);
            if (video.channel && !channelsMap.has(video.channel)) {
                channelsMap.set(video.channel, {
                    label: video.channel,
                    value: video.channel,
                    color: video.channelColor || '#4CAF50'
                });
            }
        });

        const channels = Array.from(channelsMap.values());
        console.log('📺 Found channels:', channels);

        if (channels.length === 0) {
            console.warn('⚠️ No channels found in video data');
            return;
        }

        // Initialize FilterChips
        this.channelFilters = new FilterChips('channelFilterChips', {
            multiSelect: true,
            onChange: (activeChannels) => {
                console.log('🎛️ Channel filter changed:', activeChannels);
                this.activeChannels = new Set(activeChannels);
                this.applyChannelFilter();
            }
        });

        this.channelFilters.render(channels);
        this.activeChannels = new Set(channels.map(c => c.value)); // All active by default
        console.log('✅ Channel filters initialized with', channels.length, 'channels');
    }

    // Apply channel filter
    applyChannelFilter() {
        const allVideos = [
            ...this.contentData.trending,
            ...this.contentData.recent,
            ...this.contentData.strategies
        ];

        // Filter videos by active channels
        const filteredVideos = allVideos.filter(video =>
            this.activeChannels.has(video.channel)
        );

        // Re-render only YouTube sections with filtered data
        this.renderSection('youtube', filteredVideos);
    }

    // Initialize search functionality
    initSearchFunctionality() {
        console.log('Initializing search functionality...');

        // Set up search tab switching
        this.setupSearchTabs();

        // Initialize wiki search
        this.initWikiSearch();

        // Initialize notion search
        this.initNotionSearch();

        // Set default active tab
        this.setActiveSearchTab('wiki');
    }

    setupSearchTabs() {
        const searchTabs = document.querySelectorAll('.search-tab');
        searchTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabType = e.target.dataset.tab;
                this.setActiveSearchTab(tabType);
            });
        });
    }

    setActiveSearchTab(tabType) {
        // Update tab buttons
        const searchTabs = document.querySelectorAll('.search-tab');
        searchTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabType) {
                tab.classList.add('active');
            }
        });

        // Update content panels
        const wikiPanel = document.getElementById('wiki-search-panel');
        const notionPanel = document.getElementById('notion-search-panel');

        if (tabType === 'wiki') {
            if (wikiPanel) wikiPanel.style.display = 'block';
            if (notionPanel) notionPanel.style.display = 'none';
        } else {
            if (wikiPanel) wikiPanel.style.display = 'none';
            if (notionPanel) notionPanel.style.display = 'block';
        }
    }

    initWikiSearch() {
        const wikiSearchInput = document.getElementById('wiki-search-input');
        const wikiSearchBtn = document.getElementById('wiki-search-btn');
        const wikiResults = document.getElementById('wiki-search-results');

        if (!wikiSearchInput || !wikiSearchBtn || !wikiResults) return;

        const performWikiSearch = async () => {
            const query = wikiSearchInput.value.trim();
            if (!query) return;

            wikiResults.innerHTML = '<div class="search-loading">Searching wiki...</div>';

            try {
                const apiBase = window.APP_CONFIG?.api?.baseUrl || '';
                const response = await fetch(`${apiBase}/api/wiki/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();

                if (data.success && data.results && data.results.length > 0) {
                    this.displayWikiResults(data.results, wikiResults);
                } else {
                    wikiResults.innerHTML = '<div class="no-results">No wiki results found</div>';
                }
            } catch (error) {
                console.error('Wiki search error:', error);
                wikiResults.innerHTML = '<div class="search-error">Error searching wiki</div>';
            }
        };

        wikiSearchBtn.addEventListener('click', performWikiSearch);
        wikiSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performWikiSearch();
            }
        });
    }

    initNotionSearch() {
        const notionSearchInput = document.getElementById('notion-search-input');
        const notionSearchBtn = document.getElementById('notion-search-btn');
        const notionResults = document.getElementById('notion-search-results');

        if (!notionSearchInput || !notionSearchBtn || !notionResults) return;

        const performNotionSearch = async () => {
            const query = notionSearchInput.value.trim();
            if (!query) return;

            notionResults.innerHTML = '<div class="search-loading">Searching Notion...</div>';

            try {
                const apiBase = window.APP_CONFIG?.api?.baseUrl || '';
                const response = await fetch(`${apiBase}/api/notion/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();

                if (data.success && data.results && data.results.length > 0) {
                    this.displayNotionResults(data.results, notionResults);
                } else {
                    notionResults.innerHTML = '<div class="no-results">No Notion results found</div>';
                }
            } catch (error) {
                console.error('Notion search error:', error);
                notionResults.innerHTML = '<div class="search-error">Error searching Notion</div>';
            }
        };

        notionSearchBtn.addEventListener('click', performNotionSearch);
        notionSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performNotionSearch();
            }
        });
    }

    displayWikiResults(results, container) {
        container.innerHTML = results.map(result => `
            <div class="search-result-item">
                <h4 class="result-title">
                    <a href="${result.url}" target="_blank" rel="noopener noreferrer">${result.title}</a>
                </h4>
                ${result.snippet ? `<p class="result-snippet">${result.snippet}</p>` : ''}
                <div class="result-meta">
                    <span class="result-source">Wiki</span>
                    ${result.category ? `<span class="result-category">${result.category}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    displayNotionResults(results, container) {
        container.innerHTML = results.map(result => `
            <div class="search-result-item">
                <h4 class="result-title">
                    <a href="${result.url}" target="_blank" rel="noopener noreferrer">${result.title}</a>
                </h4>
                ${result.snippet ? `<p class="result-snippet">${result.snippet}</p>` : ''}
                <div class="result-meta">
                    <span class="result-source">Notion</span>
                    ${result.type ? `<span class="result-type">${result.type}</span>` : ''}
                </div>
            </div>
        `).join('');
    }
}

// Export for use in main script
window.ContentHub = ContentHub;

// Initialize Content Hub instance when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create global instance for immediate access
    if (!window.contentHubInstance) {
        window.contentHubInstance = new ContentHub();
        console.log('✅ Content Hub instance created');
    }

    // Initialize refactored feed managers
    // YouTube is handled by ContentHub directly via Vercel API
    // Reddit still uses the refactored manager since Reddit API blocks Vercel

    if (typeof RedditRSSManager !== 'undefined') {
        window.redditManager = new RedditRSSManager();
        window.redditManager.init();
        console.log('✅ Reddit RSS Manager (refactored) initialized');
    }
});