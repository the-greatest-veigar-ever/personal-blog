/**
 * GAROLD'S BLOG - Storage Manager
 * Handles saving and loading blog posts via local server API or Firebase Firestore.
 * Auto-detects environment and uses appropriate backend.
 * @module storage
 */

import { AppConstants } from './constants.js';

/** Firebase configuration */
const firebaseConfig = {
    apiKey: "AIzaSyCbMOhQ3tzDn86ejuvhD4F6syNoZEF4tuw",
    authDomain: "garold-personal-blog.firebaseapp.com",
    projectId: "garold-personal-blog",
    storageBucket: "garold-personal-blog.firebasestorage.app",
    messagingSenderId: "664212121686",
    appId: "1:664212121686:web:2b8f69d5aa35e82b8eae0c"
};

/** Check if running on Firebase Hosting */
const hostname = window.location.hostname;
const isFirebaseHosting = hostname.includes('.web.app') ||
    hostname.includes('.firebaseapp.com') ||
    hostname === 'garold-personal-blog.web.app' ||
    hostname === 'garold-personal-blog.firebaseapp.com';


/** Firebase instances */
let db = null;
let firebaseInitialized = false;

/**
 * Initialize Firebase Firestore
 * @returns {Promise<boolean>} True if initialization successful
 */
async function initFirebase() {
    if (firebaseInitialized) return true;

    try {
        // Dynamic import Firebase modules
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        firebaseInitialized = true;
        return true;
    } catch (error) {
        console.error('[Storage] Failed to initialize Firebase:', error);
        return false;
    }
}

/**
 * Firestore Storage Implementation
 */
const FirestoreStorage = {
    async getAllPosts() {
        if (!await initFirebase()) return [];

        try {
            const { collection, getDocs, orderBy, query } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const postsRef = collection(db, 'posts');
            const q = query(postsRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            const posts = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                posts.push({
                    id: doc.id,
                    filename: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || data.createdAt,
                    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
                });
            });

            return posts;
        } catch (error) {
            console.error('[Storage] Failed to load posts from Firestore:', error);
            return [];
        }
    },

    async savePost(post) {
        if (!await initFirebase()) throw new Error('Firebase not initialized');

        try {
            const { collection, doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            const postId = post.id || post.filename || `post_${Date.now()}`;
            const postRef = doc(db, 'posts', postId);

            const postData = {
                ...post,
                id: postId,
                filename: postId,
                updatedAt: serverTimestamp()
            };

            // Set createdAt only for new posts
            if (!post.createdAt) {
                postData.createdAt = serverTimestamp();
            }

            await setDoc(postRef, postData, { merge: true });

            return {
                ...postData,
                createdAt: post.createdAt || new Date(),
                updatedAt: new Date()
            };
        } catch (error) {
            console.error('[Storage] Failed to save post to Firestore:', error);
            throw error;
        }
    },

    async deletePost(filename) {
        if (!filename || !await initFirebase()) return false;

        try {
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            await deleteDoc(doc(db, 'posts', filename));
            return true;
        } catch (error) {
            console.error('[Storage] Failed to delete post from Firestore:', error);
            return false;
        }
    }
};

/**
 * Local Server Storage Implementation
 */
const LocalStorage = {
    async getAllPosts() {
        try {
            const response = await fetch(AppConstants.API.BASE);
            if (!response.ok) throw new Error('Failed to fetch posts');

            const posts = await response.json();
            return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('[Storage] Failed to load posts:', error.message);
            return [];
        }
    },

    async savePost(post) {
        try {
            const response = await fetch(AppConstants.API.BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(post)
            });

            if (!response.ok) throw new Error('Failed to save post');

            return await response.json();
        } catch (error) {
            console.error('[Storage] Failed to save post:', error.message);
            throw error;
        }
    },

    async deletePost(filename) {
        if (!filename) return false;

        try {
            const response = await fetch(`${AppConstants.API.BASE}/${filename}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete post');
            return true;
        } catch (error) {
            console.error('[Storage] Failed to delete post:', error.message);
            return false;
        }
    }
};

/** Select storage backend based on environment */
const StorageBackend = isFirebaseHosting ? FirestoreStorage : LocalStorage;

export const StorageManager = {
    /**
     * Fetch all posts from the storage backend
     * @returns {Promise<Array>} Array of post objects sorted by creation date
     */
    async getAllPosts() {
        return StorageBackend.getAllPosts();
    },

    /**
     * Save a post to the storage backend
     * @param {Object} post - Post data to save
     * @param {string} post.title - Post title
     * @param {string} post.content - HTML content
     * @param {string} post.plainText - Plain text content
     * @returns {Promise<Object>} Saved post with server-assigned metadata
     * @throws {Error} If save operation fails
     */
    async savePost(post) {
        return StorageBackend.savePost(post);
    },

    /**
     * Find a post by ID from a posts array
     * @param {Array} posts - Array of post objects
     * @param {string} id - Post ID to find
     * @returns {Object|null} Found post or null
     */
    getPostById(posts, id) {
        return posts.find(p => p.id === id) || null;
    },

    /**
     * Delete a post from the storage backend
     * @param {string} filename - Filename of the post to delete
     * @returns {Promise<boolean>} True if deletion was successful
     */
    async deletePost(filename) {
        return StorageBackend.deletePost(filename);
    },

    /**
     * Export a post as a downloadable JSON file
     * @param {Object} post - Post to export
     */
    exportPost(post) {
        if (!post) return;

        const blob = new Blob([JSON.stringify(post, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = post.filename || `${post.title.replace(/[^a-z0-9]/gi, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
