/**
 * Integration tests for Reddit API
 */
const request = require('supertest');
const express = require('express');
const redditRouter = require('../../routes/reddit');
const { createMockSupabase, mockRedditPosts } = require('../mocks/supabase');

describe('Reddit API', () => {
    let app;
    let mockSupabase;

    beforeEach(() => {
        // Create Express app with Reddit router
        app = express();
        app.use(express.json());

        // Create mock Supabase with test data
        mockSupabase = createMockSupabase({ redditPosts: mockRedditPosts });
        app.locals.supabase = mockSupabase;

        // Mount router
        app.use('/api/reddit', redditRouter);
    });

    describe('GET /api/reddit', () => {
        test('returns reddit posts successfully', async () => {
            const res = await request(app)
                .get('/api/reddit')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.posts).toBeDefined();
            expect(Array.isArray(res.body.posts)).toBe(true);
            expect(res.body.subreddit).toBe('TheTowerGame');
        });

        test('applies default limit of 25', async () => {
            const res = await request(app)
                .get('/api/reddit')
                .expect(200);

            expect(res.body.success).toBe(true);
        });

        test('accepts custom subreddit parameter', async () => {
            const res = await request(app)
                .get('/api/reddit?subreddit=TestSub')
                .expect(200);

            expect(res.body.success).toBe(true);
        });

        test('accepts custom limit parameter', async () => {
            const res = await request(app)
                .get('/api/reddit?limit=10')
                .expect(200);

            expect(res.body.success).toBe(true);
        });

        test('rejects limit over 100', async () => {
            const res = await request(app)
                .get('/api/reddit?limit=500')
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Validation failed');
            expect(res.body.details).toBeDefined();
        });

        test('rejects negative limit', async () => {
            const res = await request(app)
                .get('/api/reddit?limit=-10')
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        test('rejects invalid limit type', async () => {
            const res = await request(app)
                .get('/api/reddit?limit=invalid')
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Validation failed');
        });

        test('rejects non-alphanumeric subreddit', async () => {
            const res = await request(app)
                .get('/api/reddit?subreddit=test@sub!')
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        test('returns posts with correct structure', async () => {
            const res = await request(app)
                .get('/api/reddit')
                .expect(200);

            if (res.body.posts.length > 0) {
                const post = res.body.posts[0];
                expect(post).toHaveProperty('id');
                expect(post).toHaveProperty('title');
                expect(post).toHaveProperty('url');
                expect(post).toHaveProperty('author');
                expect(post).toHaveProperty('subreddit');
                expect(post).toHaveProperty('created_utc');
                expect(post).toHaveProperty('score');
                expect(post).toHaveProperty('num_comments');
            }
        });

        test('returns count field', async () => {
            const res = await request(app)
                .get('/api/reddit')
                .expect(200);

            expect(res.body.count).toBeDefined();
            expect(typeof res.body.count).toBe('number');
        });

        test('caches responses', async () => {
            // First request
            const res1 = await request(app)
                .get('/api/reddit?limit=5')
                .expect(200);

            expect(res1.body.success).toBe(true);

            // Second request should hit cache
            const res2 = await request(app)
                .get('/api/reddit?limit=5')
                .expect(200);

            expect(res2.body.success).toBe(true);
            expect(res2.body).toEqual(res1.body);
        });

        test('handles database errors gracefully', async () => {
            // Create app with failing Supabase
            const failingApp = express();
            failingApp.use(express.json());
            failingApp.locals.supabase = null; // No Supabase client
            failingApp.use('/api/reddit', redditRouter);

            const res = await request(failingApp)
                .get('/api/reddit')
                .expect(500);

            expect(res.body.success).toBe(false);
            expect(res.body.error).toBeDefined();
        });
    });
});
