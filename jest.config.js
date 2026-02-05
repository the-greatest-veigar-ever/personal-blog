/**
 * Jest configuration for blog application tests
 * @file jest.config.js
 */

module.exports = {
    // Test environment
    testEnvironment: 'node',

    // Test file patterns
    testMatch: [
        '**/tests/**/*.test.js',
        '**/__tests__/**/*.js'
    ],

    // Coverage configuration
    collectCoverageFrom: [
        'js/**/*.js',
        '!js/components/**',
        '!**/node_modules/**'
    ],

    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50
        }
    },

    // Verbose output
    verbose: true,

    // Timeout for async tests
    testTimeout: 10000,

    // Setup files
    setupFilesAfterEnv: [],

    // Module directories
    moduleDirectories: ['node_modules', 'js'],

    // Transform ignore patterns
    transformIgnorePatterns: [
        '/node_modules/'
    ]
};
