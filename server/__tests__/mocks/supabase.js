/**
 * Mock Supabase client for testing
 * Provides Jest mock implementations of Supabase methods
 */

const mockSupabaseClient = {
    from: jest.fn((table) => {
        const query = {
            select: jest.fn(() => query),
            insert: jest.fn(() => query),
            update: jest.fn(() => query),
            delete: jest.fn(() => query),
            eq: jest.fn(() => query),
            neq: jest.fn(() => query),
            gt: jest.fn(() => query),
            gte: jest.fn(() => query),
            lt: jest.fn(() => query),
            lte: jest.fn(() => query),
            like: jest.fn(() => query),
            ilike: jest.fn(() => query),
            in: jest.fn(() => query),
            order: jest.fn(() => query),
            limit: jest.fn(() => query),
            range: jest.fn(() => query),
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
            maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
            then: jest.fn((resolve) => resolve({ data: [], error: null })),
        };
        return query;
    }),

    auth: {
        getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
        signOut: jest.fn(() => Promise.resolve({ error: null })),
    },

    rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
};

/**
 * Create a mock Supabase instance with predefined responses
 */
const createMockSupabase = (mockData = {}) => {
    const client = { ...mockSupabaseClient };

    // Override with custom mock data if provided
    if (mockData.redditPosts) {
        client.from = jest.fn((table) => {
            if (table === 'reddit_posts') {
                return {
                    select: jest.fn(() => ({
                        eq: jest.fn(() => ({
                            order: jest.fn(() => ({
                                limit: jest.fn(() => Promise.resolve({
                                    data: mockData.redditPosts,
                                    error: null
                                }))
                            }))
                        }))
                    }))
                };
            }
            return mockSupabaseClient.from(table);
        });
    }

    return client;
};

/**
 * Mock reddit posts data
 */
const mockRedditPosts = [
    {
        post_id: 'test123',
        title: 'Test Post 1',
        url: 'https://reddit.com/r/test/test123',
        author: 'testuser',
        subreddit: 'TheTowerGame',
        created_at: '2025-01-01T00:00:00Z',
        score: 100,
        num_comments: 10,
        body: 'Test body',
        thumbnail_url: 'https://example.com/thumb.jpg',
        is_video: false,
        flair: 'Discussion'
    },
    {
        post_id: 'test456',
        title: 'Test Post 2',
        url: 'https://reddit.com/r/test/test456',
        author: 'testuser2',
        subreddit: 'TheTowerGame',
        created_at: '2025-01-02T00:00:00Z',
        score: 50,
        num_comments: 5,
        body: 'Test body 2',
        thumbnail_url: 'https://example.com/thumb2.jpg',
        is_video: false,
        flair: 'Guide'
    }
];

/**
 * Mock tower runs data
 */
const mockTowerRuns = [
    {
        id: 1,
        discord_user_id: 'user123',
        tier: 11,
        wave: 8500,
        coins: '1.5M',
        cells: 500000,
        shards: 1000,
        game_time: '2d 6h',
        real_time: '11h 8m',
        death: 'Boss',
        created_at: '2025-01-01T00:00:00Z',
        category: 'farm'
    },
    {
        id: 2,
        discord_user_id: 'user123',
        tier: 12,
        wave: 9000,
        coins: '2.0M',
        cells: 600000,
        shards: 1200,
        game_time: '2d 12h',
        real_time: '12h 30m',
        death: 'Wave',
        created_at: '2025-01-02T00:00:00Z',
        category: 'tournament'
    }
];

module.exports = {
    mockSupabaseClient,
    createMockSupabase,
    mockRedditPosts,
    mockTowerRuns
};
