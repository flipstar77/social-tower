/**
 * Reddit RSS Manager - Refactored
 * Extends BaseFeedManager with Reddit-specific functionality
 */

class RedditRSSManager extends BaseFeedManager {
    constructor() {
        super({
            updateInterval: window.APP_CONFIG?.updateIntervals.reddit || 900000,
            maxItems: window.REDDIT_CONFIG?.maxPosts || 25,
            defaultSort: 'hot',
            cacheKey: window.APP_CONFIG?.cache.reddit.key || 'reddit_posts',
            cacheMaxAge: window.APP_CONFIG?.cache.reddit.maxAge || 900000,
            refreshButtonId: 'refreshReddit',
            notificationColor: '#FF4500'
        });

        this.subreddit = window.REDDIT_CONFIG?.subreddit || 'TheTowerGame';
        this.flairColors = window.REDDIT_CONFIG?.flairColors || {};
        this.filterChips = null;
    }

    /**
     * Get grid selector for Reddit
     */
    getGridSelector() {
        return '.reddit-grid';
    }

    /**
     * Load Reddit posts data from backend (uses scraped database)
     */
    async loadData(forceRefresh = false) {
        try {
            console.log('🔄 Loading Reddit posts from backend...');

            // Use backend API which pulls from scraped database
            const apiBaseUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:6078'
                : 'https://social-tower-production.up.railway.app';

            const url = `${apiBaseUrl}/api/reddit?subreddit=${this.subreddit}&limit=${this.maxItems}`;

            const result = await this.apiClient.get(url, { timeout: 5000, retries: 1 });

            if (result.success && result.data.posts) {
                // Parse posts from backend response
                const posts = [];
                for (const postData of result.data.posts.slice(0, this.maxItems)) {
                    const post = this.parseItem(postData);
                    if (post) posts.push(post);
                }

                if (posts.length > 0) {
                    this.items = posts.sort((a, b) => b.publishDate - a.publishDate);
                    this.lastUpdated = new Date();
                    this.saveToCache();
                    this.updateCarousel();
                    console.log(`✅ Loaded ${this.items.length} posts from backend (scraped database)`);
                } else {
                    throw new Error('No posts found in backend response');
                }
            } else {
                throw new Error('Backend returned invalid data');
            }

        } catch (error) {
            console.error('❌ Error loading Reddit data from backend:', error);
            console.log('🔄 Using cached or mock data...');

            if (this.items.length === 0) {
                this.loadMockData();
            } else {
                this.updateCarousel();
            }
        }
    }

    /**
     * Parse Reddit post data
     */
    parseItem(postData) {
        try {
            return {
                id: postData.id,
                title: postData.title,
                flair: postData.link_flair_text || 'Discussion',
                author: postData.author,
                publishDate: new Date(postData.created_utc * 1000),
                url: `https://reddit.com${postData.permalink}`,
                preview: postData.selftext ? postData.selftext.substring(0, 200) : 'Click to read more...',
                upvotes: postData.ups || 0,
                comments: postData.num_comments || 0
            };
        } catch (error) {
            console.error('Error parsing Reddit post:', error);
            return null;
        }
    }

