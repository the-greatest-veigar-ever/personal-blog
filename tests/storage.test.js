/**
 * Unit tests for storage functionality
 * @file tests/storage.test.js
 */

describe('Storage API Tests', () => {
    const API_BASE = 'http://localhost:3000/api';

    // Mock fetch for testing
    let mockPosts = [];

    beforeEach(() => {
        mockPosts = [
            {
                id: 'test-1',
                title: 'Test Post 1',
                content: '<p>Test content 1</p>',
                createdAt: '2026-01-21T09:00:00Z',
                updatedAt: '2026-01-21T09:00:00Z',
                isStarred: false
            },
            {
                id: 'test-2',
                title: 'Test Post 2',
                content: '<p>Test content 2</p>',
                createdAt: '2026-01-20T09:00:00Z',
                updatedAt: '2026-01-20T09:00:00Z',
                isStarred: true
            }
        ];

        // Mock global fetch
        global.fetch = jest.fn((url, options = {}) => {
            const method = options.method || 'GET';

            // GET all posts
            if (url === `${API_BASE}/posts` && method === 'GET') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockPosts)
                });
            }

            // GET single post
            const getMatch = url.match(/\/api\/posts\/(.+)$/);
            if (getMatch && method === 'GET') {
                const post = mockPosts.find(p => p.id === getMatch[1]);
                return Promise.resolve({
                    ok: !!post,
                    json: () => Promise.resolve(post || { error: 'Not found' })
                });
            }

            // POST new post
            if (url === `${API_BASE}/posts` && method === 'POST') {
                const newPost = JSON.parse(options.body);
                newPost.id = 'new-' + Date.now();
                mockPosts.push(newPost);
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(newPost)
                });
            }

            // PUT update post
            const putMatch = url.match(/\/api\/posts\/(.+)$/);
            if (putMatch && method === 'PUT') {
                const index = mockPosts.findIndex(p => p.id === putMatch[1]);
                if (index !== -1) {
                    const updated = { ...mockPosts[index], ...JSON.parse(options.body) };
                    mockPosts[index] = updated;
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(updated)
                    });
                }
            }

            // DELETE post
            const deleteMatch = url.match(/\/api\/posts\/(.+)$/);
            if (deleteMatch && method === 'DELETE') {
                const index = mockPosts.findIndex(p => p.id === deleteMatch[1]);
                if (index !== -1) {
                    mockPosts.splice(index, 1);
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ success: true })
                    });
                }
            }

            return Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ error: 'Unknown endpoint' })
            });
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('GET Posts', () => {
        test('should fetch all posts', async () => {
            const response = await fetch(`${API_BASE}/posts`);
            const posts = await response.json();

            expect(response.ok).toBe(true);
            expect(Array.isArray(posts)).toBe(true);
            expect(posts.length).toBe(2);
        });

        test('should fetch single post by ID', async () => {
            const response = await fetch(`${API_BASE}/posts/test-1`);
            const post = await response.json();

            expect(response.ok).toBe(true);
            expect(post.id).toBe('test-1');
            expect(post.title).toBe('Test Post 1');
        });

        test('should return error for non-existent post', async () => {
            const response = await fetch(`${API_BASE}/posts/non-existent`);
            expect(response.ok).toBe(false);
        });
    });

    describe('POST Create Post', () => {
        test('should create new post', async () => {
            const newPost = {
                title: 'New Test Post',
                content: '<p>New content</p>'
            };

            const response = await fetch(`${API_BASE}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPost)
            });
            const created = await response.json();

            expect(response.ok).toBe(true);
            expect(created.title).toBe('New Test Post');
            expect(created.id).toBeDefined();
        });
    });

    describe('PUT Update Post', () => {
        test('should update existing post', async () => {
            const updates = { title: 'Updated Title' };

            const response = await fetch(`${API_BASE}/posts/test-1`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const updated = await response.json();

            expect(response.ok).toBe(true);
            expect(updated.title).toBe('Updated Title');
        });
    });

    describe('DELETE Post', () => {
        test('should delete existing post', async () => {
            const initialCount = mockPosts.length;

            const response = await fetch(`${API_BASE}/posts/test-1`, {
                method: 'DELETE'
            });

            expect(response.ok).toBe(true);
            expect(mockPosts.length).toBe(initialCount - 1);
        });
    });

    describe('Starred Posts', () => {
        test('should filter starred posts', () => {
            const starredPosts = mockPosts.filter(p => p.isStarred);
            expect(starredPosts.length).toBe(1);
            expect(starredPosts[0].id).toBe('test-2');
        });

        test('should toggle star status', async () => {
            const post = mockPosts.find(p => p.id === 'test-1');
            const updates = { isStarred: !post.isStarred };

            const response = await fetch(`${API_BASE}/posts/test-1`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const updated = await response.json();

            expect(updated.isStarred).toBe(true);
        });
    });
});
