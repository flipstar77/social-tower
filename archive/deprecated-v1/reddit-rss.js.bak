// Reddit RSS Feed Manager - Modular Component
class RedditRSSManager {
    constructor() {
        this.subreddit = 'TheTowerGame';
        this.posts = [];
        this.filteredPosts = [];
        this.lastUpdated = null;
        this.updateInterval = 15 * 60 * 1000; // 15 minutes
        this.cache = new Map();
        this.maxPosts = 25; // Limit for performance
        this.selectedFlairs = new Set();
        this.currentSort = 'hot';

        this.init();
    }

    init() {
        // Clear old cache to force fresh data
        localStorage.removeItem('reddit_posts');
        this.setupPeriodicUpdate();
        this.setupFilterEvents();
        // Load real data immediately
        this.loadRedditData();
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
        console.log('🔧 Reddit: Binding filter events...');

        const redditFlairToggle = document.getElementById('redditFlairToggle');
        const redditFlairDropdown = document.getElementById('redditFlairDropdown');
        const redditSelectAllCheckbox = document.getElementById('redditSelectAll');
        const refreshRedditBtn = document.getElementById('refreshReddit');

        console.log('🔧 Reddit elements found:', {
            redditFlairToggle: !!redditFlairToggle,
            redditFlairDropdown: !!redditFlairDropdown,
            redditSelectAllCheckbox: !!redditSelectAllCheckbox,
            refreshRedditBtn: !!refreshRedditBtn
        });

        // Toggle dropdown
        if (redditFlairToggle && !redditFlairToggle.hasAttribute('data-reddit-bound')) {
            redditFlairToggle.setAttribute('data-reddit-bound', 'true');
            redditFlairToggle.addEventListener('click', (e) => {
                console.log('🔧 Reddit: Flair filter toggle clicked');
                e.stopPropagation();
                redditFlairToggle.classList.toggle('open');
                if (redditFlairDropdown) {
                    redditFlairDropdown.classList.toggle('open');
                }
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.reddit-filter-container')) {
                if (redditFlairToggle) redditFlairToggle.classList.remove('open');
                if (redditFlairDropdown) redditFlairDropdown.classList.remove('open');
            }
        });

        // Select All functionality
        if (redditSelectAllCheckbox) {
            redditSelectAllCheckbox.addEventListener('change', (e) => {
                e.stopPropagation();
                const isChecked = e.target.checked;
                const flairCheckboxes = document.querySelectorAll('#redditFlairCheckboxes input[type="checkbox"]');

                flairCheckboxes.forEach(checkbox => {
                    checkbox.checked = isChecked;
                });

                if (isChecked) {
                    this.selectedFlairs.clear();
                } else {
                    this.selectedFlairs.clear();
                }

                this.updateFlairSelectionDisplay();
                this.updateRedditCarousel();
            });
        }

        if (refreshRedditBtn) {
            refreshRedditBtn.addEventListener('click', () => {
                this.manualRefresh();
            });
        }
    }