    /**
     * Load mock data as fallback
     */
    loadMockData() {
        console.log('📋 Loading mock Reddit data (backend temporarily unavailable)...');
        this.items = [
            {
                id: 'mock1',
                title: 'New Wave 15000+ Strategy Discussion',
                flair: 'Strategy',
                author: 'TowerMaster',
                publishDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
                url: 'https://reddit.com/r/TheTowerGame',
                preview: 'Found a new strategy that helped me push past wave 15000 using Black Hole and Chain Lightning...',
                upvotes: 247,
                comments: 34
            },
            {
                id: 'mock2',
                title: 'Bug Report: Module not applying correctly',
                flair: 'Bug Report',
                author: 'GameDebugger',
                publishDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
                url: 'https://reddit.com/r/TheTowerGame',
                preview: 'The Amplifier module sometimes doesn\'t apply its bonus after tier 10...',
                upvotes: 89,
                comments: 12
            },
            {
                id: 'mock3',
                title: 'Tier 14 Tournament Winners - Congratulations!',
                flair: 'News',
                author: 'TowerOfficial',
                publishDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
                url: 'https://reddit.com/r/TheTowerGame',
                preview: 'Congratulations to all Tier 14 tournament winners! Amazing runs this week...',
                upvotes: 432,
                comments: 67
            },
            {
                id: 'mock4',
                title: 'Question: Best modules for Death Wave build?',
                flair: 'Question',
                author: 'NewPlayer2024',
                publishDate: new Date(Date.now() - 8 * 60 * 60 * 1000),
                url: 'https://reddit.com/r/TheTowerGame',
                preview: 'I\'m trying to optimize my Death Wave build. What modules work best?',
                upvotes: 56,
                comments: 23
            },
            {
                id: 'mock5',
                title: 'Update 2.5.0 - New Core Module Released!',
                flair: 'News',
                author: 'TowerDev',
                publishDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
                url: 'https://reddit.com/r/TheTowerGame',
                preview: 'Patch notes for version 2.5.0 including the new Quantum Core module...',
                upvotes: 891,
                comments: 145
            },
            {
                id: 'mock6',
                title: 'My first wave 10000! Tips for new players',
                flair: 'Achievement',
                author: 'ProgressPlayer',
                publishDate: new Date(Date.now() - 16 * 60 * 60 * 1000),
                url: 'https://reddit.com/r/TheTowerGame',
                preview: 'Finally hit wave 10000! Here are the strategies that worked for me...',
                upvotes: 178,
                comments: 41
            }
        ];

        this.lastUpdated = new Date();
        this.saveToCache();
        this.updateCarousel();
        console.log(`✅ Loaded ${this.items.length} mock Reddit posts`);
    }

    /**
     * Create Reddit post tile
     */
    createTile(post) {
        const tile = document.createElement('div');
        tile.className = 'tile-component reddit-tile';
        tile.dataset.postId = post.id;
        tile.dataset.tileId = post.id;

        const timeAgo = TextUtils.getTimeAgo(post.publishDate);
        const flairColor = this.getFlairColor(post.flair);

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
                    ${TextUtils.truncate(post.preview, 120)}
                </div>
            </div>
        `;

        tile.addEventListener('click', (e) => {
            if (!e.target.closest('.control-btn')) {
                this.openItem(post);
            }
        });

        return tile;
    }

    /**
     * Get flair color
     */
    getFlairColor(flair) {
        return this.flairColors[flair] || '#666666';
    }

    /**
     * Bind filter events
     */
    bindFilterEvents() {
        console.log('🔧 Reddit: Binding filter events...');

        const refreshBtn = document.getElementById('refreshReddit');
        if (refreshBtn && !refreshBtn.hasAttribute('data-reddit-bound')) {
            refreshBtn.setAttribute('data-reddit-bound', 'true');
            refreshBtn.addEventListener('click', () => {
                this.manualRefresh();
            });
        }
    }

    /**
     * Populate filter UI with flair chips
     */
    populateFilterUI() {
        const chipContainer = document.getElementById('redditFlairChips');
        if (!chipContainer) return;

        // Initialize filter chips if not already done
        if (!this.filterChips) {
            this.filterChips = new FilterChips('redditFlairChips', {
                multiSelect: true,
                onChange: (activeFilters) => {
                    console.log('Active flair filters:', activeFilters);
                    this.updateCarousel();
                }
            });
        }

        // Get unique flairs from posts
        const uniqueFlairs = [...new Set(this.items.map(p => p.flair))].sort();

        // Convert to filter format
        const filters = uniqueFlairs.map(flair => ({
            value: flair,
            label: flair,
            color: this.getFlairColor(flair)
        }));

        this.filterChips.render(filters);
    }

    /**
     * Apply flair filters
     */
    applyCustomFilters(items) {
        if (!this.filterChips) return items;

        const activeFlairs = this.filterChips.getActiveFilters();

        // If all selected or none, show all
        const uniqueFlairs = [...new Set(this.items.map(p => p.flair))];
        if (activeFlairs.length === 0 || activeFlairs.length === uniqueFlairs.length) {
            return items;
        }

        return items.filter(post => activeFlairs.includes(post.flair));
    }
}

// Export for use in main application
window.RedditRSSManager = RedditRSSManager;
