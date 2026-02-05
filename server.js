/**
 * GAROLD'S BLOG - Server
 * Simple Node.js server for file-based blog storage
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BLOGS_DIR = path.join(__dirname, 'saved-blogs');
const PUBLIC_DIR = __dirname;

// Ensure saved-blogs directory exists
if (!fs.existsSync(BLOGS_DIR)) {
    fs.mkdirSync(BLOGS_DIR, { recursive: true });
}

// MIME types for static files
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

// Generate filename from title and timestamp
function generateFilename(title, timestamp = null) {
    if (!timestamp) {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hour = String(d.getHours()).padStart(2, '0');
        const minute = String(d.getMinutes()).padStart(2, '0');
        timestamp = `${year}-${month}-${day}_${hour}${minute}`;
    }

    const sanitized = title
        .replace(/[^a-zA-Z0-9]+/g, '-') // Allow mixed case
        .replace(/^-|-$/g, '')
        .substring(0, 50);

    const finalTitle = sanitized || 'untitled';

    return `${timestamp}_${finalTitle}.json`;
}

// Parse request body
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
}

// Send JSON response
function sendJSON(res, data, status = 200) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data));
}

// Serve static files
function serveStatic(res, filePath) {
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// API Handlers
const api = {
    // GET /api/posts - List all posts
    listPosts(req, res) {
        fs.readdir(BLOGS_DIR, (err, files) => {
            if (err) {
                sendJSON(res, { error: 'Failed to read posts' }, 500);
                return;
            }

            const posts = [];
            const jsonFiles = files.filter(f => f.endsWith('.json'));

            if (jsonFiles.length === 0) {
                sendJSON(res, []);
                return;
            }

            let processed = 0;
            jsonFiles.forEach(file => {
                fs.readFile(path.join(BLOGS_DIR, file), 'utf8', (err, data) => {
                    processed++;
                    if (!err) {
                        try {
                            const post = JSON.parse(data);
                            post.filename = file;
                            posts.push(post);
                        } catch (e) { }
                    }
                    if (processed === jsonFiles.length) {
                        // Sort by modified date descending
                        posts.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
                        sendJSON(res, posts);
                    }
                });
            });
        });
    },

    // POST /api/posts - Create/Update post
    async savePost(req, res) {
        try {
            const post = await parseBody(req);
            const now = new Date().toISOString();

            // Generate ID if new post
            if (!post.id) {
                post.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                post.createdAt = now;
            }
            post.modifiedAt = now;

            // Determine timestamp to use for filename
            let fileTimestamp = null;
            if (post.oldFilename) {
                // Try to extract timestamp from old filename: YYYY-MM-DD_HHmm_Title.json
                const match = post.oldFilename.match(/^(\d{4}-\d{2}-\d{2}_\d{4})_/);
                if (match) {
                    fileTimestamp = match[1];
                }
            }

            // Generate filename (reuse timestamp if updating, else generate new)
            const filename = generateFilename(post.title || 'untitled', fileTimestamp);
            const filePath = path.join(BLOGS_DIR, filename);

            // If updating, delete old file with different name
            if (post.oldFilename && post.oldFilename !== filename) {
                const oldPath = path.join(BLOGS_DIR, post.oldFilename);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            delete post.oldFilename;

            post.filename = filename;

            fs.writeFile(filePath, JSON.stringify(post, null, 2), 'utf8', (err) => {
                if (err) {
                    sendJSON(res, { error: 'Failed to save post' }, 500);
                    return;
                }
                sendJSON(res, post);
            });
        } catch (e) {
            sendJSON(res, { error: 'Invalid request' }, 400);
        }
    },

    // DELETE /api/posts/:filename - Delete post
    deletePost(req, res, filename) {
        const filePath = path.join(BLOGS_DIR, filename);

        if (!fs.existsSync(filePath)) {
            sendJSON(res, { error: 'Post not found' }, 404);
            return;
        }

        fs.unlink(filePath, (err) => {
            if (err) {
                sendJSON(res, { error: 'Failed to delete post' }, 500);
                return;
            }
            sendJSON(res, { success: true });
        });
    }
};

// Create server
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    // API routes
    if (pathname === '/api/posts') {
        if (req.method === 'GET') {
            api.listPosts(req, res);
        } else if (req.method === 'POST') {
            api.savePost(req, res);
        } else {
            sendJSON(res, { error: 'Method not allowed' }, 405);
        }
        return;
    }

    if (pathname.startsWith('/api/posts/') && req.method === 'DELETE') {
        const filename = decodeURIComponent(pathname.replace('/api/posts/', ''));
        api.deletePost(req, res, filename);
        return;
    }

    // Static file serving
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(PUBLIC_DIR, filePath);

    // Security: prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    serveStatic(res, filePath);
});

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║   🖊️  Garold's Blog Server                 ║
║                                            ║
║   Local:    http://localhost:${PORT}          ║
║   Blogs:    ./saved-blogs/                 ║
║                                            ║
╚════════════════════════════════════════════╝
    `);
});