    async loadRedditData(forceRefresh = false) {
        try {
            console.log('🔄 Loading Reddit posts...');

            let jsonContent;
            let fetchMethod = 'unknown';

            try {
                // Method 1: Try our local server first (with short timeout)
                console.log('🟢 Trying local server...');
                const serverUrl = `http://localhost:6078/api/reddit?subreddit=${this.subreddit}&limit=25`;

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

                let response = await fetch(serverUrl, {
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json' }
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const serverData = await response.json();
                    if (serverData.success && serverData.posts) {
                        jsonContent = {
                            data: {
                                children: serverData.posts.map(post => ({ data: post }))
                            }
                        };
                        fetchMethod = 'local-server';
                        console.log('✅ Local server success!');
                    } else {
                        throw new Error('Local server returned invalid data');
                    }
                } else {
                    throw new Error('Local server failed');
                }
            } catch (serverError) {
                try {
                    // Method 2: Try direct Reddit API
                    console.log('🔴 Local server failed, trying direct Reddit API...');
                    const jsonUrl = `https://www.reddit.com/r/${this.subreddit}.json?limit=25`;
                    response = await fetch(jsonUrl, {
                        mode: 'cors',
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });

                    if (response.ok) {
                        jsonContent = await response.json();
                        fetchMethod = 'direct-api';
                        console.log('✅ Direct API success!');
                    } else {
                        throw new Error('Direct API failed');
                    }
                } catch (directError) {
                    // Method 3: CORS proxy fallback
                    console.log('🔴 Direct failed, trying CORS proxy...');
                    const jsonUrl = `https://www.reddit.com/r/${this.subreddit}.json?limit=25`;
                    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(jsonUrl)}`;
                    response = await fetch(proxyUrl);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();
                    jsonContent = JSON.parse(data.contents);
                    fetchMethod = 'cors-proxy';
                    console.log('✅ CORS proxy success!');
                }
            }


            const posts = [];

            if (jsonContent && jsonContent.data && jsonContent.data.children) {
                for (let i = 0; i < Math.min(jsonContent.data.children.length, this.maxPosts); i++) {
                    const postData = jsonContent.data.children[i].data;
                    const post = this.parseRedditJsonPost(postData);
                    if (post) posts.push(post);
                }
            }

            if (posts.length > 0) {
                this.posts = posts.sort((a, b) => b.publishDate - a.publishDate);
                this.lastUpdated = new Date();
                this.saveToCache();
                this.updateRedditCarousel();
                console.log(`✅ Loaded ${this.posts.length} real Reddit posts via ${fetchMethod}`);
            } else {
                console.error(`⚠️ No posts found via ${fetchMethod}! Check parsing logic.`);
                console.log('Raw JSON data:', jsonContent);
            }

        } catch (error) {
            console.error('❌ Error loading Reddit data:', error);
            console.log('🔄 Loading mock data as fallback...');
            this.loadMockData(); // Always load mock data if API fails
        }
    }

    parseRedditPost(entry) {
        try {
            const title = entry.getElementsByTagName('title')[0]?.textContent;
            const link = entry.getElementsByTagName('link')[0]?.getAttribute('href');
            const published = entry.getElementsByTagName('published')[0]?.textContent;
            const content = entry.getElementsByTagName('content')[0]?.textContent || '';
            const author = entry.getElementsByTagName('author')[0]?.getElementsByTagName('name')[0]?.textContent || 'Unknown';

            // Extract flair from content (Reddit RSS includes flair in content)
            const flairMatch = content.match(/\[([^\]]+)\]/);
            const flair = flairMatch ? flairMatch[1] : 'Discussion';

            // Extract post ID from link
            const postIdMatch = link.match(/\/r\/\w+\/comments\/([a-z0-9]+)\//);
            const postId = postIdMatch ? postIdMatch[1] : Math.random().toString(36).substr(2, 9);

            // Extract preview text from content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            let previewText = tempDiv.textContent || tempDiv.innerText || '';
            previewText = previewText.replace(/\[([^\]]+)\]/, '').trim(); // Remove flair
            previewText = previewText.substring(0, 200); // Limit preview

            return {
                id: postId,
                title: title.replace(/^r\/\w+\s*-\s*/, ''), // Remove subreddit prefix
                flair: flair,
                author: author.replace('u/', ''),
                publishDate: new Date(published),
                url: link,
                preview: previewText,
                upvotes: Math.floor(Math.random() * 500) + 1, // Reddit RSS doesn't include vote counts
                comments: Math.floor(Math.random() * 50) + 1
            };
        } catch (error) {
            console.error('Error parsing Reddit post:', error);
            return null;
        }
    }

    parseRedditJsonPost(postData) {
        try {
            const title = postData.title;
            const url = `https://reddit.com${postData.permalink}`;
            const published = new Date(postData.created_utc * 1000);
            const author = postData.author;
            const flair = postData.link_flair_text || 'Discussion';
            const upvotes = postData.ups || 0;
            const comments = postData.num_comments || 0;
            const preview = postData.selftext ? postData.selftext.substring(0, 200) : 'Click to read more...';

            return {
                id: postData.id,
                title: title,
                flair: flair,
                author: author,
                publishDate: published,
                url: url,
                preview: preview,
                upvotes: upvotes,
                comments: comments
            };
        } catch (error) {
            console.error('Error parsing Reddit JSON post:', error);
            return null;
        }
    }

    loadMockData() {
        const mockPosts = [
            {
                id: 'mock1',
                title: 'New Wave 15000+ Strategy Discussion',
                flair: 'Strategy',
                author: 'TowerMaster',
                publishDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
                url: 'https://reddit.com/r/TheTowerGame/mock1',
                preview: 'Found a new strategy that helped me push past wave 15000 consistently...',
                upvotes: 247,
                comments: 34
            },
            {
                id: 'mock2',
                title: 'Bug Report: Module not applying correctly',
                flair: 'Bug Report',
                author: 'GameDebugger',
                publishDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
                url: 'https://reddit.com/r/TheTowerGame/mock2',
                preview: 'Has anyone else noticed that the Amplifier module sometimes doesn\'t apply its bonus...',
                upvotes: 89,
                comments: 12
            },
            {
                id: 'mock3',
                title: 'Achievement Unlocked: First Tier 20!',
                flair: 'Achievement',
                author: 'ProudGamer',
                publishDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
                url: 'https://reddit.com/r/TheTowerGame/mock3',
                preview: 'Finally hit Tier 20 after weeks of grinding! Here\'s my build and strategy...',
                upvotes: 156,
                comments: 23
            },
            {
                id: 'mock4',
                title: 'Question about optimal research order',
                flair: 'Question',
                author: 'NewPlayer',
                publishDate: new Date(Date.now() - 8 * 60 * 60 * 1000),
                url: 'https://reddit.com/r/TheTowerGame/mock4',
                preview: 'I\'m still relatively new and wondering what the optimal research order should be...',
                upvotes: 73,
                comments: 18
            }
        ];

        this.posts = mockPosts;
        this.lastUpdated = new Date();
        this.saveToCache();
        this.updateRedditCarousel();
    }

    updateRedditCarousel() {
        // Find the Reddit grid
        const grid = document.querySelector('.reddit-grid');
        if (!grid) return;

        // Apply filters
        this.applyFilters();
        this.populateFlairFilter();

        // Clear existing content
        grid.innerHTML = '';

        // Create tiles container
        const tilesContainer = document.createElement('div');
        tilesContainer.className = 'tiles-container';

        // Duplicate posts for seamless carousel animation
        const postsForCarousel = [...this.filteredPosts, ...this.filteredPosts];

        // Create post tiles
        postsForCarousel.forEach((post, index) => {
            const tile = this.createRedditTile(post);
            tile.style.animationDelay = `${(index % this.filteredPosts.length) * 0.1}s`;
            tilesContainer.appendChild(tile);
        });

        grid.appendChild(tilesContainer);
    }

    createRedditTile(post) {
        console.log('🔧 Creating Reddit tile for post:', post);

        const tile = document.createElement('div');
        tile.className = 'tile-component reddit-tile';
        tile.dataset.postId = post.id;
        tile.dataset.tileId = post.id;

        const timeAgo = this.getTimeAgo(post.publishDate);
        const flairColor = this.getFlairColor(post.flair);

        console.log('🔧 Post title:', post.title);
        console.log('🔧 Post author:', post.author);
        console.log('🔧 Post flair:', post.flair);

        tile.innerHTML = `
            <div class="tile-image reddit-post-header" style="background: linear-gradient(135deg, ${flairColor} 0%, ${flairColor}88 100%);">
                <div class="reddit-flair-badge" style="background-color: ${flairColor};">
                    ${post.flair}
                </div>
                <div class="reddit-stats">
                    <span class="reddit-upvotes">↑ ${post.upvotes}</span>
                    <span class="reddit-comments">💬 ${post.comments}</span>
                </div>
            </div>
            <div class="tile-info reddit-info">
                <div class="control-bar">
                    <div class="controls">
                        <button class="control-btn play-btn" title="Open on Reddit"><span></span></button>
                        <button class="control-btn add-btn" title="Save Post"><span class="plus-icon"></span></button>
                        <button class="control-btn thumbs-up" title="Upvote"><span></span></button>
                        <button class="control-btn share-btn" title="Share"><span></span></button>
                    </div>
                    <button class="control-btn reveal-btn"><span class="chevron-down"></span></button>
                </div>
                <div class="show-info">
                    <span class="reddit-author">u/${post.author}</span>
                    <span class="reddit-time">${timeAgo}</span>
                    <span class="reddit-flair">${post.flair}</span>
                </div>
                <div class="reddit-title">
                    ${post.title}
                </div>
                <div class="reddit-preview">
                    ${this.truncateText(post.preview, 120)}
                </div>
            </div>
        `;

        // Add click handler to open Reddit post
        tile.addEventListener('click', (e) => {
            if (!e.target.closest('.control-btn')) {
                this.openRedditPost(post);
            }
        });

        return tile;
    }

    openRedditPost(post) {
        window.open(post.url, '_blank');
    }

    getFlairColor(flair) {
        const flairColors = {
            'Strategy': '#4CAF50',
            'Bug Report': '#F44336',
            'Achievement': '#FF9800',
            'Question': '#2196F3',
            'Discussion': '#9C27B0',
            'Guide': '#00BCD4',
            'News': '#795548',
            'Feedback': '#E91E63',
            'Meme': '#8BC34A',
            'Meta': '#607D8B'
        };
        return flairColors[flair] || '#666666';
    }

    populateFlairFilter() {
        console.log('🔧 Reddit: Populating flair filter...');
        const redditFlairChips = document.getElementById('redditFlairChips');
        if (!redditFlairChips) {
            console.log('❌ Reddit: redditFlairChips element not found!');
            console.log('Available elements:', document.querySelectorAll('[id*="reddit"], [id*="Flair"]'));
            return;
        }

        // Get unique flairs from posts
        const uniqueFlairs = [...new Set(this.posts.map(p => p.flair))].sort();

        // Remember current chip states before clearing
        const currentChipStates = {};
        const existingChips = redditFlairChips.querySelectorAll('.filter-chip');
        existingChips.forEach(chip => {
            currentChipStates[chip.dataset.flair] = chip.classList.contains('active');
        });

        console.log('🔧 Current flair chip states:', currentChipStates);

        // Clear existing chips
        redditFlairChips.innerHTML = '';

        // Add flair filter chips
        uniqueFlairs.forEach(flair => {
            const chip = document.createElement('div');
            chip.className = 'filter-chip';
            chip.dataset.flair = flair;

            // Add colored dot for flair
            const colorDot = document.createElement('span');
            colorDot.className = 'flair-color';
            colorDot.style.backgroundColor = this.getFlairColor(flair);

            chip.appendChild(colorDot);
            chip.appendChild(document.createTextNode(flair));

            // Restore previous state or default to active
            const shouldBeActive = currentChipStates.hasOwnProperty(flair) ?
                currentChipStates[flair] : true;

            if (shouldBeActive) {
                chip.classList.add('active');
            }

            console.log('🔧 Flair', flair, 'is', shouldBeActive ? 'active' : 'inactive');

            // Add click handler
            chip.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleFlairChipClick(flair, chip);
            });

            redditFlairChips.appendChild(chip);
        });
    }

