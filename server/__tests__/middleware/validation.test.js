/**
 * Tests for validation middleware
 */
const { validate, schemas, sanitize } = require('../../middleware/validation');

describe('Validation Middleware', () => {
    describe('Reddit Query Schema', () => {
        test('validates valid reddit query', () => {
            const { error, value } = schemas.redditQuery.validate({
                subreddit: 'TheTowerGame',
                limit: 25,
                sort: 'hot'
            });

            expect(error).toBeUndefined();
            expect(value.subreddit).toBe('TheTowerGame');
            expect(value.limit).toBe(25);
        });

        test('applies default values', () => {
            const { error, value } = schemas.redditQuery.validate({});

            expect(error).toBeUndefined();
            expect(value.subreddit).toBe('TheTowerGame');
            expect(value.limit).toBe(25);
            expect(value.sort).toBe('hot');
        });

        test('rejects limit over 100', () => {
            const { error } = schemas.redditQuery.validate({ limit: 500 });

            expect(error).toBeDefined();
            expect(error.details[0].message).toContain('less than or equal to 100');
        });

        test('rejects invalid sort option', () => {
            const { error } = schemas.redditQuery.validate({ sort: 'invalid' });

            expect(error).toBeDefined();
            expect(error.details[0].message).toContain('must be one of');
        });

        test('rejects non-alphanumeric subreddit', () => {
            const { error } = schemas.redditQuery.validate({ subreddit: 'test@sub' });

            expect(error).toBeDefined();
        });
    });

    describe('Tower Stats Schema', () => {
        test('validates complete tower stats', () => {
            const { error, value } = schemas.towerStats.validate({
                tier: 11,
                wave: 8500,
                coins: 1500000,
                cells: 500000,
                shards: 1000,
                gameTime: '2d 6h 30m',
                realTime: '11h 8m',
                death: 'Boss',
                isTournament: false
            });

            expect(error).toBeUndefined();
            expect(value.tier).toBe(11);
            expect(value.wave).toBe(8500);
        });

        test('rejects tier over 50', () => {
            const { error } = schemas.towerStats.validate({
                tier: 100,
                wave: 1000,
                coins: 1000,
                cells: 1000
            });

            expect(error).toBeDefined();
            expect(error.details[0].message).toContain('less than or equal to 50');
        });

        test('rejects negative coins', () => {
            const { error } = schemas.towerStats.validate({
                tier: 11,
                wave: 1000,
                coins: -1000,
                cells: 1000
            });

            expect(error).toBeDefined();
        });

        test('requires tier, wave, coins, cells', () => {
            const { error } = schemas.towerStats.validate({});

            expect(error).toBeDefined();
            expect(error.details).toHaveLength(4); // All 4 required fields missing
        });
    });

    describe('Pagination Schema', () => {
        test('validates pagination params', () => {
            const { error, value } = schemas.pagination.validate({
                page: 2,
                limit: 50,
                sortBy: 'created_at',
                sortOrder: 'desc'
            });

            expect(error).toBeUndefined();
            expect(value.page).toBe(2);
            expect(value.limit).toBe(50);
        });

        test('applies default pagination', () => {
            const { error, value } = schemas.pagination.validate({});

            expect(error).toBeUndefined();
            expect(value.page).toBe(1);
            expect(value.limit).toBe(20);
            expect(value.sortOrder).toBe('desc');
        });

        test('rejects invalid sort order', () => {
            const { error } = schemas.pagination.validate({ sortOrder: 'invalid' });

            expect(error).toBeDefined();
        });
    });

    describe('Object ID Schema', () => {
        test('validates UUID', () => {
            const { error } = schemas.objectId.validate({
                id: '123e4567-e89b-12d3-a456-426614174000'
            });

            expect(error).toBeUndefined();
        });

        test('validates positive integer', () => {
            const { error } = schemas.objectId.validate({ id: 123 });

            expect(error).toBeUndefined();
        });

        test('rejects negative integer', () => {
            const { error } = schemas.objectId.validate({ id: -1 });

            expect(error).toBeDefined();
        });

        test('rejects invalid string', () => {
            const { error } = schemas.objectId.validate({ id: 'invalid' });

            expect(error).toBeDefined();
        });
    });

    describe('Tournament Schemas', () => {
        test('validates tournament entry', () => {
            const { error, value } = schemas.tournament.validate({
                date: '2025-01-01',
                name: 'Weekly Championship',
                rank: 3,
                score: 125000,
                tier: 12,
                wave: 850,
                rewards: '500 gems'
            });

            expect(error).toBeUndefined();
            expect(value.rank).toBe(3);
        });

        test('validates video ID (11 chars)', () => {
            const { error } = schemas.videoId.validate({ videoId: 'dQw4w9WgXcQ' });

            expect(error).toBeUndefined();
        });

        test('rejects invalid video ID length', () => {
            const { error } = schemas.videoId.validate({ videoId: 'short' });

            expect(error).toBeDefined();
        });
    });

    describe('Run Category Schema', () => {
        test('validates valid categories', () => {
            const valid = ['milestone', 'tournament', 'farm', '', null];

            valid.forEach(category => {
                const { error } = schemas.runCategory.validate({ category });
                expect(error).toBeUndefined();
            });
        });

        test('rejects invalid category', () => {
            const { error } = schemas.runCategory.validate({ category: 'invalid' });

            expect(error).toBeDefined();
        });
    });

    describe('Sanitization Helpers', () => {
        test('cleanString removes dangerous characters', () => {
            const dirty = '<script>alert("xss")</script>';
            const clean = sanitize.cleanString(dirty);

            expect(clean).not.toContain('<');
            expect(clean).not.toContain('>');
        });

        test('cleanString trims whitespace', () => {
            const dirty = '  test  ';
            const clean = sanitize.cleanString(dirty);

            expect(clean).toBe('test');
        });

        test('cleanObject recursively cleans strings', () => {
            const dirty = {
                name: '<script>test</script>',
                nested: {
                    value: '  dirty  '
                }
            };

            const clean = sanitize.cleanObject(dirty);

            expect(clean.name).not.toContain('<');
            expect(clean.nested.value).toBe('dirty');
        });
    });

    describe('Validate Middleware Function', () => {
        test('calls next() on valid data', () => {
            const middleware = validate(schemas.pagination, 'query');
            const req = { query: { page: 1, limit: 20 } };
            const res = {};
            const next = jest.fn();

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('returns 400 on invalid data', () => {
            const middleware = validate(schemas.pagination, 'query');
            const req = { query: { page: -1 } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Validation failed'
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        test('strips unknown properties', () => {
            const middleware = validate(schemas.pagination, 'query');
            const req = { query: { page: 1, limit: 20, unknown: 'test' } };
            const res = {};
            const next = jest.fn();

            middleware(req, res, next);

            expect(req.query.unknown).toBeUndefined();
        });
    });
});
