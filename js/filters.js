/**
 * GAROLD'S BLOG - Filters Manager
 * Handles filtering and sorting of blog posts.
 * @module filters
 */

export const FiltersManager = {
    /**
     * Filter posts by title
     * @param {Array} posts - Array of post objects
     * @param {string} query - Search query
     * @returns {Array} Filtered posts
     */
    filterByName(posts, query) {
        if (!query || !query.trim()) return posts;
        const lowerQuery = query.toLowerCase().trim();
        return posts.filter(post =>
            post.title.toLowerCase().includes(lowerQuery)
        );
    },

    /**
     * Filter posts by content text
     * @param {Array} posts - Array of post objects
     * @param {string} query - Search query
     * @returns {Array} Filtered posts
     */
    filterByContent(posts, query) {
        if (!query || !query.trim()) return posts;
        const lowerQuery = query.toLowerCase().trim();
        return posts.filter(post =>
            post.plainText && post.plainText.toLowerCase().includes(lowerQuery)
        );
    },

    /**
     * Filter posts by date range
     * @param {Array} posts - Array of post objects
     * @param {string} fromDate - Start date (YYYY-MM-DD)
     * @param {string} toDate - End date (YYYY-MM-DD)
     * @returns {Array} Filtered posts
     */
    filterByDateRange(posts, fromDate, toDate) {
        return posts.filter(post => {
            const postDate = new Date(post.createdAt);

            if (fromDate) {
                const from = new Date(fromDate);
                from.setHours(0, 0, 0, 0);
                if (postDate < from) return false;
            }

            if (toDate) {
                const to = new Date(toDate);
                to.setHours(23, 59, 59, 999);
                if (postDate > to) return false;
            }

            return true;
        });
    },

    /**
     * Sort posts by specified criteria
     * @param {Array} posts - Array of post objects
     * @param {string} sortBy - Sort criteria ('date-asc', 'date-desc', 'name-asc', 'name-desc')
     * @returns {Array} Sorted posts
     */
    sortPosts(posts, sortBy) {
        const sorted = [...posts];

        switch (sortBy) {
            case 'date-asc':
                sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'date-desc':
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'name-asc':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'name-desc':
                sorted.sort((a, b) => b.title.localeCompare(a.title));
                break;
            default:
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        return sorted;
    },

    /**
     * Apply all filters and sorting to posts
     * @param {Array} posts - Array of post objects
     * @param {Object} options - Filter options
     * @param {string} [options.name] - Title filter query
     * @param {string} [options.content] - Content filter query
     * @param {string} [options.fromDate] - Start date filter
     * @param {string} [options.toDate] - End date filter
     * @param {string} [options.sortBy] - Sort criteria
     * @returns {Array} Filtered and sorted posts
     */
    applyFilters(posts, options = {}) {
        let result = [...posts];

        if (options.name) {
            result = this.filterByName(result, options.name);
        }

        if (options.content) {
            result = this.filterByContent(result, options.content);
        }

        if (options.fromDate || options.toDate) {
            result = this.filterByDateRange(result, options.fromDate, options.toDate);
        }

        result = this.sortPosts(result, options.sortBy || 'date-desc');

        return result;
    }
};