    handleFlairChipClick(flair, chipElement) {
        console.log('🔧 Reddit: Flair chip clicked:', flair);

        if (chipElement.classList.contains('active')) {
            // Deactivating chip - remove from filter
            chipElement.classList.remove('active');
            console.log('🔧 Deactivated flair:', flair);
        } else {
            // Activating chip - add to filter
            chipElement.classList.add('active');
            console.log('🔧 Activated flair:', flair);
        }

        // Check if any chips are still active
        const allChips = document.querySelectorAll('#redditFlairChips .filter-chip');
        const activeChips = document.querySelectorAll('#redditFlairChips .filter-chip.active');

        console.log('🔧 Active flair chips:', activeChips.length, 'of', allChips.length);

        // If no chips are active, activate all (show everything)
        if (activeChips.length === 0) {
            console.log('🔧 No flair chips active, showing all posts');
            allChips.forEach(chip => chip.classList.add('active'));
        }

        this.updateRedditCarousel();
    }

    updateFlairSelectionDisplay() {
        const selectedCountSpan = document.querySelector('.reddit-selected-count');
        if (!selectedCountSpan) return;

        const totalFlairs = document.querySelectorAll('#redditFlairCheckboxes input[type="checkbox"]').length;

        if (this.selectedFlairs.size === 0 || this.selectedFlairs.size === totalFlairs) {
            selectedCountSpan.textContent = 'All Posts';
        } else if (this.selectedFlairs.size === 1) {
            selectedCountSpan.textContent = [...this.selectedFlairs][0];
        } else {
            selectedCountSpan.textContent = `${this.selectedFlairs.size} Flairs`;
        }
    }

