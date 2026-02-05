/**
 * Unit tests for utility functions
 * @file tests/utils.test.js
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

describe('Utility Functions', () => {
    describe('Date Formatting', () => {
        test('should format date correctly', () => {
            const date = new Date('2026-01-21T09:00:00');
            const formatted = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            expect(formatted).toBe('Jan 21, 2026');
        });

        test('should handle invalid date gracefully', () => {
            const invalidDate = new Date('invalid');
            expect(isNaN(invalidDate.getTime())).toBe(true);
        });
    });

    describe('String Utilities', () => {
        test('should truncate long strings', () => {
            const longString = 'This is a very long string that needs to be truncated';
            const maxLength = 20;
            const truncated = longString.length > maxLength
                ? longString.substring(0, maxLength) + '...'
                : longString;
            expect(truncated).toBe('This is a very long ...');
            expect(truncated.length).toBeLessThanOrEqual(maxLength + 3);
        });

        test('should not truncate short strings', () => {
            const shortString = 'Short';
            const maxLength = 20;
            const result = shortString.length > maxLength
                ? shortString.substring(0, maxLength) + '...'
                : shortString;
            expect(result).toBe('Short');
        });

        test('should handle empty strings', () => {
            const emptyString = '';
            expect(emptyString.length).toBe(0);
        });
    });

    describe('ID Generation', () => {
        test('should generate unique IDs', () => {
            const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
            const id1 = generateId();
            const id2 = generateId();
            expect(id1).not.toBe(id2);
        });

        test('should generate non-empty IDs', () => {
            const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
            const id = generateId();
            expect(id.length).toBeGreaterThan(0);
        });
    });

    describe('Array Utilities', () => {
        test('should filter array by property', () => {
            const items = [
                { id: 1, active: true },
                { id: 2, active: false },
                { id: 3, active: true }
            ];
            const activeItems = items.filter(item => item.active);
            expect(activeItems.length).toBe(2);
        });

        test('should sort array by date', () => {
            const items = [
                { id: 1, date: new Date('2026-01-20') },
                { id: 2, date: new Date('2026-01-22') },
                { id: 3, date: new Date('2026-01-21') }
            ];
            const sorted = items.sort((a, b) => b.date - a.date);
            expect(sorted[0].id).toBe(2);
            expect(sorted[1].id).toBe(3);
            expect(sorted[2].id).toBe(1);
        });
    });
});

describe('DOM Utilities', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    test('should create element with class', () => {
        const element = document.createElement('div');
        element.className = 'test-class';
        expect(element.className).toBe('test-class');
    });

    test('should append child to parent', () => {
        const parent = document.createElement('div');
        const child = document.createElement('span');
        parent.appendChild(child);
        expect(parent.children.length).toBe(1);
    });

    test('should set inner HTML', () => {
        const element = document.createElement('div');
        element.innerHTML = '<span>Test</span>';
        expect(element.querySelector('span')).not.toBeNull();
    });
});