    applyFilters() {
        console.log('🔧 Reddit: Applying filters...');
        let filtered = [...this.posts];
        console.log('🔧 Starting with', filtered.length, 'posts');

        // Apply flair filter - show only active flairs
        const activeChips = document.querySelectorAll('#redditFlairChips .filter-chip.active');
        console.log('🔧 Found', activeChips.length, 'active flair chips');

        if (activeChips.length > 0) {
            const activeFlairs = Array.from(activeChips).map(chip => chip.dataset.flair);
            console.log('🔧 Active flairs:', activeFlairs);

            const originalCount = filtered.length;
            filtered = filtered.filter(post => activeFlairs.includes(post.flair));
            console.log('🔧 Filtered from', originalCount, 'to', filtered.length, 'posts');
        }

        // Sort by publish date (newest first)
        filtered.sort((a, b) => b.publishDate - a.publishDate);

        this.filteredPosts = filtered;
        console.log('🔧 Final filtered posts:', this.filteredPosts.length);
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

    async manualRefresh() {
        const refreshBtn = document.getElementById('refreshReddit');
        if (refreshBtn) {
            refreshBtn.classList.add('refreshing');
        }

        try {
            await this.loadRedditData(true); // Force refresh
            this.showNotification('Reddit posts updated!');
        } catch (error) {
            console.error('Error refreshing Reddit:', error);
            this.showNotification('Error updating Reddit posts');
        }

        if (refreshBtn) {
            refreshBtn.classList.remove('refreshing');
        }
    }

    setupPeriodicUpdate() {
        // Check for updates every 15 minutes
        setInterval(() => {
            this.loadRedditData();
        }, this.updateInterval);
    }

    loadCachedData() {
        try {
            const cached = localStorage.getItem('reddit_posts');
            if (cached) {
                const data = JSON.parse(cached);
                this.posts = data.posts || [];
                this.lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : null;
            }
        } catch (error) {
            console.error('Error loading cached Reddit data:', error);
        }
    }

    saveToCache() {
        try {
            const data = {
                posts: this.posts,
                lastUpdated: this.lastUpdated
            };
            localStorage.setItem('reddit_posts', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving Reddit cache:', error);
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'reddit-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #FF4500, #CC3300);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideInUp 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutDown 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Export for use in main application
window.RedditRSSManager = RedditRSSManager;